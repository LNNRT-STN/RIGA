"""Partner sign-up: how a company becomes "Verified by KBC".

A company enters its enterprise number, says how customers will recognise it
(name, website, phone), and proves what it owns (sender domains, IBANs). KBC
runs the onboarding checks below. Clean applications go live at once and join
the registry every Trust check reads, so every KBC customer sees the company as
verified on their next check. Anything uncertain goes to a KBC analyst (human
in the loop). Lookalikes of a verified partner, or anything KBC customers have
reported, are rejected.

Rule based (real code): enterprise number checksum (mod 97), IBAN checksum
(ISO 13616 mod 97), account holder match, lookalike detection against verified
partners, network reports, duplicate checks and the decision.

SIMULATED: the enterprise register extract, account holders and ages, DNS TXT
lookups and the phone confirmation. Approved partners live in memory and are
removed by ``reset()``.
"""

import hashlib
import re
import secrets
import threading
import time

import registry as reg
import trust

_LOCK = threading.Lock()

# New companies are a common front for invoice fraud, so an analyst looks first.
NEW_COMPANY_DAYS = 180
NEW_ACCOUNT_DAYS = 90

CATEGORIES = ["telecom", "energy", "travel", "retail", "insurance", "supplier", "other"]

# What a partner switches on. New threats become new modules; "planned" ones are
# shown in the portal but can't be switched on yet.
MODULES = [
    {"id": "invoices", "label": "Invoices and payment requests",
     "detail": "Kate confirms your invoices and IBANs before customers pay.", "status": "available"},
    {"id": "websites", "label": "Website and emails",
     "detail": "Kate confirms your domains and warns about lookalikes.", "status": "available"},
    {"id": "calls", "label": "Phone calls",
     "detail": "Kate confirms calls from your customer service number.", "status": "available"},
    {"id": "employees", "label": "Employees at the door",
     "detail": "Customers check that a technician or adviser really works for you.", "status": "planned"},
]
AVAILABLE_MODULES = {m["id"] for m in MODULES if m["status"] == "available"}

# SIMULATED: extract of the Crossroads Bank for Enterprises (KBO/BCE) plus what KBC
# already knows about the company as a business customer. Fictional companies.
COMPANY_REGISTER = {
    "0764312290": {
        "legalName": "Zonnig Reizen BV",
        "legalForm": "Private limited company (BV)",
        "address": "Meir 24, 2000 Antwerpen",
        "founded": "4 Mar 2011",
        "foundedDaysAgo": 5709,
        "activity": "Travel agency (NACE 79.110)",
        "active": True,
        "kbcCustomerSince": "2014",
        "accounts": {"BE88734041208841": {"holder": "Zonnig Reizen BV", "openedDaysAgo": 4300}},
        "dnsVerified": ["zonnigreizen.be"],
        "suggested": {
            "brandName": "Zonnig Reizen",
            "website": "zonnigreizen.be",
            "phone": "+32 3 201 44 70",
            "category": "travel",
            "domains": ["zonnigreizen.be"],
            "ibans": ["BE88 7340 4120 8841"],
        },
    },
    "0891234515": {
        "legalName": "PX Billing Services BV",
        "legalForm": "Private limited company (BV)",
        "address": "Nieuwstraat 1, 1000 Brussel",
        "founded": "11 Oct 2026",
        "foundedDaysAgo": 9,
        "activity": "Business support services (NACE 82.990)",
        "active": True,
        "kbcCustomerSince": None,
        "accounts": {"BE64737010593352": {"holder": "PX Billing Services BV", "openedDaysAgo": 6}},
        "dnsVerified": ["proximus-factuur.be"],
        "suggested": None,
    },
}

_onboarded = []        # partner dicts added to reg.PARTNERS
_added_accounts = []   # IBANs added to reg.ACCOUNTS


class OnboardingError(Exception):
    """Invalid input. `fields` maps a form field to what to fix."""

    def __init__(self, status, message, fields=None):
        super().__init__(message)
        self.status = status
        self.message = message
        self.fields = fields or {}


