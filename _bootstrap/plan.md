# web-app-shorten-link — Bootstrap Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng monorepo trống `web-app-shorten-link` đúng cấu hình (format-clone của store, stack mới NestJS+Prisma+PG / Vue3+Vuetify+Tailwind), author docs source-of-truth, và trình mock UI cho user duyệt — sẵn sàng cho Plan 2 (Phase 1 product).

**Architecture:** Monorepo 4 repo git độc lập (`.claude`, `docs`, `server`, `client`) tại `D:\Learn\web-app-shorten-link\`. `server/` = NestJS + Prisma + PostgreSQL; `client/` = Vue 3 + Vite + Vuetify + Tailwind. `.claude/` fork từ store, viết lại phần stack-specific. Bootstrap khởi tạo git LOCAL trước; GitHub remote là task cuối, gated theo xác nhận user.

**Tech Stack:** NestJS + Prisma 6 + PostgreSQL + @nestjs/throttler + nanoid (BE, pnpm, Jest) · Vue 3 + Vite + TypeScript + Vuetify 3 + Tailwind v4 + Pinia + Vue Router + TanStack Vue Query + VeeValidate + Zod + vue-i18n + axios + qrcode + Playwright (FE, pnpm).

## Global Constraints

- **Ports dev**: BE `:5300`, FE `:3300` (tránh store `:5000/:3000`, match-cv `:5200`). Verbatim mọi config.
- **Package manager**: `pnpm` (đồng bộ store/match-cv). Chốt tháng 8 là `yarn`; cả workspace chuyển sang pnpm ngày 13.09.2026.
- **Không copy code app từ store** — chỉ clone format (`.claude` methodology + skills + docs skeleton + layout).
- **Không dùng git worktree của store** — bootstrap tạo repo mới; scaffold commit đầu vào `main` mỗi repo mới. Feature P1 (Plan 2) mới theo worktree per-repo.
- **Không commit secret**: `.env` gitignored; chỉ commit `.env.example` (key + placeholder).
- **Commit review gate (store §7)**: mặc định trình diff/summary cho user duyệt TRƯỚC mỗi commit (trừ khi user opt-out).
- **PostgreSQL local** (không Docker, như match-cv). DB name: `shortenlink`.

## Prerequisites (verify trước Task 1)

- Node.js LTS + `pnpm` có sẵn (`node -v`, `pnpm -v`).
- PostgreSQL chạy local, biết superuser creds để tạo DB `shortenlink`.
- GitHub account `LeVanAnhDuc` + GitHub MCP token có scope tạo repo (chỉ cần ở Task 9).

---

### Task 1: Folder structure + local git init (4 repo)

**Files:**
- Create: `D:\Learn\web-app-shorten-link\{.claude,docs,server,client}\` (folders)
- Create: `D:\Learn\web-app-shorten-link\.gitignore` KHÔNG cần (root không phải repo — như store)

**Interfaces:**
- Produces: 4 thư mục con, mỗi thư mục là 1 git repo local trên branch `main`.

- [ ] **Step 1: Tạo cây thư mục**

```bash
mkdir -p "D:/Learn/web-app-shorten-link/.claude" \
         "D:/Learn/web-app-shorten-link/docs" \
         "D:/Learn/web-app-shorten-link/server" \
         "D:/Learn/web-app-shorten-link/client"
```

- [ ] **Step 2: Git init từng repo trên branch main**

```bash
for r in .claude docs server client; do
  git -C "D:/Learn/web-app-shorten-link/$r" init -b main
