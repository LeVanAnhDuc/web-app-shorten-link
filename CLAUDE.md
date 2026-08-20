# Shorten Link (web-app-shorten-link)

Public, anonymous URL shortener — paste a long URL, get a short link plus a client-side QR code. Monorepo of `server/` (NestJS 11 + Prisma 6 + PostgreSQL, dev port `:5300`) and `client/` (Vue 3 + Vite + TypeScript + Vuetify 3 + Tailwind v4, dev port `:3300`); the repo is at **scaffold stage** — design docs and the approved Home mock exist, but no shortener code (no `Link` model, no `/api/links`, no redirect) is implemented yet.

## Commands

Both sides use `yarn`. There is no root `package.json`, no Docker Compose and no Makefile, so every command runs from `server/` or `client/`.

From `server/`:

```bash
yarn install                              # install dependencies
yarn start:dev                            # dev server, watch mode, :5300
yarn build                                # nest build -> dist/
yarn start:prod                           # run compiled dist/main
yarn test                                 # Jest unit tests (src/**/*.spec.ts)
yarn test:e2e                             # Jest + supertest (test/jest-e2e.json)
yarn lint                                 # ESLint --fix
yarn format                               # Prettier write
npx prisma migrate dev --name <change>    # create + apply a dev migration
npx prisma generate                       # regenerate Prisma Client
npx prisma studio                         # browse the local DB
```

From `client/`:

```bash
yarn install       # install dependencies
yarn dev           # Vite dev server, :3300
yarn build         # vue-tsc type-check + production build
yarn preview       # serve the production build
yarn type-check    # vue-tsc --build, no emit
yarn test:e2e      # Playwright E2E
yarn lint          # oxlint --fix + eslint --fix
```

## README (REQUIRED — keep in sync with features)

`README.md` describes what the app does for its users — it is not a boilerplate page. Every commit that adds or changes user-facing behaviour (`feat:`) MUST update the `## Features` section of `README.md` in the same branch, before merging — one short English bullet in the existing style.

While touching README, refresh any stale numbers you notice (test counts, stack versions).

README-only documentation commits use a `docs:` prefix.
