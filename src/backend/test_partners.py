"""Tests for partner sign-up ("Verified by KBC" onboarding).

Run: python3 -m unittest discover src/backend
"""

import json
import os
import sys
import threading
import unittest
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import partners  # noqa: E402
import registry as reg  # noqa: E402
import server  # noqa: E402
import trust  # noqa: E402

OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))

ZONNIG = {
    "enterpriseNumber": "BE 0764.312.290",
    "brandName": "Zonnig Reizen",
    "website": "https://www.zonnigreizen.be",
    "phone": "+32 3 201 44 70",
    "category": "travel",
    "domains": ["zonnigreizen.be"],
    "ibans": ["BE88 7340 4120 8841"],
    "modules": ["invoices", "websites", "calls"],
}

IMPOSTOR = {
    "enterpriseNumber": "0891234515",
    "brandName": "Proximus Facturatie",
    "website": "proximus-factuur.be",
    "phone": "+32 2 555 01 99",
    "category": "telecom",
    "domains": ["proximus-factuur.be"],
    "ibans": ["BE64 7370 1059 3352"],
    "modules": ["invoices"],
}


class RulesTest(unittest.TestCase):
    def setUp(self):
        reg.reset()
        partners.reset()

    tearDown = setUp

    def test_enterprise_number_checksum(self):
        self.assertTrue(partners.enterprise_number_valid("0764312290"))
        self.assertFalse(partners.enterprise_number_valid("0764312291"))
        self.assertFalse(partners.enterprise_number_valid("7643122522"))
        self.assertEqual(partners.normalise_enterprise_number("BE 0764.312.290"), "0764312290")

    def test_iban_checksum(self):
        self.assertTrue(partners.iban_valid("BE88 7340 4120 8841"))
        self.assertFalse(partners.iban_valid("BE88 7340 4120 8842"))
        self.assertFalse(partners.iban_valid("not an iban"))

    def test_lookup_returns_register_extract(self):
        out = partners.lookup("0764.312.290")
        self.assertEqual(out["company"]["legalName"], "Zonnig Reizen BV")
        self.assertEqual(out["company"]["enterpriseNumber"], "0764.312.290")
        self.assertEqual(out["suggested"]["website"], "zonnigreizen.be")

    def test_lookup_rejects_bad_and_unknown_numbers(self):
        with self.assertRaises(partners.OnboardingError) as bad:
            partners.lookup("0764312291")
        self.assertEqual(bad.exception.status, 400)
        self.assertIn("enterpriseNumber", bad.exception.fields)
        with self.assertRaises(partners.OnboardingError) as unknown:
            partners.lookup("0891234614")  # valid checksum, not in the demo register
        self.assertEqual(unknown.exception.status, 404)

    def test_genuine_company_goes_live_and_kate_sees_it(self):
        before = trust.check_website("zonnigreizen.be")
        self.assertFalse(before["verifiedPartner"])

        count = len(reg.PARTNERS)
        out = partners.apply(dict(ZONNIG))
        self.assertEqual(out["decision"], "approved", out["checks"])
        self.assertTrue(all(c["status"] == "pass" for c in out["checks"]))
        self.assertEqual(out["partnerCount"], count + 1)
        self.assertTrue(out["apiKey"].startswith("kbt_test_"))
        self.assertTrue(out["partner"]["joinedToday"])

        after = trust.check_website("zonnigreizen.be")
        self.assertTrue(after["verifiedPartner"])
        self.assertEqual(after["level"], "verified")
        payee = trust.check_payee("Zonnig Reizen BV", "BE88734041208841", "personal")
        self.assertTrue(payee["verifiedPartner"])

    def test_same_company_cannot_sign_up_twice(self):
        partners.apply(dict(ZONNIG))
        with self.assertRaises(partners.OnboardingError) as dup:
            partners.apply(dict(ZONNIG))
        self.assertEqual(dup.exception.status, 409)

    def test_impostor_is_rejected(self):
        out = partners.apply(dict(IMPOSTOR))
        self.assertEqual(out["decision"], "rejected")
        self.assertIsNone(out["partner"])
        self.assertIsNone(out["apiKey"])
        failed = {c["id"] for c in out["checks"] if c["status"] == "fail"}
        self.assertIn("name", failed)
        self.assertIn("domain:proximus-factuur.be", failed)
        self.assertIn("network", failed)
        self.assertEqual(out["checks"][0]["status"], "fail")
        self.assertFalse(trust.check_website("proximus-factuur.be")["verifiedPartner"])

    def test_unconfirmed_details_go_to_an_analyst(self):
        app = dict(ZONNIG, domains=["zonnigreizen.be", "zonnig-boeken.be"])
        out = partners.apply(app)
        self.assertEqual(out["decision"], "review")
        self.assertIsNone(out["partner"])
        warned = [c for c in out["checks"] if c["status"] == "warn"]
        self.assertEqual(warned[0]["id"], "domain:zonnig-boeken.be")

    def test_form_errors_name_the_field(self):
        with self.assertRaises(partners.OnboardingError) as err:
            partners.apply(dict(ZONNIG, ibans=["BE88 7340 4120 8842"], modules=[], phone="12"))
        self.assertEqual(set(err.exception.fields), {"ibans", "modules", "phone"})

    def test_dns_records_have_a_stable_token(self):
        out = partners.dns_records("0764312290", ["zonnigreizen.be", "other.be"])
        first, second = out["records"]
        self.assertTrue(first["found"])
        self.assertFalse(second["found"])
        self.assertTrue(first["value"].startswith("kbc-trust-verify="))
        self.assertEqual(first["value"], partners.dns_records("0764312290", ["zonnigreizen.be"])["records"][0]["value"])

    def test_reset_removes_new_partners(self):
        count = len(reg.PARTNERS)
        partners.apply(dict(ZONNIG))
        partners.reset()
        self.assertEqual(len(reg.PARTNERS), count)
        self.assertNotIn("BE88734041208841", reg.ACCOUNTS)
        self.assertFalse(trust.check_website("zonnigreizen.be")["verifiedPartner"])


class HttpTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.base = "http://127.0.0.1:%d" % cls.httpd.server_address[1]
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def setUp(self):
        reg.reset()
        partners.reset()

    tearDown = setUp

    def request(self, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, headers={"Content-Type": "application/json"})
        try:
            with OPENER.open(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read())
        except urllib.error.HTTPError as err:
            return err.code, json.loads(err.read())

    def test_directory_grows_after_sign_up(self):
        status, before = self.request("/api/partners")
        self.assertEqual(status, 200)
        status, out = self.request("/api/partners/apply", ZONNIG)
        self.assertEqual((status, out["decision"]), (200, "approved"))
        _, after = self.request("/api/partners")
        self.assertEqual(after["count"], before["count"] + 1)
        self.assertEqual(after["partners"][-1]["shortName"], "Zonnig Reizen")

    def test_field_errors_are_returned(self):
        status, out = self.request("/api/partners/lookup", {"enterpriseNumber": "123"})
        self.assertEqual(status, 400)
        self.assertIn("enterpriseNumber", out["fields"])

    def test_demo_reset_clears_partners(self):
        self.request("/api/partners/apply", ZONNIG)
        self.request("/api/demo/reset", {})
        _, after = self.request("/api/partners")
        self.assertNotIn("Zonnig Reizen", [p["shortName"] for p in after["partners"]])


if __name__ == "__main__":
    unittest.main()
