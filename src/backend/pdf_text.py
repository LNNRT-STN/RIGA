"""Minimal PDF text extraction, standard library only.

SIMULATED OCR: the prototype does not run real OCR. It reads the text that is
embedded in a PDF's content streams. That works for the generated demo PDFs
(uncompressed streams) and, as a best effort, for FlateDecode streams via zlib.
Scanned or image-only PDFs return an empty string.
"""

import re
import zlib

_STREAM_RE = re.compile(rb"<<(.*?)>>\s*stream\r?\n(.*?)\r?\n?endstream", re.S)
_TOKEN_RE = re.compile(
    rb"\((?:\\.|[^\\()]|\((?:\\.|[^\\()])*\))*\)"  # literal string, one nesting level
    rb"|<[0-9A-Fa-f\s]*>"                         # hex string
    rb"|\[|\]"                                     # array delimiters
    rb"|/[^\s/\[\]()<>]+"                          # name
    rb"|-?\d*\.?\d+"                               # number
    rb"|[A-Za-z'\"*]+"                             # operator
)

_ESCAPES = {b"n": b"\n", b"r": b"\r", b"t": b"\t", b"b": b"\b", b"f": b"\f",
            b"(": b"(", b")": b")", b"\\": b"\\"}


def _unescape(raw):
    """Decode a PDF literal string body (without outer parentheses)."""
    out = bytearray()
    i = 0
    while i < len(raw):
        c = raw[i:i + 1]
        if c == b"\\" and i + 1 < len(raw):
            nxt = raw[i + 1:i + 2]
            if nxt in _ESCAPES:
                out += _ESCAPES[nxt]
                i += 2
                continue
            octal = re.match(rb"[0-7]{1,3}", raw[i + 1:i + 4])
            if octal:
                out.append(int(octal.group(0), 8) & 0xFF)
                i += 1 + len(octal.group(0))
                continue
            if nxt in (b"\n", b"\r"):
                i += 2
                continue
            out += nxt
            i += 2
            continue
        out += c
        i += 1
    return bytes(out)


def _decode(data):
    return data.decode("cp1252", errors="replace")


def _string_value(token):
    if token.startswith(b"("):
        return _decode(_unescape(token[1:-1]))
    hexdigits = re.sub(rb"\s", b"", token[1:-1])
    if len(hexdigits) % 2:
        hexdigits += b"0"
    try:
        data = bytes.fromhex(hexdigits.decode("ascii"))
    except ValueError:
        return ""
    if data.startswith(b"\xfe\xff"):
        return data[2:].decode("utf-16-be", errors="replace")
    return _decode(data)


def _text_from_content(content):
    """Return (y, x, text) runs from one content stream."""
    runs = []
    x = y = 0.0
    line_x = line_y = 0.0
    leading = 12.0
    stack = []
    array = None
    current = []

    def flush():
        text = "".join(current).strip()
        if text:
            runs.append((round(y, 1), round(x, 1), text))
        current.clear()

    for match in _TOKEN_RE.finditer(content):
        tok = match.group(0)
        if tok == b"[":
            array = []
            continue
        if tok == b"]":
            stack.append(array if array is not None else [])
            array = None
            continue
        if tok.startswith(b"(") or (tok.startswith(b"<") and not tok.startswith(b"<<")):
            value = _string_value(tok)
            (array if array is not None else stack).append(value)
            continue
        if re.match(rb"^-?\d*\.?\d+$", tok):
            value = float(tok)
            (array if array is not None else stack).append(value)
            continue
        if tok.startswith(b"/"):
            stack.append(tok)
            continue
        op = tok.decode("latin-1")
        nums = [v for v in stack if isinstance(v, float)]
        if op == "BT":
            flush()
            x = y = line_x = line_y = 0.0
        elif op == "ET":
            flush()
        elif op == "Tm" and len(nums) >= 6:
            flush()
            x, y = nums[-2], nums[-1]
            line_x, line_y = x, y
        elif op in ("Td", "TD") and len(nums) >= 2:
            flush()
            line_x += nums[-2]
            line_y += nums[-1]
            x, y = line_x, line_y
            if op == "TD":
                leading = -nums[-1]
        elif op == "TL" and nums:
            leading = nums[-1]
        elif op == "T*":
            flush()
            line_y -= leading
            x, y = line_x, line_y
        elif op == "Tj":
            current.extend(v for v in stack if isinstance(v, str))
        elif op in ("'", '"'):
            flush()
            line_y -= leading
            x, y = line_x, line_y
            current.extend(v for v in stack if isinstance(v, str))
        elif op == "TJ":
            for item in (stack[-1] if stack and isinstance(stack[-1], list) else []):
                if isinstance(item, str):
                    current.append(item)
                elif item < -200:
                    current.append(" ")
        stack = []
    flush()
    return runs


def _streams(data):
    for match in _STREAM_RE.finditer(data):
        header, body = match.group(1), match.group(2)
        if b"/FlateDecode" in header:
            try:
                body = zlib.decompress(body)
            except zlib.error:
                try:
                    body = zlib.decompressobj().decompress(body)
                except zlib.error:
                    continue
        elif b"/Filter" in header:
            continue  # other filters (DCT, LZW, ...) are not supported
        if b"/Subtype /Image" in header or b"/Subtype/Image" in header:
            continue
        yield body


def extract_text(data):
    """Return the text of a PDF as lines, best effort. Never raises."""
    if not data or not data.startswith(b"%PDF"):
        return ""
    lines = []
    try:
        for body in _streams(data):
            if b"BT" not in body:
                continue
            runs = _text_from_content(body)
            # Group runs on the same baseline into one line, top to bottom.
            rows = {}
            for y, x, text in runs:
                rows.setdefault(y, []).append((x, text))
            for y in sorted(rows, reverse=True):
                lines.append("  ".join(t for _, t in sorted(rows[y])))
    except Exception:  # best effort: a broken PDF just yields what we have
        pass
    return "\n".join(lines)
