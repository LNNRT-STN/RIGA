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

The frontend includes Tailwind CSS and [shadcn/ui](https://ui.shadcn.com/docs/installation/vite). The project configuration is in `frontend/components.json`; reusable components live in `frontend/src/components/ui/`. To add another component, run `npx shadcn@latest add <component>` from `frontend/`, then align its styles and copy with `DESIGN.md`. All new UI and team documentation should be in English.

Keep local configuration in `frontend/.env.local`, which Git ignores. Commit only safe variable names and placeholders in an `.env.example` when the app needs them. Do not put secrets in `VITE_` variables: Vite includes their values in the browser bundle. Share development credentials through the team's password manager, and use GitHub Actions secrets only for workflows.

### OpenRouter key

Server-side code reads `OPENROUTER_API_KEY` from a `.env` file in the repository root. To set it up:

```sh
cp .env.example .env
```

Then paste the key from the team's password manager into `.env`. Keep the key in server-side code only, never in `frontend/` or a `VITE_` variable, because anything the browser loads can be read by anyone using the app. If a key leaks, tell the integration lead so they can revoke it on [OpenRouter](https://openrouter.ai/settings/keys).

### iPhone mockup

`npm run dev` opens a working KBC Mobile replica inside an iPhone frame, scaled to fit the screen for projector demos. On a real phone (touch screen up to 520px wide) the frame is dropped and the app runs full screen.

- `src/components/device/iphone-frame.tsx`: device frame, status bar and safe areas.
- `src/kbc/`: the app. Screens live in `screens/`, demo data in `data.ts`, navigation and state in `store.tsx`.
- `src/kbc/kate.ts`: scripted Kate replies. Replace `getKateReply` with a call to our backend to show the final product inside the app.
- Photo slots use stand-in artwork; pass an `image` path to `Artwork` or `PromoCard` to use real images from `public/`.

All customer data is fictional, and transfers are simulated.

## Multica agents

The team's [Multica](https://multica.ai/) workspace `riga` has two agents that run on the integration lead's machine:

- **Claude** picks up assigned issues, works on an `agent/claude/<task>` branch, and opens a pull request against `main`.
- **Integration Lead** reviews pull requests against `main`. A GitHub webhook starts it when a pull request is opened, reopened, marked ready for review, or updated. It runs `npm run lint` and `npm run build` when `frontend/` changed, then merges ready pull requests, requests changes, or leaves them for a human when they change agent instructions or the workflow.

The agents only run while the integration lead's machine is online with Multica open.
