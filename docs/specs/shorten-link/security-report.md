# Security report — F1 · Rút gọn link

- **Date:** 2026-11-21
- **Scope:** branch `feat/shorten-link` vs `origin/main` — `POST /api/links` (NestJS + Prisma) and the Vue client that calls it.
- **Method:** independent security-audit subagent (`.claude/CLAUDE.md` §4 step 6), rules from `.claude/skills/standard-security`. URL-rule bypasses were checked by running the same parsing logic in Node, not by reading alone.
- **Verdict:** ✅ **PASS** — no High or Medium finding. Both Low findings were fixed in this branch.

## Findings

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 1 | Low | WHATWG `URL` silently strips TAB/CR/LF, so `https://exa\nmple.com` validated while the raw string (with the control characters) was stored — and would reach the `Location` header once F2 redirects. | **Fixed** — `isPublicHttpUrl` rejects `/[\p{Cc}\s]/u` after trim, on server (`url-rules.ts`) and client (`schemas/link.ts`); unit + supertest + Playwright cases added. |
| 2 | Low | Phishing-shaped URLs accepted: userinfo `https://paypal.com@evil.com`. Mixed-script IDN hosts and hosts that resolve to internal IPs (`*.nip.io`) are also accepted. No SSRF: the server never fetches the URL. | **Fixed (userinfo)** — URLs with `username`/`password` are refused on both sides. **Deferred** — confusable/IDN-homograph and blocklist checks before redirecting: backlog for F2. |
| 3 | Info | `pnpm audit --prod` shows pre-existing advisories (server 13, incl. body-parser compressed-body DoS now reachable via the first JSON POST; client 30, incl. axios and vue-i18n `escapeParameter` — the latter not exploitable, no `v-html`). Added deps (`class-validator`, `class-transformer`, `@fontsource/*`) are reputable and lock-filed. | **Open** — bump `@nestjs/platform-express`/express and axios before any public deployment. |

## Verified OK

- IPv4 shorthand/decimal/hex/octal (`127.1`, `2130706433`, `0x7f.1`, `0177.0.0.1`) normalise to `127.0.0.1` and are refused; `[::1]`, `[::ffff:127.0.0.1]` refused.
- `localhost`, `localhost.`, trailing-dot hosts, `example.com@127.0.0.1` refused; DR-5 catches `SHO.RT`, fullwidth `ｓｈｏ.ｒｔ` and subdomains.
- Malformed hosts `http://.com`, `http://a..com`, `http://-.com` refused (found by code review, fixed with a per-label DNS check on both sides).
- Body size bounded by Express' 100 kb default + `@MaxLength(2048)`; `ValidationPipe` `whitelist` + `forbidNonWhitelisted`; DTO trims before validating.
- Prisma errors never reach the response (P2002 retried, others → generic 500); response DTO is an explicit whitelist (no `id`, no `ownerId`).
- CORS single configured origin; `Cache-Control: no-store` on every `/api` response, errors included.
- `.env` gitignored on both sides; only `VITE_API_BASE_URL` (public) exposed to the bundle.
- Client: no `v-html`, user data rendered via `{{ }}` only, no `href` built from user URLs, clipboard writes only the server's `shortUrl`, `localStorage` holds theme/locale only with guarded access.

## Accepted-deferred (not findings)

- Rate limiting on `POST /api/links` → **F6** (the `standard-security` checklist marks it Blocking for production: F6 must ship before any public deployment).
- Redirect `GET /:code` → **F2**; `helmet` / security headers → before production.
