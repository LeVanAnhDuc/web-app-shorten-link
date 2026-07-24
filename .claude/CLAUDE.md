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

## 3. `ui-designs/` — Thiết kế UX (mock đã duyệt)

- Mỗi feature FE mới sẽ có 1 folder con `ui-designs/<feature-name>/` chứa các file `.html` là mock **đã được user duyệt** (xuất ra từ workflow SuperDesign — xem mục 5) — đây là bản chốt cuối cùng để đối chiếu, KHÔNG phải bản nháp đang iterate.
- File `.html` mock có thể đọc/xem trực tiếp bằng Read/browser — không mã hoá (khác Pencil `.pen` cũ, đã retired — dự án này không dùng Pencil).
- Source-of-truth cho UI/UX của feature FE đã chốt. Khi code `client/src/**` đụng màn hình tương ứng → đối chiếu design ở đây trước.
- Drift giữa design đã duyệt và code FE → flag trong `brainstorming` / `requesting-code-review`, không tự suy diễn layout.
- Hiện tại (bootstrap) folder này còn trống — mock đầu tiên (Home: form + result + QR + history) sẽ được thêm ở task kế tiếp, trước khi build FE P1.

## 4. `specs/` — Tài liệu feature (per-feature)

- `specs/<feature-name>/` chứa toàn bộ tài liệu 1 feature: `design.md` (brainstorm, gồm cả E2E Scenario Matrix — skill `e2e-scenario-coverage`) + `plan.md` + `security-report.md` (khi cần) + `e2e.md` (khi có E2E) + `e2e-bugs.md` (khi dual-gate fail).
- Source-of-truth cho scope/flow từng feature; mọi feature mới tạo folder ở đây.
- Feature đầu tiên: `specs/shorten-link-p1/` (Phase 1 — public anonymous shortener).
- Chi tiết lifecycle artifact xem root `.claude/CLAUDE.md` §1, §5, §6.2.

## 5. `.superdesign/` — Design system + mock generation (thay thế Pencil)

- `design-system.md` — token brand STRICT (màu OKLCH, radius, shadow, icon set `mdi:`, typography, component recipe) mà mọi mock HTML do SuperDesign sinh ra **PHẢI** tuân theo. Đây là design tool duy nhất của dự án — **Pencil (`.pen`) đã retired, không dùng lại**.
- `replica_html_template/` — các fragment HTML tái sử dụng (header, v.v.) để SuperDesign tái tạo layout hiện có một cách trung thực trước khi thêm mới. Hiện trống (chưa có UI thật để trích xuất — sẽ có sau khi FE P1 build xong 1 lần).
- Quy trình: mock nháp sinh ra trong dự án SuperDesign riêng (không lưu trong `docs/`) → khi user duyệt bản cuối, xuất `.html` vào `docs/ui-designs/<feature-name>/` (mục 3) làm source-of-truth chốt.
- Đọc `design-system.md` trước khi tạo/duyệt bất kỳ mock nào (skill `superdesign`) — mock lệch token (màu generic indigo/slate/sky, Google Font, `rounded-2xl` tràn lan...) bị reject.

## 6. `.gitignore`

- Repo `docs/` chỉ ignore rác hệ điều hành/editor và `.worktrees/` (artifact của git worktree khi làm feature theo flow §6 root `.claude/CLAUDE.md`) — KHÔNG ignore bất kỳ nội dung tài liệu nào (`project-goals.md`, `erd.md`, `specs/`, `ui-designs/`, `.superdesign/`, `adr/` luôn được commit).

## 7. `adr/` — Architecture Decision Records

- Quyết định kiến trúc tầm dự án (không riêng 1 feature) — xem `adr/README.md` cho quy ước đặt tên và khi nào cần tạo ADR mới.
- Quyết định cục bộ trong 1 feature ghi ở bảng "Decision Records" (`DR-n`) trong `specs/<feature-name>/design.md` — không cần ADR riêng.
