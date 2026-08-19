# HANDOFF — web-app-shorten-link (resume brief)

> Đọc file này ĐẦU TIÊN khi mở Claude Code trong `D:\Learn\web-app-shorten-link`.
> Mục đích: nối tiếp công việc đã brainstorm + plan ở session cũ (project `web-app-store-server-client`, 2026-07-24) sang session mới tại project này.

## 1. Đang làm gì

Tạo project MỚI `web-app-shorten-link` = **URL shortener**, bằng cách **clone format làm việc** của `web-app-store-server-client` (giống tiền lệ `web-app-match-cv`) NHƯNG **đổi stack**. Clone format = mang `.claude` methodology + skills + docs skeleton + layout monorepo, KHÔNG copy code app.

## 2. Quyết định đã CHỐT (không cần hỏi lại)

- **Phạm vi template**: chỉ format (như match-cv). `server/`+`client/` là app mới, stack tự do.
- **Sản phẩm**: URL shortener public, UI-first.
  - **P1 (build ngay)**: shorten (`POST /api/links`) + redirect (`GET /:code` → 302) + **click counter (tổng)** + UI (form/copy/QR/local-history ẩn danh, localStorage). KHÔNG auth.
  - **P2 (sau)**: OAuth/OIDC **app vệ tinh của IDMS** (`web-app-store`) → login qua IDMS.
  - **P3 (sau)**: quản lý per-user + analytics chi tiết (geo/device), sửa/xoá, expiration...
- **Stack (chốt)**:
  - BE = **NestJS + Prisma 6 + PostgreSQL + @nestjs/throttler + nanoid** (yarn, Jest). Mượn techstack/skills BE từ `D:\Learn\web-app-match-cv`.
  - FE = **Vue 3 + Vite + TypeScript + Vuetify 3 + Tailwind v4 + Pinia + Vue Router + TanStack Vue Query + VeeValidate + Zod + vue-i18n + axios + qrcode + Playwright** (yarn).
- **Ports dev**: BE `:5300`, FE `:3300`.
- **DB name**: `shortenlink` (PostgreSQL local, không Docker).
- **4 repo git**: `.claude`→`claude-architecture-shorten-link`, `docs`→`doc-web-app-shorten-link`, `server`→`api-web-app-shorten-link`, `client`→`client-web-app-shorten-link`.
- **Data model P1**: bảng `Link` (id, code @unique, originalUrl, customAlias?, clickCount @default 0, createdAt, ownerId? nullable cho P2).
- **Isolation**: bootstrap KHÔNG dùng git worktree của store; scaffold commit đầu vào `main` mỗi repo mới. Feature P1 mới theo worktree per-repo.
- **Vuetify + Tailwind**: Tailwind lo utility/layout, Vuetify lo component; xử lý preflight conflict (tắt/scope) khi scaffold FE.

## 3. Trạng thái hiện tại

- ✅ Brainstorm xong → `design.md` (user đã duyệt).
- ✅ Plan xong → `plan.md` (Plan 1 = Bootstrap, 9 task). Đã self-review.
- ⬜ CHƯA build gì cả. Folder mới chỉ có `_bootstrap/` (3 file này).
- **Plan 2** (Phase 1 product: BE/FE/E2E, TDD) sẽ viết SAU khi Plan 1 xong (skeleton tồn tại) + UI được duyệt (Task 8).

## 4. Bước tiếp theo — resume thế nào

Trong Claude Code mở tại `D:\Learn\web-app-shorten-link`, gõ:

> "Đọc `_bootstrap/HANDOFF.md`, `_bootstrap/design.md`, `_bootstrap/plan.md`. Tiếp tục thực thi Plan 1 bằng `superpowers:subagent-driven-development` (hoặc `executing-plans`)."

Plan được viết cho engineer zero-context nên tự đủ để chạy. Lưu ý khi chạy:
- **Commit review gate BẬT mặc định** (store §7): trình diff cho user duyệt trước mỗi commit. (Nói "skip review" nếu muốn tự commit.)
- **Prerequisites**: Node+yarn; **PostgreSQL local đang chạy** (biết creds tạo DB `shortenlink`); GitHub token có scope tạo repo (chỉ cần Task 9).
- **Task 8** = gate duyệt UI (SuperDesign) — BLOCKING, chờ user duyệt light+dark.
- **Task 9** (tạo GitHub repo) = GATED, hỏi user trước (hành động ra ngoài). Có thể hoãn tới lúc tạo PR đầu.
- Các file planning trong `_bootstrap/` là tạm; nội dung sẽ được author vào docs thật ở **Task 7** (`docs/project-goals.md`, `docs/erd.md`, `docs/specs/shorten-link-p1/design.md`). Xoá `_bootstrap/` sau khi bootstrap xong nếu muốn.

## 5. Lưu ý về memory & chat history

- Memory `project_shorten_link_clone.md` (context project này) hiện nằm ở project CŨ: `C:\Users\User\.claude\projects\D--Learn-web-app-store-server-client\memory\`. Session mới (project khác) sẽ KHÔNG tự load memory đó — nhưng HANDOFF này đã chứa đủ. Nếu muốn memory theo project mới, tạo lại dưới `...\D--Learn-web-app-shorten-link\memory\`.
- Cách mang nguyên transcript chat cũ sang để `claude --resume`: xem mục hướng dẫn trong câu trả lời của session cũ (copy file `302acc6b-d81a-4ee6-8474-88797a83e448.jsonl` vào folder session của project mới).
