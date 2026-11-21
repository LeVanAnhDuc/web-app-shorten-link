# Server — Backend API

Khi yêu cầu mơ hồ ở điểm ảnh hưởng tới kết quả (scope, data model, API contract) thì hỏi lại; còn lại đọc rule/skill rồi làm.

**File Sync Rule**: tạo mới hoặc xoá file/folder cấp module trong `src/` (vd `src/modules/<feature>/`, `src/prisma/`) → cập nhật lại phần mô tả tương ứng trong file này và skill liên quan trong cùng commit.

NestJS REST API backend cho `web-app-shorten-link`. Tạo short link, redirect + đếm click, lưu trữ qua Prisma + PostgreSQL. Phase 1: **anonymous, không auth** (auth qua Ducker ID OIDC là Phase 2 — không tự dựng auth trước khi có yêu cầu).

## Tech Stack

Chi tiết version/packages xem `server/package.json` (nguồn đúng). Tóm tắt:

- **Runtime**: Node.js + TypeScript
- **Framework**: NestJS 11
- **Database**: PostgreSQL (DB `shortenlink`) qua **Prisma 6** (`@prisma/client`) — không MongoDB, không Mongoose
- **Rate limiting**: `@nestjs/throttler` (bảo vệ endpoint public `POST /api/links`) — chưa cài, thuộc F6
- **Short code generation**: `node:crypto` `randomInt` (`src/modules/links/code-generator.ts`) — không dùng `nanoid` (v5 chỉ ESM, vướng Jest)
- **Validation**: `class-validator` + `class-transformer` (Nest `ValidationPipe`)
- **Test**: Jest (`*.spec.ts` unit, `*.e2e-spec.ts` trong `test/`)
- **Dev port**: `:5300`
- **Auth**: KHÔNG có ở Phase 1. Phase 2 sẽ dùng Ducker ID OAuth/OIDC client — không hand-roll JWT/session trước đó.

## Skills

Thư mục `.claude/skills/` chứa các file hướng dẫn coding convention.

| Khi nào                                                             | Skill files cần đọc                             |
| ---------------------------------------------------------------------- | -------------------------------------------------- |
| Viết/review `.ts` (type safety, tsconfig, decorator, async, imports) | `standard-typescript/SKILL.md` (bản Node/NestJS)  |
| Viết/review REST API endpoint, controller, request/response          | `standard-restful-api/SKILL.md`                   |
| Scaffold/review module NestJS: controller, service, module, dto      | `module-struct/SKILL.md`                          |
| Viết/review `schema.prisma`, query, migration, `PrismaService`        | `standard-prisma/SKILL.md`                        |
| Thiết kế hệ thống backend, resilience, data integrity, architecture   | `standard-backend-engineering-mindset/SKILL.md`   |

Skill dùng chung ở `<project>/.claude/skills/` (không nằm trong `server/.claude/skills/`): `standard-coding-universal` (mọi code) và `standard-security` (§1 + §2 — khi đụng input user / rate-limit / redirect / config / secret).

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

> **Trạng thái (F1, 2026-11-21):** đã có model `Link` + migration, `PrismaModule`, `AppConfig`, `POST /api/links`. Chưa có: `GET /:code` (F2), `GET /api/links/:code` (F4), alias + `409` (F5), throttler (F6) — lộ trình ở `docs/unfinished-features.md`.

### Boot Sequence

`main.ts` bootstraps `AppModule` via `NestFactory.create()`:

1. `loadEnv()` nạp `.env` bằng `process.loadEnvFile` (Node built-in — không `dotenv`/`@nestjs/config` ở runtime).
2. `AppModule` imports `AppConfigModule` (global `AppConfig`: `PUBLIC_BASE_URL`, `CLIENT_ORIGIN`), `PrismaModule` (global `PrismaService`), `LinksModule`.
3. `configureApp(app)` (`src/app.setup.ts`): global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) + CORS cho `CLIENT_ORIGIN`. E2E dùng chung hàm này.
4. *(F6)* `ThrottlerModule` rate-limit `POST /api/links`.
5. Listen on `PORT` env var, default `5300`.

### Module Pattern

Every feature lives in `src/modules/{feature}/`. See **`module-struct/SKILL.md`** for the full NestJS file layout (dto/, module/controller/service), DI via `PrismaService`, and when (rarely, for P1) to split a service.

## Core Patterns

### Data model (Phase 1)

Single Prisma model `Link` (`prisma/schema.prisma`): `code` (`@unique`), `originalUrl`, `customAlias?`, `clickCount` (`@default(0)`), `createdAt`, `ownerId?` (nullable, reserved for P2). See `standard-prisma/SKILL.md`.

### Endpoints (Phase 1)

| Endpoint                | Mô tả                                                          |
| -------------------------- | ------------------------------------------------------------------ |
| `POST /api/links`         | ✅ F1. Tạo short link. Body `{ url }` (`customAlias` từ F5, `409` nếu trùng). |
| `GET /api/links/:code`    | Lấy metadata 1 link (dùng cho local history hiển thị `clickCount`). |
| `GET /:code`              | Redirect `302` về `originalUrl`, tăng `clickCount`. `404` nếu không tồn tại. |

Chi tiết status code, response shape, validation rule → `standard-restful-api/SKILL.md`.

### Validation

DTO class + `class-validator` decorator, validated bởi Nest's global `ValidationPipe`. URL dùng decorator riêng `@IsPublicHttpUrl()` (luật ở `src/modules/links/url-rules.ts`, DR-4) — `@IsUrl` một mình vẫn nhận `http://127.0.0.1`. Luật cần config (DR-5, host của chính shortener) kiểm ở service. Không dùng Joi (đó là convention của project khác) — xem `module-struct/SKILL.md` cho ví dụ DTO.

### Error Handling

Dùng NestJS `HttpException` subclasses trực tiếp (`NotFoundException`, `ConflictException`, `BadRequestException`) — **không** tự dựng error envelope hay throw `new Error(...)` tuỳ tiện. Map `Prisma.PrismaClientKnownRequestError` (`P2002` → `409`, `P2025` → `404`) trong service layer trước khi rethrow.

### Key Conventions

- Mọi truy cập DB đi qua `PrismaService` (inject qua constructor) — **không** `new PrismaClient()` ở nơi khác.
- Env vars đọc qua `AppConfig` (inject) — không hardcode `DATABASE_URL` hay secret khác; `DATABASE_URL` chỉ Prisma đọc.
- `GET /:code` (redirect) nằm ở controller riêng, **không** dưới prefix `/api` — xem `standard-restful-api/SKILL.md` để hiểu lý do.
- Short code: 7 ký tự, base62 bỏ `0 O 1 l I`; trùng `P2002` → sinh lại tối đa 3 lần (`docs/specs/shorten-link/design.md` DR-2, DR-3).

## Quality & Workflow

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
| `*.e2e-spec.ts`         | E2E test (supertest) | `test/` — chạy trên DB `shortenlink_test`, Jest global setup tự tạo + `migrate deploy` |