done
```

- [ ] **Step 3: Verify**

Run: `for r in .claude docs server client; do git -C "D:/Learn/web-app-shorten-link/$r" branch --show-current; done`
Expected: in ra `main` 4 lần.

- [ ] **Step 4: Commit** — hoãn: mỗi repo commit ở task tương ứng khi có nội dung. (Repo trống chưa commit.)

---

### Task 2: Scaffold NestJS `server/`

**Files:**
- Create: toàn bộ scaffold NestJS trong `server/` (do `nest new` sinh)
- Modify: `server/package.json` (name, script `start:dev` port)
- Create: `server/.gitignore` (nest default có sẵn)

**Interfaces:**
- Produces: NestJS app build được (`pnpm build`), chạy dev được, lắng nghe port `5300`.

- [ ] **Step 1: Scaffold Nest vào thư mục có sẵn**

```bash
cd "D:/Learn/web-app-shorten-link"
pnpm dlx @nestjs/cli@latest new server --package-manager pnpm --skip-git --directory server
```
(Nếu CLI từ chối thư mục không rỗng: scaffold ra temp rồi copy nội dung vào `server/`.)

- [ ] **Step 2: Set port 5300**

Modify `server/src/main.ts`: `await app.listen(process.env.PORT ?? 5300);`

- [ ] **Step 3: Verify build**

Run: `cd "D:/Learn/web-app-shorten-link/server" && pnpm build`
Expected: build thành công, sinh `dist/`.

- [ ] **Step 4: Verify run**

Run: `cd "D:/Learn/web-app-shorten-link/server" && pnpm start:dev` (chạy nền, kiểm port 5300 listen rồi tắt)
Expected: Nest khởi động, log "Nest application successfully started" trên `:5300`.

- [ ] **Step 5: Commit** (sau khi user duyệt diff)

```bash
git -C "D:/Learn/web-app-shorten-link/server" add -A
git -C "D:/Learn/web-app-shorten-link/server" commit -m "chore: scaffold NestJS server on port 5300"
```

---

### Task 3: Prisma + PostgreSQL vào `server/`

**Files:**
- Create: `server/prisma/schema.prisma` (empty datasource + Link model placeholder-free tối thiểu chưa cần — chỉ datasource/generator + model Link để migrate lần đầu)
- Create: `server/.env.example`, `server/.env` (gitignored)
- Modify: `server/package.json` (thêm deps)

**Interfaces:**
- Produces: kết nối Postgres `shortenlink`, `pnpm exec prisma migrate` chạy được. (Model `Link` đầy đủ để lại cho Plan 2; ở đây chỉ khởi tạo Prisma + 1 migration khởi đầu tối thiểu.)

- [ ] **Step 1: Cài Prisma + client**

```bash
cd "D:/Learn/web-app-shorten-link/server"
pnpm add @prisma/client && pnpm add -D prisma
pnpm exec prisma init --datasource-provider postgresql
```

- [ ] **Step 2: `.env.example` + `.env`**

`server/.env.example`:
```
PORT=5300
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/shortenlink?schema=public"
```
Copy `.env.example` → `.env`, điền creds thật local.

- [ ] **Step 3: Tạo DB `shortenlink`**

Run: `psql -U postgres -c "CREATE DATABASE shortenlink;"` (hoặc creclient tương đương)
Expected: `CREATE DATABASE`.

- [ ] **Step 4: Migration khởi đầu (schema tối thiểu)**

`server/prisma/schema.prisma` — giữ generator+datasource mặc định, chưa thêm model (model `Link` để Plan 2 định nghĩa cùng test). Chạy:
Run: `pnpm exec prisma migrate dev --name init`
Expected: tạo migration + `Prisma schema loaded`, DB sync (empty schema hợp lệ).

- [ ] **Step 5: Verify `.env` gitignored**

Run: `git -C "D:/Learn/web-app-shorten-link/server" check-ignore .env`
Expected: in ra `.env`.

- [ ] **Step 6: Commit** (sau duyệt)

```bash
git -C "D:/Learn/web-app-shorten-link/server" add -A
git -C "D:/Learn/web-app-shorten-link/server" commit -m "chore: add Prisma + PostgreSQL wiring (db: shortenlink)"
```

---

### Task 4: Scaffold Vue `client/`

**Files:**
- Create: toàn bộ scaffold Vue trong `client/` (do create-vue sinh)
- Modify: `client/vite.config.ts` (dev server port 3300)

**Interfaces:**
- Produces: Vue 3 app (TS + Router + Pinia + ESLint + Playwright) build & dev được trên `:3300`.

- [ ] **Step 1: Scaffold Vue**

```bash
cd "D:/Learn/web-app-shorten-link"
pnpm create vue@latest client --ts --router --pinia --eslint --playwright
```
(create-vue tôn trọng thư mục có sẵn nếu rỗng; nếu không, scaffold temp rồi copy.)

- [ ] **Step 2: Install + set port 3300**

Modify `client/vite.config.ts`: thêm `server: { port: 3300 }` vào defineConfig.
Run: `cd "D:/Learn/web-app-shorten-link/client" && pnpm install`

- [ ] **Step 3: Verify build**

Run: `cd "D:/Learn/web-app-shorten-link/client" && pnpm build`
Expected: build thành công, sinh `dist/`.

- [ ] **Step 4: Verify dev run**

Run: `pnpm dev` (nền, kiểm `:3300` listen rồi tắt)
Expected: Vite log `Local: http://localhost:3300/`.

