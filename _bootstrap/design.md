# Design — `web-app-shorten-link` (bootstrap format-clone + Phase 1)

> **Status**: Brainstorm output (2026-07-24). Đầu vào cho `superpowers:writing-plans`.
> **Bản chất**: Tạo project MỚI `web-app-shorten-link` bằng cách clone **format làm việc** của `web-app-store-server-client` (giống lần clone `web-app-match-cv`), rồi build Phase 1.
> **Điểm neo permanent**: khi implement, nội dung §1–§4 → `docs/project-goals.md` của repo mới; §5–§6 (Phase 1 chi tiết) → `docs/specs/shorten-link-p1/design.md`.

---

## 0. Bối cảnh & mục tiêu clone

Monorepo template = **4 repo git độc lập**: `.claude/` (lõi kiến trúc), `docs/`, `server/`, `client/`. "Clone làm template" = mang **format/quy trình làm việc** (`.claude` methodology + skills + convention + docs skeleton + layout monorepo), **KHÔNG copy code app**. Tiền lệ `web-app-match-cv`: đổi hẳn stack, fork `.claude` thành `claude-architecture-match-cv`, viết lại `project-goals.md` + `techstack.md`, port dev riêng.

`web-app-shorten-link` chủ đích **đổi stack** so với store để thử format với công nghệ mới.

---

## 1. Identity & Vision

**Tên**: `web-app-shorten-link` — dịch vụ **rút gọn link (URL shortener)**.

**Định vị**: khởi đầu là shortener **public, ẩn danh, UI-first**. Dài hạn trở thành **app vệ tinh đầu tiên** của constellation IDMS (`web-app-store`) — đăng nhập qua IDMS bằng OAuth/OIDC, mở khoá quản lý link per-user.

**Một câu**: dán link dài → nhận link ngắn + QR; sau này đăng nhập (qua IDMS) để quản lý link của mình.

---

## 2. Target Users & Roles

| Persona | Mô tả | Phase |
|---|---|---|
| Anonymous visitor | Ai cũng rút gọn link, không cần đăng nhập | P1 |
| Registered user (qua IDMS) | Đăng nhập qua IDMS → quản lý link của mình, xem analytics | P2+ |
| Admin | (defer) vận hành, moderation link abuse | P3+ |

---

## 3. Roadmap (phân phase)

| Phase | Nội dung | Auth |
|---|---|---|
| **P1 (build ngay)** | Public shortener: tạo short link + redirect + click counter + DB. UI hoàn chỉnh (form, copy, QR, local history). Ẩn danh. | ❌ |
| **P2 (sau)** | Tích hợp **OAuth/OIDC client của IDMS** → login. Link tạo khi đã login gắn `ownerId`. | ✅ qua IDMS |
| **P3 (sau)** | Quản lý per-user: dashboard "link của tôi", analytics chi tiết (geo/device/referrer), sửa/xoá, expiration, custom domain, admin moderation. | ✅ |

---

## 4. Goals & Non-Goals

### 4.1 Goals — Phase 1
- **G1 — Rút gọn**: `POST /api/links { url, customAlias? }` → sinh short code base62 (`nanoid`, ~7 ký tự) hoặc dùng `customAlias` nếu hợp lệ & chưa trùng. Validate URL (http/https, format). Trả `{ code, shortUrl }`.
- **G2 — Redirect**: `GET /:code` (BE đóng vai "short domain") → **302** về `originalUrl`; tăng `clickCount`; không thấy → 404.
- **G3 — Click counter**: đếm **tổng** lượt click mỗi lần redirect (chưa breakdown geo/device — đó là P3).
- **G4 — UI shorten**: trang chủ input URL → nút Shorten → hiện short URL + **Copy** + **QR code** (client-side).
- **G5 — Lịch sử cục bộ**: link vừa tạo lưu **localStorage** (vì ẩn danh) — list có copy / QR / mở / xoá-khỏi-history. Hiện `clickCount` (fetch theo code).

