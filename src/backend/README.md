# KBC Trust demo backend

Python 3 standard library, plus `cryptography` for the digital invoice seal. Without it the
server still runs and prints that invoice seals are off.

## Run

```sh
pip install -r src/backend/requirements.txt   # cryptography, for invoice seals
python3 src/backend/server.py              # http://127.0.0.1:8787
KBC_TRUST_PORT=9000 python3 src/backend/server.py
python3 src/backend/make_demo_pdfs.py      # regenerate src/frontend/public/demo/*.pdf
python3 -m unittest discover src/backend   # tests, under 1 s
```

## Endpoints

All JSON, CORS `*`. Every `/api/trust/*` check except `report` returns a TrustResult
(`subject`, `score`, `level`, `decision`, `verifiedPartner`, `headline`, `summary`,
`checks`, `extracted`, `verifiedContact`, `network`, `seal`, `elapsedMs`).

| Method | Path | Body |
|---|---|---|
| GET | `/api/health` | none, returns `{"ok": true}` |
| GET | `/api/trust/keys` | none, returns the partners' public seal keys as a JWK set |
| POST | `/api/trust/invoice` | `{"sample": "proximus-invoice-october.pdf"}` or `{"fileName", "contentBase64"}` |
| POST | `/api/trust/payee` | `{"name", "iban", "account": "personal" \| "business"}` |
| POST | `/api/trust/call` | `{"scenario": "ceo-deepfake"}` or `{"callerNumber", "claimedName", "hasVideo", "request"?}` |
| POST | `/api/trust/website` | `{"url"}` |
| POST | `/api/trust/report` | `{"iban"}` or `{"number"}`, returns `{"reports", "message"}` |
| POST | `/api/demo/reset` | `{}`, restores report counts |

Scoring: start at 100, subtract the weight of each failed or warning check, clamp to 0..100.
80+ verified/allow, 50 to 79 caution/warn, 30 to 49 review (Secure4u), below 30 danger/block.

## Digital invoice seal ("Verified by KBC")

A verified partner signs the payment details of each invoice (issuer, invoice number, IBAN,
amount, due date, structured reference) with its own Ed25519 private key. KBC stores only the
public key, so KBC can check a seal but can't make one. The seal is a JWS compact token
(RFC 7515, `alg: EdDSA` from RFC 8037) in the PDF's document information (`/KBCTrustSeal`);
the same token fits in a QR code on a paper invoice. See `seal.py`.

The invoice check (`trust.py`, check 7) then:

1. Verifies the signature with the key named in the token. Only EdDSA and our token type are
   accepted. Unknown, withdrawn (revoked) or forged keys fail.
2. Requires the key's partner to be the company the invoice claims to come from.
3. Compares the sealed fields with what is printed. Any difference means the invoice was
   changed after sealing, which blocks the payment and shows both values.
4. For partners that seal every invoice (`sealsInvoicesSince` in `registry.py`), a missing
   seal is a warning, and blocks when the IBAN is not one of the partner's accounts too
   (that is what removing the seal from a changed invoice looks like).

The other checks still run, so a stolen partner key alone can't redirect a payment to an
unknown IBAN.

Demo keys: `make_demo_pdfs.py` creates the private keys in `src/backend/.demo-keys/` (git
ignored, never commit them) and writes the public keys to `partner_keys.json`. Without the
private keys it makes new ones and re-seals every PDF, so the two always match.
`proximus-invoice-november.pdf` is a real sealed invoice whose IBAN was swapped afterwards.

## Rule based vs simulated

- **Rule based (real code):** invoice field parsing (regex), lookalike domain detection
  (`difflib`), IBAN and phone matching, urgency and bank-change wording, payment history,
  scoring and verdict text. No LLM is used anywhere.
- **Real cryptography:** the invoice seal is a real Ed25519 signature check.
- **Simulated:** the partner keys (fictional demo keys), the partner registry, account holder names (Verification of Payee),
  account ages, network report counts and people in `registry.py` are synthetic.
  "OCR" is text extraction from the PDF text layer (`pdf_text.py`). Voice and video
  deepfake signals for the `ceo-deepfake` call are fixed values in `trust.py`.
- Report counts live in memory and reset on restart or `POST /api/demo/reset`.
