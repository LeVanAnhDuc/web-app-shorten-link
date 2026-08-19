---
name: standard-backend-engineering-mindset
description: Language-agnostic backend engineering principles covering distributed systems thinking, resilience, observability, data integrity, security, and architecture decisions. Load alongside any stack-specific skill. Use when designing systems, making architecture decisions, reviewing backend code for correctness, or reasoning about production reliability.
see-also: standard-coding-universal, standard-restful-api, standard-typescript, module-struct, standard-prisma
user-invocable: false
---

> Sources: 8 Fallacies of Distributed Computing (Peter Deutsch), Martin Fowler (martinfowler.com), Google SRE Book, Designing Data-Intensive Applications (Kleppmann), Backend Engineering First Principles.

---

## The Core Job of a Backend

> "The fundamental job of a backend is to reliably manage, process, and distribute state (data) and logic in response to requests. Everything else is an optimization or implication of this core truth."

Every backend decision — architecture, data model, caching, queue, API shape — should be evaluated against this: does it make state management more reliable, correct, or efficient?

---

## The 8 Fallacies of Distributed Computing

These are assumptions that feel true but are always false in production. Violating them is the root cause of most distributed system failures.

| Fallacy                    | Reality                                                 | Response                                                       |
| --------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| The network is reliable    | Networks partition, drop packets, and time out          | Design for failure: timeouts, retries, circuit breakers        |
| Latency is zero            | A network call is never as fast as a local call         | Minimize round trips, batch calls, cache aggressively          |
| Bandwidth is infinite      | Moving data has real cost: CPU, money, energy           | Right-size payloads, paginate, compress, avoid over-fetching   |
| The network is secure      | Every network call is an attack surface                 | Encrypt in transit, authenticate every service-to-service call |
| Topology doesn't change    | IPs change, services move, DNS TTLs matter              | Use service discovery, avoid hardcoded addresses               |
| There is one administrator | Teams own different services with different priorities  | Build for observability across boundaries, define SLAs         |
| Transport cost is zero     | Serialization, encryption, and routing have CPU cost    | Profile before optimizing, but never ignore serialization cost |
| The network is homogeneous | Different services use different protocols and versions | Design APIs for compatibility and evolution                    |

**Never assume a remote call succeeded.** Always handle the case where you don't know if it succeeded.

---

## Assume Failure, Design for Recovery

- Every external call (network, database, third-party API) will eventually fail — design for it from day one, not as an afterthought
- A system that crashes loudly is better than one that silently corrupts data
- Design for **graceful degradation**: when a dependency fails, the system should degrade partially, not collapse entirely

### Resilience patterns

**Timeout** — every outbound call must have a timeout. No exceptions.

```
Internal services: 1–5s
External APIs:     5–10s
Background jobs:   set per SLA
```

**Retry with exponential backoff + jitter**

```
delay = min(cap, base * 2^attempt) + random_jitter
```

- Only retry on transient failures: 408, 429, 500, 502, 503, 504, network timeout
- Never retry: 400, 401, 403, 404, 409, 422 — these won't change on retry
- Set a max retry budget — unbounded retries cause thundering herd

**Circuit breaker** — stop calling a dependency that is consistently failing

- Closed → Open (after N failures) → Half-Open (probe) → Closed (if probe succeeds)
- Use for: external APIs, downstream services, databases under pressure

**Bulkhead** — isolate resources so one failing subsystem can't exhaust the entire system

- Separate connection pools per dependency (e.g. Prisma pool sized independently from any external API client)
- Prevents one slow service from starving unrelated requests

**Idempotency** — design operations so that retrying them is safe

- Every state-changing operation should be idempotent where possible
- Use idempotency keys for operations that must not double-execute
- `GET`, `PUT`, `DELETE` are idempotent by definition. `POST` and `PATCH` are not — make them so explicitly

---

## Observability — Build It In, Not On

> "You don't rise to the level of your monitoring. You fall to the level of your observability."

Observability is not something you add after incidents. It is a design constraint.

### Three pillars

