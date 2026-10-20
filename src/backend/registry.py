"""Mock KBC Trust registry for the hackathon demo.

SIMULATED: every company, IBAN, phone number, person and report count in this
file is synthetic and fictional. Nothing here talks to KBC, Proximus or any
other real system. The registry stands in for what KBC would know about:

* "Verified by KBC" partners: companies that integrated with KBC and had their
  company details, IBANs, sender domains and phone numbers checked.
* Network reports: IBANs, phone numbers and domains that KBC customers reported
  as scams (mutable in memory, reset with ``reset()``).
* Account facts that a bank can see for its own or SEPA accounts (holder name
  for Verification of Payee, account age).
* People enrolled with KBC Trust for call verification.
* Payment history per demo account.
"""

import copy
import re
import threading

TODAY = "20 Oct 2026"

_LOCK = threading.Lock()


def normalise_iban(value):
    """Return an IBAN without spaces, upper case."""
    return re.sub(r"\s+", "", str(value or "")).upper()


def format_iban(value):
    """Return an IBAN in groups of four, e.g. BE38 0000 1234 5672."""
    iban = normalise_iban(value)
    return " ".join(iban[i:i + 4] for i in range(0, len(iban), 4))


def normalise_phone(value):
    """Return a Belgian phone number as national digits, e.g. 0465892107."""
    digits = re.sub(r"[^\d+]", "", str(value or ""))
    if digits.startswith("+32"):
        digits = "0" + digits[3:]
    elif digits.startswith("0032"):
        digits = "0" + digits[4:]
    return digits.replace("+", "")


def normalise_domain(value):
    value = str(value or "").strip().lower()
    value = re.sub(r"^[a-z]+://", "", value)
    value = value.split("/")[0].split("?")[0].split("#")[0]
    value = value.split("@")[-1].split(":")[0]
    if value.startswith("www."):
        value = value[4:]
    return value.strip(".")


# SIMULATED: synthetic partner data. IBANs are fictional.
PARTNERS = [
    {
        "id": "proximus",
        "name": "Proximus NV",
        "shortName": "Proximus",
        "aliases": ["proximus"],
        "domains": ["proximus.be", "proximus.com"],
        "ibans": ["BE38000012345672"],
        "phone": "0800 22 800",
        "website": "proximus.be",
        "verifiedSince": "12 Mar 2026",
        "category": "telecom",
    },
    {
        "id": "van-damme",
        "name": "Van Damme Packaging NV",
        "shortName": "Van Damme Packaging",
        "aliases": ["van damme packaging", "vandamme packaging", "van damme"],
        "domains": ["vandamme-packaging.be"],
        "ibans": ["BE55733044710044"],
        "phone": "+32 9 225 41 10",
        "website": "vandamme-packaging.be",
        "verifiedSince": "3 Jun 2026",
        "category": "packaging supplier",
    },
    {
        "id": "engie",
        "name": "Engie Electrabel NV",
        "shortName": "Engie",
        "aliases": ["engie electrabel", "engie", "electrabel"],
        "domains": ["engie.be"],
        "ibans": ["BE46000325448336"],
        "phone": "078 35 33 33",
        "website": "engie.be",
        "verifiedSince": "21 Apr 2026",
        "category": "energy",
    },
    {
        "id": "telenet",
        "name": "Telenet BV",
        "shortName": "Telenet",
        "aliases": ["telenet"],
        "domains": ["telenet.be"],
        "ibans": ["BE30001234567811"],
        "phone": "015 66 66 66",
        "website": "telenet.be",
        "verifiedSince": "8 May 2026",
        "category": "telecom",
    },
]

# SIMULATED: network reports by KBC customers. Keys are normalised IBANs,
# phone numbers (national digits) or domains.
_DEFAULT_REPORTS = {
    "BE71967203815524": {"reports": 37, "lastReported": "19 Oct 2026"},
    "BE09001833662157": {"reports": 4, "lastReported": "18 Oct 2026"},
    "0465892107": {"reports": 2, "lastReported": "17 Oct 2026"},
    "proximus-factuur.be": {"reports": 12, "lastReported": "19 Oct 2026"},
}

# SIMULATED: account facts (Verification of Payee holder name, account age).
ACCOUNTS = {
    "BE38000012345672": {"holder": "Proximus NV", "openedDaysAgo": 4100},
    "BE55733044710044": {"holder": "Van Damme Packaging NV", "openedDaysAgo": 3650},
    "BE46000325448336": {"holder": "Engie Electrabel NV", "openedDaysAgo": 5200},
    "BE30001234567811": {"holder": "Telenet BV", "openedDaysAgo": 4800},
    "BE09001833662157": {"holder": "VD Packaging Services", "openedDaysAgo": 9},
    "BE43068999999501": {"holder": "Tom Peeters", "openedDaysAgo": 2900},
    "BE68539007547034": {"holder": "Sara De Smet", "openedDaysAgo": 1800},
    "BE19738012345612": {"holder": "Immo Vandenberghe", "openedDaysAgo": 6100},
    "BE56001122334488": {"holder": "Jonas Maes", "openedDaysAgo": 1200},
    "BE88967012340941": {"holder": "Revolut", "openedDaysAgo": 2100},
}

