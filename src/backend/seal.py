"""Digital invoice seals: how a KBC-verified partner proves an invoice is theirs.

A certified partner signs the payment details of every invoice with its own
Ed25519 private key. KBC keeps only the partner's public key (partner_keys.json),
so KBC can check a seal but can never make one, and a leak of the registry
exposes nothing secret.

A seal is a JWS compact token (RFC 7515) with alg EdDSA (RFC 8037):

    base64url(header) . base64url(payload) . base64url(signature)

The signature covers the exact bytes "header.payload", so nothing is rebuilt
before checking. Only alg "EdDSA" with our token type is accepted. The payload
holds what matters for paying: issuer, invoice number, IBAN, amount, currency,
due date and structured reference. The seal says nothing about the PDF layout,
so it still checks after the file is re-saved, printed or sent as a QR code.

SIMULATED: the partners and their keys are fictional demo keys made by
make_demo_pdfs.py. The private keys are not in the repository.
"""

import base64
import binascii
import json
import re

import registry as reg

try:
    from cryptography.exceptions import InvalidSignature
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
except ImportError:  # without the library KBC Trust still runs, just without seals
    InvalidSignature = Ed25519PublicKey = None

ALG = "EdDSA"
TOKEN_TYPE = "kbc-invoice-seal+jws"
MAX_TOKEN = 2048
CLAIMS = ("v", "iss", "inv", "iban", "amt", "cur", "due")
_B64URL = re.compile(r"^[A-Za-z0-9_-]+$")


def available():
    return Ed25519PublicKey is not None


def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _unb64url(text):
    if not _B64URL.match(text):
        raise ValueError("not base64url")
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _segment(obj):
    return b64url(json.dumps(obj, separators=(",", ":"), sort_keys=True).encode("utf-8"))


def sign(claims, private_key, kid):
    """Return a seal for the claims. Partners run this; KBC never holds the private key."""
    head = _segment({"alg": ALG, "kid": kid, "typ": TOKEN_TYPE})
    body = _segment(claims)
    signature = private_key.sign(("%s.%s" % (head, body)).encode("ascii"))
    return "%s.%s.%s" % (head, body, b64url(signature))


def verify(token):
    """Check a seal. Never raises.

    Returns {"status", "kid", "partner", "claims"} where status is one of:
    valid, invalid (signature or issuer wrong), revoked, unknown-key,
    malformed, unavailable (the crypto library is not installed).
    """
    out = {"status": "malformed", "kid": None, "partner": None, "claims": None}
    if not available():
        out["status"] = "unavailable"
        return out
    if not isinstance(token, str) or len(token) > MAX_TOKEN or token.count(".") != 2:
        return out
    head, body, sig = token.split(".")
    try:
        header = json.loads(_unb64url(head))
        claims = json.loads(_unb64url(body))
        signature = _unb64url(sig)
    except (ValueError, binascii.Error, UnicodeDecodeError):
        return out
    if not isinstance(header, dict) or not isinstance(claims, dict):
        return out
    if header.get("alg") != ALG or header.get("typ") != TOKEN_TYPE or len(signature) != 64:
        return out
    if any(not isinstance(claims.get(k), (str, int)) for k in CLAIMS) or claims.get("v") != 1:
        return out

    kid = header.get("kid")
    key = reg.seal_key(kid) if isinstance(kid, str) else None
    out["kid"] = kid if isinstance(kid, str) else None
    if key is None:
        out["status"] = "unknown-key"
        return out
    out["partner"] = reg.find_partner_by_id(key["partner"])
    try:
        public_key = Ed25519PublicKey.from_public_bytes(_unb64url(key["x"]))
        public_key.verify(signature, ("%s.%s" % (head, body)).encode("ascii"))
    except (InvalidSignature, ValueError, binascii.Error):
        out["status"] = "invalid"
        return out
    # A partner key may only seal that partner's own invoices.
    if claims.get("iss") != key["partner"]:
        out["status"] = "invalid"
        return out
    out["claims"] = claims
    out["status"] = "valid" if key["status"] == "active" else "revoked"
    return out
