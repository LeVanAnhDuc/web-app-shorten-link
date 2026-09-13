# Server — Backend API

Với bất kì yêu cầu nào của user nếu chưa rõ vấn đề hoặc cần thêm thông tin hãy hỏi lại user trước khi tiến hành làm. Tránh tự suy luận.

NestJS REST API backend cho `web-app-shorten-link`. Tạo short link, redirect + đếm click, lưu trữ qua Prisma + PostgreSQL. Phase 1: **anonymous, không auth** (auth qua IDMS OIDC là Phase 2 — không tự dựng auth trước khi có yêu cầu).

## Tech Stack

Chi tiết version/packages xem `.claude/techstack/backend.md` (repo `.claude` gốc). Tóm tắt:

- **Runtime**: Node.js + TypeScript
- **Framework**: NestJS 11
- **Database**: PostgreSQL (DB `shortenlink`) qua **Prisma 6** (`@prisma/client`) — không MongoDB, không Mongoose
- **Rate limiting**: `@nestjs/throttler` (bảo vệ endpoint public `POST /api/links`)
- **Short code generation**: `nanoid`
- **Validation**: `class-validator` + `class-transformer` (Nest `ValidationPipe`)
- **Test**: Jest (`*.spec.ts` unit, `*.e2e-spec.ts` trong `test/`)
- **Dev port**: `:5300`
- **Auth**: KHÔNG có ở Phase 1. Phase 2 sẽ dùng IDMS OAuth/OIDC client — không hand-roll JWT/session trước đó.

## Skills

Thư mục `.claude/skills/` chứa các file hướng dẫn coding convention.

| Khi nào                                                             | Skill files cần đọc                             |
| ---------------------------------------------------------------------- | -------------------------------------------------- |
| Viết/review BẤT KỲ code (mọi ngôn ngữ) — nguyên tắc chung             | `standard-coding-universal/SKILL.md`              |
| Viết/review `.ts` (type safety, tsconfig, decorator, async, imports) | `standard-typescript/SKILL.md` (bản Node/NestJS)  |
| Đụng input user / rate-limit / redirect / config / secret            | `standard-security/SKILL.md` (bản BE)             |
| Viết/review REST API endpoint, controller, request/response          | `standard-restful-api/SKILL.md`                   |
| Scaffold/review module NestJS: controller, service, module, dto      | `module-struct/SKILL.md`                          |
| Viết/review `schema.prisma`, query, migration, `PrismaService`        | `standard-prisma/SKILL.md`                        |
| Thiết kế hệ thống backend, resilience, data integrity, architecture   | `standard-backend-engineering-mindset/SKILL.md`   |

**Không có** `standard-mongodb`/`standard-jwt` trong project này — stack không dùng MongoDB hay JWT tự dựng.

## Commands

```bash
pnpm start:dev         # Start dev server (watch mode), port :5300
pnpm start:debug       # Debug mode with watch
pnpm build             # Compile TypeScript → dist/ (nest build)
pnpm start:prod        # Run compiled dist/main
pnpm lint              # ESLint check + auto-fix
pnpm format            # Prettier write (src/, test/)
pnpm test              # Run Jest unit tests
pnpm test:watch        # Jest watch mode
pnpm test:cov          # Run tests with coverage
pnpm test:e2e          # Run e2e tests (test/jest-e2e.json)

pnpm exec prisma migrate dev --name <change>   # create + apply a dev migration
pnpm exec prisma generate                      # regenerate Prisma Client types
pnpm exec prisma studio                        # browse local DB
```

## Architecture

### Boot Sequence

`main.ts` bootstraps `AppModule` via `NestFactory.create()`:

1. Global `ValidationPipe` registered (`whitelist: true, forbidNonWhitelisted: true`) — every DTO validated before reaching a controller method.
2. `AppModule` imports `PrismaModule` (global, exposes `PrismaService`) + feature modules (`LinksModule`).
3. `ThrottlerModule` configured (global or per-route) to rate-limit public endpoints.
4. Listen on `PORT` env var, default `5300`.

### Module Pattern

Every feature lives in `src/modules/{feature}/`. See **`module-struct/SKILL.md`** for the full NestJS file layout (dto/, module/controller/service), DI via `PrismaService`, and when (rarely, for P1) to split a service.

## Core Patterns

### Data model (Phase 1)

Single Prisma model `Link` (`prisma/schema.prisma`): `code` (`@unique`), `originalUrl`, `customAlias?`, `clickCount` (`@default(0)`), `createdAt`, `ownerId?` (nullable, reserved for P2). See `standard-prisma/SKILL.md`.

### Endpoints (Phase 1)

| Endpoint                | Mô tả                                                          |
| -------------------------- | ------------------------------------------------------------------ |
| `POST /api/links`         | Tạo short link. Body `{ url, customAlias? }`. `409` nếu alias trùng. |
| `GET /api/links/:code`    | Lấy metadata 1 link (dùng cho local history hiển thị `clickCount`). |
| `GET /:code`              | Redirect `302` về `originalUrl`, tăng `clickCount`. `404` nếu không tồn tại. |

Chi tiết status code, response shape, validation rule → `standard-restful-api/SKILL.md`.

### Validation

DTO class + `class-validator` decorator (`@IsUrl`, `@Matches`, …), validated bởi Nest's global `ValidationPipe`. Không dùng Joi (đó là convention của project khác) — xem `module-struct/SKILL.md` cho ví dụ DTO.

### Error Handling

Dùng NestJS `HttpException` subclasses trực tiếp (`NotFoundException`, `ConflictException`, `BadRequestException`) — **không** tự dựng error envelope hay throw `new Error(...)` tuỳ tiện. Map `Prisma.PrismaClientKnownRequestError` (`P2002` → `409`, `P2025` → `404`) trong service layer trước khi rethrow.

### Key Conventions

- Mọi truy cập DB đi qua `PrismaService` (inject qua constructor) — **không** `new PrismaClient()` ở nơi khác.
- Env vars đọc qua `process.env`/`ConfigService` — không hardcode `DATABASE_URL` hay secret khác.
- `GET /:code` (redirect) nằm ở controller riêng, **không** dưới prefix `/api` — xem `standard-restful-api/SKILL.md` để hiểu lý do.
- Short code sinh bằng `nanoid` (charset/length chốt ở lúc implement P1 — xem `docs/specs/shorten-link-p1/design.md` Open Question #1).

## Quality & Workflow

### Post-Task Self-Review

Pattern self-review 3 bước (review → phản biện → refactor) đã được lift lên root — xem `.claude/CLAUDE.md` (repo `.claude` gốc) mục **Post-Task Self-Review Pattern**. Áp dụng cho mọi Side, không duplicate ở đây.

### Quality Check Before Handover

**MANDATORY: After completing ANY code task in this directory, run all checks in order:**

```bash
pnpm format   # auto-fix formatting
pnpm lint     # auto-fix lint errors
pnpm build    # tsc via nest build — surfaces type errors
```

- Run all 3 even if you think the code is clean
- If `pnpm lint` or `pnpm build` report errors → fix ALL errors before responding to the user
- Only after all pass with no errors can you hand over to the user
- `pnpm format` and `pnpm lint` may auto-fix files — always re-read modified files after running them

### Test File Naming & Location

| Pattern              | Ý nghĩa           | Vị trí                 |
| ------------------------ | -------------------- | -------------------------- |
| `*.spec.ts`             | Unit test           | Co-located cạnh source     |
| `*.e2e-spec.ts`         | E2E test            | `test/`                    |
