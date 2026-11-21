---
name: standard-restful-api
description: REST conventions for this project's endpoints (POST /api/links, GET /api/links/:code, GET /:code redirect) — URL rules, status codes, response shape, caching and throttling. Use when writing or reviewing a controller, route, request/response DTO, or the API contract.
user-invocable: false
---

> Sources: RFC 9110 (HTTP semantics), NestJS docs. Endpoint set and data model: `docs/project-goals.md`, `docs/erd.md`.

- Resources are plural, lowercase, kebab-case under `/api` (`/api/links`); a link is addressed by its public `code`, never by DB `id`.
- `GET /:code` stays at the domain root, **outside** `/api`, unversioned — it *is* the short link. Never move it, never reuse this exception for another route. It is a side-effecting GET (increments `clickCount`) by design; do not split the increment into another endpoint.
- No `/v1/` prefix until a real breaking change needs it.
- A `customAlias` must not shadow a route segment (`api`, …) — treat such aliases as reserved and reject with 400.
- P1 has no `PUT`/`PATCH`/`DELETE` and no list endpoint — no speculative `?limit=`/`?offset=`. "Delete" in P1 only removes a client `localStorage` entry.
- Status codes: create → `201` (never `200`); metadata → `200`; redirect → **`302`, never `301`** (target may change later; a cached 301 kills click counting); DTO validation → `400`; unknown code → `404`; alias taken → `409`; throttled → `429`. Never `200` for an error, never `500` for validation/not-found.
- `GET /:code` on an unknown code returns a JSON `404` — do not redirect to a client "not found" page; the client router owns that UX.
- Responses: camelCase fields, ISO 8601 dates, always mapped through a response DTO — never a raw Prisma `Link`. `POST` returns at least `{ code, shortUrl }` (G1); `GET /api/links/:code` carries `clickCount`. `ownerId` is never returned in P1.
- Errors use Nest's default `HttpException` shape `{ statusCode, message, error }` — no custom `{ success, data, error }` envelope.
- Validation: DTO class + class-validator + global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`). `url` must be absolute http/https; `customAlias` `^[a-zA-Z0-9_-]{3,32}$`; `:code` params checked against the same charset. Why scheme validation matters (open redirect): root `.claude/skills/standard-security` §2.
- Caching: `POST /api/links` → `Cache-Control: no-store`; `GET /api/links/:code` → `no-cache`; the `302` must not be cacheable by any layer.
- `POST /api/links` is throttled (`@nestjs/throttler`); 429 responses carry `Retry-After`.
- No auth in P1: no guards, no `Authorization` handling, no `req.user`. P2 makes `POST` optionally authenticated (sets `ownerId`); do not scaffold that now.