# --------------------------------------------------------------------------
# Validation helpers (real rules)
# --------------------------------------------------------------------------

def normalise_enterprise_number(value):
    """Return 10 digits, e.g. "BE 0764.312.290" -> "0764312290"."""
    digits = re.sub(r"\D", "", str(value or ""))
    if len(digits) == 9:  # old numbers without the leading 0
        digits = "0" + digits
    return digits


def format_enterprise_number(digits):
    return "%s.%s.%s" % (digits[:4], digits[4:7], digits[7:])


def enterprise_number_valid(digits):
    """Belgian enterprise number: 10 digits starting with 0 or 1, last two are 97 - (first 8 mod 97)."""
    if not re.fullmatch(r"[01]\d{9}", digits or ""):
        return False
    return 97 - int(digits[:8]) % 97 == int(digits[8:])


def iban_valid(value):
    """ISO 13616 checksum: move the first four characters to the end, letters to numbers, mod 97 == 1."""
    iban = reg.normalise_iban(value)
    if not re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{10,30}", iban):
        return False
    if iban.startswith("BE") and len(iban) != 16:
        return False
    rearranged = iban[4:] + iban[:4]
    return int("".join(str(int(ch, 36)) for ch in rearranged)) % 97 == 1


def domain_valid(domain):
    return bool(re.fullmatch(r"(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}", domain or ""))


def phone_valid(phone):
    digits = re.sub(r"\D", "", str(phone or ""))
    return 8 <= len(digits) <= 15


def verification_token(enterprise_number, domain):
    """The TXT record value a partner adds to prove it controls a domain."""
    digest = hashlib.sha256(("%s:%s" % (enterprise_number, domain)).encode("utf-8")).hexdigest()
    return "kbc-trust-verify=" + digest[:20]


def _slug(text):
    return re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-") or "partner"


# --------------------------------------------------------------------------
# Directory
# --------------------------------------------------------------------------

def _modules_of(partner):
    if partner.get("modules"):
        return list(partner["modules"])
    # Partners from before sign-up existed: derive from what KBC has on file.
    out = []
    if partner.get("ibans"):
        out.append("invoices")
    if partner.get("domains"):
        out.append("websites")
    if partner.get("phone"):
        out.append("calls")
    return out


def directory_entry(partner):
    return {
        "id": partner["id"],
        "name": partner["name"],
        "shortName": partner["shortName"],
        "category": partner.get("category", "other"),
        "website": partner.get("website"),
        "verifiedSince": partner["verifiedSince"],
        "modules": _modules_of(partner),
        "joinedToday": bool(partner.get("onboarded")),
    }


def directory():
    with _LOCK:
        partners = [directory_entry(p) for p in reg.PARTNERS]
    return {"partners": partners, "count": len(partners), "modules": MODULES, "categories": CATEGORIES}


def _onboarded_by_number(digits):
    for partner in _onboarded:
        if partner.get("enterpriseNumber") == digits:
            return partner
    return None


# --------------------------------------------------------------------------
# Step 1: look up the company
# --------------------------------------------------------------------------

def lookup(enterprise_number):
    digits = normalise_enterprise_number(enterprise_number)
    if not enterprise_number_valid(digits):
        raise OnboardingError(400, "This is not a valid Belgian enterprise number.", {
            "enterpriseNumber": "Check the number. It has 10 digits, like 0764.312.290."})
    if _onboarded_by_number(digits):
        raise OnboardingError(409, "This company is already verified by KBC.", {
            "enterpriseNumber": "This company is already a verified partner."})
    record = COMPANY_REGISTER.get(digits)
    if record is None:
        raise OnboardingError(404, "We can't find this company in the enterprise register.", {
            "enterpriseNumber": "No active company with this number. The demo register knows 0764.312.290."})
    return {
        "company": {
            "enterpriseNumber": format_enterprise_number(digits),
            "legalName": record["legalName"],
            "legalForm": record["legalForm"],
            "address": record["address"],
            "founded": record["founded"],
            "activity": record["activity"],
            "active": record["active"],
            "kbcCustomerSince": record["kbcCustomerSince"],
        },
        "suggested": record["suggested"],
    }


