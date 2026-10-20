# KBC Trust demo backend

Python 3 standard library only. No installs.

## Run

```sh
python3 src/backend/server.py              # http://127.0.0.1:8787
KBC_TRUST_PORT=9000 python3 src/backend/server.py
python3 src/backend/make_demo_pdfs.py      # regenerate src/frontend/public/demo/*.pdf
python3 -m unittest discover src/backend   # tests, under 1 s
```

## Endpoints

All JSON, CORS `*`. Every `/api/trust/*` check except `report` returns a TrustResult
(`subject`, `score`, `level`, `decision`, `verifiedPartner`, `headline`, `summary`,
`checks`, `extracted`, `verifiedContact`, `network`, `elapsedMs`).

| Method | Path | Body |
|---|---|---|
| GET | `/api/health` | none, returns `{"ok": true}` |
| POST | `/api/trust/invoice` | `{"sample": "proximus-invoice-october.pdf"}` or `{"fileName", "contentBase64"}` |
| POST | `/api/trust/payee` | `{"name", "iban", "account": "personal" \| "business"}` |
| POST | `/api/trust/call` | `{"scenario": "ceo-deepfake"}` or `{"callerNumber", "claimedName", "hasVideo", "request"?}` |
| POST | `/api/trust/website` | `{"url"}` |
| POST | `/api/trust/report` | `{"iban"}` or `{"number"}`, returns `{"reports", "message"}` |
| POST | `/api/demo/reset` | `{}`, restores report counts and removes partners added through sign-up |
| GET | `/api/partners` | none, returns the verified partner directory, `count`, modules and sectors |
| POST | `/api/partners/lookup` | `{"enterpriseNumber"}`, returns the register extract and suggested details |
| POST | `/api/partners/dns` | `{"enterpriseNumber", "domains"}`, returns the TXT record per domain and whether it is found |
| POST | `/api/partners/apply` | `{"enterpriseNumber", "brandName", "website", "phone", "category", "domains", "ibans", "modules"}` |

Partner sign-up (`partners.py`): `apply` returns `decision` (`approved`, `review` or `rejected`),
`headline`, `summary`, `checks`, `partner`, `apiKey` and `partnerCount`. Any failed check rejects,
any warning sends the application to a KBC analyst, and a clean application goes live at once: the
partner joins `registry.PARTNERS`, so every Trust check above recognises it. Invalid fields return
400 with `{"error", "fields": {field: message}}`. Demo companies: `0764.312.290` (Zonnig Reizen,
approved) and `0891.234.515` (poses as Proximus, rejected).

Scoring: start at 100, subtract the weight of each failed or warning check, clamp to 0..100.
80+ verified/allow, 50 to 79 caution/warn, 30 to 49 review (Secure4u), below 30 danger/block.

## Rule based vs simulated

- **Rule based (real code):** invoice field parsing (regex), lookalike domain detection
  (`difflib`), IBAN and phone matching, urgency and bank-change wording, payment history,
  scoring and verdict text. Partner sign-up: enterprise number and IBAN checksums (mod 97),
  account holder match, lookalike and duplicate checks against verified partners, network reports.
  No LLM is used anywhere.
- **Simulated:** the partner registry, account holder names (Verification of Payee),
  account ages, network report counts and people in `registry.py` are synthetic.
  "OCR" is text extraction from the PDF text layer (`pdf_text.py`). Voice and video
  deepfake signals for the `ceo-deepfake` call are fixed values in `trust.py`.
- Partner sign-up: the enterprise register extract (`partners.COMPANY_REGISTER`), DNS TXT lookups,
  the phone confirmation and the sandbox API key are simulated. New partners live in memory.
- Report counts live in memory and reset on restart or `POST /api/demo/reset`.
