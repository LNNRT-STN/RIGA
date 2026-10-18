# RIGA agent context

This is a four-person hackathon repository. Each person uses a separate Git branch. Claude Code and Codex agents work concurrently in separate Git worktrees and branches. All changes go through GitHub pull requests; the integration lead reviews and merges them.

Read [the collaboration skill](.claude/skills/hackathon-collaboration/SKILL.md) before changing files. Confirm your assigned task and current Git worktree and branch. Coordinate overlapping work through the relevant PR or the integration lead.

A Multica agent, **Integration Lead**, reviews every non-draft PR against `main` when it is opened, reopened, marked ready, or updated. It merges the PR, requests changes, or leaves it for a human; see `AGENTS.md`. Keep PRs as drafts until they are ready, and write descriptions that match the diff.

For product work, use `DESIGN.md` for UI direction and relevant sections of `KBC_information.md` for background. Use the repo's `impeccable` skill for UI and UX work; it is pinned as a submodule and linked at `.claude/skills/impeccable`.

Use English for all new UI copy, code comments, documentation, PR descriptions, and team communication. The default demo locale is English (Belgium). Do not reuse non-English copy from historical reference material in the product UI.

The frontend uses React, Vite, Tailwind CSS, and shadcn/ui. Reuse components from `frontend/src/components/ui` where appropriate, and keep their tokens aligned with `DESIGN.md`.
