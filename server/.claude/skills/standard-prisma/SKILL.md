---
name: standard-prisma
description: Prisma 6 + PostgreSQL conventions for this NestJS project — schema.prisma structure, PrismaService/PrismaModule DI pattern, migration workflow (prisma migrate dev), DATABASE_URL/.env handling, and query patterns. Use when writing or reviewing schema.prisma, any Prisma query, a migration, or PrismaService wiring.
user-invocable: false
---

# Prisma 6 + PostgreSQL

This project uses **Prisma 6** as the only data-access layer against **PostgreSQL** (DB name: `shortenlink`). There is no MongoDB, no Mongoose, no raw SQL client, and no separate ORM. Do not introduce a repository abstraction layer on top of Prisma for this project's size — inject `PrismaService` directly into feature services (see `module-struct/SKILL.md`).

---

## `schema.prisma` conventions

Single schema file at `prisma/schema.prisma`. Config lives in `prisma.config.ts` (Prisma 6's config file, replacing the old `package.json#prisma` block) — already present in this project, pointing `schema` at `prisma/schema.prisma` and reading `DATABASE_URL` via `env()`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Link {
  id          String   @id @default(cuid())
  code        String   @unique
  originalUrl String
  customAlias String?
  clickCount  Int      @default(0)
  createdAt   DateTime @default(now())
  ownerId     String?  // nullable, reserved for P2 (IDMS-authenticated owner)

  @@index([createdAt])
}
```

**Rules:**

- Model names: `PascalCase` singular (`Link`, not `Links`/`link`).
- Field names: `camelCase` — Prisma maps to the DB's `snake_case` automatically only if you add `@map`/`@@map`; this project keeps column names matching field names (no mapping) for simplicity, so keep fields camelCase consistently rather than mixing.
- Every model needs an explicit `@id` — prefer `@default(cuid())` over auto-increment `Int` ids (avoids leaking row count, avoids enumeration).
- Public-facing lookup fields (`code`) get `@unique` — this is both a correctness constraint (Task's G1: code must be unique) and the index the redirect hot-path (`GET /:code`) relies on.
- New nullable columns added in anticipation of a later phase (like `ownerId` for P2) must be nullable from day one and require no follow-up migration to add — only a follow-up migration to populate/use them.
- Never rename or drop a column that existing deployed code still reads/writes in the same migration as the code change — additive-first, remove-later (see `standard-backend-engineering-mindset/SKILL.md`).

---

## `PrismaService` + `PrismaModule`

```ts
// src/modules/prisma/prisma.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```ts
// src/modules/prisma/prisma.module.ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- `@Global()` on `PrismaModule` so every feature module can inject `PrismaService` without re-importing it everywhere — import it once in `AppModule` and it's available project-wide. (If the project later wants stricter module boundaries, drop `@Global()` and import `PrismaModule` explicitly per feature module — either is acceptable, but be consistent.)
- Feature services inject `PrismaService` via constructor, exactly like any other provider — never instantiate `new PrismaClient()` directly anywhere else (that creates a second, untracked connection pool).

```ts
// feature service
constructor(private readonly prisma: PrismaService) {}
```

---

## Environment / `.env`

- `DATABASE_URL` lives in `.env` (gitignored) and `.env.example` (tracked, placeholder values only):
  ```
  DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/shortenlink?schema=public"
  ```
- Read via `process.env.DATABASE_URL` only inside Prisma's own config (`prisma.config.ts`, `schema.prisma`'s `env()`) and Nest's `ConfigModule` — never re-parse or hardcode the connection string elsewhere.
- Local dev DB name: `shortenlink`. Do not point dev at a shared/staging database.

---

## Migrations workflow

```bash
# 1. Edit prisma/schema.prisma

# 2. Generate + apply a dev migration (creates prisma/migrations/<timestamp>_<name>/)
npx prisma migrate dev --name add_link_model

# 3. Regenerate the Prisma Client types (migrate dev does this automatically,
#    but re-run explicitly after pulling someone else's migration)
npx prisma generate

# Inspect/browse data locally
npx prisma studio

# CI / production — apply already-committed migrations, never `migrate dev`
npx prisma migrate deploy
```

**Rules:**