def dns_records(enterprise_number, domains):
    """The TXT record to add per domain, and whether we see it (SIMULATED lookup)."""
    digits = normalise_enterprise_number(enterprise_number)
    record = COMPANY_REGISTER.get(digits)
    out = []
    for raw in domains or []:
        d = reg.normalise_domain(raw)
        if not domain_valid(d):
            continue
        out.append({"domain": d, "host": "_kbc-trust." + d, "type": "TXT",
                    "value": verification_token(digits, d),
                    "found": bool(record and d in record["dnsVerified"])})
    return {"records": out}


# --------------------------------------------------------------------------
# Step 2 to 4: apply
# --------------------------------------------------------------------------

def _clean_application(body):
    """Validate the form. Raises OnboardingError with per-field messages."""
    fields = {}
    digits = normalise_enterprise_number(body.get("enterpriseNumber"))
    if not enterprise_number_valid(digits):
        fields["enterpriseNumber"] = "Check the enterprise number."

    brand = re.sub(r"\s+", " ", str(body.get("brandName") or "")).strip()
    if len(brand) < 2:
        fields["brandName"] = "Enter the name customers know you by."

    website = reg.normalise_domain(body.get("website"))
    if not domain_valid(website):
        fields["website"] = "Enter a web address, like zonnigreizen.be."

    phone = str(body.get("phone") or "").strip()
    if not phone_valid(phone):
        fields["phone"] = "Enter your customer service number, like +32 3 201 44 70."

    category = body.get("category") if body.get("category") in CATEGORIES else "other"

    domains = []
    for raw in body.get("domains") or []:
        d = reg.normalise_domain(raw)
        if d and d not in domains:
            domains.append(d)
    if website and website not in domains:
        domains.insert(0, website)
    bad = [d for d in domains if not domain_valid(d)]
    if bad:
        fields["domains"] = "%s is not a valid domain." % bad[0]

    ibans = []
    for raw in body.get("ibans") or []:
        i = reg.normalise_iban(raw)
        if i and i not in ibans:
            ibans.append(i)
    if not ibans:
        fields["ibans"] = "Add the account customers pay you on."
    else:
        bad = [i for i in ibans if not iban_valid(i)]
        if bad:
            fields["ibans"] = "%s is not a valid IBAN. Check for a typo." % reg.format_iban(bad[0])

    modules = [m for m in (body.get("modules") or []) if m in AVAILABLE_MODULES]
    if not modules:
        fields["modules"] = "Choose at least one thing Kate should confirm."

    if fields:
        raise OnboardingError(400, "Some details need a fix.", fields)
    if _onboarded_by_number(digits):
        raise OnboardingError(409, "This company is already verified by KBC.",
                              {"enterpriseNumber": "This company is already a verified partner."})
    return {"enterpriseNumber": digits, "brandName": brand, "website": website, "phone": phone,
            "category": category, "domains": domains, "ibans": ibans, "modules": modules}


def _account(record, iban):
    """Account holder and age (SIMULATED: register extract first, then the shared bank data)."""
    if record and iban in record["accounts"]:
        return record["accounts"][iban]
    return reg.account_info(iban)


