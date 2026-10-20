# KBC Trust

**KBC Trust answers one question inside the KBC Mobile app: "Is this real?"** Before a customer pays an invoice, picks up a call or trusts a website, Kate checks it and shows one clear verdict. When something looks wrong, KBC Trust warns or stops the payment before the money leaves the account.

This is a working prototype by Team Riga for the KBC Hackathon 2026. All customer data is fictional and every payment is simulated.

> Not security, just trust. We trust KBC, so we can trust the partners KBC verifies.

## What KBC Trust does

### The Ecosystem

In the AI age, fake invoices, cloned websites and deepfake calls look just as real as the genuine ones. Customers and businesses have no quick way to tell them apart, and once a payment is made the money is usually gone.

### The answer: one Trust Score for everything

Every check returns a **KBC Trust Score from 0 to 100**, with a short verdict and the reasons behind it. A green **Verified by KBC** sits at the top of the scale.

| Score | Verdict | What happens |
|---|---|---|
| 80 to 100 | Verified | The payment goes ahead |
| 50 to 79 | Caution | Kate warns; the customer decides |
| 30 to 49 | Review | A Secure4u analyst reviews the payment (human in the loop) |
| 0 to 29 | Danger | The payment is blocked |

### What it can check

- **Invoices** (PDF upload or a forwarded email): reads the payment details, compares the IBAN, sender and wording with the real company, and checks the digital seal.
- **Payees and bank accounts**: name and IBAN match, whether this company is really your supplier, and whether other KBC customers already reported the IBAN.
- **Phone and video calls**: whether the number belongs to the company the caller claims, plus deepfake signals in a video call, for example a fake CEO asking for an urgent payment.
- **Websites**: lookalike domains of verified partners, such as a fake travel site.

### How it works, in two modes

1. **The customer asks (passive).** In Kate the customer uploads an invoice or asks "Is zonnigreizen.be real?" and gets an answer in seconds.
2. **Kate warns first (proactive).** When the customer is about to pay, KBC Trust checks the payee in the transfer review and warns or stops a risky payment before it is confirmed. A Guardian Angel the customer chose can be told when a payment is stopped.

### Verified by KBC partners

Companies such as Proximus can become **verified partners**. They sign up in a partner portal: KBC checks the company number, the account holder of each IBAN and the sender domains. Verified partners then put a **digital seal** on each invoice. The seal is a real Ed25519 signature that KBC can check but cannot forge. If someone changes the IBAN on a sealed invoice, KBC shows exactly what was changed and blocks the payment.

### Why it works at KBC: the network

When one KBC customer reports a fake IBAN or phone number, every other KBC customer is warned before they pay it. A single app can't do this, but a bank with millions of customers can.

### The customer stays in control

Under **MyTrust** on Home and **Settings > What you share with KBC Trust**, customers choose what KBC Trust may use, how proactive it may be, who is informed, and which verified partners may reach them. A log shows everything KBC Trust did. Every change applies straight away.

### Triple win

- **Customers:** no scams, and instant answers to "is this real?"
- **KBC:** fewer fraud refunds, partner revenue and more trust.
- **Partners:** less brand abuse, fewer support calls and correct payments.

### What is real and what is simulated

- **Real code:** invoice parsing, lookalike domain detection, IBAN and phone matching, risky wording detection, scoring, partner sign-up checks (company number and IBAN checksums) and the Ed25519 invoice seal.
- **Simulated:** the partner registry, account holder names, network report counts, the company register and DNS lookups, and the deepfake signals in the demo call.
- **AI:** no language model takes part in any trust check or verdict. Only Kate's free chat replies are written by an LLM through OpenRouter, labelled "Answer written by AI"; questions that lead to an app action keep a scripted reply.

Full details: [src/backend/README.md](src/backend/README.md).

### What is unfinished

- **Kate's AI replies need a key.** Without `OPENROUTER_API_KEY`, Kate falls back to fixed keyword replies (`src/frontend/src/kbc/kate.ts`).
- **Partner data is synthetic.** The partner registry, company register, DNS lookups, account holder names and report counts are demo data, not live KBC or government sources.
- **The deepfake check is staged.** The CEO call uses fixed voice and video signals; there is no real deepfake detection model.
- **Secure4u review and calls are simulated.** Sending a payment to Secure4u or calling KBC Live only shows a message.
- **Nothing is saved.** Reports and new partners live in server memory and reset on restart; app state resets on reload.
- **No frontend tests.** The backend has unit tests (`python3 -m unittest discover src/backend`); the frontend is checked only by lint and the TypeScript build.

## Run the demo