- `prisma migrate dev` is a **local development** command only — it can prompt to reset the DB on drift. Never run it in CI/production; use `prisma migrate deploy` there.
- Every schema change ships with its generated migration folder committed to `prisma/migrations/` — never hand-edit a migration SQL file after it has been applied anywhere.
- Migration names: short, snake_case, describe the change (`add_link_model`, `add_link_owner_id`) — not `update`, `fix`, `wip`.
- Run `npx prisma generate` after `yarn install` in any fresh clone/CI job so `@prisma/client` types exist before `tsc`/`nest build` runs.

---

## Query patterns

```ts
// ✅ Unique lookup on the indexed field — the redirect hot path
await prisma.link.findUnique({ where: { code } });

// ✅ Atomic increment — avoids read-then-write race on clickCount
await prisma.link.update({
  where: { code },
  data: { clickCount: { increment: 1 } },
});

// ✅ Let the DB constraint do conflict detection — catch P2002, don't pre-check
try {
  await prisma.link.create({ data: { code, originalUrl, customAlias } });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    // alias/code already taken
  }
}

// ✅ Multi-step write → transaction
await prisma.$transaction(async (tx) => {
  // multiple dependent writes here, none partially applied
});
```

```ts
// ❌ Read-then-write race — two concurrent requests can both pass the check
const existing = await prisma.link.findUnique({ where: { code: alias } });
if (existing) throw new ConflictException();
await prisma.link.create({ data: { code: alias, originalUrl } });

// ❌ Non-atomic counter update — lost updates under concurrent redirects
const link = await prisma.link.findUnique({ where: { code } });
await prisma.link.update({ where: { code }, data: { clickCount: link.clickCount + 1 } });

// ❌ Second, untracked PrismaClient instance
const prisma = new PrismaClient();
```

- Prisma parameterizes all queries by default — never build a query with raw string interpolation. If raw SQL is ever unavoidable, use `prisma.$queryRaw` with tagged-template parameters (`` prisma.$queryRaw`...${value}...` ``), never `$queryRawUnsafe` with interpolated user input.
- Select only the fields a DTO needs (`select: { code: true, originalUrl: true, ... }`) when a model grows large enough that over-fetching matters — not required while `Link` has ~6 fields, but keep in mind as the schema grows.

---

## Testing

- Unit tests for services: mock `PrismaService` (e.g. `jest.mock` or a lightweight fake implementing the subset of methods used) — do not hit a real database in `*.spec.ts`.
- `*.e2e-spec.ts` (in `test/`) may run against a real (test) PostgreSQL database via `prisma migrate deploy` in a CI setup step — never against the dev/shared `shortenlink` database.

---

## DO NOT

- Instantiate `new PrismaClient()` outside of `PrismaService`
- Run `prisma migrate dev` in CI or production — use `prisma migrate deploy`
- Hand-edit an already-applied migration SQL file
- Pre-check existence with `findUnique` then `create` for alias/code uniqueness — rely on the `@unique` constraint + catch `P2002`
- Do a read-then-write for `clickCount` — always use `{ increment: 1 }`
- Use `$queryRawUnsafe` with unsanitized user input
- Hardcode `DATABASE_URL` anywhere outside `.env`/`.env.example`
- Introduce a Mongoose/MongoDB dependency into this project — Prisma + PostgreSQL is the only data layer

---

## Code Review Checklist

### Blocking

- [ ] `new PrismaClient()` instantiated outside `PrismaService`
- [ ] Read-then-write race for uniqueness check instead of relying on `@unique` + `P2002`
- [ ] Non-atomic `clickCount` update (`read → +1 → write` instead of `{ increment: 1 }`)
- [ ] `$queryRawUnsafe` used with interpolated user input
- [ ] Migration hand-edited after being applied
- [ ] `prisma migrate dev` invoked from a CI/deploy script

### Warning

- [ ] New column added without considering nullability/backward compatibility
- [ ] Migration not committed alongside the schema change
- [ ] Migration name uninformative (`update`, `fix`, `wip`)
- [ ] Multi-step write not wrapped in `$transaction`

### Suggestion

- [ ] `select`/`include` could narrow an over-fetching query as the model grows
- [ ] Missing `@@index` for a field used in a frequent `WHERE`/`ORDER BY`
