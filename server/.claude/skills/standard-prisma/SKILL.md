---
name: standard-prisma
description: Prisma 6 + PostgreSQL conventions for this project — schema.prisma rules, the global PrismaService/PrismaModule, migration workflow, and the race-free query patterns the shortener depends on (unique-constraint conflicts, atomic clickCount). Use when writing or reviewing schema.prisma, a Prisma query, a migration, or PrismaService wiring.
user-invocable: false
---

> Sources: Prisma docs (prisma.io/docs), NestJS Prisma recipe. Prisma is pinned at `6.19.3` (`prisma` + `@prisma/client`) — bump both together, in their own commit.

Prisma is the **only** data layer (PostgreSQL, DB `shortenlink`). No raw SQL client, no second ORM, no repository layer on top — services inject `PrismaService` directly.

## Schema (`prisma/schema.prisma`)

Config lives in `prisma.config.ts` (schema path, `prisma/migrations`, `engine: "classic"`, `DATABASE_URL` via `env()` + `dotenv/config`). Target model, per `docs/erd.md`:

```prisma
model Link {
  id          String   @id @default(uuid())
  code        String   @unique
  originalUrl String
  customAlias String?
  clickCount  Int      @default(0)
  createdAt   DateTime @default(now())
  ownerId     String?  // reserved for P2 (Ducker ID owner) — stays nullable
}
```

- Models `PascalCase` singular; fields `camelCase`; no `@map`/`@@map` — column names equal field names.
- Ids are `String @default(uuid())` (ERD; `cuid()` allowed if sort order matters), never autoincrement `Int` (row-count leak / enumeration).
- `code` is `@unique` — it is both the uniqueness guarantee and the index the `GET /:code` hot path uses. No other index in P1; `@@index([ownerId])` arrives with P2's "my links" query.
- Columns for a later phase are added nullable up front (like `ownerId`), so the later phase needs no breaking migration.
- Additive-first: never rename/drop a column in the same migration+deploy as the code that stops using it.
- `docs/erd.md` must change in the same PR as any schema change.

## `PrismaService` + `PrismaModule` (`src/modules/prisma/`)

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

- `PrismaModule` is imported once in `AppModule`; feature modules inject `PrismaService` without importing it.
- `new PrismaClient()` anywhere else is forbidden (second, untracked connection pool).

## Env

- `DATABASE_URL` in `.env` (gitignored); `.env.example` holds only the placeholder `postgresql://USER:PASSWORD@localhost:5432/shortenlink?schema=public`.
- Read it only through Prisma's `env()` — never hardcode or re-parse it. Dev never points at a shared/staging DB.

## Migrations

```bash
pnpm exec prisma migrate dev --name add_link_model   # local only
pnpm exec prisma generate                            # after pulling someone's migration / fresh install
pnpm exec prisma migrate deploy                      # CI / prod — never `migrate dev` there
```

- Commit the generated `prisma/migrations/<ts>_<name>/` with the schema change. Never edit a migration that has been applied anywhere.
- Names: short snake_case describing the change (`add_link_owner_id`), never `update`/`fix`/`wip`.
- Fresh clone / CI: `prisma generate` must run before `nest build` so `@prisma/client` types exist.

## Query patterns

```ts
// Conflict detection = DB constraint, not a pre-check
try {
  await this.prisma.link.create({ data: { code, originalUrl, customAlias } });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    throw new ConflictException(`Alias "${customAlias}" is already in use`);
  }
  throw e;
}

// Redirect: one atomic statement — lookup + increment; P2025 = unknown code
try {
  return await this.prisma.link.update({ where: { code }, data: { clickCount: { increment: 1 } } });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return null;
  throw e;
}
```

- ❌ `findUnique` then `create` for alias uniqueness (TOCTOU race). ❌ read `clickCount`, `+1`, write back (lost updates).
- Generated code colliding with an existing one also raises `P2002` — retry generation a bounded number of times, never loop forever.
- Map only `P2002` → 409 and `P2025` → 404/`null` in the service; rethrow every other error untouched.
- Multi-step dependent writes → `prisma.$transaction`.
- Raw SQL only via tagged `$queryRaw\`...${v}\``; never `$queryRawUnsafe` with user input.

## Testing

- `*.spec.ts`: mock `PrismaService` (only the methods used) — never a real DB.
- `*.e2e-spec.ts` (`test/`): a dedicated test database via `migrate deploy` — never the dev `shortenlink` DB.