# SIMULATED: payment history per demo account (payee name -> IBAN, count).
HISTORY = {
    "business": [
        {"name": "Van Damme Packaging NV", "iban": "BE55733044710044", "count": 6},
    ],
    "personal": [
        {"name": "Tom Peeters", "iban": "BE43068999999501", "count": 4},
        {"name": "Sara De Smet", "iban": "BE68539007547034", "count": 7},
        {"name": "Immo Vandenberghe", "iban": "BE19738012345612", "count": 12},
        {"name": "Jonas Maes", "iban": "BE56001122334488", "count": 2},
        {"name": "Revolut", "iban": "BE88967012340941", "count": 3},
    ],
}

# SIMULATED: people enrolled with KBC Trust (voice and face enrolment is fake).
PEOPLE = [
    {
        "id": "pieter-claes",
        "name": "Pieter Claes",
        "role": "CEO",
        "company": "Noord Design BV",
        "phone": "+32 478 12 34 56",
        "website": "noorddesign.be",
        "verifiedSince": "14 Feb 2026",
        "voiceEnrolled": True,
        "faceEnrolled": True,
    },
]

_reports = copy.deepcopy(_DEFAULT_REPORTS)


def reset():
    """Restore the in-memory report counts to their defaults."""
    global _reports
    with _LOCK:
        _reports = copy.deepcopy(_DEFAULT_REPORTS)


def report_key(value):
    """Return the network-report key for an IBAN, phone number or domain."""
    text = str(value or "").strip()
    if re.match(r"^[A-Za-z]{2}\d{2}", normalise_iban(text)):
        return normalise_iban(text)
    if re.search(r"\d{6,}", re.sub(r"\D", "", text)) and not re.search(r"[a-zA-Z]", text):
        return normalise_phone(text)
    return normalise_domain(text)


def get_reports(value):
    """Return {"reports": int, "lastReported": str | None} for a key."""
    key = report_key(value)
    with _LOCK:
        entry = _reports.get(key)
        if entry:
            return dict(entry)
    return {"reports": 0, "lastReported": None}


def add_report(value):
    """Increment the report count for an IBAN, number or domain."""
    key = report_key(value)
    with _LOCK:
        entry = _reports.setdefault(key, {"reports": 0, "lastReported": None})
        entry["reports"] += 1
        entry["lastReported"] = TODAY
        return dict(entry)


def _clean_name(name):
    name = str(name or "").lower()
    name = re.sub(r"[^a-z0-9 ]+", " ", name)
    name = re.sub(r"\b(nv|bv|bvba|srl|sa|sprl|vzw|ltd)\b", " ", name)
    return re.sub(r"\s+", " ", name).strip()


def find_partner_by_name(name):
    cleaned = _clean_name(name)
    if not cleaned:
        return None
    for partner in PARTNERS:
        for alias in partner["aliases"]:
            if re.search(r"\b" + re.escape(alias) + r"\b", cleaned):
                return partner
    return None


def find_partner_in_text(text):
    """Return the partner whose name appears first in the text."""
    lowered = str(text or "").lower()
    best = None
    best_pos = None
    for partner in PARTNERS:
        for alias in partner["aliases"]:
            match = re.search(r"\b" + re.escape(alias) + r"\b", lowered)
            if match and (best_pos is None or match.start() < best_pos):
                best, best_pos = partner, match.start()
    return best


def find_partner_by_domain(domain):
    domain = normalise_domain(domain)
    for partner in PARTNERS:
        for d in partner["domains"]:
            if domain == d or domain.endswith("." + d):
                return partner
    return None


def find_partner_by_iban(iban):
    iban = normalise_iban(iban)
    for partner in PARTNERS:
        if iban in partner["ibans"]:
            return partner
    return None


def find_person_by_name(name):
    cleaned = _clean_name(name)
    for person in PEOPLE:
        if _clean_name(person["name"]) == cleaned or _clean_name(person["name"]) in cleaned:
            return person
    return None


def find_person_by_phone(phone):
    phone = normalise_phone(phone)
    for person in PEOPLE:
        if normalise_phone(person["phone"]) == phone:
            return person
    return None


def account_info(iban):
    return ACCOUNTS.get(normalise_iban(iban))


def history_for(account, name=None, iban=None):
    """Return history entries matching a payee name and/or IBAN."""
    entries = HISTORY.get(account or "personal", [])
    out = []
    for entry in entries:
        if iban and entry["iban"] == normalise_iban(iban):
            out.append(entry)
        elif name and names_match(entry["name"], name) == "match":
            out.append(entry)
    return out


def names_match(a, b):
    """Simulated Verification of Payee: "match", "close" or "none"."""
    import difflib

    ca, cb = _clean_name(a), _clean_name(b)
    if not ca or not cb:
        return "none"
    if ca == cb:
        return "match"
    tokens_a, tokens_b = set(ca.split()), set(cb.split())
    overlap = tokens_a & tokens_b
    if overlap or difflib.SequenceMatcher(None, ca, cb).ratio() >= 0.6:
        return "close"
    return "none"


def partner_contact(partner):
    return {
        "name": partner["name"],
        "phone": partner["phone"],
        "website": partner["website"],
        "iban": format_iban(partner["ibans"][0]) if partner["ibans"] else None,
        "verifiedSince": partner["verifiedSince"],
    }


def person_contact(person):
    return {
        "name": person["name"],
        "phone": person["phone"],
        "website": person["website"],
        "iban": None,
        "verifiedSince": person["verifiedSince"],
    }