- [ ] **Step 5: Commit** (sau duyệt)

```bash
git -C "D:/Learn/web-app-shorten-link/client" add -A
git -C "D:/Learn/web-app-shorten-link/client" commit -m "chore: scaffold Vue 3 client on port 3300"
```

---

### Task 5: FE libs (Vuetify + Tailwind + Vue Query + VeeValidate/Zod + vue-i18n + axios + qrcode)

**Files:**
- Modify: `client/package.json`, `client/src/main.ts`, `client/vite.config.ts`
- Create: `client/tailwind.config.js`, `client/postcss.config.js`, `client/src/plugins/vuetify.ts`, `client/src/plugins/i18n.ts`, `client/src/plugins/vue-query.ts`, `client/src/assets/tailwind.css`
- Create: `client/.env.example` (`VITE_API_BASE_URL=http://localhost:5300`)

**Interfaces:**
- Produces: app khởi tạo được với Vuetify + Tailwind cùng chạy (không xung đột preflight), Vue Query + i18n + axios sẵn sàng.

- [ ] **Step 1: Cài deps**

```bash
cd "D:/Learn/web-app-shorten-link/client"
pnpm add vuetify @mdi/font @tanstack/vue-query vee-validate zod @vee-validate/zod vue-i18n axios qrcode
pnpm add -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Tailwind v4 qua Vite plugin**

`vite.config.ts`: thêm `@tailwindcss/vite` plugin. `src/assets/tailwind.css`: `@import "tailwindcss";`. Import css trong `main.ts`.
**Xử lý preflight-vs-Vuetify**: dùng Tailwind cho utility/layout; Vuetify cho component. Nếu reset xung đột → scope Tailwind preflight (ghi rõ cách chọn vào techstack Task 6).

- [ ] **Step 3: Register plugins trong `main.ts`**

Vuetify (`createVuetify`), Vue Query (`VueQueryPlugin`), i18n (`createI18n` với `en`/`vi` messages skeleton), Pinia, Router — theo thứ tự `app.use(...)`.

- [ ] **Step 4: `.env.example`**

`client/.env.example`: `VITE_API_BASE_URL=http://localhost:5300`. Copy → `.env` (gitignored).

- [ ] **Step 5: Verify dev run không lỗi console**

Run: `pnpm dev` → mở `:3300`, kiểm không có lỗi import/plugin trong console; render 1 Vuetify component test (vd `<v-btn>`).
Expected: trang render, Vuetify style áp dụng, không lỗi.

- [ ] **Step 6: Commit** (sau duyệt)

```bash
git -C "D:/Learn/web-app-shorten-link/client" add -A
git -C "D:/Learn/web-app-shorten-link/client" commit -m "chore: wire Vuetify, Tailwind, Vue Query, VeeValidate/Zod, vue-i18n, axios"
```

---

### Task 6: `.claude/` fork + adapt cho stack mới

**Files:**
- Create (copy từ store): `.claude/{CLAUDE.md,skills/,techstack/,uiux/,agents/,scripts/,settings.local.json,.gitignore}`
- Rewrite: `.claude/techstack/backend.md` (Nest+Prisma+PG, port 5300), `.claude/techstack/frontend.md` (Vue stack, port 3300)
- Rewrite: `.claude/CLAUDE.md` (tên project/repo, port, bỏ IDMS-specific)
- Create: `server/.claude/CLAUDE.md` + skills BE (NestJS/Prisma — mượn match-cv), `client/.claude/CLAUDE.md` + skills FE Vue (`standard-vue`, `standard-vuetify`, giữ `standard-tailwind`, `standard-typescript` bản Vue)
- Rewrite: `.claude/uiux/*` (reset brand token, bỏ shadcn refs)

**Interfaces:**
- Produces: bộ `.claude` khớp stack mới; context-routing + bảng skills đúng NestJS/Vue.

- [ ] **Step 1: Copy `.claude` gốc từ store**

```bash
cp -r "D:/Learn/web-app-store-server-client/.claude/." "D:/Learn/web-app-shorten-link/.claude/"
rm -rf "D:/Learn/web-app-shorten-link/.claude/.git"
git -C "D:/Learn/web-app-shorten-link/.claude" init -b main
```
Xoá `lesson.md` nội dung cũ, `.lesson-state`, techstack/uiux sẽ rewrite.

