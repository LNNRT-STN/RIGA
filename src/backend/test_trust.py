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
import seal  # noqa: E402
import server  # noqa: E402
import trust  # noqa: E402

# Skip system proxy lookup (slow on macOS) for local requests.
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))

KEYS = {"subject", "score", "level", "decision", "verifiedPartner", "headline", "summary",
        "checks", "extracted", "verifiedContact", "network", "seal", "elapsedMs"}


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
        self.assertTrue(0 <= r["score"] <= 12, r["score"])
        self.assertEqual((r["level"], r["decision"]), ("danger", "block"))
        self.assertFalse(r["verifiedPartner"])
        self.assertEqual(r["headline"], "This invoice is not from Proximus")
        if seal.available():
            self.assertEqual(r["seal"]["status"], "missing")
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


@unittest.skipUnless(seal.available(), "pip install -r src/backend/requirements.txt")
class SealTests(ShapeMixin, unittest.TestCase):
    """The digital invoice seal: valid, changed after sealing, forged, withdrawn, damaged."""

    REAL = ("Proximus\nInvoice number: PRX-1\nBill to\nLaura Janssens\nDue date: 30 Oct 2026\n"
            "Total due: €64.50\nIBAN: BE38 0000 1234 5672\nEmail: noreply@proximus.be\n"
            "Phone: 0800 22 800\n")
    CLAIMS = {"v": 1, "iss": "proximus", "inv": "PRX-1", "iban": "BE38000012345672",
              "amt": "64.50", "cur": "EUR", "due": "2026-10-30", "ref": "+++1+++",
              "iat": "2026-10-01"}

    def setUp(self):
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        reg.reset()
        self.saved = dict(reg.SEAL_KEYS)
        self.key = Ed25519PrivateKey.generate()
        raw = self.key.public_key().public_bytes(serialization.Encoding.Raw,
                                                 serialization.PublicFormat.Raw)
        for kid, partner, status in (("test-proximus", "proximus", "active"),
                                     ("test-old", "proximus", "revoked"),
                                     ("test-telenet", "telenet", "active")):
            reg.SEAL_KEYS[kid] = {"kid": kid, "partner": partner, "x": seal.b64url(raw),
                                  "validFrom": "2026-01-01", "status": status}

    def tearDown(self):
        reg.SEAL_KEYS.clear()
        reg.SEAL_KEYS.update(self.saved)

    def run_check(self, token, text=None):
        r = trust.check_invoice_text(text or self.REAL, seal_tokens=[token] if token else [])
        self.assertShape(r)
        return r

    def test_valid_seal(self):
        r = self.run_check(seal.sign(self.CLAIMS, self.key, "test-proximus"))
        self.assertEqual(r["seal"]["status"], "valid")
        self.assertEqual(r["seal"]["signedOn"], "1 Oct 2026")
        self.assertEqual((r["score"], r["decision"]), (100, "allow"))
        self.assertTrue(r["verifiedPartner"])

    def test_changed_after_sealing(self):
        text = self.REAL.replace("BE38 0000 1234 5672", "BE63 9671 2345 6108")
        r = self.run_check(seal.sign(self.CLAIMS, self.key, "test-proximus"), text)
        self.assertEqual(r["seal"]["status"], "tampered")
        self.assertEqual(r["seal"]["mismatches"], [
            {"field": "IBAN", "printed": "BE63 9671 2345 6108", "signed": "BE38 0000 1234 5672"}])
        self.assertEqual(r["decision"], "block")
        self.assertFalse(r["verifiedPartner"])
        self.assertEqual(r["headline"], "This invoice was changed after it was sealed")

    def test_changed_amount(self):
        r = self.run_check(seal.sign(self.CLAIMS, self.key, "test-proximus"),
                           self.REAL.replace("€64.50", "€640.50"))
        self.assertEqual([m["field"] for m in r["seal"]["mismatches"]], ["Amount"])
        self.assertEqual(r["decision"], "block")

    def test_forged_signature(self):
        token = seal.sign(self.CLAIMS, self.key, "test-proximus")
        head, body, sig = token.split(".")
        forged_body = seal.b64url(json.dumps(dict(self.CLAIMS, iban="BE63967123456108"),
                                             separators=(",", ":"), sort_keys=True).encode())
        r = self.run_check("%s.%s.%s" % (head, forged_body, sig),
                           self.REAL.replace("BE38 0000 1234 5672", "BE63 9671 2345 6108"))
        self.assertEqual(r["seal"]["status"], "invalid")
        self.assertEqual(r["headline"], "This invoice has a fake Proximus seal")
        self.assertEqual(r["decision"], "block")

    def test_other_partners_key(self):
        r = self.run_check(seal.sign(dict(self.CLAIMS, iss="telenet"), self.key, "test-telenet"))
        self.assertEqual(r["seal"]["status"], "invalid")
        self.assertFalse(r["verifiedPartner"])

    def test_issuer_must_match_key(self):
        # A Telenet key can't seal an invoice that claims to be from Proximus.
        r = self.run_check(seal.sign(self.CLAIMS, self.key, "test-telenet"))
        self.assertEqual(r["seal"]["status"], "invalid")

    def test_revoked_and_unknown_keys(self):
        self.assertEqual(self.run_check(seal.sign(self.CLAIMS, self.key, "test-old"))
                         ["seal"]["status"], "revoked")
        self.assertEqual(self.run_check(seal.sign(self.CLAIMS, self.key, "nobody"))
                         ["seal"]["status"], "unknown-key")

    def test_only_eddsa_is_accepted(self):
        token = seal.sign(self.CLAIMS, self.key, "test-proximus")
        none_head = seal.b64url(b'{"alg":"none","kid":"test-proximus","typ":"kbc-invoice-seal+jws"}')
        self.assertEqual(seal.verify(none_head + token[token.index("."):])["status"], "malformed")

    def test_damaged_tokens(self):
        for token in ("", "a.b", "a.b.c", "!!.??.**", "x" * 3000 + ".a.b",
                      seal.sign(self.CLAIMS, self.key, "test-proximus")[:-4]):
            self.assertIn(seal.verify(token)["status"], ("malformed", "invalid"), token[:20])
        r = self.run_check("not.a.seal")
        self.assertEqual(r["seal"]["status"], "malformed")
        self.assertNotEqual(r["decision"], "allow")
        self.assertEqual(r["headline"], "This invoice has a fake Proximus seal")

    def test_removed_seal_and_new_iban_blocked(self):
        # Removing the seal from a sealing partner's invoice must not make the fake pass.
        r = self.run_check(None, self.REAL.replace("BE38 0000 1234 5672", "BE63 9671 2345 6108"))
        self.assertEqual((r["seal"]["status"], r["decision"]), ("missing", "block"))
        # Without a seal but with the verified IBAN, the money goes to Proximus: a warning only.
        r = self.run_check(None)
        self.assertEqual((r["seal"]["status"], r["level"]), ("missing", "verified"))

    def test_two_seals_are_rejected(self):
        a = seal.sign(self.CLAIMS, self.key, "test-proximus")
        b = seal.sign(dict(self.CLAIMS, inv="PRX-2"), self.key, "test-proximus")
        r = trust.check_invoice_text(self.REAL, seal_tokens=[a, b])
        self.assertEqual(r["seal"]["status"], "malformed")

    def test_partner_without_seals_is_unchanged(self):
        text = self.REAL.replace("Proximus", "Engie Electrabel").replace("proximus.be", "engie.be")
        r = trust.check_invoice_text(text, seal_tokens=[])
        self.assertIsNone(r["seal"])
        self.assertFalse(any(c["id"] == "seal" for c in r["checks"]))

    def test_demo_samples(self):
        # The committed PDFs must match the committed public keys in partner_keys.json.
        reg.SEAL_KEYS.clear()
        reg.SEAL_KEYS.update(self.saved)
        real = server.invoice_endpoint({"sample": "proximus-invoice-september.pdf"})
        self.assertEqual(real["seal"]["status"], "valid")
        changed = server.invoice_endpoint({"sample": "proximus-invoice-november.pdf"})
        self.assertEqual(changed["seal"]["status"], "tampered")
        self.assertEqual(changed["decision"], "block")
        self.assertTrue(any(c["id"] == "domain" and c["status"] == "pass"
                            for c in changed["checks"]), "the perfect fake uses the real domain")


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
        status, body = self.call("/api/trust/keys")
        self.assertEqual(status, 200)
        self.assertTrue(all(k["kty"] == "OKP" and k["crv"] == "Ed25519" and "d" not in k
                            for k in body["keys"]))
        self.assertEqual(self.call("/api/nope", {})[0], 404)
        self.assertEqual(self.call("/api/trust/payee", raw=b"{bad")[0], 400)

    def test_report_and_reset(self):
        status, body = self.call("/api/trust/report", {"iban": "BE71 9672 0381 5524"})
        self.assertEqual((status, body["reports"]), (200, 38))
        self.assertEqual(self.call("/api/demo/reset", {}), (200, {"ok": True}))
        self.assertEqual(reg.get_reports("BE71967203815524")["reports"], 37)


if __name__ == "__main__":
    unittest.main()
