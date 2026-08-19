# ADR — Architecture Decision Records

Thư mục này lưu **Architecture Decision Records** cho `web-app-shorten-link` — mỗi file ghi lại **1 quyết định kiến trúc** đủ quan trọng để cần lý giải lâu dài (không phải mọi quyết định nhỏ trong `specs/*/design.md`).

## Khi nào tạo 1 ADR mới

Tạo ADR khi quyết định:
- Đi ngược lại pattern mặc định của stack (vd: patch 1 thư viện, chọn cơ chế khác với convention chuẩn của NestJS/Vue).
- Ảnh hưởng nhiều feature/module về sau, khó đảo ngược, hoặc từng gây tranh cãi/nhầm lẫn cần chốt lại bằng văn bản.
- Chọn giữa ≥2 phương án kỹ thuật có đánh đổi rõ ràng (vd: cơ chế cache redirect, lib OAuth client cho P2, chiến lược migrate schema).

**Không cần ADR** cho quyết định cục bộ trong 1 feature — những quyết định đó ghi trong bảng "Decision Records" (`DR-n`) ở `specs/<feature-name>/design.md` là đủ. ADR dành cho quyết định ở tầm **kiến trúc dự án**, không riêng 1 feature.

## Quy ước đặt tên & định dạng

- File: `NNNN-slug-ngan-gon.md` (số thứ tự 4 chữ số, tăng dần — vd `0001-redirect-cache-strategy.md`).
- Mỗi file gồm: `Status` (Proposed / Accepted / Superseded), `Date`, `Context`, `Decision`, `Consequences`.

## Trạng thái hiện tại

Chưa có ADR nào — dự án đang ở giai đoạn bootstrap (docs source-of-truth, chưa build P1). ADR đầu tiên sẽ được thêm khi có quyết định kiến trúc thực tế cần ghi lại trong quá trình implement P1 trở đi.