def run_checks(app):
    record = COMPANY_REGISTER.get(app["enterpriseNumber"])
    legal_name = record["legalName"] if record else app["brandName"]
    checks = []

    # 1. Enterprise register
    if record and record["active"]:
        checks.append(trust.check("register", "Active company", "pass",
                                  "%s is registered as %s since %s."
                                  % (legal_name, record["activity"].split(" (")[0].lower(), record["founded"])))
        if record["foundedDaysAgo"] < NEW_COMPANY_DAYS:
            checks.append(trust.check("company-age", "Company founded %d days ago" % record["foundedDaysAgo"],
                                      "warn", "New companies are checked by a KBC analyst before they go live."))
    else:
        checks.append(trust.check("register", "Not in the enterprise register", "fail",
                                  "We can't find an active company with this number."))

    # 2. Identity: KBC business customers were already checked (KYC).
    if record and record["kbcCustomerSince"]:
        checks.append(trust.check("identity", "Known to KBC since %s" % record["kbcCustomerSince"], "pass",
                                  "KBC already checked the company and its directors as a business customer."))
    else:
        checks.append(trust.check("identity", "Directors not yet identified", "warn",
                                  "This company doesn't bank with KBC, so an analyst confirms who runs it."))

    # 3. Not posing as a verified partner
    clash = reg.find_partner_by_name(app["brandName"]) or reg.find_partner_by_name(legal_name)
    if clash:
        checks.append(trust.check("name", "Name of a verified partner", "fail",
                                  "%s is already verified for %s. Only that company can use the name."
                                  % (clash["shortName"], clash["name"])))
    else:
        checks.append(trust.check("name", "Unique name", "pass",
                                  "%s doesn't imitate a verified partner." % app["brandName"]))

    # 4. Domains: ownership (SIMULATED DNS) and lookalikes (real rule)
    for d in app["domains"]:
        owner = reg.find_partner_by_domain(d)
        look, real = trust.lookalike_partner(d)
        if owner:
            checks.append(trust.check("domain:" + d, "%s belongs to %s" % (d, owner["shortName"]), "fail",
                                      "This domain is already verified for %s." % owner["name"]))
        elif look:
            checks.append(trust.check("domain:" + d, "%s imitates %s" % (d, real), "fail",
                                      "%s looks like %s, the real %s website."
                                      % (d, real, look["shortName"])))
        elif record and d in record["dnsVerified"]:
            checks.append(trust.check("domain:" + d, "You control %s" % d, "pass",
                                      "We found your verification record in the DNS of %s." % d))
        else:
            checks.append(trust.check("domain:" + d, "Waiting for the DNS record on %s" % d, "warn",
                                      "Add the TXT record and an analyst confirms the domain."))

    # 5. IBANs: holder matches the company (simulated Verification of Payee), account age
    for iban in app["ibans"]:
        info = _account(record, iban)
        shown = reg.format_iban(iban)
        owner = reg.find_partner_by_iban(iban)
        if owner:
            checks.append(trust.check("iban:" + iban, "Account of %s" % owner["shortName"], "fail",
                                      "%s is already verified for %s." % (shown, owner["name"])))
            continue
        if info is None:
            checks.append(trust.check("iban:" + iban, "Account holder not confirmed", "warn",
                                      "%s is at another bank. An analyst confirms the holder." % shown))
            continue
        match = reg.names_match(info["holder"], legal_name)
        if match == "match":
            checks.append(trust.check("iban:" + iban, "Account in your name", "pass",
                                      "%s is held by %s." % (shown, info["holder"])))
        elif match == "close":
            checks.append(trust.check("iban:" + iban, "Account holder is a close match", "warn",
                                      "%s is held by %s, not %s." % (shown, info["holder"], legal_name)))
        else:
            checks.append(trust.check("iban:" + iban, "Account in someone else's name", "fail",
                                      "%s is held by %s, not by %s." % (shown, info["holder"], legal_name)))
        if info["openedDaysAgo"] < NEW_ACCOUNT_DAYS:
            checks.append(trust.check("iban-age:" + iban, "Account opened %d days ago" % info["openedDaysAgo"],
                                      "warn", "New accounts are checked by an analyst first."))

    # 6. Phone (SIMULATED: confirmed with a one-time code)
    phone_owner = next((p for p in reg.PARTNERS
                        if reg.normalise_phone(p["phone"]) == reg.normalise_phone(app["phone"])), None)
    if phone_owner:
        checks.append(trust.check("phone", "Number of %s" % phone_owner["shortName"], "fail",
                                  "%s is already verified for %s." % (app["phone"], phone_owner["name"])))
    else:
        checks.append(trust.check("phone", "Phone number confirmed", "pass",
                                  "We called %s and the code was entered." % app["phone"]))

    # 7. Reports from KBC customers on anything in the application
    reported = []
    for key in app["domains"] + app["ibans"] + [app["phone"]]:
        n = reg.get_reports(key)["reports"]
        if n:
            reported.append((key, n))
    if reported:
        key, n = max(reported, key=lambda kn: kn[1])
        shown = reg.format_iban(key) if reg.normalise_iban(key) in app["ibans"] else key
        checks.append(trust.check("network", "Reported by KBC customers", "fail",
                                  "%s was reported as a scam %d times." % (shown, n)))
    else:
        checks.append(trust.check("network", "No scam reports", "pass",
                                  "No KBC customer reported your domains, accounts or number."))
    return record, legal_name, checks


