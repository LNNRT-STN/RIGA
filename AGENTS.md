# RIGA agent context

This is the single instruction file for all agents. `CLAUDE.md` only imports it, so edit this file rather than `CLAUDE.md`.

This repository is the shared source for a four-person hackathon team. Each person works on a separate Git branch. Four or more Claude Code or Codex agents may work at the same time; each agent gets its own Git worktree and branch. Everyone shares changes through GitHub pull requests. The integration lead reviews and merges PRs throughout the hackathon.

Before changing files, read [the collaboration skill](.agents/skills/hackathon-collaboration/SKILL.md) and follow its branch, worktree, PR, and handoff workflow. Confirm your assigned task and inspect current branch and worktree state. Coordinate overlapping work through the relevant GitHub PR or with the integration lead.

The integration lead's role is partly automated by the **Integration Lead** agent in the team's Multica workspace `riga`. A GitHub webhook starts it when a PR against `main` is opened, reopened, marked ready for review, or updated. It checks scope, secrets, English-only copy, and overlap with other open PRs; runs `npm run lint` and `npm run build` when `frontend/` changed; then merges the PR or requests changes. It leaves PRs that change agent instructions, `DESIGN.md`, or the workflow, and product decisions, to a human. Keep a PR as a draft until it is ready for review, write a description that matches the diff, and push fixes to the same branch to start a new review. The **Claude** agent in the same workspace takes issues assigned in Multica and follows this file like any other agent.

For product work, use `DESIGN.md` as the UI direction and `design/KBC_Bank_Brand_and_Features.md` as background context. Check the relevant sections rather than loading the entire background document for every task. Use the repo's `impeccable` skill for UI and UX work; it is pinned as a submodule and linked at `.agents/skills/impeccable` for Codex and `.claude/skills/impeccable` for Claude Code.

Use English for all new UI copy, code comments, documentation, PR descriptions, and team communication. The default demo locale is English (Belgium). Do not reuse non-English copy from historical reference material in the product UI.

The frontend uses React, Vite, Tailwind CSS, and shadcn/ui. Reuse components from `frontend/src/components/ui` where appropriate, and keep their tokens aligned with `DESIGN.md`.

## Pitch files

`Presentation_workflow/` holds the files that feed the team's pitch deck, pitch script and film: `pitch_story.md` (why: customer, problem, event rules, keynote story, film brief), `pitch_facts.md` (what we built, generated from the code) and `pitch_script.md` (written by the Claude app; don't regenerate it). All rules for these files, and the commands "update pitch story", "update pitch facts", "update pitch files", "pitch check" and "add branch <name> to the pitch", are in [`Presentation_workflow/PITCH_RULES.md`](Presentation_workflow/PITCH_RULES.md). Read it before you touch a pitch file or run one of those commands.

- On a feature branch, don't edit the pitch files; mention in the PR what the pitch should know.
- On `main`, update `pitch_story.md` when `assignment/` or `discussion/` changes and `pitch_facts.md` when code changes, before you finish. A Claude Code Stop hook (`.claude/hooks/pitch_autoupdate.py`) enforces this on `main` only.

@Presentation_workflow/PITCH_RULES.md
