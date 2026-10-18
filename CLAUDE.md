# CLAUDE.md — Team Riga · KBC Hackathon

Team Riga (Bas Vannieuwenhuyse, Jure Ankenaert, Lennart Steen, Daniel Korobitsin) is building a prototype for the KBC Hackathon. Besides helping us build, you keep two files in `Presentation_workflow/` up to date that feed our pitch deck: **`pitch_story.md`** (why) and **`pitch_facts.md`** (what we built). We upload those two to our presentation workflow in the Claude app, which builds the slides in KBC's design.

## How we work together
- Each of the four of us uses a separate Git branch. Claude Code and Codex agents work at the same time, each in its own Git worktree and branch.
- All changes go through GitHub pull requests on `LNNRT-STN/RIGA`. The integration lead reviews and merges them.
- Read [the collaboration skill](.agents/skills/hackathon-collaboration/SKILL.md) before changing files. Confirm your assigned task, current worktree and branch. Coordinate overlapping work through the relevant PR or the integration lead.
- Use English for all new UI copy, code comments, documentation, PR descriptions and team communication. The default demo locale is English (Belgium). Don't reuse non-English copy from historical reference material in the product UI.

## Project map
| Path | What it is |
|---|---|
| `assignment/assignment.md` | Transcript / text of the official assignment — **primary source** for the story |
| `assignment/` (all other files) | Everything the organisers gave us (briefs, rubric, data, slides, PDFs) |
| `discussion/idea_discussion.md` | Our own brainstorm and decisions — lowest priority source |
| `Presentation_workflow/pitch_story.md` | Pitch story — you fill it from the three sources above |
| `Presentation_workflow/pitch_facts.md` | Pitch facts — you generate it from the code |
| `Presentation_workflow/pitch_script.md` | Spoken pitch script, written by the Claude app together with the slides. Don't regenerate it here; the team may edit the wording by hand |
| `frontend/` | The prototype: React, Vite, Tailwind CSS and shadcn/ui |
| `DESIGN.md` | KBC-inspired design tokens and UI rules — use for any UI you build |
| `design/KBC_Bank_Brand_and_Features.md` | Full KBC brand and product research (background, not verified) |
| `pitch_assets/screenshots/` | Product screenshots for the slides — list them in `pitch_facts.md` section 12 |
| `pitch_assets/video/` | Demo video for the slides — record length, size and format in `pitch_facts.md` section 12 |
| `.claude/hooks/pitch_autoupdate.py` | Stop hook that keeps the two pitch files in sync automatically |

