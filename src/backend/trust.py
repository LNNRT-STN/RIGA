"""KBC Trust rules engine and scoring.

Everything here is RULE BASED: plain Python rules over the mock registry in
registry.py. There is no LLM and no machine learning. Signals that a real
product would get from a detector (synthetic voice, face-swap artefacts) are
SIMULATED with fixed values for the demo scenario.

Scoring model, shared by every check: start at 100, subtract the weight of
every failed or warning check, clamp to 0..100, then map to a band:

    score >= 80   verified  allow
    50..79        caution   warn    (Kate warning)
    30..49        review    review  (sent to Secure4u, KBC's human fraud team)
    < 30          danger    block
"""

import difflib
import re
import time

import registry as reg
import seal as seals

URGENCY_PATTERNS = [
    r"within 24 hours", r"within 48 hours", r"service will be cut",
    r"cut off", r"\bimmediately\b", r"\burgent\b", r"\btoday\b",
    r"suspended", r"final notice",
]
BANK_CHANGE_PATTERNS = [
    r"new bank account", r"new account number", r"new iban",
    r"changed our bank", r"bank details have changed", r"previous account is no longer",
]


# --------------------------------------------------------------------------
# Formatting helpers
# --------------------------------------------------------------------------

def fmt_eur(amount):
    return "€{:,.2f}".format(amount)


def parse_amount(text):
    """Parse '€12,480.00', '12.480,00 EUR' or '89.99' into a float."""
    raw = re.sub(r"[^\d.,]", "", str(text or ""))
    if not raw:
        return None
    if "," in raw and "." in raw:
        if raw.rfind(",") > raw.rfind("."):  # Belgian style 12.480,00
            raw = raw.replace(".", "").replace(",", ".")
        else:
            raw = raw.replace(",", "")
    elif "," in raw:
        head, _, tail = raw.rpartition(",")
        raw = head.replace(",", "") + ("." if len(tail) == 2 else "") + tail
    try:
        return float(raw)
    except ValueError:
        return None


MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def fmt_date(text):
    """Normalise '30/10/2026' or '30 Oct 2026' to '30 Oct 2026'."""
    text = str(text or "").strip()
    m = re.match(r"^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$", text)
    if m and 1 <= int(m.group(2)) <= 12:
        return "%d %s %s" % (int(m.group(1)), MONTHS[int(m.group(2)) - 1], m.group(3))
    return text


# --------------------------------------------------------------------------
# Result building
# --------------------------------------------------------------------------

def check(cid, label, status, detail, weight=0):
    return {"id": cid, "label": label, "status": status, "detail": detail,
            "_weight": weight if status != "pass" else 0}


def band(score):
    if score >= 80:
        return "verified", "allow"
    if score >= 50:
        return "caution", "warn"
    if score >= 30:
        return "review", "review"
    return "danger", "block"


def score_of(checks):
    return max(0, min(100, 100 - sum(c["_weight"] for c in checks)))


def build_result(subject, checks, headline, summary, started, verified_partner=False,
                 extracted=None, contact=None, network=None, score=None,
                 level=None, decision=None, seal=None):
    if score is None:
        score = score_of(checks)
    auto_level, auto_decision = band(score)
    order = {"fail": 0, "warn": 1, "pass": 2}
    ranked = sorted(enumerate(checks),
                    key=lambda ic: (order[ic[1]["status"]], -ic[1]["_weight"], ic[0]))
    return {
        "subject": subject,
        "score": int(score),
        "level": level or auto_level,
        "decision": decision or auto_decision,
        "verifiedPartner": bool(verified_partner),
        "headline": headline[:60].rstrip("."),
        "summary": summary,
        "checks": [{k: v for k, v in c.items() if not k.startswith("_")}
                   for _, c in ranked],
        "extracted": extracted or None,
        "verifiedContact": contact,
        "network": network,
        "seal": seal,
        "elapsedMs": max(1, int(round((time.perf_counter() - started) * 1000))),
    }


def _plural(n, word):
    return "%d %s%s" % (n, word, "" if n == 1 else "s")


