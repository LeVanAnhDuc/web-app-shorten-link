# E2E — F1 · Rút gọn link

Kịch bản thực thi của matrix [`design.md` §8](./design.md#8-e2e-scenario-matrix). Gate A = Playwright
(`client/e2e/shorten-link/*.spec.ts`, Chromium, server thật + DB dev). Gate B = subagent lái trình duyệt
qua Playwright MCP. Server-side bổ sung: supertest (`server/test/links.e2e-spec.ts`, DB `shortenlink_test`).

**Cách chạy:** server worktree/checkout chạy ở `:5300` (`pnpm start:dev`), rồi `cd client && pnpm test:e2e`
(Playwright tự bật hoặc dùng lại Vite `:3300`).

## Kết quả

| Gate | Vòng 1 | Vòng 2 (sau sửa) |
| --- | --- | --- |
| A — Playwright | 26/26 ✅ | 33/33 ✅ |
| B — MCP walk | 8/9 ❌ (focus không về ô sau lỗi — `e2e-bugs.md` Round 1) | 7/7 ✅ (kiểm lại phần đã sửa) |
| Supertest (server) | 20/20 ✅ | 23/23 ✅ |

## Scenario → test

| Matrix | Scenario | Gate A (`shorten.spec.ts` / `shell.spec.ts`) | Gate B |
| --- | --- | --- | --- |
| 1 Happy | Shorten → vé (mã regex, link ngắn không `http://`, link gốc); Enter cũng submit; IDN + trim | `happy path` ×3 | ✅ |
| 4 Validation | Rỗng (0 request, `aria-invalid`, focus về ô); `example.com`, `ftp://`, `localhost`, `127.0.0.1`, `a..com`, `-.com`, userinfo; server 400 → lỗi dưới ô + focus, không snackbar | `validation` ×9 | ✅ |
| 4 Validation (server) | Lớp EP + IP literal + control chars + userinfo + malformed host + DR-5 self-host | supertest | — |
| 5 Empty | Lần đầu: chỉ điểm "No sign-up", không chữ QR/custom ending | `shell` | ✅ |
| 6 Boundary | 2048 nhận, 2049 từ chối không request (client); 2048 + khoảng trắng nhận (server) | `boundary`, supertest | — |
| 8 Rendering | Link gốc dài không tràn ngang ở 375px; có `title` đầy đủ | `i18n and rendering` ×2 | ✅ (cắt 3 dòng) |
| 9 i18n | VI cho lỗi/nút/vé; đổi ngôn ngữ khi đang có lỗi → lỗi đổi theo; reload giữ `vi` | `i18n and rendering`, `shell` | ✅ |
| 10 Error/loading | `abort()` → snackbar + giữ input + nút bấm lại được; 500 như trên; trễ 1s → nút loading; lỗi mạng lặp lại → snackbar hiện lại | `errors and loading` ×3, `keyboard` | — |
| 11 Mutation | Double-click → 1 request; cùng URL → 2 mã khác; submit hỏng giữ vé cũ | `mutation safety` ×3 | — |
| 12 A11y | Focus vùng kết quả + `#announcer`; tên nút Copy chứa mã; thứ tự Tab skip → ngôn ngữ → theme → ô → Shorten → Copy; skip link | `accessibility`, `keyboard`, `shell` | ✅ |
| 13 Copy | Clipboard = `http://localhost:5300/<code>`, nút "Copied", snackbar; clipboard bị chặn → "Couldn't copy" | `copy` ×2 | ✅ |
| 14 Theme | Theo hệ thống → đổi → reload giữ; `localStorage` bị chặn vẫn chạy | `shell` ×2 | ✅ (tương phản stub 8.76:1 / 9.88:1) |

## Ghi chú / follow-up

- **Nút Shorten khi đang chờ:** ở trạng thái loading nhưng **không** disabled (giữ focus cho người dùng bàn phím); lần bấm thứ hai bị chặn bởi guard trong `ShortenForm`. Matrix nhóm 10 đã sửa theo.
- **Font mono + cắt 3 dòng** (nhóm 8): chỉ gate B kiểm bằng mắt — không có assertion tự động cho font-family.
- **Vuetify 3.12 không tự đặt `aria-invalid`** — app tự bind; skill `standard-accessibility` đã sửa.
- **Chưa kiểm (ngoài F1):** redirect (F2), QR (F3), lịch sử (F4), alias (F5), rate limit (F6).
