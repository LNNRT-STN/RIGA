### Hackathon final

Team and AI agent collaboration rules are in [AGENTS.md](AGENTS.md) and the [hackathon collaboration skill](.agents/skills/hackathon-collaboration/SKILL.md). [CLAUDE.md](CLAUDE.md) only imports `AGENTS.md` so Claude Code loads the same instructions. Each teammate and agent works on a separate branch; agents use separate worktrees; the integration lead reviews and merges GitHub pull requests.

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

### KBC Trust demo

`npm run dev` also starts the KBC Trust backend (`src/backend/server.py`) and proxies `/api` to it. Run `pip install -r src/backend/requirements.txt` once for the digital invoice seal; without it the backend still runs, with seals off. Set `KBC_TRUST_BACKEND=off` to start only the frontend. See [src/backend/README.md](src/backend/README.md) for the endpoints and what is rule based or simulated.

A first visit opens a guided tour next to the phone: 12 short steps, about 3 minutes. The tour drives the app and the partner portal, so a visitor only presses Next (or the arrow keys) and never types anything. Closing it is remembered in the browser; the **Guided tour** button brings it back, and `?tour` in the URL always opens it. The steps live in `src/frontend/src/tour/steps.ts`.

On a laptop screen, a panel next to the phone starts the pitch scenarios. Keys work too:

- `1` Fake Proximus invoice checked in Kate (sample PDFs in `src/frontend/public/demo/`)
- `2` Deepfake CEO video call
- `3` Supplier invoice with a changed account number, stopped in the transfer review
- `4` Customer control: what KBC Trust may use, how proactive it is, which partners may reach you, and a log of what it did
- `5` Kate asks first: document checks are switched off, so Kate asks before she reads the invoice
- `6` Real Proximus invoice with a valid digital seal: "Verified by KBC"
- `7` Sealed Proximus invoice whose IBAN was changed afterwards: KBC shows what was changed
- `8` Partner sign-up: a company becomes Verified by KBC in a portal next to the phone (`#partners` in the URL opens it directly)
- `9` Ask Kate "Is zonnigreizen.be real?", before and after the partner signs up
- `0` Reset report counts and partners added through sign-up, and reload

Every scenario starts from the default KBC Trust settings, so a setting changed while showing customer control can't change the next scenario. The same controls are in the app under **MyTrust** on Home, **Settings > What you share with KBC Trust**, the line under Kate's greeting, and the note under every verdict.

### Deploy to Cloud Run

The root `Dockerfile` builds the app and runs one container: the Python server serves the API and the built frontend on `$PORT`. Test it locally with `docker build -t riga . && docker run -p 8080:8080 riga`, then open http://localhost:8080. In Cloud Run, keep the maximum number of instances at 1, because scam reports are kept in memory.

## Multica agents

The team's [Multica](https://multica.ai/) workspace `riga` has two agents that run on the integration lead's machine:

- **Claude** picks up assigned issues, works on an `agent/claude/<task>` branch, and opens a pull request against `main`.
- **Integration Lead** reviews pull requests against `main`. A GitHub webhook starts it when a pull request is opened, reopened, marked ready for review, or updated. It runs `npm run lint` and `npm run build` when `frontend/` changed, then merges ready pull requests, requests changes, or leaves them for a human when they change agent instructions or the workflow.

The agents only run while the integration lead's machine is online with Multica open.