- [ ] **Step 2: Rewrite `techstack/backend.md`** — NestJS + Prisma 6 + PostgreSQL + @nestjs/throttler + nanoid, port `:5300`. (Tham chiếu `D:/Learn/web-app-match-cv/.claude/techstack/backend.md` làm mẫu Nest.)

- [ ] **Step 3: Rewrite `techstack/frontend.md`** — Vue 3 + Vite + Vuetify + Tailwind v4 + Pinia + Vue Router + Vue Query + VeeValidate/Zod + vue-i18n + axios + qrcode + Playwright, port `:3300`, note preflight resolution.

- [ ] **Step 4: Rewrite root `.claude/CLAUDE.md`** — đổi tên project → `web-app-shorten-link`, repo names (§7.2 design), ports; giữ nguyên methodology/flow (superpowers, worktree, e2e dual-gate, security review, drift audit, commit gate). Gỡ nội dung IDMS-đặc-thù không áp dụng.

- [ ] **Step 5: BE per-side** — `server/.claude/CLAUDE.md` + skills NestJS/Prisma (module-struct, standard-typescript Node, standard-security, standard-restful-api; bỏ Express/Mongoose/JWT-store). Mượn từ match-cv `server/.claude` nếu có; nếu match-cv không có per-side thì viết mới tối thiểu.

- [ ] **Step 6: FE per-side (Vue)** — `client/.claude/CLAUDE.md` + skills: `standard-vue` (Composition API, `<script setup>`, component boundaries), `standard-vuetify` (+ Tailwind division, preflight), `standard-tailwind` (giữ), `standard-typescript` (bản Vue), `standard-accessibility` (giữ generic), bỏ `standard-react`/`standard-nextjs`/`standard-shadcn`. **Đảm bảo `client/.claude` KHÔNG bị gitignore** (store bị — kiểm `client/.gitignore` + `.git/info/exclude`).

- [ ] **Step 7: Reset `uiux/`** — token/brand khởi đầu cho shorten-link, bỏ mọi shadcn reference; `icon-map.md` map sang `@mdi` (Vuetify) hoặc lucide tuỳ chọn; `ux-copy.md` giữ pattern EN+VI.

- [ ] **Step 8: Verify** — đọc lại `.claude/CLAUDE.md` không còn "IDMS/store/Express/Next/shadcn" lạc; `client/.claude` được git track.

Run: `git -C "D:/Learn/web-app-shorten-link/client" check-ignore client/.claude || echo "TRACKED OK"`
Expected: `TRACKED OK`.

- [ ] **Step 9: Commit** (sau duyệt) — commit `.claude` repo + phần `server/.claude`, `client/.claude` (vào repo server/client tương ứng).

---

### Task 7: Author `docs/` source-of-truth

**Files:**
- Create: `docs/project-goals.md` (từ design §1–§4), `docs/erd.md` (§5), `docs/specs/shorten-link-p1/design.md` (§5–§6 + E2E matrix đầy đủ), `docs/adr/` (rỗng + README), `docs/ui-designs/` (rỗng), `docs/.superdesign/{design-system.md,replica_html_template/}`, `docs/.claude/CLAUDE.md` (adapt từ store docs rules), `docs/.gitignore`

**Interfaces:**
- Produces: docs source-of-truth cho project + config SuperDesign strict-theme.

- [ ] **Step 1: `project-goals.md`** — port §1–§4 design (Identity/Vision, Roles, Roadmap P1-P3, Goals/Non-Goals) theo format store's project-goals.md; Tech Stack section = stack đã chốt; Roadmap P1..P3.

- [ ] **Step 2: `erd.md`** — model `Link` (§5 design): code unique, originalUrl, customAlias?, clickCount, createdAt, ownerId? (P2). Note: source-of-truth sync tay với Prisma schema.

- [ ] **Step 3: `specs/shorten-link-p1/design.md`** — copy design §5–§6 (functional scope BE/FE) + **E2E Scenario Matrix đầy đủ** qua skill `e2e-scenario-coverage` (12 nhóm, mỗi nhóm ✅ scenario hoặc N/A có lý do; nhóm authN/authZ/pagination = N/A vì P1 ẩn danh + history local).

- [ ] **Step 4: `.superdesign/design-system.md`** — strict-theme boilerplate cho Vue/Vuetify (token brand shorten-link, cấm palette generic + Google Font). `replica_html_template/` để trống ban đầu (chưa có UI thật).

