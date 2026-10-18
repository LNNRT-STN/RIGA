---
name: hackathon-collaboration
description: Coordinate RIGA hackathon coding across four teammates and concurrent Claude Code or Codex agents using separate Git branches, worktrees, and GitHub pull requests.
---

# Hackathon collaboration

Use this workflow for implementation, review, and integration work in RIGA.

## Shared setup

- Four people each work on a separate branch. An agent also uses its own branch and worktree, including when helping a teammate. Never have two agents edit the same worktree or commit to the same branch at once.
- The shared GitHub repository is `LNNRT-STN/RIGA`. `main` is the integration branch. The integration lead reviews and merges PRs throughout the hackathon.
- Confirm the task owner, scope, target branch, and likely file overlap before editing. For new work, branch from the latest `origin/main` unless the integration lead has specified a different base.
- Keep team context in versioned repository files and PRs. Do not rely on one agent's chat history to inform another agent.

## Start a task

1. Inspect `git status`, `git branch --show-current`, and `git worktree list`. Fetch `origin` before branching when network access is available.
2. Give each person or agent a unique task branch. For an agent, create a dedicated worktree, for example:

   ```sh
   git fetch origin
   git worktree add -b agent/<owner>/<task> ../RIGA-<owner>-<task> origin/main
   ```

   Use short, unique branch and directory names. Run that agent from its new worktree.
3. Read the repository instructions and the files relevant to the assignment. For UI work, consult `DESIGN.md`; consult only relevant sections of `design/KBC_Bank_Brand_and_Features.md` for product background. Check open PRs or ask the integration lead when another task may touch the same files or interface.

## Deliver and integrate

- Work only within the assigned scope. Commit on your own branch, push it to `origin`, and open a GitHub PR against the agreed integration branch (normally `main`). Do not push task commits directly to `main`.
- In the PR, state what changed, how it was checked, any unfinished work, and any dependency or overlap with another PR. Link the task or discussion when one exists. Keep the branch updated if `main` moves and resolve conflicts in your own worktree.
- The integration lead checks scope, review feedback, and the available validation before merging. Agents and other teammates leave merging to the integration lead unless explicitly assigned that role.
- After a merge, start the next task from the updated integration branch in a fresh branch and worktree. Remove only your own finished worktree and branch after confirming the PR is merged.