### 4.2 Non-Goals — Phase 1
- Auth / account (P2), lưu link theo user ở server (P2).
- Analytics chi tiết geo/device/referrer (P3), expiration, password-protected link, custom domain (P3).
- Sửa/xoá link ở server (P3 — P1 chỉ xoá khỏi local history).
- Không gộp thành Next.js/Nuxt fullstack — **giữ format monorepo `server/` + `client/` tách rời**.

---

## 5. Data model — Phase 1 (Prisma / PostgreSQL)

Model `Link`:
| Field | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid/cuid PK | |
| `code` | string **@unique**, indexed | short code hoặc customAlias |
| `originalUrl` | string | link gốc |
| `customAlias` | string? | null nếu auto-gen |
| `clickCount` | int @default(0) | tổng click |
| `createdAt` | datetime @default(now) | |
| `ownerId` | string? **(chuẩn bị P2, nullable)** | gắn user khi đã login |

Index chính: `@@unique([code])` cho lookup redirect nhanh.

---

## 6. Phase 1 — Functional Scope

### 6.1 BE (NestJS + Prisma + PostgreSQL)
| Endpoint | Mô tả |
|---|---|
| `POST /api/links` | Tạo short link. Body `{ url, customAlias? }`. Validate (class-validator + custom URL rule). Sinh code `nanoid` / dùng alias. 409 nếu alias trùng. |
| `GET /api/links/:code` | Lấy metadata 1 link (cho local history hiển thị clickCount). |
| `GET /:code` | Redirect 302 + increment `clickCount`. 404 nếu không tồn tại. |

- **Rate-limit**: `@nestjs/throttler` cho `POST /api/links` (chống abuse public).
- Module-struct theo skill BE (mượn từ match-cv NestJS).
- Test: Jest (unit service sinh-code + e2e endpoint).

### 6.2 FE (Vue 3 + Vuetify + Tailwind)
| Route | Nội dung |
|---|---|
| `/` (Home) | Form input URL (+ optional custom alias) → Shorten → result card (short URL + Copy + QR). |
| Local history section | List link đã tạo (localStorage): copy / QR / open / remove, hiện clickCount. |
| `/404` (redirect miss) | Trang "link không tồn tại" (khi BE 404). |

- State: **Pinia** (history store), server-state: **TanStack Query (Vue Query)**.
- Form + validate: **VeeValidate + Zod**. HTTP: **axios**. i18n: **vue-i18n** (EN/VI).
- QR: **qrcode**. UI: Vuetify component + Tailwind utility (phân vai rõ, xử lý preflight conflict).

### 6.3 E2E Scenario Matrix (Phase 1)
> Feature P1 đụng FE (UI mới) ⇒ bắt buộc có matrix (skill `e2e-scenario-coverage`, rubric 12 nhóm). **Sẽ hoàn thiện đầy đủ trong `writing-plans`** (mở rộng thành test). Sơ bộ các nhóm áp dụng: happy (shorten→copy→QR), validation (URL sai/empty/alias trùng — `[Decision Table]`/`[BVA]` độ dài alias), data-render (history list), i18n (en+vi), error-loading (BE 404 redirect miss, 409 alias), a11y (form label, focus). Nhóm authN/authZ/pagination/filter = **N/A ở P1** (chưa auth, list nhỏ local) — ghi rõ lý do trong matrix, không bỏ trống.

---

## 7. Bootstrap — cơ chế tạo skeleton (giống match-cv)

### 7.1 Cấu trúc thư mục
```
D:\Learn\web-app-shorten-link\
├── .claude/    → repo claude-architecture-shorten-link
├── docs/       → repo doc-web-app-shorten-link
├── server/     → repo api-web-app-shorten-link   (NestJS)
└── client/     → repo client-web-app-shorten-link (Vue)
```

