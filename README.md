# Shorten Link — paste a long URL, get a short link and a QR code

`web-app-shorten-link` is a public, anonymous URL shortener for anyone who needs a shareable short link without creating an account: paste a long URL, get a short link plus a QR code, and keep the links you created in a local (browser-side) history. Longer term it is planned as the first satellite app of the IDMS constellation (`web-app-store`), signing users in over OAuth/OIDC to unlock per-user link management.

**Project stage: scaffold.** This repository currently contains the two runnable app skeletons, the wired-up library stack, and the design documents that specify Phase 1 — none of the shortener behaviour itself exists yet. Everything the product is supposed to do is listed under [Not built yet](#not-built-yet).

## Features

- **Runnable backend skeleton (`server/`)**
  - NestJS 11 application that boots on `http://localhost:5300` and answers `GET /` with `Hello World!` (the default scaffold route).
  - Prisma 6 + PostgreSQL wiring in place: `prisma/schema.prisma` declares the `postgresql` datasource and client generator, and `prisma.config.ts` points migrations at `prisma/migrations`. The schema declares **no models yet**, so no migration has been generated.
- **Runnable frontend skeleton (`client/`)**
  - Vue 3 + Vite SPA that serves on `http://localhost:3300` with the default `create-vue` welcome page and two routes, `/` and `/about`.
  - The full Phase 1 library stack is registered and verified to coexist: Vuetify 3 (MDI icon set), Tailwind v4 imported without its preflight layer so it does not fight Vuetify's reset, Pinia, Vue Router, TanStack Vue Query, and `vue-i18n` with `en`/`vi` message skeletons.
  - Pre-configured Axios client (`src/lib/axios.ts`) reading its base URL from `VITE_API_BASE_URL`.
- **Design documentation as the source of truth (`docs/`)**
  - `project-goals.md` (positioning, roadmap P1–P3, goals/non-goals), `erd.md` (the planned `Link` model), `specs/shorten-link-p1/design.md` (full Phase 1 API contract, validation rules and a 13-group E2E scenario matrix), plus the approved light+dark Home mock in `ui-designs/shorten-link-p1/home.html`.

### Not built yet

Everything below is **planned** in `docs/` and confirmed absent from the code. Phase labels come from `docs/project-goals.md`.

- **Phase 1 — the shortener itself (specified, not implemented)**
  - `Link` model in Prisma (`code` unique, `originalUrl`, `customAlias?`, `clickCount`, `createdAt`, `ownerId?`) and its first migration.
  - `POST /api/links` — create a short link from `{ url, customAlias? }`, generating a base62 code with `nanoid` or validating a custom alias (3–30 chars, reserved words blocked, `409` on collision).
  - `GET /api/links/:code` — read link metadata, `404` when unknown.
  - `GET /:code` — `302` redirect to the original URL with an atomic `clickCount` increment.
  - Rate limiting on link creation via `@nestjs/throttler`. Neither `@nestjs/throttler` nor `nanoid` is installed yet.
  - Home UI: URL + optional alias form (VeeValidate + Zod), result card with Copy and a client-side QR code (`qrcode`), anonymous local history in `localStorage` (copy / QR / open / remove, with click counts), a `/404` page, full EN+VI copy, and the accessibility behaviour described in the spec.
  - Jest unit/e2e tests for the endpoints and Playwright E2E covering the scenario matrix.
- **Phase 2 (direction only)** — sign-in through IDMS (`web-app-store`) as an OAuth/OIDC client; links created while signed in get an `ownerId`; server-side "my links".
- **Phase 3 (direction only)** — detailed analytics (geo / device / referrer), edit and delete links, expiration, password-protected links, custom domains, admin moderation.

## Tech Stack

| Layer | Stack |
| --- | --- |
| Backend (`server/`) | NestJS 11, Prisma 6.19 + PostgreSQL (DB `shortenlink`), TypeScript 5.7, Jest 30 + supertest, ESLint + Prettier, `yarn`, dev port `:5300` |
| Frontend (`client/`) | Vue 3.5 + Vite 8 + TypeScript 6, Vuetify 3.12 (+ `@mdi/font`), Tailwind CSS v4 (utilities only, preflight off), Pinia, Vue Router 5, TanStack Vue Query 5, VeeValidate 4 + Zod 4, `vue-i18n` 11 (en/vi), Axios, `qrcode`, Playwright, oxlint + ESLint, `yarn`, dev port `:3300` |
| Planned, not installed | `@nestjs/throttler` (rate limiting), `nanoid` (short-code generation), `class-validator` (request DTO validation) |
| Tooling / docs | Prisma CLI, SuperDesign (design system + approved HTML mocks under `docs/`) |

Node.js: the client declares `^22.18.0 || >=24.12.0`.

## Running

Prerequisites: Node.js (see above), `yarn`, and a local PostgreSQL instance. There is no root `package.json` and no Docker Compose — each side is installed and run from its own directory, in two terminals.

### Backend — `server/`

```bash
cd server
cp .env.example .env          # then fill in the real DATABASE_URL credentials
yarn install
```

`.env` keys (see `server/.env.example`): `PORT` (defaults to `5300`) and `DATABASE_URL`, e.g. `postgresql://USER:PASSWORD@localhost:5432/shortenlink?schema=public`.

Create the database once, then apply migrations:

```bash
createdb shortenlink                      # or: psql -U postgres -c "CREATE DATABASE shortenlink;"
npx prisma migrate dev --name init        # no-op today: schema.prisma declares no models yet
yarn start:dev                            # http://localhost:5300
```

### Frontend — `client/`

```bash
cd client
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:5300
yarn install
yarn dev                      # http://localhost:3300
```

### Tests

There are **no product tests yet** — only the three placeholder tests that `nest new` and `create-vue` generate (`server/src/app.controller.spec.ts` and `server/test/app.e2e-spec.ts` assert `Hello World!`; `client/e2e/vue.spec.ts` asserts the scaffold heading). No test counts are quoted here because dependencies are not vendored in this repo and the suites have not been executed against it.

```bash
cd server && yarn test        # Jest unit
cd server && yarn test:e2e    # Jest + supertest
cd client && yarn test:e2e    # Playwright (run `npx playwright install` first)
```

Known scaffold gap: `client/playwright.config.ts` still targets the `create-vue` default ports (`5173` dev / `4173` preview) while the Vite dev server is configured for `3300` — this needs reconciling before the Playwright suite is meaningful.

## Project structure

```
web-app-shorten-link/
├── _bootstrap/                     # bootstrap-time planning notes, kept for provenance; not app code
│   ├── HANDOFF.md                  # resume brief: decisions locked in before scaffolding started
│   ├── design.md                   # approved brainstorm: product, stack, Phase 1 scope
│   └── plan.md                     # the 9-task bootstrap plan that produced this repo (docs authored in Task 7)
├── client/                         # Vue 3 + Vite SPA (dev port 3300)
│   ├── e2e/                        # Playwright specs (scaffold placeholder only)
│   ├── src/
│   │   ├── components/             # default create-vue welcome components
│   │   ├── lib/axios.ts            # Axios instance bound to VITE_API_BASE_URL
│   │   ├── plugins/                # Vuetify, Vue Query and vue-i18n (en/vi) setup
│   │   ├── router/                 # Vue Router: / and /about
│   │   ├── stores/                 # Pinia stores (scaffold counter store)
│   │   └── views/                  # HomeView / AboutView (still scaffold content)
│   ├── .env.example                # VITE_API_BASE_URL
│   └── playwright.config.ts        # E2E config (ports not yet aligned with 3300)
├── docs/                           # source-of-truth design documentation
│   ├── project-goals.md            # positioning, personas, roadmap P1–P3, goals/non-goals
│   ├── erd.md                      # planned PostgreSQL/Prisma schema (Link model)
│   ├── adr/                        # architecture decision records (none recorded yet)
│   ├── specs/shorten-link-p1/      # Phase 1 spec: API contract, validation, E2E matrix
│   ├── ui-designs/shorten-link-p1/ # approved Home mock, light + dark (home.html)
│   └── .superdesign/               # SuperDesign design system tokens for generated mocks
├── server/                         # NestJS 11 REST API (dev port 5300)
│   ├── prisma/schema.prisma        # datasource + generator; no models yet, no migrations
│   ├── src/                        # app.module / app.controller / app.service (scaffold Hello World)
│   ├── test/                       # Jest e2e spec (scaffold placeholder)
│   └── .env.example                # PORT, DATABASE_URL
└── CLAUDE.md                       # working agreement for AI agents (commands + README rule)
```

`client/` and `server/` were merged into this monorepo with `git subtree`, so their histories are preserved inside it. Each side also ships its own `.claude/` folder holding the coding-standard skills for that stack.
