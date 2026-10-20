"""Tests for the KBC Trust demo backend.

Run: python3 -m unittest discover src/backend
"""

import base64
import json
import os
import sys
import threading
import unittest
import urllib.error
import urllib.request
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import make_demo_pdfs  # noqa: E402
import pdf_text  # noqa: E402
import registry as reg  # noqa: E402
import server  # noqa: E402
import trust  # noqa: E402

# Skip system proxy lookup (slow on macOS) for local requests.
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))

KEYS = {"subject", "score", "level", "decision", "verifiedPartner", "headline", "summary",
        "checks", "extracted", "verifiedContact", "network", "elapsedMs"}


def sample(name):
    path = os.path.join(server.DEMO_DIR, name)
    if not os.path.exists(path):
        make_demo_pdfs.main()
    with open(path, "rb") as fh:
        return fh.read()


class ShapeMixin:
    def assertShape(self, r):
        self.assertEqual(set(r), KEYS)
        self.assertIsInstance(r["score"], int)
        self.assertTrue(0 <= r["score"] <= 100)
        self.assertLessEqual(len(r["headline"]), 60)
        self.assertFalse(r["headline"].endswith("."))
        for c in r["checks"]:
            self.assertEqual(set(c), {"id", "label", "status", "detail"})
            self.assertIn(c["status"], ("pass", "fail", "warn"))
            self.assertLessEqual(len(c["label"]), 40, c["label"])


class PdfTextTests(unittest.TestCase):
    def test_extracts_demo_invoice(self):
        text = pdf_text.extract_text(sample("proximus-invoice-october.pdf"))
        self.assertIn("IBAN: BE71 9672 0381 5524", text)
        self.assertIn("Total due: €89.99", text)

    def test_flate_stream_and_escapes(self):
        content = b"BT /F1 10 Tf 1 0 0 1 50 700 Tm (Pay \\(now\\) \\200 5) Tj ET"
        comp = zlib.compress(content)
        pdf = (b"%PDF-1.4\n1 0 obj\n<< /Length " + str(len(comp)).encode()
               + b" /Filter /FlateDecode >>\nstream\n" + comp + b"\nendstream\nendobj\n%%EOF")
        self.assertEqual(pdf_text.extract_text(pdf), "Pay (now) € 5")

    def test_garbage_returns_empty(self):
        self.assertEqual(pdf_text.extract_text(b"not a pdf"), "")


class InvoiceTests(ShapeMixin, unittest.TestCase):
    def setUp(self):
        reg.reset()

    def test_fake_proximus_blocked(self):
        r = server.invoice_endpoint({"sample": "proximus-invoice-october.pdf"})
        self.assertShape(r)
        self.assertTrue(4 <= r["score"] <= 12, r["score"])
        self.assertEqual((r["level"], r["decision"]), ("danger", "block"))
        self.assertFalse(r["verifiedPartner"])
        self.assertEqual(r["headline"], "This invoice is not from Proximus")
        self.assertEqual(r["verifiedContact"]["name"], "Proximus NV")
        self.assertEqual(r["network"]["reports"], 37)
        self.assertEqual(r["extracted"]["Email domain"], "proximus-factuur.be")

    def test_real_proximus_verified(self):
        r = server.invoice_endpoint({"sample": "proximus-invoice-september.pdf"})
        self.assertShape(r)
        self.assertTrue(96 <= r["score"] <= 100)
        self.assertEqual(r["decision"], "allow")
        self.assertTrue(r["verifiedPartner"])
        self.assertTrue(all(c["status"] == "pass" for c in r["checks"]))

    def test_van_damme_new_iban_blocked(self):
        r = server.invoice_endpoint({"sample": "van-damme-invoice-1043.pdf"})
        self.assertShape(r)
        self.assertEqual(r["decision"], "block")
        self.assertEqual(r["extracted"]["Amount"], "€12,480.00")

    def test_upload_base64(self):
        data = base64.b64encode(sample("proximus-invoice-october.pdf")).decode()
        r = server.invoice_endpoint({"fileName": "x.pdf", "contentBase64": data})
        self.assertEqual(r["decision"], "block")

    def test_unreadable_upload(self):
        data = base64.b64encode(b"%PDF-1.4\n%%EOF").decode()
        r = server.invoice_endpoint({"fileName": "scan.pdf", "contentBase64": data})
        self.assertShape(r)
        self.assertEqual((r["level"], r["decision"]), ("review", "review"))
        self.assertEqual(r["headline"], "We could not read this invoice")

    def test_filename_fallback(self):
        data = base64.b64encode(b"%PDF-1.4\n%%EOF").decode()
        r = server.invoice_endpoint({"fileName": "proximus-invoice-september.pdf",
                                     "contentBase64": data})
        self.assertTrue(r["verifiedPartner"])