def _network_check(cid, what, key):
    """Network reports check. `what` is e.g. "IBAN", "account", "number"."""
    net = reg.get_reports(key)
    n = net["reports"]
    if n:
        return net, check(
            cid, "Reported by %s" % _plural(n, "KBC customer"), "fail",
            "This %s was reported as a scam by %s, most recently on %s."
            % (what, _plural(n, "KBC customer"), net["lastReported"]), 20)
    return net, check(cid, "No scam reports", "pass",
                      "No KBC customer has reported this %s." % what)


# --------------------------------------------------------------------------
# Domains
# --------------------------------------------------------------------------

def lookalike_partner(domain):
    """Return (partner, partner_domain) if the domain imitates a partner."""
    domain = reg.normalise_domain(domain)
    if not domain or reg.find_partner_by_domain(domain):
        return None, None
    label = domain.rsplit(".", 1)[0]
    best, best_domain, best_ratio = None, None, 0.0
    for partner in reg.PARTNERS:
        for alias in partner["aliases"]:
            token = alias.replace(" ", "")
            if len(token) >= 5 and (token in label.replace("-", "") or token in label):
                return partner, partner["domains"][0]
        for d in partner["domains"]:
            ratio = difflib.SequenceMatcher(None, domain, d).ratio()
            if ratio > best_ratio:
                best, best_domain, best_ratio = partner, d, ratio
    if best_ratio >= 0.8:
        return best, best_domain
    return None, None


# --------------------------------------------------------------------------
# Invoice
# --------------------------------------------------------------------------

def parse_invoice(text):
    """Pull the fields we need out of invoice text with regular expressions."""
    fields = {}
    partner = reg.find_partner_in_text(text)
    if partner:
        fields["company"] = partner["shortName"]
    else:
        m = re.search(r"^\s*([A-Z][\w&'. -]{1,60}?\s(?:NV|BV|BVBA|SRL|SA|Ltd))\b", text, re.M)
        if m:
            fields["company"] = m.group(1).strip()

    m = re.search(r"IBAN\s*:?\s*([A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,3})?)", text)
    if not m:
        m = re.search(r"\b(BE\d{2}(?: ?\d{4}){3})\b", text)
    if m:
        fields["iban"] = reg.format_iban(m.group(1))

    m = re.search(r"[\w.+-]+@([\w-]+(?:\.[\w-]+)+)", text)
    if m:
        fields["email"] = m.group(0)
        fields["domain"] = m.group(1).lower()
    else:
        m = re.search(r"(?:www\.)([\w-]+(?:\.[\w-]+)+)", text)
        if m:
            fields["domain"] = m.group(1).lower()

    m = re.search(r"(?:Phone|Tel\.?|Telephone)\s*:?\s*(\+?\d[\d /.]{6,}\d)", text, re.I)
    if m:
        fields["phone"] = m.group(1).strip()

    m = re.search(r"Total(?: due| amount| to pay)?\s*:?\s*(€\s?[\d.,]+\d|[\d.,]+\d\s?(?:EUR|€))",
                  text, re.I)
    if m:
        amount = parse_amount(m.group(1))
        if amount is not None:
            fields["amount"] = fmt_eur(amount)

    m = re.search(r"Due date\s*:?\s*(\d{1,2} [A-Z][a-z]{2} \d{4}|\d{1,2}[/.-]\d{1,2}[/.-]\d{4})",
                  text, re.I)
    if m:
        fields["due"] = fmt_date(m.group(1))

    m = re.search(r"Invoice (?:number|no\.?)\s*:?\s*([A-Z0-9][A-Z0-9/-]+)", text, re.I)
    if m:
        fields["number"] = m.group(1)

    lowered = text.lower()
    fields["urgency"] = [p for p in URGENCY_PATTERNS if re.search(p, lowered)]
    fields["bankChange"] = [p for p in BANK_CHANGE_PATTERNS if re.search(p, lowered)]
    fields["business"] = _billed_to_business(text)
    return fields


def _billed_to_business(text):
    """True when the first line after "Bill to" names a company (NV, BV, ...)."""
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if line.strip().lower().startswith("bill to") and i + 1 < len(lines):
            customer = lines[i + 1].split("  ")[0]
            return bool(re.search(r"\b(?:NV|BV|BVBA|SRL|SA)\b", customer))
    return False


