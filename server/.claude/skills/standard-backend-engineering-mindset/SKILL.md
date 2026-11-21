---
name: standard-backend-engineering-mindset
description: Backend design principles applied to this shortener — data integrity, layering, resilience, observability, and when (not) to add infrastructure. Use when making an architecture decision, designing a new backend flow, or reviewing backend code for correctness and production reliability.
see-also: standard-restful-api, standard-typescript, module-struct, standard-prisma
user-invocable: false
---

> Sources: Designing Data-Intensive Applications (Kleppmann), Google SRE Book, Martin Fowler, 8 Fallacies of Distributed Computing.

- **Correctness first.** Concurrency safety comes from the DB: `@unique` + catch `P2002` instead of check-then-insert; `{ increment: 1 }` instead of read-modify-write; `$transaction` for multi-step writes. A loud failure beats silent corruption.
- **Layers never skip**: Controller (DTO in, DTO/redirect out) → Service (business logic, no `Request`/`Response`/status codes) → `PrismaService` (data only). Controllers never touch Prisma.
- **Stateless app**: no per-request/per-user state in memory; state lives in PostgreSQL so instances scale horizontally.
- **Modular monolith** (Nest modules) with acyclic module deps. No new service boundary, cache, or queue without measured need: Redis for redirects is a P3 optimisation; P1 has no background work.
- **Hot path** is `GET /:code` (read-heavy, ~1 indexed `UPDATE … RETURNING` per hit). Keep it to a single query; no extra lookups, no N+1.
- **Design for the next phase without building it**: nullable `ownerId` lets P2 auth land with no breaking migration. Migrations are additive-first.
- **Outbound calls** (none in P1 — the server never fetches the target URL): if one is added, it needs a timeout, retries only on transient errors (408/429/5xx/network) with backoff + jitter, and never on 4xx.
- **Fail closed**: unknown code → `404`, never a fallback redirect. Validate every input at the boundary.
- **Observability**: Nest `Logger`, structured context (route, code, duration); log 409/404/429 rates as business signals. Never log full target URLs with query strings, IPs beyond what throttling needs, or secrets.
- Config/secrets only via env (`ConfigService`) — never hardcoded hosts or connection strings.
- Decisions with long-term consequences get an ADR in `docs/adr/`.