### 7.2 GitHub repos mới (4)
| Folder | Repo name | Nguồn khởi tạo |
|---|---|---|
| `.claude` | `claude-architecture-shorten-link` | fork/copy `.claude` của store, sửa nội dung stack-specific |
| `docs` | `doc-web-app-shorten-link` | skeleton mới |
| `server` | `api-web-app-shorten-link` | NestJS scaffold mới (tham chiếu match-cv) |
| `client` | `client-web-app-shorten-link` | Vue+Vite scaffold mới |

### 7.3 `.claude/` — giữ gì / đổi gì
- **Giữ nguyên (generic)**: methodology superpowers flow, skills chung (`commit`, `creating-github-pr`, `e2e-scenario-coverage`, `superdesign`, `prompt-formatter`, `triage-lessons`), root `CLAUDE.md` (chỉ sửa tên repo/project + port).
- **Viết lại (stack-specific)**:
  - `techstack/backend.md` → NestJS + Prisma + PostgreSQL (mượn match-cv, chỉnh port `:5300`).
  - `techstack/frontend.md` → Vue 3 + Vuetify + Tailwind + Pinia + Vue Router + Vue Query + VeeValidate/Zod + vue-i18n + axios + Vite (port `:3300`).
  - `server/.claude/` skills → NestJS/Prisma (bỏ Express/Mongoose/JWT-store); **`client/.claude/` skills → Vue (bỏ React/Next/shadcn)** — viết mới `standard-vue`, `standard-vuetify`, `standard-tailwind` (giữ), `standard-typescript` (bản Vue).
  - `uiux/` → khởi tạo lại token/brand cho shorten-link (không kế thừa shadcn refs).
- **CLAUDE.md per-side**: cập nhật context-routing + bảng skills theo stack mới.

### 7.4 Ports & isolation
- Dev ports: **BE `:5300` / FE `:3300`** (tránh store `:5000/:3000`, match-cv `:5200`).
- **Isolation**: bootstrap = tạo repo mới ⇒ **không dùng git worktree của store** (worktree §6 áp cho feature TRONG 1 repo có sẵn). Initial scaffold commit vào `main` của mỗi repo mới (birth của repo). Feature P1 sau đó theo flow chuẩn (worktree per-repo trong repo mới).

---

## 8. Deliverables của brainstorm này (cho writing-plans)

1. **Task 1 — Bootstrap skeleton**: tạo folder + 4 repo git + GitHub remotes; fork/adapt `.claude`; scaffold NestJS `server/` + Vue `client/`; docs skeleton; ports 5300/3300; `.env.example` per-side.
2. **Task 2 — Author docs**: `docs/project-goals.md` (từ §1–§4) + `docs/erd.md` (§5) + `docs/specs/shorten-link-p1/design.md` (§5–§6) + E2E matrix đầy đủ.
3. **Step 1.5 — SuperDesign mock UI** (UI-first): dựng mock Home (form + result + QR + history) light+dark → **user duyệt** trước khi build FE.
4. **Task 3 — BE P1**: Prisma schema `Link` + module links (POST/GET/redirect) + throttler + tests.
5. **Task 4 — FE P1**: Vue app (Home + history + QR + copy) + i18n + Vue Query + Pinia.
6. **Task 5 — E2E dual-gate** (§4.3) + green checks + README + PR per-repo.

---

## 9. Open Questions (defer → quyết ở writing-plans / spec P2)
1. `nanoid` độ dài code (6 vs 7 vs 8) + charset (base62 default) → chốt ở P1 plan.
2. Redirect có cần Redis cache không, hay Postgres index đủ nhanh ở P1 → **defer, P1 dùng Postgres index (đủ), Redis là tối ưu P3**.
3. Cơ chế P2 OAuth client với IDMS (openid-client vs @nestjs/passport strategy) → **spec P2**.
4. Vuetify + Tailwind preflight conflict resolution cụ thể (tắt preflight vs scope) → chốt lúc scaffold FE.
5. Có cần trang xem stats public theo code (`/:code/stats`) ở P1 không → **defer**, P1 chỉ hiện clickCount trong history.