- [ ] **Step 5: `docs/.claude/CLAUDE.md`** — adapt rules docs từ store (project-goals/erd/specs/ui-designs), bỏ `.pen` (Pencil retired → SuperDesign HTML).

- [ ] **Step 6: Verify** — không placeholder treo; ERD ↔ dự kiến Prisma schema nhất quán.

- [ ] **Step 7: Commit** (sau duyệt)

```bash
git -C "D:/Learn/web-app-shorten-link/docs" add -A
git -C "D:/Learn/web-app-shorten-link/docs" commit -m "docs: add project-goals, erd, P1 spec + E2E matrix, superdesign config"
```

---

### Task 8: SuperDesign mock UI — Home (BLOCKING user approval gate)

**Files:**
- Create: `docs/ui-designs/shorten-link-p1/home.html` (light+dark) qua SuperDesign export

**Interfaces:**
- Produces: mock HTML UI Home cho user duyệt trước khi build FE (Plan 2). KHÔNG viết FE code ở đây.

- [ ] **Step 1: SuperDesign create-project + draft** — dùng CLI DIRECT (skip `init`), feed `docs/.superdesign/design-system.md` (strict). Prompt dựng Home: input URL + optional custom alias, nút Shorten, result card (short URL + Copy + QR), local-history list (copy/QR/open/remove + clickCount). LUÔN xuất **light + dark**.

- [ ] **Step 2: Export** — `get-design --output docs/ui-designs/shorten-link-p1/home.html`.

- [ ] **Step 3: Trình user duyệt (BLOCKING)** — mở preview (previewUrl hoặc HTML export, cả light+dark). Đợi user duyệt. Sửa qua `iterate-design-draft` đến khi duyệt. **KHÔNG tự quyết UI ổn.**

- [ ] **Step 4: Commit** (sau duyệt UI)

```bash
git -C "D:/Learn/web-app-shorten-link/docs" add -A
git -C "D:/Learn/web-app-shorten-link/docs" commit -m "design: Home mock UI (light+dark) for shorten-link P1"
```

---

### Task 9: GitHub remotes + push (GATED — cần user xác nhận outward-facing)

**Files:** none (git remote ops)

**Interfaces:**
- Produces: 4 GitHub repo + push `main`. **Chỉ chạy khi user xác nhận** (tạo repo trên account là hành động ra ngoài).

- [ ] **Step 1: Xác nhận với user** — có tạo 4 repo GitHub ngay không, hay để dành lúc tạo PR đầu (skill `creating-github-pr`)? Nếu hoãn → dừng, skeleton local đã đủ để sang Plan 2.

- [ ] **Step 2: Tạo repo (nếu đồng ý)** — qua GitHub MCP `create_repository`: `claude-architecture-shorten-link`, `doc-web-app-shorten-link`, `api-web-app-shorten-link`, `client-web-app-shorten-link` (private, không auto-init README để tránh xung đột).

- [ ] **Step 3: Add remote + push**

```bash
git -C "<repo>" remote add origin <url>
git -C "<repo>" push -u origin main
```
(lặp 4 repo)

- [ ] **Step 4: Verify** — `git -C <repo> remote -v` + branch trên GitHub tồn tại.

---

## Self-Review

**1. Spec coverage** — design §7 (bootstrap) → Task 1-7,9; §8 deliverables 1-3 → Task 1-8 (deliverables 4-6 BE/FE/E2E = **Plan 2**, chủ đích tách); §5-6 (P1 functional) → author vào docs Task 7 (implement ở Plan 2); step 1.5 SuperDesign → Task 8. ✅ Không gap cho phạm vi Bootstrap.

**2. Placeholder scan** — Task 3 cố ý để model `Link` đầy đủ cho Plan 2 (kèm test TDD); ở Bootstrap chỉ init Prisma + empty migration → KHÔNG phải placeholder ẩn, là ranh giới plan rõ ràng. Không có TBD/TODO treo khác.

**3. Type consistency** — Bootstrap không định nghĩa type/function feature (đó là Plan 2). Ports (5300/3300), tên repo, DB name (`shortenlink`) nhất quán xuyên suốt. ✅

**Ghi chú thực thi**: scaffolding không TDD (không viết failing test cho `nest new`); dùng verification (build/run) + commit per task. TDD bắt đầu ở Plan 2 (feature code).
