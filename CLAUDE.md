# Shorten Link (web-app-shorten-link)

Public, anonymous URL shortener — paste a long URL, get a short link plus a client-side QR code. Monorepo of `server/` (NestJS 11 + Prisma 6 + PostgreSQL, dev port `:5300`) and `client/` (Vue 3 + Vite + TypeScript + Vuetify 3 + Tailwind v4, dev port `:3300`); the repo is at **scaffold stage** — design docs and the approved Home mock exist, but no shortener code (no `Link` model, no `/api/links`, no redirect) is implemented yet.

## Commands

Both sides use `pnpm`. There is no root `package.json`, no `pnpm-workspace.yaml`, no Docker Compose and no Makefile, so every command runs from `server/` or `client/` — each side owns its own `pnpm-lock.yaml`.

From `server/`:

```bash
pnpm install                                   # install dependencies
pnpm start:dev                                 # dev server, watch mode, :5300
pnpm build                                     # nest build -> dist/
pnpm start:prod                                # run compiled dist/main
pnpm test                                      # Jest unit tests (src/**/*.spec.ts)
pnpm test:e2e                                  # Jest + supertest (test/jest-e2e.json)
pnpm lint                                      # ESLint --fix
pnpm format                                    # Prettier write
pnpm exec prisma migrate dev --name <change>   # create + apply a dev migration
pnpm exec prisma generate                      # regenerate Prisma Client
pnpm exec prisma studio                        # browse the local DB
```

From `client/`:

```bash
pnpm install       # install dependencies
pnpm dev           # Vite dev server, :3300
pnpm build         # vue-tsc type-check + production build
pnpm preview       # serve the production build
pnpm type-check    # vue-tsc --build, no emit
pnpm test:e2e      # Playwright E2E
pnpm lint          # oxlint --fix + eslint --fix
```

## README (REQUIRED — keep in sync with features)

`README.md` describes what the app does for its users — it is not a boilerplate page. Every commit that adds or changes user-facing behaviour (`feat:`) MUST update the `## Features` section of `README.md` in the same branch, before merging — one short English bullet in the existing style.

While touching README, refresh any stale numbers you notice (test counts, stack versions).

README-only documentation commits use a `docs:` prefix.
