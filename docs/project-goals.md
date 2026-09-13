# Project Goals & Requirements — `web-app-shorten-link`

> **Status**: Living document — single source of truth về định vị và scope dự án.
> **Last updated**: 2026-07-24
> **Audience**: AI agents trong pipeline SDD + developer onboarding.
> **Rule**: Mọi feature mới phải đối chiếu mục [4. Goals](#4-goals) và [5. Non-Goals](#5-non-goals) trước khi vào pipeline (`superpowers:brainstorming`). Nếu xung đột → cập nhật doc này (qua PR có review của owner), không tự suy diễn.

---

## 1. Identity & Vision

**Tên dự án**: `web-app-shorten-link` — dịch vụ **rút gọn link (URL shortener)**.

**Định vị**: khởi đầu là shortener **public, ẩn danh, UI-first** — bất kỳ ai cũng dán link dài vào và nhận link ngắn ngay, không cần tài khoản. Dài hạn trở thành **app vệ tinh đầu tiên** của constellation IDMS (`web-app-store`) — đăng nhập qua IDMS bằng OAuth/OIDC, mở khoá quản lý link per-user + analytics chi tiết.

**Một câu**: dán link dài → nhận link ngắn + QR ngay lập tức; sau này đăng nhập (qua IDMS) để quản lý link của mình.

---

## 2. Target Users & Roles

| Persona | Mô tả | Phase |
|---|---|---|
| Anonymous visitor | Ai cũng rút gọn link, không cần đăng nhập. Lịch sử link vừa tạo lưu cục bộ (localStorage). | P1 |
| Registered user (qua IDMS) | Đăng nhập qua IDMS (OAuth/OIDC client) → link tạo ra gắn `ownerId`, quản lý link của mình, xem analytics. | P2+ |
| Admin | (defer) vận hành, moderation link abuse, xoá link vi phạm. | P3+ |

---

## 3. Roadmap (phân phase)

| Phase | Nội dung | Auth |
|---|---|---|
| **P1 (build ngay)** | Public shortener: tạo short link + redirect + click counter + PostgreSQL. UI hoàn chỉnh (form, copy, QR, local history). Hoàn toàn ẩn danh. | ❌ |
| **P2 (sau)** | Tích hợp **OAuth/OIDC client của IDMS** (`web-app-store`) → login. Link tạo khi đã login gắn `ownerId`. | ✅ qua IDMS |
| **P3 (sau)** | Quản lý per-user: dashboard "link của tôi", analytics chi tiết (geo/device/referrer), sửa/xoá, expiration, custom domain, admin moderation. | ✅ |

Chi tiết Phase 1 (functional scope BE/FE + E2E matrix): [`specs/shorten-link-p1/design.md`](./specs/shorten-link-p1/design.md).

---

## 4. Goals

### Goals — Phase 1
- **G1 — Rút gọn**: `POST /api/links { url, customAlias? }` → sinh short code base62 (`nanoid`, mặc định ~7 ký tự) hoặc dùng `customAlias` nếu hợp lệ & chưa trùng. Validate URL (http/https, format). Trả `{ code, shortUrl }`.
- **G2 — Redirect**: `GET /:code` (BE đóng vai "short domain") → **302** về `originalUrl`; tăng `clickCount`; không thấy → 404.
- **G3 — Click counter**: đếm **tổng** lượt click mỗi lần redirect (chưa breakdown geo/device — đó là P3).
- **G4 — UI shorten**: trang chủ input URL → nút Shorten → hiện short URL + **Copy** + **QR code** (client-side).
- **G5 — Lịch sử cục bộ**: link vừa tạo lưu **localStorage** (vì ẩn danh) — list có copy / QR / mở / xoá-khỏi-history. Hiện `clickCount` (fetch theo code).

### Goals — Phase 2 (định hướng, spec riêng khi tới)
- **G6 — SSO qua IDMS**: `web-app-shorten-link` đăng ký làm OAuth client của `web-app-store`, Authorization Code + PKCE. Link tạo khi đã login gắn `ownerId`.
- **G7 — Quản lý link của tôi**: user login xem/sửa/xoá link mình đã tạo (server-side, không chỉ localStorage).

### Goals — Phase 3 (định hướng)
- **G8 — Analytics chi tiết**: breakdown click theo geo/device/referrer/thời gian.
- **G9 — Vận hành nâng cao**: expiration date, password-protected link, custom domain, admin moderation (khoá/xoá link vi phạm).

---

## 5. Non-Goals

Rõ ràng **KHÔNG** thuộc scope của Phase 1 (một số dời sang P2/P3 như đã map ở §4, ghi lại ở đây để tránh lẫn vào pipeline P1):

- **Không có auth / account ở P1** — không login, không session, không JWT. (P2)
- **Không lưu link theo user ở server** — P1 chỉ lưu link ẩn danh, không có khái niệm "chủ sở hữu" hoạt động (field `ownerId` tồn tại trong schema nhưng luôn `null` ở P1, xem [`erd.md`](./erd.md)). (P2)
- **Không có analytics chi tiết** geo/device/referrer — P1 chỉ đếm tổng `clickCount`. (P3)
- **Không có expiration, password-protected link, custom domain.** (P3)
- **Không sửa/xoá link ở server** — P1 chỉ cho xoá khỏi **local history** (không xoá bản ghi DB, redirect vẫn hoạt động). (P3)
- **Không gộp thành Next.js/Nuxt fullstack** — giữ format monorepo `server/` (NestJS API) + `client/` (Vue SPA) tách rời, đúng format-clone từ `web-app-store-server-client`.
- **Không phải link management đa tenant / team** — single global namespace cho `code` ở mọi phase hiện tại.

---

## 6. Non-Functional Requirements (P1)

| Yêu cầu | Spec |
|---|---|
| **Rate limiting** | `@nestjs/throttler` trên `POST /api/links` — chống spam tạo link hàng loạt (public, ẩn danh, không auth để chặn theo user). |
| **i18n** | EN (default) + VI qua `vue-i18n`. Toàn bộ copy UI (form, lỗi, history, 404) phải có cả 2 locale. |
| **A11y** | Form có label + `aria-*` đầy đủ, focus quản lý sau khi shorten thành công, thông báo lỗi qua `aria-live`. |
| **Performance** | Redirect `GET /:code` dựa vào PostgreSQL index (`@@unique([code])`) — đủ nhanh cho P1; Redis cache là tối ưu hoá dời sang P3 (xem Open Questions). |
| **Validation** | `class-validator` + custom URL rule ở BE; `VeeValidate + Zod` ở FE (đồng bộ rule, tránh lệch validate 2 phía). |
| **Observability** | Log tối thiểu (NestJS Logger mặc định) — chưa cần structured logging / APM ở P1. |

---

## 7. Tech Stack (fixed)

| Layer | Stack |
|---|---|
| **Backend** | NestJS + Prisma 6 + PostgreSQL, `@nestjs/throttler` (rate-limit), `nanoid` (sinh short code). Package manager `pnpm`, test `Jest`. Dev port **`:5300`**. DB name `shortenlink`. |
| **Frontend** | Vue 3 + Vite + TypeScript, Vuetify 3 (component library) + Tailwind v4 (utility), Pinia (client state — local history), Vue Router, TanStack Vue Query (server state), VeeValidate + Zod (form + schema validation), `vue-i18n` (EN/VI), `axios` (HTTP), `qrcode` (QR client-side), Playwright (E2E). Package manager `pnpm`. Dev port **`:3300`**. |
| **OAuth client (P2, chưa dùng ở P1)** | TBD khi vào spec P2 — client OIDC của `web-app-store` (IDMS), lib cụ thể quyết định lúc đó. |

Chi tiết version cụ thể: `.claude/techstack/backend.md`, `.claude/techstack/frontend.md`.

---

## 8. Key Architectural Decisions (ADR summary)

| ADR | Quyết định | Lý do |
|---|---|---|
| — | Chưa có ADR nào ở thời điểm bootstrap (P1 chưa build). ADR chi tiết sẽ được thêm vào [`docs/adr/`](./adr/) khi có quyết định kiến trúc cần ghi lại (đổi lib, đổi cơ chế cache, v.v.). | Xem [`docs/adr/README.md`](./adr/README.md) cho quy ước. |

---

## 9. Open Questions (defer — quyết định khi vào plan/spec tương ứng)

1. **Độ dài + charset `nanoid`** (6 vs 7 vs 8 ký tự, base62 mặc định) → chốt ở P1 implementation plan (`writing-plans`).
2. **Redirect cache** (Redis vs chỉ dựa Postgres index) → **defer, P1 dùng Postgres index (đủ nhanh)**, Redis là tối ưu hoá dời sang P3 nếu cần.
3. **Cơ chế OAuth client P2** với IDMS (`openid-client` vs `@nestjs/passport` strategy riêng) → quyết định ở spec P2.
4. **Vuetify + Tailwind preflight conflict** (tắt Tailwind preflight vs scope theo class) → chốt lúc scaffold FE (Task bootstrap).
5. **Trang xem stats public theo code** (`/:code/stats`) → không có ở P1, defer — P1 chỉ hiện `clickCount` trong local history.

---

## 10. Changelog

| Date | Change |
|---|---|
| 2026-07-24 | Initial — định vị `web-app-shorten-link`, roadmap P1–P3, goals/non-goals P1, tech stack, NFR. Port từ `_bootstrap/design.md` §1–§4. |
