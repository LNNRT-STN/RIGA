### Hackathon final

Team and AI agent collaboration rules are in [AGENTS.md](AGENTS.md) and the [hackathon collaboration skill](.agents/skills/hackathon-collaboration/SKILL.md). Claude Code also reads [CLAUDE.md](CLAUDE.md). Each teammate and agent works on a separate branch; agents use separate worktrees; the integration lead reviews and merges GitHub pull requests.

For UI and UX work, the team uses [Impeccable](https://impeccable.style/) with the project's [DESIGN.md](DESIGN.md). Its version is pinned in `vendor/impeccable` and linked for both Codex (`$impeccable`) and Claude Code (`/impeccable`). After cloning or creating a new worktree, run:

```sh
git submodule update --init --recursive
```

Then reload Codex or Claude Code so it discovers the skill. The integration lead can update the pinned version and relink both providers using the commands in [Impeccable's team setup guide](https://impeccable.style/tutorials/getting-started/).

## Frontend

The React + TypeScript app lives in `frontend/`. With a [Vite-compatible Node.js version](https://vite.dev/guide/), run:

```sh
cd frontend
npm ci
npm run dev
```

`npm run lint` checks source files and `npm run build` checks TypeScript and creates a production build. Add application screens in `frontend/src/`; use `DESIGN.md` for the prototype's visual rules.

Keep local configuration in `frontend/.env.local`, which Git ignores. Commit only safe variable names and placeholders in an `.env.example` when the app needs them. Do not put secrets in `VITE_` variables: Vite includes their values in the browser bundle. Share development credentials through the team's password manager, and use GitHub Actions secrets only for workflows.