def _iso_date(value):
    """'2026-10-30' to '30 Oct 2026'; anything else is returned as is."""
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", str(value))
    if m and 1 <= int(m.group(2)) <= 12:
        return "%d %s %s" % (int(m.group(3)), MONTHS[int(m.group(2)) - 1], m.group(1))
    return str(value)


def _seal_mismatches(claims, f):
    """Fields where the printed invoice differs from what the partner sealed."""
    signed_amount = parse_amount(claims["amt"])
    printed_amount = parse_amount(f.get("amount"))
    pairs = [
        ("IBAN", f.get("iban"), reg.format_iban(claims["iban"]),
         reg.normalise_iban(f.get("iban")) == reg.normalise_iban(claims["iban"])),
        ("Amount", f.get("amount"), fmt_eur(signed_amount or 0),
         printed_amount is not None and signed_amount is not None
         and abs(printed_amount - signed_amount) < 0.005),
        ("Invoice number", f.get("number"), str(claims["inv"]), f.get("number") == claims["inv"]),
        ("Due date", f.get("due"), _iso_date(claims["due"]), f.get("due") == _iso_date(claims["due"])),
    ]
    return [{"field": field, "printed": printed, "signed": signed}
            for field, printed, signed, same in pairs if printed and not same]


def _seal_check(tokens, partner, f, iban_ok):
    """Check the invoice seal. Returns (seal info for the result, check or None, verdict).

    verdict: "valid", "tampered" (sealed, then changed), "fake" (a seal we must not trust),
    "missing", or None when nothing can be said (no seal from a partner that doesn't seal
    its invoices, or the crypto library is not installed).

    Proof of a change blocks the payment. So does a missing seal from a partner that seals
    every invoice when the IBAN is not theirs: that is what removing the seal looks like.
    """
    short = partner["shortName"] if partner else None
    if not tokens:
        if partner and partner.get("sealsInvoicesSince"):
            info = {"status": "missing", "partner": partner["name"], "keyId": None,
                    "signedOn": None, "mismatches": []}
            detail = "%s has sealed every invoice since %s. This one has no seal" % (
                short, partner["sealsInvoicesSince"])
            if iban_ok:
                return info, check("seal", "No digital seal", "warn", detail + ".", 10), "missing"
            return info, check("seal", "No digital seal", "fail",
                               detail + ", and its IBAN is not one of %s's accounts." % short,
                               50), "missing"
        return None, None, None

    result = seals.verify(tokens[0]) if len(tokens) == 1 else {
        "status": "malformed", "kid": None, "partner": None, "claims": None}
    status = result["status"]
    if status == "unavailable":
        return None, None, None
    sealer = result["partner"]
    if status in ("valid", "revoked") and sealer is None:
        status = "unknown-key"  # a key whose partner left the registry
    info = {"status": status, "partner": sealer["name"] if sealer else None,
            "keyId": result["kid"], "signedOn": None, "mismatches": []}

    if status == "valid" and sealer is not partner:
        info["status"] = "invalid"
        claimed = partner["shortName"] if partner else "another company"
        return info, check("seal", "Seal is from another company", "fail",
                           "The seal was made by %s, but the invoice says it is from %s."
                           % (sealer["shortName"], claimed), 60), "fake"
    if status == "valid":
        claims = result["claims"]
        info["signedOn"] = _iso_date(claims["iat"]) if claims.get("iat") else None
        info["mismatches"] = _seal_mismatches(claims, f)
        if info["mismatches"]:
            info["status"] = "tampered"
            detail = " ".join("%s sealed %s %s, but the invoice shows %s."
                              % (short, m["field"] if m["field"] == "IBAN" else m["field"].lower(),
                                 m["signed"], m["printed"]) for m in info["mismatches"])
            return info, check("seal", "Changed after it was sealed", "fail", detail, 80), "tampered"
        return info, check("seal", "Sealed by %s" % short, "pass",
                           "%s sealed this invoice%s and nothing was changed since. KBC "
                           "checked the seal with %s's public key."
                           % (short, " on " + info["signedOn"] if info["signedOn"] else "", short)
                           ), "valid"
    label, detail, weight = {
        "invalid": ("Fake digital seal",
                    "The seal on this invoice was not made by %s. Someone copied or forged it."
                    % (short or "a KBC partner"), 60),
        "revoked": ("Seal key was withdrawn",
                    "%s withdrew the key used for this seal, so KBC no longer trusts it."
                    % (sealer["shortName"] if sealer else "The partner"), 50),
        "unknown-key": ("Unknown digital seal",
                        "The seal names a key that no KBC-verified partner uses.", 60),
    }.get(status, ("Damaged digital seal", "The seal on this invoice can't be read.", 50))
    return info, check("seal", label, "fail", detail, weight), "fake"


