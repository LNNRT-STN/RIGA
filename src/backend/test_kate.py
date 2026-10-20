"""Kate chat tests. No network: the OpenRouter call is only checked for its fallback."""

import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import kate  # noqa: E402


class KateTests(unittest.TestCase):
    def test_messages_carry_context_history_and_question(self):
        messages = kate.build_messages(
            "Can I save for a trip?",
            history=[{"from": "kate", "text": "Hello Laura."}, {"from": "bot", "text": "ignored"}],
            context={"customer": "Laura", "accounts": [{"name": "KBC Plus Account", "kind": "current", "balance": 1284.37}]},
        )
        self.assertEqual(messages[0]["role"], "system")
        self.assertIn("KBC Plus Account (current), €1,284.37", messages[0]["content"])
        self.assertEqual([m["role"] for m in messages[1:]], ["assistant", "user"])
        self.assertEqual(messages[-1]["content"], "Can I save for a trip?")

    def test_history_and_message_are_capped(self):
        history = [{"from": "user", "text": "x" * 5000}] * 20
        messages = kate.build_messages("y" * 5000, history=history)
        self.assertEqual(len(messages), 1 + kate.MAX_HISTORY + 1)
        self.assertTrue(all(len(m["content"]) <= kate.MAX_MESSAGE for m in messages[1:]))

    def test_no_key_means_unavailable(self):
        with mock.patch.object(kate, "api_key", return_value=None):
            with self.assertRaises(kate.KateUnavailable):
                kate.reply("Hello")

    def test_network_error_means_unavailable(self):
        with mock.patch.object(kate, "api_key", return_value="test"), mock.patch(
            "urllib.request.urlopen", side_effect=OSError("offline")
        ):
            with self.assertRaises(kate.KateUnavailable):
                kate.reply("Hello")


if __name__ == "__main__":
    unittest.main()