With Python 3 and a [Vite-compatible Node.js version](https://vite.dev/guide/):

```sh
pip install -r src/backend/requirements.txt   # once, for the digital invoice seal
cd src/frontend
npm ci
npm run dev
```

`npm run dev` starts the KBC Mobile app in an iPhone frame, starts the KBC Trust backend (`src/backend/server.py`) and proxies `/api` to it. Without `cryptography` installed the backend still runs, with seals off. Set `KBC_TRUST_BACKEND=off` to start only the frontend. On a real phone (touch screen up to 520px wide) the frame is dropped and the app runs full screen.

### Guided tour

A first visit opens a guided tour next to the phone: 10 short steps. The tour drives the app and the partner portal, so a visitor only presses Next (or the arrow keys) and never types anything. Closing it is remembered in the browser; the **Guided tour** button brings it back, and `?tour` in the URL always opens it. The steps live in `src/frontend/src/tour/steps.ts`.

### Pitch scenarios

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

Every scenario starts from the default KBC Trust settings, so a setting changed while showing customer control can't change the next scenario.

### Deploy to Cloud Run

The root `Dockerfile` builds the app and runs one container: the Python server serves the API and the built frontend on `$PORT`. Test it locally with `docker build -t riga . && docker run -p 8080:8080 riga`, then open http://localhost:8080. In Cloud Run, keep the maximum number of instances at 1, because scam reports are kept in memory, and set `OPENROUTER_API_KEY` as an environment variable on the service so Kate's AI replies work (the image doesn't contain `.env`).

## Project layout

| Path | What it is |
|---|---|
| `src/frontend/` | React, TypeScript, Vite, Tailwind CSS and shadcn/ui app |
| `src/frontend/src/kbc/` | The KBC Mobile replica: screens in `screens/` (KBC Trust in `trust.tsx`, `trust-data.tsx`, `call.tsx`), demo data in `data.ts`, navigation and state in `store.tsx`, Kate in `kate.ts` |
| `src/backend/kate.py` | Kate's free chat replies through OpenRouter (`/api/kate/chat`) |
| `src/frontend/src/components/device/iphone-frame.tsx` | Device frame, status bar and safe areas |
| `src/backend/` | Python KBC Trust API: checks and scoring (`trust.py`), invoice seal (`seal.py`), partner sign-up (`partners.py`), demo registry (`registry.py`), tests |
| `DESIGN.md` | KBC design tokens and UI rules |
| `assignment/`, `instructions/` | Hackathon brief and our challenge plan |
| `Presentation_workflow/` | Pitch story, pitch facts and script |

## Development

From `src/frontend/`, `npm run lint` checks source files and `npm run build` checks TypeScript and creates a production build. From the repository root, `python3 -m unittest discover src/backend` runs the backend tests.

The frontend configuration for shadcn/ui is in `src/frontend/components.json`; reusable components live in `src/frontend/src/components/ui/`. To add one, run `npx shadcn@latest add <component>` from `src/frontend/`, then align its styles and copy with `DESIGN.md`. Photo slots use stand-in artwork; pass an `image` path to `Artwork` or `PromoCard` to use real images from `public/`. All new UI and team documentation should be in English.

Keep local configuration in `src/frontend/.env.local`, which Git ignores. Commit only safe variable names and placeholders in an `.env.example`. Do not put secrets in `VITE_` variables: Vite includes their values in the browser bundle.

### OpenRouter key

Kate's AI replies need an OpenRouter key. Server-side code reads `OPENROUTER_API_KEY` from a `.env` file in the repository root. Run `cp .env.example .env` and paste the key from the team's password manager. Keep the key in server-side code only, never in the frontend or a `VITE_` variable. If a key leaks, tell the integration lead so they can revoke it on [OpenRouter](https://openrouter.ai/settings/keys).

## Team workflow

Team and AI agent collaboration rules are in [AGENTS.md](AGENTS.md) and the [hackathon collaboration skill](.agents/skills/hackathon-collaboration/SKILL.md). [CLAUDE.md](CLAUDE.md) only imports `AGENTS.md` so Claude Code loads the same instructions. Each teammate and agent works on a separate branch; agents use separate worktrees; the integration lead reviews and merges GitHub pull requests.

For UI and UX work, the team uses [Impeccable](https://impeccable.style/) with the project's [DESIGN.md](DESIGN.md). Its version is pinned in `vendor/impeccable` and linked for both Codex (`$impeccable`) and Claude Code (`/impeccable`). After cloning or creating a new worktree, run:

```sh
git submodule update --init --recursive
```

Then reload Codex or Claude Code so it discovers the skill. On Windows the skill links only work with Git symlinks enabled (Developer Mode on, then `git config core.symlinks true`). The integration lead can update the pinned version and relink both providers using the commands in [Impeccable's team setup guide](https://impeccable.style/tutorials/getting-started/).

### Multica agents

The team's [Multica](https://multica.ai/) workspace `riga` has two agents that run on the integration lead's machine:

- **Claude** picks up assigned issues, works on an `agent/claude/<task>` branch, and opens a pull request against `main`.
- **Integration Lead** reviews pull requests against `main`. A GitHub webhook starts it when a pull request is opened, reopened, marked ready for review, or updated. It runs `npm run lint` and `npm run build` when the frontend changed, then merges ready pull requests, requests changes, or leaves them for a human when they change agent instructions or the workflow.

The agents only run while the integration lead's machine is online with Multica open.
