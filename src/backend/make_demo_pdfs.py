"""Generate the fictional demo invoices for KBC Trust.

Writes minimal, valid PDF 1.4 files by hand (uncompressed content streams,
Helvetica with WinAnsiEncoding) into src/frontend/public/demo/ so that
pdf_text.py can read them reliably. All companies, people, IBANs and amounts
are synthetic. No real logos are used.

Invoices from partners that seal their invoices get a KBC Trust seal (seal.py)
in the document information dictionary. The demo partners' private keys live in
src/backend/.demo-keys/, which git ignores; they are created on the first run.
Their public keys are written to partner_keys.json, which the backend reads.
Running this without the private keys makes new keys and re-seals every PDF,
so the PDFs and partner_keys.json always match.

Run: python3 src/backend/make_demo_pdfs.py   (needs: pip install -r src/backend/requirements.txt)
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import seal  # noqa: E402

DEMO_DIR = os.path.normpath(os.path.join(HERE, "..", "frontend", "public", "demo"))
KEYS_DIR = os.path.join(HERE, ".demo-keys")
KEYS_FILE = os.path.join(HERE, "partner_keys.json")

# SIMULATED: fictional partner signing keys as (key id, partner id, valid from, status).
# The revoked key shows what happens after a partner withdraws a leaked key.
KEY_SPECS = [
    ("proximus-2026-01", "proximus", "2026-03-12", "active"),
    ("proximus-2025-01", "proximus", "2025-03-01", "revoked"),
    ("van-damme-2026-01", "van-damme", "2026-06-03", "active"),
]

PAGE_W, PAGE_H = 595, 842
MARGIN = 56
NAVY = (0.078, 0.161, 0.302)
GREY = (0.357, 0.42, 0.51)
LINE = (0.882, 0.914, 0.941)
PANEL = (0.953, 0.98, 0.996)
FOOTER = "Fictional document for a KBC Hackathon demo."


def _pdf_string(text):
    data = text.encode("cp1252")
    out = bytearray(b"(")
    for byte in data:
        if byte in (0x28, 0x29, 0x5C):  # ( ) \
            out += b"\\" + bytes([byte])
        elif byte > 126 or byte < 32:
            out += ("\\%03o" % byte).encode("ascii")
        else:
            out.append(byte)
    out += b")"
    return bytes(out)


def _text_width(text, size):
    # Rough Helvetica average width; good enough for right alignment.
    return len(text) * size * 0.5


class Page:
    def __init__(self):
        self.ops = []

    def text(self, x, y, text, size=10, bold=False, color=NAVY, align="left"):
        if align == "right":
            x -= _text_width(text, size)
        font = b"/F2" if bold else b"/F1"
        self.ops.append(
            b"BT %s %d Tf %.3f %.3f %.3f rg 1 0 0 1 %.1f %.1f Tm %s Tj ET"
            % (font, size, color[0], color[1], color[2], x, y, _pdf_string(text))
        )

    def rect(self, x, y, w, h, color):
        self.ops.append(b"%.3f %.3f %.3f rg %.1f %.1f %.1f %.1f re f"
                        % (color[0], color[1], color[2], x, y, w, h))

    def hline(self, y, color=LINE, width=0.8):
        self.ops.append(b"%.3f %.3f %.3f RG %.1f w %d %.1f m %d %.1f l S"
                        % (color[0], color[1], color[2], width, MARGIN, y,
                           PAGE_W - MARGIN, y))

    def content(self):
        return b"\n".join(self.ops) + b"\n"


def write_pdf(path, page, title, seal_token=None):
    content = page.content()
    info = b"<< /Title %s /Producer (KBC Trust demo generator)" % _pdf_string(title)
    if seal_token:
        info += b" /KBCTrustSeal (%s)" % seal_token.encode("ascii")
    info += b" >>"
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] "
        b"/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>"
        % (PAGE_W, PAGE_H),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
        b"<< /Length %d >>\nstream\n" % len(content) + content + b"endstream",
        info,
    ]
    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for i, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % i + body + b"\nendobj\n"
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objects) + 1)
    for off in offsets:
        out += b"%010d 00000 n \n" % off
    out += (b"trailer\n<< /Size %d /Root 1 0 R /Info %d 0 R >>\nstartxref\n%d\n%%%%EOF\n"
            % (len(objects) + 1, len(objects), xref))
    with open(path, "wb") as fh:
        fh.write(bytes(out))


def invoice(spec):
    """Lay out one A4 invoice from a spec dict."""
    p = Page()
    right = PAGE_W - MARGIN
    # Header band: company name only (no logo).
    p.rect(0, PAGE_H - 110, PAGE_W, 110, PANEL)
    p.text(MARGIN, PAGE_H - 62, spec["company"], size=20, bold=True)
    p.text(MARGIN, PAGE_H - 82, spec["company_line"], size=9, color=GREY)
    p.text(right, PAGE_H - 62, "INVOICE", size=16, bold=True, align="right")
    p.text(right, PAGE_H - 82, "Invoice number: " + spec["number"], size=9,
           color=GREY, align="right")

    y = PAGE_H - 150
    p.text(MARGIN, y, "Bill to", size=9, bold=True, color=GREY)
    p.text(330, y, "Invoice details", size=9, bold=True, color=GREY)
    for i, line in enumerate(spec["customer"]):
        p.text(MARGIN, y - 16 - i * 14, line, size=10, bold=(i == 0))
    details = [
        "Invoice date: " + spec["date"],
        "Due date: " + spec["due"],
        "Customer number: " + spec["customer_no"],
    ]
    for i, line in enumerate(details):
        p.text(330, y - 16 - i * 14, line, size=10)

    y = PAGE_H - 260
    p.text(MARGIN, y, "Description", size=9, bold=True, color=GREY)
    p.text(right, y, "Amount", size=9, bold=True, color=GREY, align="right")
    p.hline(y - 8)
    y -= 26
    for desc, amount in spec["lines"]:
        p.text(MARGIN, y, desc, size=10)
        p.text(right, y, amount, size=10, align="right")
        y -= 20
    p.hline(y + 6)
    y -= 14
    p.text(330, y, "Subtotal excl. VAT", size=10, color=GREY)
    p.text(right, y, spec["subtotal"], size=10, color=GREY, align="right")
    y -= 16
    p.text(330, y, "VAT 21%", size=10, color=GREY)
    p.text(right, y, spec["vat"], size=10, color=GREY, align="right")
    y -= 22
    p.text(330, y, "Total due: " + spec["total"], size=12, bold=True)

    y -= 48
    p.rect(MARGIN, y - 92, PAGE_W - 2 * MARGIN, 108, PANEL)
    p.text(MARGIN + 14, y, "Payment instructions", size=11, bold=True)
    pay = [
        "Please transfer " + spec["total"] + " to the account below.",
        "IBAN: " + spec["iban"],
        "BIC: " + spec["bic"],
        "Structured reference: " + spec["reference"],
    ]
    for i, line in enumerate(pay):
        p.text(MARGIN + 14, y - 18 - i * 15, line, size=10)

    y -= 128
    for i, line in enumerate(spec["notes"]):
        p.text(MARGIN, y - i * 16, line, size=10, bold=spec.get("notes_bold", False))

    y = 120
    p.hline(y + 14)
    p.text(MARGIN, y, "Questions? Email: " + spec["email"] + "    Phone: " + spec["phone"],
           size=9, color=GREY)
    p.text(MARGIN, y - 14, "Website: " + spec["website"] + "    VAT: " + spec["vat_no"],
           size=9, color=GREY)
    if spec.get("seal_kid"):
        p.text(MARGIN, 62, "This invoice carries a digital seal. Check it with Kate in KBC Mobile.",
               size=8, color=GREY)
    p.text(MARGIN, 48, FOOTER, size=8, color=GREY)
    return p


def load_or_create_keys():
    """Return {key id: private key}; write the public keys to partner_keys.json."""
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    os.makedirs(KEYS_DIR, exist_ok=True)
    private, public = {}, []
    for kid, partner, valid_from, status in KEY_SPECS:
        path = os.path.join(KEYS_DIR, kid + ".pem")
        if os.path.exists(path):
            with open(path, "rb") as fh:
                key = serialization.load_pem_private_key(fh.read(), password=None)
        else:
            key = Ed25519PrivateKey.generate()
            pem = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                                    serialization.NoEncryption())
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "wb") as fh:
                fh.write(pem)
        raw = key.public_key().public_bytes(serialization.Encoding.Raw,
                                            serialization.PublicFormat.Raw)
        private[kid] = key
        public.append({"kid": kid, "partner": partner, "x": seal.b64url(raw),
                       "validFrom": valid_from, "status": status})
    with open(KEYS_FILE, "w", encoding="utf-8", newline="\n") as fh:
        json.dump({"_note": "SIMULATED: public keys of fictional demo partners, made by "
                            "make_demo_pdfs.py.", "keys": public}, fh, indent=2)
        fh.write("\n")
    return private


def _iso(date):
    """'30 Oct 2026' to '2026-10-30'."""
    day, month, year = date.split()
    return "%s-%02d-%02d" % (year, MONTHS.index(month) + 1, int(day))


MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def seal_for(spec, keys):
    """The seal the partner makes when it sends the invoice (before anyone changes it)."""
    kid = spec["seal_kid"]
    partner = next(p for k, p, _, _ in KEY_SPECS if k == kid)
    claims = {
        "v": 1,
        "iss": partner,
        "inv": spec["number"],
        "iban": re.sub(r"\s+", "", spec.get("sealed_iban", spec["iban"])),
        "amt": re.sub(r"[^\d.]", "", spec["total"]),
        "cur": "EUR",
        "due": _iso(spec["due"]),
        "ref": spec["reference"],
        "iat": _iso(spec["date"]),
    }
    return seal.sign(claims, keys[kid], kid)


LAURA = ["Laura Janssens", "Kortrijksesteenweg 112", "9000 Gent", "Belgium"]

SPECS = {
    # The FAKE: lookalike domain, unknown IBAN, urgency.
    "proximus-invoice-october.pdf": {
        "company": "Proximus",
        "company_line": "Customer billing department",
        "number": "PRX-2026-10-88412",
        "customer": LAURA,
        "date": "18 Oct 2026",
        "due": "21 Oct 2026",
        "customer_no": "7710 4428",
        "lines": [("Internet Flex, October 2026", "€64.37"),
                  ("Late payment fee", "€10.00")],
        "subtotal": "€74.37",
        "vat": "€15.62",
        "total": "€89.99",
        "iban": "BE71 9672 0381 5524",
        "bic": "TRWIBEB1XXX",
        "reference": "+++771/0442/88412+++",
        "notes": ["URGENT: your last payment failed.",
                  "Pay within 24 hours to avoid your internet being cut off."],
        "notes_bold": True,
        "email": "facturen@proximus-factuur.be",
        "phone": "0470 55 12 98",
        "website": "www.proximus-factuur.be",
        "vat_no": "BE 0202.239.951",
    },
    # The REAL: verified domain, verified IBAN, normal tone.
    "proximus-invoice-september.pdf": {
        "company": "Proximus",
        "company_line": "Proximus NV, Koning Albert II-laan 27, 1030 Brussels",
        "number": "PRX-2026-09-55210",
        "customer": LAURA,
        "date": "16 Sep 2026",
        "due": "30 Oct 2026",
        "customer_no": "7710 4428",
        "lines": [("Internet Flex, September 2026", "€44.21"),
                  ("Mobile Flex, 1 SIM", "€9.10")],
        "subtotal": "€53.31",
        "vat": "€11.19",
        "total": "€64.50",
        "iban": "BE38 0000 1234 5672",
        "bic": "BPOTBEB1",
        "reference": "+++771/0442/55210+++",
        "notes": ["Thank you for being a Proximus customer.",
                  "Please pay by 30 Oct 2026. You can also pay with direct debit."],
        "email": "noreply@proximus.be",
        "phone": "0800 22 800",
        "website": "www.proximus.be",
        "vat_no": "BE 0202.239.951",
        "seal_kid": "proximus-2026-01",
    },
    # The PERFECT FAKE: a real, sealed Proximus invoice that was intercepted and
    # changed. Domain, phone and wording are genuine; only the IBAN was swapped.
    # The rules alone see one wrong IBAN; the seal proves the invoice was altered.
    "proximus-invoice-november.pdf": {
        "company": "Proximus",
        "company_line": "Proximus NV, Koning Albert II-laan 27, 1030 Brussels",
        "number": "PRX-2026-10-61877",
        "customer": LAURA,
        "date": "16 Oct 2026",
        "due": "15 Nov 2026",
        "customer_no": "7710 4428",
        "lines": [("Internet Flex, November 2026", "€44.21"),
                  ("Mobile Flex, 1 SIM", "€9.10")],
        "subtotal": "€53.31",
        "vat": "€11.19",
        "total": "€64.50",
        "iban": "BE63 9671 2345 6108",
        "sealed_iban": "BE38 0000 1234 5672",
        "bic": "BPOTBEB1",
        "reference": "+++771/0442/61877+++",
        "notes": ["Thank you for being a Proximus customer.",
                  "Please pay by 15 Nov 2026. You can also pay with direct debit."],
        "email": "noreply@proximus.be",
        "phone": "0800 22 800",
        "website": "www.proximus.be",
        "vat_no": "BE 0202.239.951",
        "seal_kid": "proximus-2026-01",
    },
    # Business email compromise: real domain, but a new fraudulent IBAN.
    "van-damme-invoice-1043.pdf": {
        "company": "Van Damme Packaging NV",
        "company_line": "Industrieweg 18, 9032 Wondelgem",
        "number": "VDP-2026-1043",
        "customer": ["Noord Design BV", "Attn. accounts payable",
                     "Coupure Links 45", "9000 Gent"],
        "date": "15 Oct 2026",
        "due": "29 Oct 2026",
        "customer_no": "C-00318",
        "lines": [("Custom printed boxes, 4,000 pcs", "€7,600.00"),
                  ("Protective inserts, 4,000 pcs", "€2,214.05"),
                  ("Delivery, Gent", "€500.00")],
        "subtotal": "€10,314.05",
        "vat": "€2,165.95",
        "total": "€12,480.00",
        "iban": "BE09 0018 3366 2157",
        "bic": "GEBABEBB",
        "reference": "+++104/3000/31845+++",
        "notes": ["Please note our new bank account: BE09 0018 3366 2157.",
                  "Our previous account is no longer in use."],
        "email": "accounts@vandamme-packaging.be",
        "phone": "+32 9 225 41 10",
        "website": "www.vandamme-packaging.be",
        "vat_no": "BE 0456.789.123",
    },
}


def main():
    os.makedirs(DEMO_DIR, exist_ok=True)
    keys = load_or_create_keys()
    for name, spec in SPECS.items():
        path = os.path.join(DEMO_DIR, name)
        token = seal_for(spec, keys) if spec.get("seal_kid") else None
        write_pdf(path, invoice(spec), spec["company"] + " invoice " + spec["number"], token)
        print("wrote", os.path.relpath(path), "(sealed)" if token else "")
    print("wrote", os.path.relpath(KEYS_FILE))


if __name__ == "__main__":
    main()
