---
name: standard-security
description: Application security standards for the backend — input validation, rate limiting, open-redirect / SSRF prevention on user-supplied URLs, secrets management, and security headers. Use when writing or reviewing any code that handles user input, the public shorten/redirect endpoints, or deployment configuration.
user-invocable: false
---

> Sources: OWASP Top 10 2025, OWASP Cheat Sheet Series (Unvalidated Redirects and Forwards, SSRF Prevention), NIST SP 800-63-4.

---

## Backend focus (P1 — anonymous, no auth)

P1 has **no authentication** (auth arrives in P2 via IDMS OIDC — do not build ad-hoc auth now). The trust boundary today is simpler but still real: any anonymous caller can hit `POST /api/links` and `GET /:code`. Weight these first:

- **Input validation** — every DTO field validated with `class-validator` before it reaches the service layer; never trust the client to have validated the URL.
- **Open redirect / SSRF via user-supplied URL** — `originalUrl` is attacker-controlled input that the server later `302`s browsers to. Validate scheme and reject dangerous targets (see below). This is the single highest-risk item in this codebase.
- **Rate limiting** — `POST /api/links` is public and unauthenticated; must be throttled (`@nestjs/throttler`) to prevent abuse (spam link creation, alias squatting, DB growth).
- **Secrets management** — `DATABASE_URL` and any future secret live in `.env`, read via `ConfigService`; never hardcoded, never logged, never committed (`.env` is gitignored, only `.env.example` is tracked).
- **Safe error responses** — never leak Prisma error internals (stack trace, SQL, DB schema) to the client; map to `NotFoundException` / `ConflictException` / `BadRequestException`.

(FE-specific items — XSS/CSP/DOM sanitization/client storage — are covered in the client's own `standard-security`, out of scope here.)

---

## Input Validation

- Every controller method parameter comes from a DTO class validated with `class-validator` (`ValidationPipe` registered globally in `main.ts` with `whitelist: true, forbidNonWhitelisted: true`) — never read `req.body`/`req.query` unvalidated.
- `code` path param: validate shape (allowed charset, length bound) before using it in a Prisma `findUnique` — reject obviously-invalid input with `400` before hitting the DB.
- `customAlias`: validate charset (e.g. alnum + `-`/`_`, length bound, e.g. 3–32 chars) — this becomes part of a public URL, so also block reserved/system paths (`api`, `health`, `assets`, …) from being claimed as an alias.

```ts
// dto/create-link.dto.ts
export class CreateLinkDto {
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  url!: string;

  @IsOptional()
  @Matches(/^[a-zA-Z0-9_-]{3,32}$/)
  customAlias?: string;
}
```

## Open Redirect / SSRF Prevention on `originalUrl`

The server never fetches `originalUrl` itself (no server-side request forgery risk from an outbound HTTP call — P1 only stores and redirects), but it does `302` an end user's browser to it, and a naive shortener can be abused as an open-redirect / phishing vector. Apply at creation time (`POST /api/links`), not at redirect time:

- **Scheme allowlist**: only `http`/`https` (`class-validator`'s `@IsUrl({ protocols: ["http", "https"] })` covers this — reject `javascript:`, `data:`, `file:`, `ftp:`, etc.)
- **Reject loopback/private/link-local targets** if/when P1 ever adds server-side URL fetching (e.g. link preview, favicon fetch) — not needed for pure redirect, but document the rule now so it isn't missed later:
  ```
  169.254.169.254/latest/meta-data/    # cloud metadata
  localhost, 127.0.0.1, ::1            # loopback
  10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16  # RFC1918
  ```
- **Do not shorten a link to the app's own redirect domain** (prevents infinite redirect loops / redirect chaining abuse) — reject `originalUrl` whose host matches the shortener's own `BASE_URL`.
- Reserved codes (`api`, `health`, static asset prefixes) must be excluded from the nanoid generation space and from valid `customAlias` values so a created link can never shadow a real route.

## Rate Limiting

- `@nestjs/throttler` guard applied globally or on `POST /api/links` specifically — by IP for this anonymous endpoint.
- `GET /:code` (redirect) is also public and high-volume by nature (that's its job) — apply a higher/looser limit here than on creation, tuned so legitimate click traffic isn't blocked, but a scraping burst against sequential/guessed codes is slowed.
- Return `429` with `Retry-After` when throttled — do not silently drop requests.

```ts
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Post()
create(@Body() dto: CreateLinkDto) { /* ... */ }
```

## Secrets Management

- `DATABASE_URL` (and any future secret) only via `process.env` inside `ConfigModule`/`ConfigService` — never hardcoded, never interpolated into log lines.
- `.env` is gitignored; `.env.example` documents the shape with placeholder values only (already the case — `postgresql://USER:PASSWORD@localhost:5432/shortenlink?schema=public`).
- CI/deployment secrets injected via environment, never committed.

## Error Responses

- Catch `Prisma.PrismaClientKnownRequestError` and map known codes to `HttpException` subclasses (`P2002` unique violation → `409 ConflictException`, `P2025` record not found → `404 NotFoundException`) — never let a raw Prisma error reach the client (it would leak table/column names).
- Global exception filter (Nest default, or a custom one) must strip stack traces from the JSON response in production.

## Future (P2+) — do not build yet

- IDMS OAuth/OIDC client (Authorization Code + PKCE) replaces any ad-hoc auth — do not hand-roll JWT/session auth for P1.
- Once `ownerId` is populated, every per-user endpoint must check resource ownership server-side (`link.ownerId === currentUser.id`), not just "is authenticated."

---

## DO NOT

- Trust `originalUrl` scheme without validation — a shortener that accepts `javascript:`/`data:` URIs is a stored-XSS/phishing vector
- Skip rate limiting on `POST /api/links` because "it's just a shortener" — public unauthenticated write endpoints are the most common abuse target
- Hardcode `DATABASE_URL` or any credential in source
- Let a raw Prisma error (stack trace, SQL, constraint name) reach the HTTP response
- Build custom JWT/session auth for P1 — auth is IDMS OIDC in P2, not before
- Allow a `customAlias` to collide with a reserved route (`api`, `health`, etc.)

---

## Code Review Checklist

### Blocking

- [ ] `originalUrl` accepted without scheme allowlist validation
- [ ] `POST /api/links` missing `@Throttle` / global throttler guard
- [ ] Prisma error surfaced to client without mapping to an `HttpException`
- [ ] Secret/credential hardcoded in source
- [ ] `customAlias`/`code` used in a Prisma query without prior format validation

### Warning

- [ ] `GET /:code` has no rate limit at all (even a loose one)
- [ ] Reserved-word check missing for `customAlias`
- [ ] Redirect target allows the app's own domain (redirect loop / chaining risk)
- [ ] Global `ValidationPipe` missing `whitelist: true` / `forbidNonWhitelisted: true`

### Suggestion

- [ ] Security headers (`helmet`) not yet applied — acceptable to defer within P1 but track before production
- [ ] No structured audit log yet for abuse patterns (repeated 409s, throttled IPs)
