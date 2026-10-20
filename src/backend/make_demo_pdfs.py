"""Generate the fictional demo invoices for KBC Trust.

Writes minimal, valid PDF 1.4 files by hand (uncompressed content streams,
Helvetica with WinAnsiEncoding) into src/frontend/public/demo/ so that
pdf_text.py can read them reliably. All companies, people, IBANs and amounts
are synthetic. No real logos are used.

Run: python3 src/backend/make_demo_pdfs.py
"""

import os

HERE = os.path.dirname(os.path.abspath(__file__))
DEMO_DIR = os.path.normpath(os.path.join(HERE, "..", "frontend", "public", "demo"))

PAGE_W, PAGE_H = 595, 842
MARGIN = 56
NAVY = (0.078, 0.161, 0.302)
GREY = (0.357, 0.42, 0.51)
LINE = (0.882, 0.914, 0.941)
PANEL = (0.953, 0.98, 0.996)
FOOTER = "Fictional document for a KBC Hackathon demo."


def _pdf_string(text):
    data = text.encode("cp1252")
    out = bytearray(b"(")
    for byte in data:
        if byte in (0x28, 0x29, 0x5C):  # ( ) \
            out += b"\\" + bytes([byte])
        elif byte > 126 or byte < 32:
            out += ("\\%03o" % byte).encode("ascii")
        else:
            out.append(byte)
    out += b")"
    return bytes(out)


def _text_width(text, size):
    # Rough Helvetica average width; good enough for right alignment.
    return len(text) * size * 0.5


class Page:
    def __init__(self):
        self.ops = []

    def text(self, x, y, text, size=10, bold=False, color=NAVY, align="left"):
        if align == "right":
            x -= _text_width(text, size)
        font = b"/F2" if bold else b"/F1"
        self.ops.append(
            b"BT %s %d Tf %.3f %.3f %.3f rg 1 0 0 1 %.1f %.1f Tm %s Tj ET"
            % (font, size, color[0], color[1], color[2], x, y, _pdf_string(text))
        )

    def rect(self, x, y, w, h, color):
        self.ops.append(b"%.3f %.3f %.3f rg %.1f %.1f %.1f %.1f re f"
                        % (color[0], color[1], color[2], x, y, w, h))

    def hline(self, y, color=LINE, width=0.8):
        self.ops.append(b"%.3f %.3f %.3f RG %.1f w %d %.1f m %d %.1f l S"
                        % (color[0], color[1], color[2], width, MARGIN, y,
                           PAGE_W - MARGIN, y))

    def content(self):
        return b"\n".join(self.ops) + b"\n"


def write_pdf(path, page, title):
    content = page.content()
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] "
        b"/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>"
        % (PAGE_W, PAGE_H),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
        b"<< /Length %d >>\nstream\n" % len(content) + content + b"endstream",
        b"<< /Title %s /Producer (KBC Trust demo generator) >>" % _pdf_string(title),
    ]
    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for i, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % i + body + b"\nendobj\n"
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objects) + 1)
    for off in offsets:
        out += b"%010d 00000 n \n" % off
    out += (b"trailer\n<< /Size %d /Root 1 0 R /Info %d 0 R >>\nstartxref\n%d\n%%%%EOF\n"
            % (len(objects) + 1, len(objects), xref))
    with open(path, "wb") as fh:
        fh.write(bytes(out))


def invoice(spec):
    """Lay out one A4 invoice from a spec dict."""
    p = Page()
    right = PAGE_W - MARGIN
    # Header band: company name only (no logo).
    p.rect(0, PAGE_H - 110, PAGE_W, 110, PANEL)
    p.text(MARGIN, PAGE_H - 62, spec["company"], size=20, bold=True)
    p.text(MARGIN, PAGE_H - 82, spec["company_line"], size=9, color=GREY)
    p.text(right, PAGE_H - 62, "INVOICE", size=16, bold=True, align="right")
    p.text(right, PAGE_H - 82, "Invoice number: " + spec["number"], size=9,
           color=GREY, align="right")

    y = PAGE_H - 150
    p.text(MARGIN, y, "Bill to", size=9, bold=True, color=GREY)
    p.text(330, y, "Invoice details", size=9, bold=True, color=GREY)
    for i, line in enumerate(spec["customer"]):
        p.text(MARGIN, y - 16 - i * 14, line, size=10, bold=(i == 0))
    details = [
        "Invoice date: " + spec["date"],
        "Due date: " + spec["due"],
        "Customer number: " + spec["customer_no"],
    ]
    for i, line in enumerate(details):
        p.text(330, y - 16 - i * 14, line, size=10)

    y = PAGE_H - 260
    p.text(MARGIN, y, "Description", size=9, bold=True, color=GREY)
    p.text(right, y, "Amount", size=9, bold=True, color=GREY, align="right")
    p.hline(y - 8)
    y -= 26
    for desc, amount in spec["lines"]:
        p.text(MARGIN, y, desc, size=10)
        p.text(right, y, amount, size=10, align="right")
        y -= 20
    p.hline(y + 6)
    y -= 14
    p.text(330, y, "Subtotal excl. VAT", size=10, color=GREY)
    p.text(right, y, spec["subtotal"], size=10, color=GREY, align="right")
    y -= 16
    p.text(330, y, "VAT 21%", size=10, color=GREY)
    p.text(right, y, spec["vat"], size=10, color=GREY, align="right")
    y -= 22
    p.text(330, y, "Total due: " + spec["total"], size=12, bold=True)

    y -= 48
    p.rect(MARGIN, y - 92, PAGE_W - 2 * MARGIN, 108, PANEL)
    p.text(MARGIN + 14, y, "Payment instructions", size=11, bold=True)
    pay = [
        "Please transfer " + spec["total"] + " to the account below.",
        "IBAN: " + spec["iban"],
        "BIC: " + spec["bic"],
        "Structured reference: " + spec["reference"],
    ]
    for i, line in enumerate(pay):
        p.text(MARGIN + 14, y - 18 - i * 15, line, size=10)

    y -= 128
    for i, line in enumerate(spec["notes"]):
        p.text(MARGIN, y - i * 16, line, size=10, bold=spec.get("notes_bold", False))

    y = 120
    p.hline(y + 14)
    p.text(MARGIN, y, "Questions? Email: " + spec["email"] + "    Phone: " + spec["phone"],
           size=9, color=GREY)
    p.text(MARGIN, y - 14, "Website: " + spec["website"] + "    VAT: " + spec["vat_no"],
           size=9, color=GREY)
    p.text(MARGIN, 48, FOOTER, size=8, color=GREY)
    return p


