# Rules — docs/

Folder `docs/` chứa tài liệu source-of-truth cho `web-app-shorten-link`, chia làm các nhóm sau:

## 1. `project-goals.md` — Định vị + scope

- Single source of truth về Identity/Vision/Roles/Roadmap/Goals/Non-Goals/Tech Stack của dự án.
- Mọi feature mới phải đối chiếu `## 4. Goals` và `## 5. Non-Goals` **trước khi** vào `superpowers:brainstorming`.
- Xung đột với goals → cập nhật `project-goals.md` qua PR có review của owner. KHÔNG tự suy diễn trong feature spec.
- Đọc file này khi feature liên quan đến định vị / scope / non-goals / phase (P1 vs P2 vs P3) — giai đoạn `brainstorming`.

## 2. `erd.md` — Data model

- Schema PostgreSQL (Prisma) chính cho `web-app-shorten-link` (P1: model `Link`).
- Source-of-truth: file ERD. Sync **TAY** với `server/prisma/schema.prisma`.
- Drift giữa ERD và schema code:
  - Code mới hơn ERD → developer update ERD trong cùng commit/PR.
  - ERD mới hơn code → là spec chưa implement → flag trong `writing-plans`.
- Khi thiết kế/mở rộng data model (giai đoạn `brainstorming` / `writing-plans`) đọc ERD trước. Phát hiện thiếu field/bảng → đề xuất update ERD qua Decision Record (DR) trong design doc / plan.

## 3. `design-system/` + `ui-designs/` — Thiết kế UX

- `design-system/shorten-link/` — design system dự án, sinh bởi plugin `ui-ux-pro-max` + `frontend-design`: token ở `MASTER.md`, icon ở `icon-map.md`, câu chữ EN/VI ở `ux-copy.md`, override theo trang ở `pages/<page>.md` (khi có). Sinh ngày 2026-11-21 (concept "claim ticket" — quyết định ở `adr/0001-design-system-bootstrap.md`). Đọc `MASTER.md` trước khi tạo/duyệt bất kỳ mock nào; mock lệch token bị reject.
- `ui-designs/<feature-name>/` — các file `.html` là mock **đã được user duyệt** (light + dark) — bản chốt để đối chiếu, KHÔNG phải bản nháp đang iterate. Hiện chưa có mock nào.
- Khi code `client/src/**` đụng màn hình tương ứng → đối chiếu design ở đây trước. Drift giữa design đã duyệt và code FE → flag trong `brainstorming` / `requesting-code-review`, không tự suy diễn layout.

## 4. `specs/` — Tài liệu feature (per-feature)

- `specs/<feature-name>/` chứa toàn bộ tài liệu 1 feature: `design.md` (brainstorm, gồm cả E2E Scenario Matrix — skill `e2e-scenario-coverage`) + `plan.md` + `security-report.md` (khi cần) + `e2e.md` (khi có E2E) + `e2e-bugs.md` (khi dual-gate fail).
- Source-of-truth cho scope/flow từng feature; mọi feature mới tạo folder ở đây.
- Hiện trống — spec Phase 1 cũ (`specs/shorten-link-p1/`) đã xoá 2026-11-21, sẽ viết lại qua `brainstorming` sau khi design lại.
- Chi tiết lifecycle artifact xem root `.claude/CLAUDE.md` §1, §5, §6.2.

## 5. `.gitignore`

- `docs/.gitignore` chỉ ignore rác hệ điều hành/editor và `.worktrees/` (artifact của git worktree khi làm feature theo flow §6 root `.claude/CLAUDE.md`) — KHÔNG ignore bất kỳ nội dung tài liệu nào (`project-goals.md`, `erd.md`, `specs/`, `design-system/`, `ui-designs/`, `adr/` luôn được commit).

## 6. `adr/` — Architecture Decision Records

- Quyết định kiến trúc tầm dự án (không riêng 1 feature) — xem `adr/README.md` cho quy ước đặt tên và khi nào cần tạo ADR mới.
- Quyết định cục bộ trong 1 feature ghi ở bảng "Decision Records" (`DR-n`) trong `specs/<feature-name>/design.md` — không cần ADR riêng.