class PayeeTests(ShapeMixin, unittest.TestCase):
    def setUp(self):
        reg.reset()

    def test_van_damme_fraud_iban(self):
        r = trust.check_payee("Van Damme Packaging NV", "BE09001833662157", "business")
        self.assertShape(r)
        self.assertTrue(4 <= r["score"] <= 12, r["score"])
        self.assertEqual(r["decision"], "block")
        self.assertEqual(r["headline"], "This account doesn't belong to Van Damme Packaging")
        self.assertEqual(r["verifiedContact"]["iban"], "BE55 7330 4471 0044")

    def test_van_damme_correct_iban(self):
        r = trust.check_payee("Van Damme Packaging NV", "BE55 7330 4471 0044", "business")
        self.assertGreaterEqual(r["score"], 96)
        self.assertTrue(r["verifiedPartner"])
        self.assertEqual(r["decision"], "allow")

    def test_known_personal_payee(self):
        r = trust.check_payee("Tom Peeters", "BE43 0689 9999 9501", "personal")
        self.assertTrue(92 <= r["score"] <= 97)
        self.assertEqual(r["level"], "verified")
        self.assertFalse(r["verifiedPartner"])
        self.assertEqual(r["headline"], "You have paid Tom Peeters before")

    def test_unknown_payee(self):
        r = trust.check_payee("Ann Smet", "BE12345678901234", "personal")
        self.assertEqual(r["score"], 70)
        self.assertEqual(r["level"], "caution")
        self.assertEqual(r["headline"], "First payment to this account")


class CallAndWebsiteTests(ShapeMixin, unittest.TestCase):
    def setUp(self):
        reg.reset()

    def test_ceo_deepfake(self):
        r = trust.check_call_scenario("ceo-deepfake")
        self.assertShape(r)
        self.assertTrue(3 <= r["score"] <= 6, r["score"])
        self.assertEqual(r["decision"], "block")
        self.assertEqual(r["headline"], "This is probably not Pieter Claes")
        self.assertEqual(r["verifiedContact"]["phone"], "+32 478 12 34 56")
        self.assertEqual(r["extracted"]["Request"], "Pay €48,500.00 today")

    def test_verified_call(self):
        r = trust.check_call("+32 478 12 34 56", "Pieter Claes", True)
        self.assertEqual(r["level"], "verified")

    def test_websites(self):
        self.assertEqual(trust.check_website("https://www.proximus.be/x")["level"], "verified")
        self.assertEqual(trust.check_website("proximus-factuur.be")["level"], "danger")
        self.assertEqual(trust.check_website("example.org")["level"], "caution")


class HttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.httpd.RequestHandlerClass.log_message = lambda *a: None
        cls.base = "http://127.0.0.1:%d" % cls.httpd.server_address[1]
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def call(self, path, body=None, raw=None):
        data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
        req = urllib.request.Request(self.base + path, data=data,
                                     headers={"Content-Type": "application/json"})
        try:
            with OPENER.open(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read())
        except urllib.error.HTTPError as err:
            return err.code, json.loads(err.read())

    def test_health_and_errors(self):
        self.assertEqual(self.call("/api/health"), (200, {"ok": True}))
        self.assertEqual(self.call("/api/nope", {})[0], 404)
        self.assertEqual(self.call("/api/trust/payee", raw=b"{bad")[0], 400)

    def test_report_and_reset(self):
        status, body = self.call("/api/trust/report", {"iban": "BE71 9672 0381 5524"})
        self.assertEqual((status, body["reports"]), (200, 38))
        self.assertEqual(self.call("/api/demo/reset", {}), (200, {"ok": True}))
        self.assertEqual(reg.get_reports("BE71967203815524")["reports"], 37)


if __name__ == "__main__":
    unittest.main()