LAURA = ["Laura Janssens", "Kortrijksesteenweg 112", "9000 Gent", "Belgium"]

SPECS = {
    # The FAKE: lookalike domain, unknown IBAN, urgency.
    "proximus-invoice-october.pdf": {
        "company": "Proximus",
        "company_line": "Customer billing department",
        "number": "PRX-2026-10-88412",
        "customer": LAURA,
        "date": "18 Oct 2026",
        "due": "21 Oct 2026",
        "customer_no": "7710 4428",
        "lines": [("Internet Flex, October 2026", "€64.37"),
                  ("Late payment fee", "€10.00")],
        "subtotal": "€74.37",
        "vat": "€15.62",
        "total": "€89.99",
        "iban": "BE71 9672 0381 5524",
        "bic": "TRWIBEB1XXX",
        "reference": "+++771/0442/88412+++",
        "notes": ["URGENT: your last payment failed.",
                  "Pay within 24 hours to avoid your internet being cut off."],
        "notes_bold": True,
        "email": "facturen@proximus-factuur.be",
        "phone": "0470 55 12 98",
        "website": "www.proximus-factuur.be",
        "vat_no": "BE 0202.239.951",
    },
    # The REAL: verified domain, verified IBAN, normal tone.
    "proximus-invoice-september.pdf": {
        "company": "Proximus",
        "company_line": "Proximus NV, Koning Albert II-laan 27, 1030 Brussels",
        "number": "PRX-2026-09-55210",
        "customer": LAURA,
        "date": "16 Sep 2026",
        "due": "30 Oct 2026",
        "customer_no": "7710 4428",
        "lines": [("Internet Flex, September 2026", "€44.21"),
                  ("Mobile Flex, 1 SIM", "€9.10")],
        "subtotal": "€53.31",
        "vat": "€11.19",
        "total": "€64.50",
        "iban": "BE38 0000 1234 5672",
        "bic": "BPOTBEB1",
        "reference": "+++771/0442/55210+++",
        "notes": ["Thank you for being a Proximus customer.",
                  "Please pay by 30 Oct 2026. You can also pay with direct debit."],
        "email": "noreply@proximus.be",
        "phone": "0800 22 800",
        "website": "www.proximus.be",
        "vat_no": "BE 0202.239.951",
    },
    # Business email compromise: real domain, but a new fraudulent IBAN.
    "van-damme-invoice-1043.pdf": {
        "company": "Van Damme Packaging NV",
        "company_line": "Industrieweg 18, 9032 Wondelgem",
        "number": "VDP-2026-1043",
        "customer": ["Noord Design BV", "Attn. accounts payable",
                     "Coupure Links 45", "9000 Gent"],
        "date": "15 Oct 2026",
        "due": "29 Oct 2026",
        "customer_no": "C-00318",
        "lines": [("Custom printed boxes, 4,000 pcs", "€7,600.00"),
                  ("Protective inserts, 4,000 pcs", "€2,214.05"),
                  ("Delivery, Gent", "€500.00")],
        "subtotal": "€10,314.05",
        "vat": "€2,165.95",
        "total": "€12,480.00",
        "iban": "BE09 0018 3366 2157",
        "bic": "GEBABEBB",
        "reference": "+++104/3000/31845+++",
        "notes": ["Please note our new bank account: BE09 0018 3366 2157.",
                  "Our previous account is no longer in use."],
        "email": "accounts@vandamme-packaging.be",
        "phone": "+32 9 225 41 10",
        "website": "www.vandamme-packaging.be",
        "vat_no": "BE 0456.789.123",
    },
}


def main():
    os.makedirs(DEMO_DIR, exist_ok=True)
    for name, spec in SPECS.items():
        path = os.path.join(DEMO_DIR, name)
        write_pdf(path, invoice(spec), spec["company"] + " invoice " + spec["number"])
        print("wrote", os.path.relpath(path))


if __name__ == "__main__":
    main()
