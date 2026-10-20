"""KBC Trust demo API, Python standard library only.

Run from anywhere:  python3 src/backend/server.py
Port: env KBC_TRUST_PORT (default 8787), bound to 127.0.0.1.

All partner, account and detector data is SIMULATED (see registry.py).
"""

import base64
import binascii
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import pdf_text  # noqa: E402
import registry as reg  # noqa: E402
import trust  # noqa: E402

DEMO_DIR = os.path.normpath(os.path.join(HERE, "..", "frontend", "public", "demo"))
MAX_BODY = 15 * 1024 * 1024
REPORT_MESSAGE = "Thanks. Every KBC customer is now warned before paying this account."


class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


def demo_samples():
    try:
        return sorted(n for n in os.listdir(DEMO_DIR) if n.lower().endswith(".pdf"))
    except OSError:
        return []


def read_sample(name):
    name = os.path.basename(str(name or ""))
    if name not in demo_samples():
        raise ApiError(404, "Unknown sample: %s" % name)
    with open(os.path.join(DEMO_DIR, name), "rb") as fh:
        return name, fh.read()


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
            text = pdf_text.extract_text(read_sample(name)[1])
    return trust.check_invoice_text(text, started=started, file_name=name)


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
    return {"ok": True}


POST_ROUTES = {
    "/api/trust/invoice": invoice_endpoint,
    "/api/trust/payee": payee_endpoint,
    "/api/trust/call": call_endpoint,
    "/api/trust/website": website_endpoint,
    "/api/trust/report": report_endpoint,
    "/api/demo/reset": reset_endpoint,
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
        else:
            self._send(404, {"error": "Not found: GET %s" % self._path()})

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
        except ApiError as err:
            self._send(err.status, {"error": err.message})
        except Exception as err:  # keep the demo alive and say what broke
            self._send(500, {"error": "Internal error: %s" % err})

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.log_date_time_string(), fmt % args))


def main():
    port = int(os.environ.get("KBC_TRUST_PORT", "8787"))
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print("KBC Trust demo API on http://127.0.0.1:%d (simulated data)" % port, flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
