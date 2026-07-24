---
name: standard-restful-api
description: RESTful API design standards for this project — URL structure, HTTP methods, status codes, request/response format, validation, rate limiting, matching the shorten-link P1 endpoint set (POST /api/links, GET /api/links/:code, GET /:code redirect). Use when writing or reviewing any REST endpoint, route handler, request/response DTO, or API contract.
user-invocable: false
---

## This Project's Endpoint Set (Phase 1)

```
POST   /api/links           create a short link
GET    /api/links/:code     get link metadata (for local history clickCount display)
GET    /:code                redirect 302 to originalUrl + increment clickCount
```

`GET /:code` is intentionally **not** under `/api` — it plays the role of the "short domain" root path (`shortener.app/abc123`), matching how real URL shorteners work. Do not move it under `/api` and do not add versioning to it.

`/api/links` **is** versioned-ready (see Versioning section) even though P1 ships unversioned — do not retrofit `/v1/` prefix speculatively; add it only if/when a breaking change is needed.

---

## URL & Resource Design

- Resource name: plural noun — `/api/links` not `/api/link`
- All lowercase, kebab-case for multi-word resources (none yet in P1)
- `GET /:code` is a deliberate exception to "resources live under `/api`" — documented above, not a pattern to reuse for other top-level routes

```
POST   /api/links               → create
GET    /api/links/:code         → read one (by code, not by DB id — code is the public identifier)
GET    /:code                   → redirect (side-effecting GET: increments clickCount)
```

> **Note on `GET /:code` being side-effecting**: this violates the usual "GET must be safe/idempotent" rule, but it is the load-bearing role of a URL shortener (every redirect visit increments a counter). This is an accepted, documented exception — do not "fix" it by moving the increment to a separate endpoint; a real shortener's redirect endpoint always does this.

---

## HTTP Methods

- `POST /api/links` creates a resource — not idempotent by default; a duplicate `customAlias` submission returns `409`, it does not silently create a second link
- Never use `GET` for state-changing operations **except** the documented `GET /:code` click-increment above
- P1 has no `PUT`/`PATCH`/`DELETE` on the server — editing/deleting a link server-side is P3 (non-goal for P1). "Delete" in P1 only removes an entry from client-side `localStorage` history, never calls the server

---

## HTTP Status Codes (P1 usage)

| Scenario                                         | Code |
| -------------------------------------------------- | ---- |
| Link created                                     | 201  |
| Link metadata found                              | 200  |
| Redirect to `originalUrl`                          | 302  |
| Validation error (bad URL, invalid alias format) | 400  |
| Code/alias not found                             | 404  |
| `customAlias` already taken                        | 409  |
| Rate limited                                     | 429  |
| Internal server error                            | 500  |

- `POST /api/links` that succeeds returns `201`, never `200`
- `GET /:code` on a missing code returns `404` (JSON, since there is nothing to redirect to) — it does **not** redirect to a client-side "not found" page; the client's router owns that UX (design.md `/404` route)
- `302 Found` specifically (not `301`) for the redirect — a short link's target could change in a later phase, so it must never be permanently cached by the browser
- Never `200` for errors, never `500` for a validation failure or a plain not-found

---

## Request Format

```
POST /api/links
{ "url": "https://example.com/very/long/path", "customAlias": "my-alias" }   // customAlias optional

GET /api/links/:code
GET /:code
```

- `code`/`customAlias` are path/body params, not query params
- No pagination/filtering/sorting query params exist in P1 (no list endpoint) — do not add speculative `?limit=`/`?offset=` support

---

## Response Format

```json
// 201 Created — POST /api/links
{ "code": "aZ3kP1q", "shortUrl": "https://short.example/aZ3kP1q", "originalUrl": "https://example.com/...", "clickCount": 0, "createdAt": "2026-07-24T10:00:00.000Z" }

// 200 OK — GET /api/links/:code
{ "code": "aZ3kP1q", "originalUrl": "https://example.com/...", "clickCount": 42, "createdAt": "2026-07-24T10:00:00.000Z" }

// 404 — GET /api/links/:code or GET /:code, code not found
{ "statusCode": 404, "message": "Link not found" }

// 409 — POST /api/links, customAlias taken
{ "statusCode": 409, "message": "Alias \"my-alias\" is already in use" }
```

- Response field names: camelCase
- Dates: ISO 8601 (`toISOString()`) — Prisma `DateTime` fields serialize this way by default via `class-transformer`/Nest's JSON serializer
- Never return `ownerId` in P1 responses (always `null` today, reserved for P2 — do not leak the column just because it exists)
- Never return raw Prisma model objects — always map through a response DTO (see `module-struct/SKILL.md`) so adding a column later doesn't silently change the public API
- Use Nest's built-in exception shape (`{ statusCode, message }` from `HttpException`) for errors — do not invent a custom envelope for this project

