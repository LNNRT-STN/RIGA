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
| POST | `/api/demo/reset` | `{}`, restores report counts |

Scoring: start at 100, subtract the weight of each failed or warning check, clamp to 0..100.
80+ verified/allow, 50 to 79 caution/warn, 30 to 49 review (Secure4u), below 30 danger/block.

## Rule based vs simulated

- **Rule based (real code):** invoice field parsing (regex), lookalike domain detection
  (`difflib`), IBAN and phone matching, urgency and bank-change wording, payment history,
  scoring and verdict text. No LLM is used anywhere.
- **Simulated:** the partner registry, account holder names (Verification of Payee),
  account ages, network report counts and people in `registry.py` are synthetic.
  "OCR" is text extraction from the PDF text layer (`pdf_text.py`). Voice and video
  deepfake signals for the `ceo-deepfake` call are fixed values in `trust.py`.
- Report counts live in memory and reset on restart or `POST /api/demo/reset`.