def unreadable_invoice(started, file_name=None):
    detail = ("We could not find a sender, amount or IBAN in this file. "
              "It may be a scan or a photo.")
    checks = [check("readable", "Invoice could not be read", "fail", detail, 60)]
    return build_result(
        "invoice", checks, "We could not read this invoice",
        "We sent it to Secure4u, KBC's fraud team, so don't pay it until they confirm it is genuine.",
        started, extracted={"File": file_name} if file_name else None,
        score=40, level="review", decision="review")


def check_invoice_text(text, started=None, file_name=None, seal_tokens=None):
    """Check an invoice from its text and the KBC Trust seals found in the file."""
    started = started or time.perf_counter()
    f = parse_invoice(text or "")
    if not f.get("company") or not (f.get("iban") or f.get("amount")):
        return unreadable_invoice(started, file_name)

    partner = reg.find_partner_by_name(f["company"])
    account = "business" if f["business"] else "personal"
    checks = []
    contact = reg.partner_contact(partner) if partner else None
    short = partner["shortName"] if partner else f["company"]
    domain_ok = iban_ok = None

    # 1. Sender domain
    domain = f.get("domain")
    if partner:
        if not domain:
            checks.append(check("domain", "No sender domain found", "warn",
                                "The invoice has no email or website we can check.", 10))
        elif reg.find_partner_by_domain(domain) is partner:
            domain_ok = True
            checks.append(check("domain", "Sender domain verified", "pass",
                                "%s is a verified %s domain." % (domain, short)))
        else:
            domain_ok = False
            look, real = lookalike_partner(domain)
            if look is partner:
                detail = ("%s imitates %s. %s only sends invoices from %s."
                          % (domain, real, short, " or ".join(partner["domains"])))
                label = "Lookalike sender domain"
            else:
                detail = ("%s is not a %s domain. %s only uses %s."
                          % (domain, short, short, " or ".join(partner["domains"])))
                label = "Sender domain not verified"
            checks.append(check("domain", label, "fail", detail, 30))
    else:
        checks.append(check("partner", "Not a KBC-verified partner", "warn",
                            "%s has not integrated with KBC, so we can't confirm its "
                            "details. Check the invoice with the sender." % f["company"], 25))

    # 2. IBAN belongs to the partner
    iban = f.get("iban")
    if partner and iban:
        if reg.normalise_iban(iban) in partner["ibans"]:
            iban_ok = True
            checks.append(check("iban", "IBAN belongs to %s" % short, "pass",
                                "%s is a verified %s account." % (iban, short)))
        else:
            iban_ok = False
            checks.append(check("iban", "IBAN not on the verified list", "fail",
                                "%s is not one of %s's verified accounts. Their account is %s."
                                % (iban, short, contact["iban"]), 25))
    elif partner:
        checks.append(check("iban", "No IBAN found", "warn",
                            "We could not find an IBAN on the invoice.", 10))

    # 3. Network reports
    network = None
    if iban:
        network, c = _network_check("network", "IBAN", iban)
        checks.append(c)

    # 4. Account facts (simulated bank data): age and payment history
    info = reg.account_info(iban) if iban else None
    if info and info["openedDaysAgo"] < 90:
        checks.append(check("account-age", "Account opened %d days ago" % info["openedDaysAgo"],
                            "fail", "The receiving account is only %d days old and is held by "
                            "%s." % (info["openedDaysAgo"], info["holder"]), 15))
    if partner and iban:
        history = reg.history_for(account, name=partner["name"])
        if history:
            h = history[0]
            if h["iban"] == reg.normalise_iban(iban):
                checks.append(check("history", "Paid %s before" % _plural(h["count"], "time"),
                                    "pass", "You paid %s %s to this account."
                                    % (short, _plural(h["count"], "time"))))
            else:
                checks.append(check("history", "Different from your past payments", "fail",
                                    "You paid %s %s, always to %s."
                                    % (short, _plural(h["count"], "time"),
                                       reg.format_iban(h["iban"])), 22))

    # 5. Phone number
    phone = f.get("phone")
    if partner and phone:
        if reg.normalise_phone(phone) == reg.normalise_phone(partner["phone"]):
            checks.append(check("phone", "Phone number verified", "pass",
                                "%s is %s's verified number." % (phone, short)))
        else:
            checks.append(check("phone", "Phone number not verified", "fail",
                                "%s is not %s's number. Their verified number is %s."
                                % (phone, short, partner["phone"]), 10))

    # 6. Language
    if f["bankChange"]:
        checks.append(check("bank-change", "Asks you to use a new account", "warn",
                            "The invoice says the bank account has changed. Fraudsters "
                            "often do this.", 10))
    if f["urgency"]:
        checks.append(check("urgency", "Pressure to pay fast", "warn",
                            "The invoice pushes you to pay quickly or lose service.", 8))
    elif not f["bankChange"]:
        checks.append(check("language", "Normal payment terms", "pass",
                            "No pressure or threats in the text."))

    # 7. Digital seal: proof from the partner itself that it issued exactly this invoice
    seal_info, seal_check, seal_verdict = _seal_check(seal_tokens or [], partner, f, iban_ok)
    if seal_check:
        checks.append(seal_check)

    score = score_of(checks)
    level, decision = band(score)
    verified_partner = bool(partner and domain_ok and iban_ok and seal_verdict in (None, "valid"))
    reports = network["reports"] if network else 0
    sealer = (seal_info or {}).get("partner") or short

    if seal_verdict == "tampered":
        changed = seal_info["mismatches"][0]["field"]
        headline = "This invoice was changed after it was sealed"
        summary = "Someone changed the %s after %s sealed it, so don't pay it and call %s on %s." % (
            "account number" if changed == "IBAN" else changed.lower(), short, short, partner["phone"])
    elif seal_verdict == "fake":
        headline = "This invoice has a fake %s seal" % short
        summary = "The seal was not made by %s, so don't pay it%s." % (
            short, " and call %s on %s" % (short, partner["phone"]) if partner else "")
    elif verified_partner and level == "verified":
        headline = "This invoice is really from %s" % short
        if seal_verdict == "valid":
            summary = "%s sealed this invoice and KBC checked the seal, so it is safe to pay." % sealer
        else:
            summary = "The sender domain and IBAN match %s's verified details, so it is safe to pay." % short
    elif partner and domain_ok is False:
        headline = "This invoice is not from %s" % short
        reason = "It comes from %s, not %s" % (domain, partner["domains"][0])
        if reports:
            reason += ", and %s reported its IBAN" % _plural(reports, "KBC customer")
        summary = "%s, so don't pay it and call %s on %s if you are unsure." % (reason, short, partner["phone"])
    elif partner and iban_ok is False:
        headline = "This account doesn't belong to %s" % short
        summary = ("The IBAN on this invoice is not %s's verified account, so don't pay it and "
                   "call %s on %s to check." % (short, short, partner["phone"]))
    elif level == "danger":
        headline = "Do not pay this invoice"
        summary = "This IBAN was reported for fraud, so don't pay it."
    elif level == "review":
        headline = "We need to check this invoice"
        summary = "We sent it to Secure4u, KBC's fraud team, so wait for their answer before you pay."
    elif level == "caution":
        headline = "We could not verify this sender"
        summary = "%s is not a KBC-verified partner, so check the details with them before you pay." % f["company"]
    else:
        headline = "No problems found on this invoice"
        summary = "We found no warning signs, so you can pay it."

    extracted = {"Sender": f["company"]}
    for key, label in (("amount", "Amount"), ("iban", "IBAN"), ("domain", "Email domain"),
                       ("phone", "Phone"), ("due", "Due date"), ("number", "Invoice number")):
        if f.get(key):
            extracted[label] = f[key]

    return build_result("invoice", checks, headline, summary, started,
                        verified_partner=verified_partner, extracted=extracted,
                        contact=contact, network=network, seal=seal_info)


