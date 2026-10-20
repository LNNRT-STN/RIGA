"""KBC Trust demo API, Python standard library plus `cryptography` for invoice seals.

Run from anywhere:  python3 src/backend/server.py
Port: env PORT (set by Cloud Run) or KBC_TRUST_PORT (default 8787). Host: env HOST
(default 127.0.0.1; the Docker image uses 0.0.0.0). With STATIC_DIR set, it also serves
the built frontend from that folder, so one container runs the whole demo.

All partner, account and detector data is SIMULATED (see registry.py).
"""

import base64
import binascii
import json
import mimetypes
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import kate  # noqa: E402
import partners  # noqa: E402
import pdf_text  # noqa: E402
import registry as reg  # noqa: E402
import seal  # noqa: E402
import trust  # noqa: E402

DEMO_DIR = os.path.normpath(os.path.join(HERE, "..", "frontend", "public", "demo"))
STATIC_DIR = os.environ.get("STATIC_DIR")
MAX_BODY = 15 * 1024 * 1024
REPORT_MESSAGE = "Thanks. Every KBC customer is now warned before paying this account."


class ApiError(Exception):
    def __init__(self, status, message, fields=None):
        super().__init__(message)
        self.status = status
        self.message = message
        self.fields = fields or {}


def demo_samples():
    """{file name: path} of the demo PDFs. Only these paths are ever opened for a sample."""
    try:
        names = sorted(n for n in os.listdir(DEMO_DIR) if n.lower().endswith(".pdf"))
    except OSError:
        return {}
    return {n: os.path.join(DEMO_DIR, n) for n in names}


def read_sample(name):
    name = str(name or "")
    path = demo_samples().get(name)
    if path is None:
        raise ApiError(404, "Unknown sample: %s" % os.path.basename(name))
    with open(path, "rb") as fh:
        return name, fh.read()


def static_files(root):
    """{URL path: file path} of the built frontend, listed once at startup.

    Only paths in this index are ever opened, so a request path can't reach other files."""
    if not root:
        return {}
    root = os.path.realpath(root)
    index = {}
    for folder, _dirs, names in os.walk(root):
        for n in names:
            path = os.path.join(folder, n)
            index["/" + os.path.relpath(path, root).replace(os.sep, "/")] = path
    return index


STATIC_FILES = static_files(STATIC_DIR)


def invoice_endpoint(body):
    started = time.perf_counter()
    if body.get("sample"):
        name, data = read_sample(body["sample"])
    elif body.get("contentBase64") is not None:
        name = os.path.basename(str(body.get("fileName") or "upload.pdf"))
        raw = str(body["contentBase64"])
        if "," in raw[:100] and raw.startswith("data:"):
            raw = raw.split(",", 1)[1]
        try:
            data = base64.b64decode(raw, validate=False)
        except (binascii.Error, ValueError):
            raise ApiError(400, "contentBase64 is not valid base64")
    else:
        raise ApiError(400, "Send {\"sample\": name} or {\"fileName\", \"contentBase64\"}")

    # SIMULATED OCR: we read the text layer of the PDF instead of running OCR.
    text = pdf_text.extract_text(data)
    if not text.strip():
        # Fallback: an upload of one of the demo samples whose text we can't
        # read (e.g. re-saved with compressed streams) is matched by file name.
        if name in demo_samples():
            data = read_sample(name)[1]
            text = pdf_text.extract_text(data)
    return trust.check_invoice_text(text, started=started, file_name=name,
                                    seal_tokens=pdf_text.extract_seals(data))


def payee_endpoint(body):
    if not body.get("iban"):
        raise ApiError(400, "Field 'iban' is required")
    return trust.check_payee(body.get("name", ""), body["iban"], body.get("account", "personal"))


def call_endpoint(body):
    started = time.perf_counter()
    if body.get("scenario"):
        result = trust.check_call_scenario(body["scenario"], started=started)
        if result is None:
            raise ApiError(404, "Unknown scenario: %s" % body["scenario"])
        return result
    if not body.get("callerNumber"):
        raise ApiError(400, "Send {\"scenario\"} or {\"callerNumber\", \"claimedName\", \"hasVideo\"}")
    return trust.check_call(body["callerNumber"], body.get("claimedName", ""),
                            bool(body.get("hasVideo")), body.get("request"), started=started)


def website_endpoint(body):
    if not body.get("url"):
        raise ApiError(400, "Field 'url' is required")
    return trust.check_website(body["url"])