| Pillar      | What it answers                                       | Tool                          |
| ----------- | ------------------------------------------------------ | ------------------------------ |
| **Metrics** | Is something wrong? (numeric, aggregated)             | Prometheus, Datadog           |
| **Logs**    | What happened? (structured events)                    | Loki, CloudWatch              |
| **Traces**  | Where did the time go? (request flow across services) | Jaeger, Zipkin, OpenTelemetry |

### Rules

- Use **structured logging** (JSON) — never unstructured strings. Include: `timestamp`, `level`, `service`, `trace_id`, `duration_ms`
- Every log entry must be parseable by a machine — no multi-line strings, no concatenated context
- Propagate **trace/request IDs** across boundaries when the system grows beyond a single service
- Never log sensitive data: tokens, PII, payment details
- Define **SLIs and SLOs** before incidents happen:
  - SLI (indicator): "99th percentile latency of `GET /:code` redirect"
  - SLO (objective): "< 200ms for 99% of redirects over 30 days"
- Alert on SLO burn rate — not on raw metrics thresholds

### What to instrument

- All inbound requests: latency, status code, route
- Database query latency and error rate
- Business metrics: links created, redirects served, 404/409 rate

---

## Data Integrity — Correctness Over Convenience

### Consistency models

| Model                    | Guarantee                                              | Use when                                                                                   |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **ACID**                 | Atomicity, Consistency, Isolation, Durability          | Financial transactions, inventory, anything where partial writes are unacceptable          |
| **BASE**                 | Basically Available, Soft state, Eventually consistent | Social feeds, activity counts, read-heavy data where temporary inconsistency is acceptable |
| **Eventual consistency** | All replicas converge given enough time                | Caches, denormalized views, distributed counters                                           |

**Default to ACID** (PostgreSQL gives this by default). Relax consistency only when you have a concrete reason and understand the trade-off — e.g. `clickCount` increments are a candidate for eventual consistency at high scale, but P1 uses a plain atomic `UPDATE ... SET clickCount = clickCount + 1` (or Prisma `increment`), which is sufficient at this volume.

### Rules

- **Never trust external input** — validate all inputs (DTOs + `class-validator`) before they touch Prisma
- **Prefer explicit transactions** (`prisma.$transaction`) for multi-step writes — partial writes that leave data in an inconsistent state are worse than failed writes
- **Idempotency at the data layer**: writes that run twice must produce the same result. Use `@unique` constraints (e.g. `Link.code`) and catch the resulting Prisma `P2002` conflict rather than pre-checking then inserting (TOCTOU race)
- **Schema migrations** must be backward compatible — additive changes only. Never rename or drop a column in the same deploy as the code that stops using it
- **N+1 queries** are a correctness problem masquerading as a performance problem — use Prisma `include`/`select` instead of looping queries

---

## Architecture — Decisions That Are Hard to Undo

### Start simple, earn complexity

> "Good architecture isn't about how many services you have. It's about how well you can change one part without accidentally breaking three others." — Martin Fowler

- **Start with a modular monolith** (this is what NestJS modules give you). Extract services only when you have persistent, quantified pressure
- Measure real pressure before splitting. "We might need to scale this someday" is not a reason

### Coupling and cohesion

- **High cohesion**: related logic lives together inside one NestJS module
- **Low coupling**: modules depend on injected abstractions (services), not concrete implementations reached across module boundaries
- **Acyclic dependencies**: module A can import B, B can import C, but C must not import A
- The right test: can you extract a module into a separate package without pulling half the codebase with it?

### Layer responsibilities — never cross boundaries

```
Controller  → parse input (DTO + pipes), call service, return response/redirect
Service     → business logic, orchestrate PrismaService, no HTTP concepts (no Request/Response)
Prisma      → data access only, no business logic (no validation, no branching on business rules)
```

Each layer must only know about the layer directly below it. Controllers never call `PrismaService` directly.

### Stateless services

- The NestJS app must not store per-request or per-user state in memory — state lives in PostgreSQL
- Stateless services can be horizontally scaled without coordination (important once redirect traffic grows)

### Evolutionary architecture

