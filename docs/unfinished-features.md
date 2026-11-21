# Unfinished features

Lộ trình còn dở của Shorten Link. Đọc trước khi bắt đầu một feature; cập nhật trong cùng PR với feature.

## Phase 1 — chia thành 6 feature cắt dọc (chốt 2026-11-21)

Mỗi feature đi trọn DB → API → UI để user bấm thử trên app thật trước khi sang feature kế. Thứ tự là
thứ tự làm. Phạm vi gốc: [`project-goals.md`](./project-goals.md) §4 (G1–G5) + §6 NFR.

| # | Feature | Phía | Goal | Mock | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| F1 | **Rút gọn link** + nền (theme, font, i18n, khung trang, model `Link`) | BE + FE | G1, G4 (phần form + Copy) | ✅ [`ui-designs/shorten-link/home.html`](./ui-designs/shorten-link/home.html) | 🟡 đang làm — [`specs/shorten-link/`](./specs/shorten-link/design.md) |
| F2 | **Redirect + đếm click + trang 404**, nút Open trên vé | BE (+ FE 404) | G2, G3 | — (xem trên app) | ⚪ |
| F3 | **Mã QR** trên vé, tải PNG | FE | G4 (QR) | — | ⚪ |
| F4 | **Lịch sử trên trình duyệt**: danh sách, số click, xoá + hoàn tác | FE + BE (`GET /api/links/:code`) | G5 | cần mock | ⚪ |
| F5 | **Đuôi tuỳ chọn**: alias, từ dành riêng, `409` | BE + FE | G1 (alias) | — | ⚪ |
| F6 | **Chống spam**: rate limit, thông báo `429` | BE + FE | NFR rate limit | — | ⚪ |

Ký hiệu: ⚪ chưa bắt đầu · 🟡 đang làm · ✅ đã merge.