---

## Error Handling

Use NestJS's built-in `HttpException` subclasses — do not build a custom error envelope:

```ts
// links.service.ts
async createLink(dto: CreateLinkDto) {
  const code = dto.customAlias ?? generateCode();
  try {
    return await this.prisma.link.create({
      data: { code, originalUrl: dto.url, customAlias: dto.customAlias ?? null },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException(`Alias "${dto.customAlias}" is already in use`);
    }
    throw error;
  }
}
```

```ts
// links.controller.ts — redirect
@Get(":code")
async redirect(@Param("code") code: string, @Res() res: Response) {
  const link = await this.linksService.findAndTrackClick(code);
  if (!link) throw new NotFoundException("Link not found");
  return res.redirect(HttpStatus.FOUND, link.originalUrl);
}
```

Standard status codes to keep consistent across the API:

| statusCode | when                                   |
| ------------ | ---------------------------------------- |
| 400        | `class-validator` DTO validation failure |
| 404        | code/alias does not exist                |
| 409        | `customAlias` unique constraint violation  |
| 429        | throttler limit exceeded                 |
| 500        | unhandled/infrastructure error           |

---

## Input Validation

All path params and request bodies validated before reaching the service layer, via DTO classes + `class-validator` + Nest's global `ValidationPipe`.

```
POST /api/links — body (CreateLinkDto):
  url:          string, required, valid http/https URL (@IsUrl)
  customAlias:  string, optional, ^[a-zA-Z0-9_-]{3,32}$

GET /api/links/:code — params:
  code:         string, required, matches generated-code/alias charset

GET /:code — params:
  code:         string, required, same charset as above
```

- Define the DTO once, reuse its shape for both validation and the generated OpenAPI/type contract — never duplicate the shape as a separate plain interface
- See `standard-security/SKILL.md` for why URL scheme validation matters here (open-redirect prevention)

---

## Authentication & Authorization

P1 ships with **no auth** — every endpoint above is public and anonymous by design (see `docs/project-goals.md` roadmap). Do not add `Authorization` header handling, guards, or `req.user` reads in P1 code.

P2 (later, out of scope now): IDMS OIDC login attaches `ownerId` to links created while authenticated. When that lands, `POST /api/links` becomes optionally-authenticated (works anonymously too), and new per-user endpoints (P3) will require an `AuthGuard` + ownership check — do not scaffold these guards speculatively now.

---

## Caching

```
Cache-Control: no-store        # POST /api/links (state-changing)
Cache-Control: no-cache        # GET /api/links/:code (clickCount changes, must revalidate)
```

- Do **not** set a long-lived `Cache-Control`/browser cache on `GET /:code` — the `302` itself must not be cached by intermediaries (a later click must still hit the server to increment `clickCount`), which is consistent with using `302` over `301` above

---

## Rate Limiting

See `standard-security/SKILL.md` for the abuse-prevention rationale. Mechanically:

```ts
// main.ts / app.module.ts
ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]);
```

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

---

## DO NOT

- Move `GET /:code` under `/api` — it must stay at the domain root to act as the short link
- Add pagination/sorting/filtering query params — no list endpoint exists in P1
- Return raw Prisma `Link` objects — always map to a response DTO
- Invent a custom `{ success, data, error }` envelope — use Nest's default `HttpException` shape
- Cache the `302` redirect response at any layer
- Build auth guards/JWT handling for P1 — no auth until P2 (IDMS OIDC)
- Use `301` for the shortlink redirect (breaks future edit/expire support and defeats click tracking after browser caches it)

---

## Code Review Checklist

### Blocking

- [ ] `POST /api/links` body not validated via DTO + `class-validator`
- [ ] Raw Prisma `Link` object returned instead of a response DTO
- [ ] `GET /:code` uses `301` instead of `302`
- [ ] `GET /:code` missing `404` handling for unknown code
- [ ] `customAlias` unique violation not mapped to `409`
- [ ] Auth guard added to a P1 endpoint (out of scope until P2)

### Warning

- [ ] `Cache-Control` missing/incorrect on `GET /api/links/:code` or the redirect route
- [ ] `POST /api/links` missing throttling
- [ ] `ownerId` leaked in a response DTO while still always-null in P1

### Suggestion

- [ ] Consider `Retry-After` header presence on 429 responses
- [ ] Consider whether an OpenAPI/Swagger doc should be regenerated after an endpoint change
