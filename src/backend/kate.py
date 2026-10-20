"""Kate's free chat replies, written by an LLM through OpenRouter.

The LLM only writes conversation. It never decides whether an invoice, caller or website is
real: those verdicts stay rule based in trust.py. Kate sends trust questions to those checks.

Key: env OPENROUTER_API_KEY, or the same name in the .env file at the repository root.
Model: env KATE_MODEL (default below). Without a key the endpoint answers 503 and the app
falls back to its scripted reply.
"""

import json
import os
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ENV_FILE = os.path.normpath(os.path.join(HERE, "..", "..", ".env"))
URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "anthropic/claude-haiku-5.5"
TIMEOUT_S = 12
MAX_MESSAGE = 1000
MAX_HISTORY = 8

SYSTEM_PROMPT = """You are Kate, the assistant in the KBC Mobile banking app in Belgium. This is a \
hackathon demo with fictional customers and simulated money.

Write in English, in two or three short, friendly sentences. Plain text only: no markdown, lists \
or emoji. Amounts look like €1,284.37.

What you can do in this app: show balances, start a transfer (the customer reviews and confirms \
it themselves), find KBC Live (weekdays 8:00 to 22:00, Saturdays 9:00 to 17:00), and check with \
KBC Trust whether an invoice, caller or website is real.

Rules:
- Never say whether an invoice, IBAN, caller, email or website is real or safe yourself. Ask the \
customer to share the document, or type the website address, so KBC Trust can check it.
- Never move money, and never ask for passwords, card codes or digipass codes. KBC never asks for them.
- If someone urges the customer to pay fast or keep a payment secret, tell them to stop and check first.
- Only use the account data below. If you don't know something, say so and offer KBC Live.

Customer: {customer}
Accounts:
{accounts}"""


class KateUnavailable(Exception):
    """The LLM can't answer right now; the app shows its scripted reply instead."""


def _env_file_value(name):
    try:
        with open(ENV_FILE, encoding="utf-8") as fh:
            for line in fh:
                key, sep, value = line.strip().partition("=")
                if sep and key.strip() == name:
                    return value.strip().strip("'\"")
    except OSError:
        pass
    return None


def api_key():
    return os.environ.get("OPENROUTER_API_KEY") or _env_file_value("OPENROUTER_API_KEY")


def model():
    return os.environ.get("KATE_MODEL") or DEFAULT_MODEL


def _text(value, limit=MAX_MESSAGE):
    return str(value or "").strip()[:limit]


def build_messages(message, history=None, context=None):
    context = context if isinstance(context, dict) else {}
    accounts = context.get("accounts") if isinstance(context.get("accounts"), list) else []
    lines = []
    for acc in accounts[:6]:
        if isinstance(acc, dict):
            try:
                balance = "€{:,.2f}".format(float(acc.get("balance")))
            except (TypeError, ValueError):
                balance = "unknown"
            lines.append("- %s (%s), %s" % (_text(acc.get("name"), 60), _text(acc.get("kind"), 20), balance))
    system = SYSTEM_PROMPT.format(
        customer=_text(context.get("customer"), 60) or "unknown",
        accounts="\n".join(lines) or "- none shared",
    )
    messages = [{"role": "system", "content": system}]
    for turn in (history if isinstance(history, list) else [])[-MAX_HISTORY:]:
        if isinstance(turn, dict) and turn.get("from") in ("user", "kate") and _text(turn.get("text")):
            role = "user" if turn["from"] == "user" else "assistant"
            messages.append({"role": role, "content": _text(turn.get("text"))})
    messages.append({"role": "user", "content": _text(message)})
    return messages


def reply(message, history=None, context=None):
    """Returns {"text", "model"}; raises KateUnavailable when there is no key or OpenRouter fails."""
    key = api_key()
    if not key:
        raise KateUnavailable("OPENROUTER_API_KEY is not set")
    payload = {"model": model(), "messages": build_messages(message, history, context), "max_tokens": 300}
    request = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
            "X-Title": "KBC Trust demo (Team Riga)",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_S) as response:
            data = json.loads(response.read().decode("utf-8"))
        text = data["choices"][0]["message"]["content"].strip()
    except urllib.error.HTTPError as err:
        raise KateUnavailable("OpenRouter returned %d" % err.code)
    except (urllib.error.URLError, OSError, ValueError, KeyError, IndexError, TypeError, AttributeError) as err:
        raise KateUnavailable("OpenRouter failed: %s" % err)
    if not text:
        raise KateUnavailable("OpenRouter returned an empty reply")
    return {"text": text, "model": data.get("model") or model()}
