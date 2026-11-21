# Shorten Link — paste a long URL, get a short link and a QR code

`web-app-shorten-link` is a public, anonymous URL shortener for anyone who needs a shareable short link without creating an account: paste a long URL, get a short link plus a QR code, and keep the links you created in a local (browser-side) history. Longer term it is planned as the first satellite app of the IDMS constellation (`web-app-ducker-id`), signing users in over OAuth/OIDC to unlock per-user link management.

**Project stage: Phase 1, slice 1 of 6.** Shortening a link and copying it work end to end (Vue → NestJS → PostgreSQL). Opening a short link, QR codes, local history, custom endings and rate limiting come in the next slices — see [Not built yet](#not-built-yet).

## Features

- **Shorten a link** — paste a long `http`/`https` link on the home page and get a 7-character short code (no look-alike characters `0 O 1 l I`) plus its short link, shown on a "claim ticket" result card. Links to `localhost`, IP addresses, the shortener itself, or with credentials (`user@host`) are refused with an inline error.
- **Copy the short link** — one button copies the full short URL to the clipboard and confirms with "Copied".
- **English and Vietnamese, light and dark** — the whole UI is available in `en` and `vi`, follows the system theme until you pick one, and remembers both choices.
- **Accessible by keyboard and screen reader** — skip link, labelled field whose errors are linked to it and receive focus, focus moved to the result, and announcements for created links, copy results and failed requests.

### Not built yet

Phase 1 is delivered as six slices, tracked in [`docs/unfinished-features.md`](docs/unfinished-features.md):

- **F2** — open a short link: `GET /:code` redirects (`302`) to the original URL and counts the click; unknown codes get a 404 page.
- **F3** — a QR code on the ticket, downloadable as PNG.
- **F4** — your recent links, kept in this browser (`localStorage`), with click counts and remove + undo.
- **F5** — choose your own ending (custom alias, reserved words blocked, `409` when taken).
- **F6** — rate limiting on link creation with a "try again in N seconds" message.
- **Phase 2 (direction only)** — sign-in through Ducker ID (`web-app-ducker-id`) as an OAuth/OIDC client; links created while signed in get an `ownerId`.
- **Phase 3 (direction only)** — detailed analytics, edit and delete, expiration, password-protected links, custom domains, admin moderation.

## Tech Stack

| Layer | Stack |
| --- | --- |
| Backend (`server/`) | NestJS 11, Prisma 6.19 + PostgreSQL (DB `shortenlink`), `class-validator` + `class-transformer`, TypeScript 5.7, Jest 30 + supertest, ESLint + Prettier, `pnpm`, dev port `:5300` |
| Frontend (`client/`) | Vue 3.5 + Vite 8 + TypeScript 6, Vuetify 3.12 (+ `@mdi/font`), Tailwind CSS v4 (utilities only, preflight off), Atkinson Hyperlegible Next + Martian Mono (`@fontsource`), Pinia, Vue Router 5, TanStack Vue Query 5, VeeValidate 4 + Zod 4, `vue-i18n` 11 (en/vi), Axios, Playwright, oxlint + ESLint, `pnpm`, dev port `:3300` |
| Planned, not installed | `@nestjs/throttler` (F6), `qrcode` usage (F3 — already a dependency) |
| Design | Design system in `docs/design-system/shorten-link/` (decision: `docs/adr/0001-design-system-bootstrap.md`), built with the `ui-ux-pro-max` + `frontend-design` Claude Code plugins |

Short codes are generated with `node:crypto` (`randomInt`), not `nanoid`.

Node.js: the client declares `^22.18.0 || >=24.12.0`.

## Running

Prerequisites: Node.js (see above), `pnpm`, and a local PostgreSQL instance. There is no root `package.json`, no `pnpm-workspace.yaml` and no Docker Compose — each side owns its own `pnpm-lock.yaml` and is installed and run from its own directory, in two terminals.

### Backend — `server/`

```bash
cd server
cp .env.example .env          # then fill in the real DATABASE_URL credentials
pnpm install
```

`.env` keys (see `server/.env.example`):

| Key | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5300` | HTTP port |
| `DATABASE_URL` | — | e.g. `postgresql://USER:PASSWORD@localhost:5432/shortenlink?schema=public` |
| `PUBLIC_BASE_URL` | `http://localhost:5300` | Origin short links are built on; its host is refused as a link target |
| `CLIENT_ORIGIN` | `http://localhost:3300` | Browser origin allowed by CORS |

Apply migrations, then start:

```bash
pnpm exec prisma migrate dev   # creates the shortenlink DB if needed and applies prisma/migrations
pnpm start:dev                 # http://localhost:5300
```

### Frontend — `client/`

```bash
cd client
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:5300
pnpm install
pnpm dev                      # http://localhost:3300
```

### Tests

```bash
cd server && pnpm test        # Jest unit — 50 tests (code generation, URL rules, LinksService, AppConfig)
cd server && pnpm test:e2e    # Jest + supertest — 23 tests, against shortenlink_test (created and migrated automatically)
cd client && pnpm test:e2e    # Playwright, Chromium — 33 tests; needs the server running on :5300
```

Run `pnpm exec playwright install chromium` once before the first Playwright run. Playwright starts Vite on `:3300` itself, or reuses one that is already running.

## Project structure

```
web-app-shorten-link/
├── _bootstrap/                     # bootstrap-time planning notes, kept for provenance; not app code
├── client/                         # Vue 3 + Vite SPA (dev port 3300)
│   ├── e2e/shorten-link/           # Playwright specs: app shell, shorten + copy
│   ├── src/
│   │   ├── components/             # AppHeader, ShortenForm, LinkTicket (the result "ticket")
│   │   ├── composables/            # useCreateLink, usePreferences (theme + language), useAnnounce
│   │   ├── locales/                # en.json, vi.json
│   │   ├── plugins/                # Vuetify theme (light/dark), Vue Query, vue-i18n
│   │   ├── schemas/                # Zod URL rules + VeeValidate adapter
│   │   ├── types/                  # LinkDto
│   │   └── views/HomeView.vue      # the home page
│   └── .env.example                # VITE_API_BASE_URL
├── docs/                           # source-of-truth design documentation
│   ├── project-goals.md            # positioning, roadmap P1–P3, goals/non-goals
│   ├── unfinished-features.md      # Phase 1 slices F1–F6 and their status
│   ├── erd.md                      # PostgreSQL/Prisma schema (Link model)
│   ├── design-system/shorten-link/ # MASTER.md tokens, icon map, UX copy
│   ├── specs/<feature>/            # design.md, plan.md, e2e.md, security-report.md per feature
│   ├── ui-designs/<feature>/       # approved HTML mocks
│   └── adr/                        # architecture decision records
├── server/                         # NestJS 11 REST API (dev port 5300)
│   ├── prisma/                     # schema.prisma (Link) + migrations
│   ├── src/
│   │   ├── config/                 # AppConfig (PUBLIC_BASE_URL, CLIENT_ORIGIN)
│   │   ├── modules/prisma/         # global PrismaService
│   │   ├── modules/links/          # POST /api/links: DTOs, URL rules, code generator, service
│   │   └── app.setup.ts            # ValidationPipe + CORS, shared with e2e
│   ├── test/                       # supertest e2e + test-DB setup
│   └── .env.example
└── CLAUDE.md                       # working agreement for AI agents (commands + README rule)
```

`client/` and `server/` were merged into this monorepo with `git subtree`, so their histories are preserved inside it. Each side also ships its own `.claude/` folder holding the coding-standard skills for that stack.
