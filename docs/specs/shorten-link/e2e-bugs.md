# E2E bugs — F1 · Rút gọn link

Append-only. Một mục cho mỗi vòng dual-gate fail (`.claude/CLAUDE.md` §5).

## Round 1 — 2026-11-21

- **Gate fail:** B (gate A 26/26 pass)
- **Scenario:** matrix §8 nhóm 12 (Accessibility) + design §6 "Lỗi validate client → hiện dưới ô, focus về ô"
- **Triệu chứng:** bấm **Shorten** khi ô trống → lỗi "Paste a link to shorten." hiện đúng, `aria-invalid="true"`, không gửi request; nhưng focus **ở lại nút Shorten**, không quay về ô URL. Submit bằng Enter thì không lộ ra (focus vốn đã ở ô).
- **Root cause:** `handleSubmit` của VeeValidate chỉ gọi handler khi hợp lệ; khi không hợp lệ nó không chạm tới focus, và `ShortenForm` chưa truyền callback `onInvalidSubmit`. Test gate A chỉ assert text lỗi + `aria-invalid`, không assert focus.
- **Fix đã làm:** `client/src/components/ShortenForm.vue` — `handleSubmit(onValid, onInvalid)` với `onInvalid` focus `v-text-field` qua template ref; cùng nhánh 400 từ server cũng focus về ô. Thêm assertion `toBeFocused()` vào `e2e/shorten-link/shorten.spec.ts` (validation rỗng, URL sai, server 400).
- **Kết quả re-verify:** xem mục "Re-verify" bên dưới.

### Re-verify (Round 1) — 2026-11-21

- **Gate A:** 33/33 ✅ (thêm assertion `toBeFocused()` cho rỗng, URL sai, server 400; thêm test thứ tự Tab, lỗi mạng lặp lại, đổi ngôn ngữ khi đang lỗi, `title` link gốc).
- **Gate B:** 7/7 ✅ — bấm chuột Shorten khi rỗng → focus ở ô URL, `aria-invalid="true"`, không request; `http://a..com` và `https://google.com@evil.tk` bị chặn ở client; viền ô khi focus là `rgb(35, 48, 107)` (primary); cảnh báo `[Vuetify UPGRADE] theme.global.name.value` đã hết, 0 lỗi/0 cảnh báo console; VI cũng đúng.
- **Kết luận:** dual-gate PASS sau 1 vòng sửa.