def apply(body):
    started = time.perf_counter()
    app = _clean_application(body)
    record, legal_name, checks = run_checks(app)

    statuses = {c["status"] for c in checks}
    if "fail" in statuses:
        decision = "rejected"
        headline = "We can't verify this company"
        summary = ("Some details belong to another company or were reported by KBC customers. "
                   "Nothing goes live, and Secure4u, KBC's fraud team, is informed.")
    elif "warn" in statuses:
        decision = "review"
        headline = "A KBC analyst checks a few points"
        summary = ("Most checks passed. A person at KBC confirms the open points, "
                   "then %s goes live." % app["brandName"])
    else:
        decision = "approved"
        headline = "%s is verified by KBC" % app["brandName"]
        summary = "Every KBC customer now sees %s as verified in Kate." % app["brandName"]

    partner = None
    api_key = None
    with _LOCK:
        if decision == "approved":
            if _onboarded_by_number(app["enterpriseNumber"]):
                raise OnboardingError(409, "This company is already verified by KBC.")
            partner = {
                "id": _slug(app["brandName"]),
                "name": legal_name,
                "shortName": app["brandName"],
                "aliases": [_slug(app["brandName"]).replace("-", " ")],
                "domains": app["domains"],
                "ibans": app["ibans"],
                "phone": app["phone"],
                "website": app["website"],
                "verifiedSince": reg.TODAY,
                "category": app["category"],
                "modules": app["modules"],
                "enterpriseNumber": app["enterpriseNumber"],
                "onboarded": True,
            }
            reg.PARTNERS.append(partner)
            _onboarded.append(partner)
            # Let Verification of Payee in the customer checks know the holder.
            for iban in app["ibans"]:
                info = _account(record, iban)
                if info and iban not in reg.ACCOUNTS:
                    reg.ACCOUNTS[iban] = dict(info)
                    _added_accounts.append(iban)
            # SIMULATED sandbox key; nothing authenticates with it in the demo.
            api_key = "kbt_test_" + secrets.token_hex(12)
        count = len(reg.PARTNERS)

    order = {"fail": 0, "warn": 1, "pass": 2}
    ranked = sorted(checks, key=lambda c: order[c["status"]])
    return {
        "decision": decision,
        "headline": headline,
        "summary": summary,
        "checks": [{k: v for k, v in c.items() if not k.startswith("_")} for c in ranked],
        "partner": directory_entry(partner) if partner else None,
        "apiKey": api_key,
        "partnerCount": count,
        "elapsedMs": max(1, int(round((time.perf_counter() - started) * 1000))),
    }


def reset():
    """Remove partners added through sign-up."""
    with _LOCK:
        for partner in _onboarded:
            if partner in reg.PARTNERS:
                reg.PARTNERS.remove(partner)
        for iban in _added_accounts:
            reg.ACCOUNTS.pop(iban, None)
        _onboarded.clear()
        _added_accounts.clear()