## Commands we'll use
| We say | You do |
|---|---|
| **"update pitch story"** | Update `pitch_story.md` from `assignment/assignment.md`, the rest of `assignment/`, and `discussion/idea_discussion.md` |
| **"update pitch facts"** | Regenerate `pitch_facts.md` from the repository |
| **"update pitch files"** | Both, then run the pitch check |
| **"pitch check"** | Compare story vs facts and list conflicts and gaps (don't edit either file) |
| **"add branch &lt;name&gt; to the pitch"** (one or more branches, or "all open branches") | Read those branches without checking them out or merging, and update section 15 of `pitch_facts.md` |

After any of these, end with a short summary: what changed, what's still `[missing]`, and conflicts found. Then remind us: *"Upload `pitch_story.md` and `pitch_facts.md` to the Claude chat and say 'update our presentation'."*

## Automatic updates
The pitch files must always match the project.
- **When to update (on `main`):**
  - Whenever your work in a session changes `assignment/` or `discussion/`, update `pitch_story.md` before you finish.
  - Whenever it changes code, update `pitch_facts.md` before you finish.
- **The Stop hook enforces this on `main` only.** It sends you back with a reason when a pitch file is older than its sources. On agent and teammate branches it stays silent, so the pitch files don't cause merge conflicts in every pull request. To run it on another branch for one session, start Claude Code with `PITCH_AUTOUPDATE=1`; `PITCH_AUTOUPDATE=0` switches it off.
- **On a feature branch, don't edit the pitch files.** Mention in the PR what changed that the pitch should know about; the integration lead's session on `main` picks it up after the merge.
- **Quick update (automatic):**
  - Only re-read what changed. Use `git diff` against the commit in the `pitch_facts.md` header when git is available; otherwise use the changed files the hook names.
  - Update only the affected sections and refresh the header.
  - Add a line to section 14 (facts) or to the source log (story).
  - All rules below still apply: `[confirmed]` stays untouched, facts need evidence, no invented numbers.
- **Full update:** only when we ask, with "update pitch story", "update pitch facts" or "update pitch files".
- **Finish with one line** saying what you changed in the pitch files.

---

## Rules for `pitch_story.md` — the why

**Sources, in priority order.** When they disagree, the higher one wins; note the conflict in section 14.
1. `assignment/assignment.md`
2. All other files in `assignment/` (read every file, including PDFs and slides; the rubric and format rules usually live here)
3. `discussion/idea_discussion.md` (our choices and ideas, not facts about the event)

**How to fill it**
- Keep the file's structure and headings exactly as they are; the slides workflow reads them.
- **Never overwrite a field tagged `[confirmed]`.** Only the team sets that tag.
- New content you add is `[draft]`. Leave `[missing]` where no source says anything.
- Copy event rules **verbatim**: judging criteria and weights, pitch length, Q&A time, deliverables, deadlines, required tech, video rules.
- Every claim gets a `Source:` (file + section) and a line in the source log.
- **Never invent numbers, quotes, customers or test results.** If `idea_discussion.md` has an estimate, keep it and label it "estimate".
- You may *propose* a persona, insight or one-liner when the sources point clearly to one. Mark it `[draft]` and add "proposed by Claude" to its source.
- Don't read the code for this file. The only exception is a story claim the code clearly contradicts: flag it in section 14 and leave the claim alone.
- Write like a person: short sentences, plain words, no buzzwords ("revolutionary", "seamless", "leverage", "cutting-edge", "game-changer").
- Update "Last updated" and "Filled: X of 15 sections".

## Rules for `pitch_facts.md` — what we built

**Source: the repository only.** Regenerate sections 1 to 14 each time, keep the headings, fill section 14 with what changed since last time. Keep section 15 (other branches) as it is, except remove blocks for branches that are now merged into `main`.

1. **Map the repo.** Read README(s), package and dependency files, entry points, routes/screens, API clients, config, tests, `.env.example` (never real secrets).
2. **Features (section 2).** List every user-facing feature with status `working`, `partial` or `mocked` and a `path:line` as evidence.
3. **Find what's fake (section 7).** Search for mocks, stubs, sample or dummy data, hard-coded responses, fake latency, `TODO`, `FIXME`, `mock`, `fake`, `stub`, `dummy`, `sample`, `hardcoded`, static JSON fixtures used at runtime, and API calls behind feature flags. Be honest: a simulated KBC or Kate connection is normal at a hackathon, but it must be labelled "simulated".
4. **Demo path (section 3).** Work out how to start the app and the shortest click path that shows the main features. Note fragile steps (network calls, slow model calls, auth).
5. **Architecture (section 4).** Describe 4–6 components and the data flow. Say which parts are rule-based and which use an LLM. This mirrors how KBC's Kate works and judges will ask.
6. **Numbers (section 8).** Only numbers you produced: run the test suite if it takes under 2 minutes, time key requests if a quick script allows it, and count records in datasets. Write the exact command. **Never estimate here.**
7. **Security, privacy, accessibility (section 10).** Record what the code really does. Don't describe intentions.
8. **Visual assets (section 12).** List screenshots and video files in the repo with their paths. For a video, give its length, size and format, and whether it is ≤ 20 MB mp4/webm (the deck's limit). Suggest which screenshots are still worth capturing.
9. Facts only, no adjectives. "Returns a parking recommendation in 1.2 s (measured: `npm run bench`)", not "lightning-fast smart parking".

## Work on other branches (section 15 of `pitch_facts.md`)
Use this when a teammate's work isn't merged yet but the pitch should already know about it. Run it from `main`.
1. `git fetch origin`, then for each branch read only what it adds compared with `main`:
   - `git log --oneline main..origin/<branch>`
   - `git diff --stat main...origin/<branch>`
   - `git show origin/<branch>:<path>` for the files that matter
   Never check the branch out, merge it, or change it.
2. In `pitch_facts.md` section 15, write one block per branch: branch name, owner if known, last commit and date, what it adds (features, screens, measured numbers), and its state: `working on the branch`, `partial` or `started`. Every line needs evidence (`origin/<branch>:path:line`).
3. Everything in section 15 is **not merged**. Sections 1 to 14 keep describing `main` only. When a branch is merged, remove its block and let the normal facts update pick it up.
4. If a teammate's PR description mentions something for the pitch, add it here too, marked "from the PR description".
5. End with one line per branch saying what changed in section 15.

## Pitch check (story vs facts)
List, without editing either file:
- **Conflicts:** story promises something the facts show as mocked, partial or missing.
- **Unused strengths:** features or numbers in the facts the story doesn't use yet.
- **Gaps:** `[missing]` story fields that block a good pitch (pitch length, judging criteria, persona, headline number, ask).
- **Demo risk:** fragile steps, and whether a backup video exists.

## Building UI for the prototype
- Follow `DESIGN.md` for every screen, component and state. Use the repo's `impeccable` skill for UI and UX work; it is pinned as a submodule and linked at `.claude/skills/impeccable`.
- Reuse components from `frontend/src/components/ui` where appropriate, and keep their tokens aligned with `DESIGN.md`.
- Key tokens: app canvas `#F3F8FA`, white cards with a `1px #D9E5EC` border, `action-blue` `#006B99` for primary actions, `navy` `#003B71` for headings, `brand-cyan` `#00AEEF` as an accent only. Use the system font stack from `DESIGN.md`.
- Any LLM-generated text goes in a visibly labelled "AI-generated answer" bubble.
- Don't use or fabricate the KBC logo.

This keeps our app and our slides looking like one product.
