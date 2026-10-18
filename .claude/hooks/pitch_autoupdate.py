#!/usr/bin/env python3
"""Team Rega - keep pitch_story.md and pitch_facts.md up to date automatically.

Claude Code runs this as a Stop hook every time it is about to finish a reply.
If the assignment/discussion changed after pitch_story.md, or the code changed
after pitch_facts.md, it tells Claude to update those files before stopping.
"""
import json
import os
import sys
import time

# Minutes between automatic pitch_facts.md updates (avoids redoing it after every tiny edit).
FACTS_MIN_INTERVAL_MIN = 10

STORY_FILE = "pitch_story.md"
FACTS_FILE = "pitch_facts.md"
STORY_SOURCES = ["assignment", "discussion"]
# Everything else in the repo counts as "code" for the facts, except these:
FACTS_EXCLUDE_TOP = {
    "assignment", "discussion", "design", ".claude", ".git", ".github", ".vscode", ".idea",
    STORY_FILE, FACTS_FILE, "CLAUDE.md",
}
IGNORE_DIRS = {
    ".git", "node_modules", ".venv", "venv", "env", "__pycache__", "dist", "build", ".next",
    ".nuxt", ".expo", "coverage", ".pytest_cache", ".mypy_cache", "target", "out", ".turbo",
    ".cache", ".DS_Store",
}
IGNORE_SUFFIXES = (".log", ".lock", ".tmp", ".swp", ".pyc")


def newest_mtime(paths, root):
    """Newest modification time and file among the given paths (files or folders)."""
    newest, newest_file = 0.0, None
    for rel in paths:
        start = os.path.join(root, rel)
        if os.path.isfile(start):
            m = os.path.getmtime(start)
            if m > newest:
                newest, newest_file = m, rel
            continue
        for dirpath, dirnames, filenames in os.walk(start):
            dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
            for name in filenames:
                if name.endswith(IGNORE_SUFFIXES) or name in IGNORE_DIRS or name == ".gitkeep":
                    continue
                path = os.path.join(dirpath, name)
                try:
                    m = os.path.getmtime(path)
                except OSError:
                    continue
                if m > newest:
                    newest, newest_file = m, os.path.relpath(path, root)
    return newest, newest_file


def mtime(path):
    try:
        return os.path.getmtime(path)
    except OSError:
        return 0.0


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}

    # Already continuing because of this hook: let Claude stop (prevents loops).
    if data.get("stop_hook_active"):
        return 0

    root = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()
    story_path = os.path.join(root, STORY_FILE)
    facts_path = os.path.join(root, FACTS_FILE)
    if not os.path.exists(story_path) and not os.path.exists(facts_path):
        return 0  # not set up yet

    tasks = []

    # Story: assignment/ or discussion/ changed after pitch_story.md
    src_m, src_file = newest_mtime([p for p in STORY_SOURCES if os.path.exists(os.path.join(root, p))], root)
    if src_m > mtime(story_path) + 1:
        tasks.append(
            f"pitch_story.md is out of date ({src_file} changed). Run a quick 'update pitch story': "
            "re-read only the changed source files and update the affected sections; keep [confirmed] fields."
        )

    # Facts: code changed after pitch_facts.md (throttled)
    code_paths = [
        name for name in os.listdir(root)
        if name not in FACTS_EXCLUDE_TOP and name not in IGNORE_DIRS and not name.startswith(".")
    ]
    code_m, code_file = newest_mtime(code_paths, root)
    facts_m = mtime(facts_path)
    if code_m > facts_m + 1 and (time.time() - facts_m) > FACTS_MIN_INTERVAL_MIN * 60:
        tasks.append(
            f"pitch_facts.md is out of date ({code_file} changed). Run a quick 'update pitch facts': "
            "check what changed since the commit/time in its header (git diff if available), update only the "
            "affected sections, refresh the header and section 14. Facts only, with evidence paths."
        )

    if not tasks:
        return 0

    reason = (
        "Before finishing, keep the pitch files in sync (CLAUDE.md > Automatic updates). "
        + " ".join(tasks)
        + " Then finish with one line saying what you updated in the pitch files."
    )
    print(json.dumps({"decision": "block", "reason": reason}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