- Architecture is not a one-time decision — it is continuously improved
- Use **Architecture Decision Records (ADRs)** in `docs/adr/` for decisions with long-term consequences (e.g. "P1 uses Postgres index for redirect lookup, not Redis")
- Design for change, not for predicted scale — P1 is anonymous-only; the `ownerId` nullable column exists so P2 auth can attach without a breaking migration

---

## Security — By Design, Not Afterthought

### Zero Trust

> "Trust no one. Verify every access and action, whether it's an external user or an internal service call."

- Validate all inputs at the boundary — never trust client data
- Principle of Least Privilege: the DB user only has the grants it needs
- Rotate credentials regularly. Treat secrets as ephemeral

### Rules

- Validate all inputs at the boundary — DTO + `class-validator`, never trust client-supplied URLs blindly (see `standard-security`)
- Encrypt data in transit (TLS in front of the app in any real deployment)
- Parameterized queries only — Prisma does this by default; never drop to raw SQL string concatenation
- Never log credentials, tokens, or PII
- Apply rate limiting (`@nestjs/throttler`) to all public endpoints — `POST /api/links` is public and must be throttled to prevent abuse
- Fail securely: when a check fails, deny by default (404 for missing code, not a silent redirect)

---

## Performance — Measure Before Optimizing

- **Profile first, optimize second**. Premature optimization is the root of many architecture mistakes
- The three most common backend performance problems in order of impact: N+1 queries, missing indexes, synchronous calls that should be async
- For P1: the redirect path (`GET /:code`) is the hottest path — it relies on the `@@unique([code])` index. Redis caching is an explicit deferred optimization (P3), not needed at P1 volume
- Cache invalidation is hard — avoid introducing a cache until there's measured evidence it's needed

### Back-of-envelope thinking

Before building, estimate: how many requests per second? What's the read/write ratio? What's the data volume? These numbers determine whether your approach will hold.

```
1 DB query (indexed) ≈ 1–10ms
1 network hop         ≈ 1–100ms
```

A redirect service is read-heavy (many `GET /:code` per `POST /api/links`) — a single indexed lookup per redirect is the right shape for P1.

---

## The Fallacies of Scale

- **You probably don't need microservices yet** — most systems fail not from scale but from complexity
- **You probably don't need a cache yet** — add one (Redis) when you have measured evidence of a redirect-latency bottleneck, not preemptively
- **You probably don't need a message queue yet** — P1 has no background work; introduce one only when async work (e.g. analytics aggregation) actually exists
- **Eventual consistency has real costs** — default to strong consistency (Postgres transaction) and relax only with justification

---

## DO NOT

- Assume a network call succeeded because it didn't throw an exception — check the response
- Build a system without timeouts on every outbound call
- Mutate shared state without transaction protection
- Write N+1 queries — always check the SQL Prisma generates for hot paths
- Log sensitive data
- Hardcode credentials, connection strings, or hostnames in source code — always `process.env` via `ConfigService`
- Add a service boundary before measuring the need for one
- Relax consistency without documenting the trade-off and handling the failure cases
- Deploy schema changes that are not backward compatible in a single step
- Trust input from any external source — validate at every boundary

---

## Code Review Checklist

### Blocking

- [ ] Outbound call missing timeout
- [ ] Retry on non-retryable status (400, 401, 403, 404)
- [ ] SQL/query built with string concatenation from user input
- [ ] Sensitive data (token, password, PII) written to log
- [ ] Secret or credential hardcoded in source
- [ ] Multi-step write without `$transaction` protection
- [ ] Missing idempotency for a state-changing operation that can be retried (e.g. alias creation racing on the unique constraint)

### Warning

- [ ] No structured logging — unstructured string log entries
- [ ] N+1 query pattern in data access
- [ ] Service layer contains HTTP concepts (`Request`, `Response`, status codes)
- [ ] Prisma calls made directly from controller instead of service
- [ ] Consistency model not explicitly chosen — implicit eventual consistency
- [ ] Schema migration not backward compatible
- [ ] No SLO defined for a new endpoint or service

### Suggestion

- [ ] Back-of-envelope estimate missing for new high-traffic path
- [ ] Synchronous call for operation that could be async
- [ ] Circuit breaker missing for frequently-called external dependency