# --------------------------------------------------------------------------
# Payee
# --------------------------------------------------------------------------

def check_payee(name, iban, account="personal", started=None):
    started = started or time.perf_counter()
    account = account if account in ("personal", "business") else "personal"
    name = str(name or "").strip()
    iban_n = reg.normalise_iban(iban)
    iban_f = reg.format_iban(iban_n)
    checks = []
    partner = reg.find_partner_by_name(name)
    contact = reg.partner_contact(partner) if partner else None
    short = partner["shortName"] if partner else name
    info = reg.account_info(iban_n)

    # 1. Verification of Payee (SIMULATED: holder names come from registry.ACCOUNTS;
    #    unknown accounts are assumed to match the name you typed).
    holder = info["holder"] if info else None
    vop = reg.names_match(holder, name) if holder else "match"
    if vop == "match":
        checks.append(check("vop", "Name matches the account", "pass",
                            "The account holder name matches %s." % name))
    elif vop == "close":
        checks.append(check("vop", "Name is a close match", "warn",
                            "The account is held by \"%s\", not \"%s\"." % (holder, name), 10))
    else:
        checks.append(check("vop", "Name does not match", "fail",
                            "The account is held by someone else, not %s." % name, 30))

    # 2. Verified partner
    iban_ok = None
    if partner:
        if iban_n in partner["ibans"]:
            iban_ok = True
            checks.append(check("partner-iban", "Verified %s account" % short, "pass",
                                "%s is on %s's verified list since %s."
                                % (iban_f, short, partner["verifiedSince"])))
        else:
            iban_ok = False
            checks.append(check("partner-iban", "Not a %s account" % short, "fail",
                                "%s is not one of %s's verified accounts. Their account is %s."
                                % (iban_f, short, contact["iban"]), 25))
    else:
        checks.append(check("partner", "Not a KBC-verified partner", "warn",
                            "%s is not a company that integrated with KBC. That is normal "
                            "for people." % name, 5))

    # 3. Network reports
    network, c = _network_check("network", "account", iban_n)
    checks.append(c)

    # 4. Account age (SIMULATED bank data)
    if info and info["openedDaysAgo"] < 90:
        checks.append(check("account-age", "Account opened %d days ago" % info["openedDaysAgo"],
                            "fail", "New accounts are often used to collect scam payments.", 15))
    elif info:
        checks.append(check("account-age", "Long-standing account", "pass",
                            "The account has been open for more than %d years."
                            % (info["openedDaysAgo"] // 365)))
    else:
        checks.append(check("account-age", "Account age unknown", "warn",
                            "This account is at another bank, so we can't see its age.", 5))

    # 5. Payment history
    by_iban = reg.history_for(account, iban=iban_n)
    by_name = reg.history_for(account, name=partner["name"] if partner else name)
    paid_before = False
    if by_iban:
        h = by_iban[0]
        paid_before = True
        checks.append(check("history", "Paid %s before" % _plural(h["count"], "time"), "pass",
                            "You paid %s %s to this account." % (h["name"], _plural(h["count"], "time"))))
    elif by_name:
        h = by_name[0]
        checks.append(check("history", "Different from your past payments", "fail",
                            "You paid %s %s, always to %s."
                            % (short, _plural(h["count"], "time"), reg.format_iban(h["iban"])), 22))
    else:
        checks.append(check("history", "First payment to this account", "warn",
                            "You have never paid this account before.", 20))

    score = score_of(checks)
    level, _ = band(score)
    verified_partner = bool(partner and iban_ok and vop == "match")
    reports = network["reports"]

    if partner and iban_ok is False:
        headline = "This account doesn't belong to %s" % short
        bits = []
        if info and info["openedDaysAgo"] < 90:
            bits.append("opened %d days ago" % info["openedDaysAgo"])
        if reports:
            bits.append("reported by %s" % _plural(reports, "KBC customer"))
        if holder and vop != "match":
            reason = "This IBAN is held by %s" % holder
        else:
            reason = "This IBAN is not on %s's verified list" % short
        if bits:
            reason += ", " + " and ".join(bits)
        summary = "%s, so don't pay and call %s on %s." % (reason, short, partner["phone"])
    elif verified_partner and level == "verified":
        headline = "This is %s's verified account" % short
        summary = "The name and IBAN match %s's details checked by KBC, so you can pay." % short
    elif reports and level in ("danger", "review"):
        headline = "This account was reported for fraud"
        summary = "%s reported this account as a scam, so don't pay it." % _plural(reports, "KBC customer")
    elif vop == "none":
        headline = "The name does not match this account"
        summary = "The account belongs to someone else, so check the IBAN with %s before you pay." % name
    elif paid_before and level == "verified":
        headline = "You have paid %s before" % name
        summary = "The name matches and you paid this account before, so you can pay."
    elif level in ("danger", "review"):
        headline = "We need to check this payment"
        summary = "We sent it to Secure4u, KBC's fraud team, so wait for their answer before you pay."
    elif vop == "close":
        headline = "The name is only a close match"
        summary = "The account is held by %s, so check the details with %s before you pay." % (holder, name)
    else:
        headline = "First payment to this account"
        summary = "We found no warning signs, but check the IBAN with %s before you pay." % (name or "the payee")

    extracted = {"Name": name, "IBAN": iban_f}
    if holder:
        extracted["Account holder"] = holder + " (simulated check)"
    return build_result("payee", checks, headline, summary, started,
                        verified_partner=verified_partner, extracted=extracted,
                        contact=contact, network=network)


# --------------------------------------------------------------------------
# Call
# --------------------------------------------------------------------------

# SIMULATED detector output for the deepfake CEO call scenario.
CEO_DEEPFAKE = {
    "callerNumber": "+32 465 89 21 07",
    "claimedName": "Pieter Claes",
    "hasVideo": True,
    "request": "Pay €48,500.00 today",
    "signals": {
        "voice": {"status": "fail", "label": "Synthetic voice detected",
                  "detail": "Synthetic speech markers: 94% likely. The voice does not match "
                            "Pieter Claes's enrolled voiceprint."},
        "video": {"status": "fail", "label": "Face-swap artefacts in video",
                  "detail": "Artefacts around the mouth and jawline, lip sync off by 180 ms, "
                            "no natural blink pattern."},
        "pattern": {"status": "fail", "label": "Matches CEO fraud pattern",
                    "detail": "Urgent, confidential, a new account and €48,500.00 today: "
                              "the classic CEO fraud script."},
    },
}

PRESSURE_WORDS = ["urgent", "today", "confidential", "secret", "new account", "right now",
                  "immediately", "gift card"]


def check_call(caller_number, claimed_name, has_video=False, request=None,
               signals=None, started=None):
    started = started or time.perf_counter()
    checks = []
    person = reg.find_person_by_name(claimed_name)
    partner = None if person else reg.find_partner_by_name(claimed_name)
    contact = (reg.person_contact(person) if person
               else reg.partner_contact(partner) if partner else None)
    who = person["name"] if person else partner["shortName"] if partner else (claimed_name or "this caller")
    verified_number = person["phone"] if person else partner["phone"] if partner else None
    number_ok = None

    # 1. Caller number vs verified number
    if verified_number:
        number_ok = reg.normalise_phone(caller_number) == reg.normalise_phone(verified_number)
        if number_ok:
            checks.append(check("number", "Verified number", "pass",
                                "%s is %s's verified number." % (caller_number, who)))
        else:
            checks.append(check("number", "Unknown number", "fail",
                                "%s is not %s's verified number %s."
                                % (caller_number, who, verified_number), 20))
    else:
        checks.append(check("number", "Caller not enrolled", "warn",
                            "%s is not enrolled with KBC Trust, so we can't confirm who is calling."
                            % who, 25))

    # 2. Voice and video (SIMULATED detector signals)
    signals = signals or {}
    if "voice" in signals:
        s = signals["voice"]
        checks.append(check("voice", s["label"], s["status"], s["detail"], 25))
    elif person and person.get("voiceEnrolled"):
        if number_ok:
            checks.append(check("voice", "Voice matches enrolment", "pass",
                                "The voice matches %s's enrolled voiceprint (simulated)." % who))
        else:
            checks.append(check("voice", "Voice not confirmed", "warn",
                                "We could not match the voice to %s's enrolled voiceprint "
                                "(simulated)." % who, 15))
    if has_video:
        if "video" in signals:
            s = signals["video"]
            checks.append(check("video", s["label"], s["status"], s["detail"], 20))
        elif number_ok:
            checks.append(check("video", "Face matches enrolment", "pass",
                                "The face matches %s's enrolment (simulated)." % who))
        else:
            checks.append(check("video", "Face not confirmed", "warn",
                                "We could not match the face on video (simulated).", 10))

    # 3. Request pattern
    if "pattern" in signals:
        s = signals["pattern"]
        checks.append(check("pattern", s["label"], s["status"], s["detail"], 20))
    elif request:
        hits = [w for w in PRESSURE_WORDS if w in request.lower()]
        if hits:
            checks.append(check("pattern", "Pressure in the request", "warn",
                                "The request uses pressure words: %s." % ", ".join(hits), 15))
        else:
            checks.append(check("pattern", "Normal request", "pass", "No pressure in the request."))

    # 4. Network reports
    network, c = _network_check("network", "number", caller_number)
    if network["reports"]:
        c["_weight"] = 10
    checks.append(c)

    score = score_of(checks)
    level, _ = band(score)
    if level == "verified" and number_ok:
        headline = "This is really %s" % who
        summary = "The number, voice and face match %s's enrolment with KBC, so you can continue." % who
    elif level in ("danger", "review") and verified_number:
        headline = "This is probably not %s" % who
        summary = ("The call shows signs of a deepfake, so hang up and call %s back on %s."
                   % (who, verified_number))
    elif level in ("danger", "review"):
        headline = "This call looks like a scam"
        summary = "Hang up and don't pay anything; call the person back on a number you know."
    else:
        headline = "We could not confirm this caller"
        summary = "Hang up and call %s back on a number you already know before you act." % who

    extracted = {"Caller": "%s (claimed)" % who if claimed_name else "Unknown",
                 "Number": caller_number}
    if request:
        extracted["Request"] = request
    if has_video:
        extracted["Video"] = "Yes"
    return build_result("call", checks, headline, summary, started,
                        verified_partner=bool(number_ok and level == "verified"),
                        extracted=extracted, contact=contact, network=network)


def check_call_scenario(scenario, started=None):
    if scenario == "ceo-deepfake":
        s = CEO_DEEPFAKE
        return check_call(s["callerNumber"], s["claimedName"], s["hasVideo"],
                          s["request"], s["signals"], started)
    return None


# --------------------------------------------------------------------------
# Website
# --------------------------------------------------------------------------

def check_website(url, started=None):
    started = started or time.perf_counter()
    domain = reg.normalise_domain(url)
    checks = []
    partner = reg.find_partner_by_domain(domain)
    contact = None
    if partner:
        contact = reg.partner_contact(partner)
        checks.append(check("domain", "Verified %s domain" % partner["shortName"], "pass",
                            "%s is registered with KBC by %s." % (domain, partner["name"])))
        headline = "This is the real %s website" % partner["shortName"]
        summary = "%s is a verified %s domain, so you can continue." % (domain, partner["shortName"])
    else:
        look, real = lookalike_partner(domain)
        if look:
            contact = reg.partner_contact(look)
            checks.append(check("domain", "Not a %s domain" % look["shortName"], "fail",
                                "%s is not registered with KBC by %s." % (domain, look["shortName"]), 40))
            checks.append(check("lookalike", "Lookalike of %s" % real, "fail",
                                "%s imitates %s, the real %s website." % (domain, real, look["shortName"]), 35))
            headline = "This is not the real %s website" % look["shortName"]
            summary = ("This site imitates %s, so close it and go to %s yourself."
                       % (look["shortName"], look["website"]))
        else:
            checks.append(check("domain", "Not a KBC-verified partner", "warn",
                                "%s is not registered with KBC, so we can't confirm who runs it."
                                % domain, 25))
            headline = "We could not verify this website"
            summary = "Be careful with payments or personal details on %s." % domain
    network, c = _network_check("network", "website", domain)
    checks.append(c)
    if network["reports"] and not partner and checks[0]["status"] != "fail":
        headline = "This website was reported for fraud"
        summary = "KBC customers reported %s as a scam, so close it." % domain
    return build_result("website", checks, headline, summary, started,
                        verified_partner=bool(partner), extracted={"Domain": domain},
                        contact=contact, network=network)