def report_endpoint(body):
    key = body.get("iban") or body.get("number") or body.get("domain")
    if not key:
        raise ApiError(400, "Send {\"iban\"} or {\"number\"}")
    entry = reg.add_report(key)
    return {"reports": entry["reports"], "message": REPORT_MESSAGE}


def reset_endpoint(_body):
    reg.reset()
    partners.reset()
    return {"ok": True}


def kate_chat_endpoint(body):
    message = str(body.get("message") or "").strip()
    if not message:
        raise ApiError(400, "Missing message")
    try:
        return kate.reply(message, body.get("history"), body.get("context"))
    except kate.KateUnavailable as err:
        sys.stderr.write("Kate LLM unavailable: %s\n" % err)
        raise ApiError(503, "Kate's AI replies are unavailable right now")


def partner_lookup_endpoint(body):
    return partners.lookup(body.get("enterpriseNumber"))


def partner_dns_endpoint(body):
    return partners.dns_records(body.get("enterpriseNumber"), body.get("domains"))


def partner_apply_endpoint(body):
    return partners.apply(body)


POST_ROUTES = {
    "/api/trust/invoice": invoice_endpoint,
    "/api/trust/payee": payee_endpoint,
    "/api/trust/call": call_endpoint,
    "/api/trust/website": website_endpoint,
    "/api/trust/report": report_endpoint,
    "/api/demo/reset": reset_endpoint,
    "/api/kate/chat": kate_chat_endpoint,
    "/api/partners/lookup": partner_lookup_endpoint,
    "/api/partners/dns": partner_dns_endpoint,
    "/api/partners/apply": partner_apply_endpoint,
}


class Handler(BaseHTTPRequestHandler):
    server_version = "KBCTrustDemo/1.0"

    def _send(self, status, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _path(self):
        return self.path.split("?", 1)[0].rstrip("/") or "/"

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        if self._path() == "/api/health":
            self._send(200, {"ok": True})
        elif self._path() == "/api/partners":
            self._send(200, partners.directory())
        elif self._path() == "/api/trust/keys":
            # Partner public keys for invoice seals, as a JWK set (RFC 7517 and 8037).
            self._send(200, {"keys": reg.public_keys()})
        elif STATIC_DIR and not self._path().startswith("/api/"):
            self._send_static()
        else:
            self._send(404, {"error": "Not found: GET %s" % self._path()})

    def _send_static(self):
        """Serves the built frontend; unknown paths fall back to index.html."""
        target = STATIC_FILES.get(self._path()) or STATIC_FILES.get("/index.html")
        if target is None:
            self._send(404, {"error": "Not found: GET %s" % self._path()})
            return
        with open(target, "rb") as handle:
            data = handle.read()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(target)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        # Hashed build assets never change; index.html must always be fresh.
        immutable = os.sep + "assets" + os.sep in target
        self.send_header("Cache-Control", "public, max-age=31536000, immutable" if immutable else "no-cache")
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        route = POST_ROUTES.get(self._path())
        if route is None:
            self._send(404, {"error": "Not found: POST %s" % self._path()})
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
            if length > MAX_BODY:
                raise ApiError(413, "Request body too large")
            raw = self.rfile.read(length) if length else b""
            try:
                body = json.loads(raw.decode("utf-8") or "{}")
            except (ValueError, UnicodeDecodeError):
                raise ApiError(400, "Invalid JSON body")
            if not isinstance(body, dict):
                raise ApiError(400, "JSON body must be an object")
            self._send(200, route(body))
        except (ApiError, partners.OnboardingError) as err:
            payload = {"error": err.message}
            if err.fields:
                payload["fields"] = err.fields
            self._send(err.status, payload)
        except Exception as err:  # keep the demo alive and say what broke
            self._send(500, {"error": "Internal error: %s" % err})

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.log_date_time_string(), fmt % args))


def main():
    port = int(os.environ.get("PORT") or os.environ.get("KBC_TRUST_PORT", "8787"))
    host = os.environ.get("HOST", "127.0.0.1")
    httpd = ThreadingHTTPServer((host, port), Handler)
    print("KBC Trust demo API on http://%s:%d (simulated data)" % (host, port), flush=True)
    if not seal.available():
        print("Invoice seals are OFF: run pip install -r src/backend/requirements.txt", flush=True)
    if not kate.api_key():
        print("Kate's AI replies are OFF: set OPENROUTER_API_KEY in .env", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
