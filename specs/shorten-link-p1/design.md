# Design — Shorten Link (Phase 1)

> Feature: `shorten-link-p1` · Repos: `server/`, `client/`, `docs/`
> Status: bootstrap design (port từ `_bootstrap/design.md` §5–§6) — nguồn cho `writing-plans` khi build P1.

## 1. Bối cảnh & mục tiêu

`web-app-shorten-link` là project mới, clone **format làm việc** của `web-app-store-server-client` (methodology `.claude`, layout monorepo 4-repo) nhưng đổi hẳn stack và domain sang **URL shortener public, ẩn danh**. Phase 1 là lần build đầu tiên: chưa có code, chưa có schema, chưa có UI — tài liệu này là spec chức năng đầy đủ cho BE + FE + E2E matrix, làm input cho `writing-plans` (chia task BE/FE/FS cụ thể) và cho `superdesign` (mock UI Home trước khi code FE).

**Mục tiêu P1**: user dán URL dài vào form → nhận short URL + QR code ngay (client-side) → có thể copy / mở / xem lại trong lịch sử cục bộ (localStorage, vì ẩn danh không có tài khoản). Click vào short URL → redirect 302 về URL gốc + tăng bộ đếm click.

## 2. Quyết định đã chốt (Decision Records)

| # | Quyết định | Lý do |
|---|---|---|
| DR-1 | **Redirect qua chính BE** (`GET /:code` trả 302), không dùng service short-domain ngoài | BE đóng vai "short domain" — đơn giản cho P1, không cần hạ tầng domain riêng. `shortUrl` trả về từ `POST /api/links` là `${BE_ORIGIN}/{code}`. |
| DR-2 | **Lịch sử lưu localStorage (client), không lưu theo user ở server** | P1 ẩn danh, không có khái niệm "user sở hữu link" hoạt động. Field `ownerId` đã có trong schema (nullable, chuẩn bị P2) nhưng luôn `null` ở P1. Xoá khỏi history = xoá local, KHÔNG gọi API xoá (không có endpoint DELETE ở P1 — xem Non-Goals `project-goals.md` §5). |
| DR-3 | **`code` và `customAlias` dùng chung 1 namespace unique** (`@@unique([code])`) | Tránh 2 link khác nhau có URL rút gọn trùng nhau dù nguồn gốc (auto-gen vs custom) khác nhau. Trùng → `409 Conflict`, không tự fallback sinh code khác. |
| DR-4 | **Danh sách alias reserved bị chặn** (`api`, `admin`, `assets`, `404`, `health`, `favicon.ico`, `robots.txt`) | `GET /:code` là catch-all route ở BE; nếu user đặt alias trùng path hệ thống dùng (`/api/*` prefix, `/health`, static assets) sẽ gây nhầm lẫn / che route thật. Validate ở tầng `customAlias` schema (Zod ở FE + `class-validator` custom rule ở BE), KHÔNG dựa vào thứ tự route để né tránh — chặn tường minh. |
| DR-5 | **Rate-limit chỉ áp cho `POST /api/links`**, không áp cho `GET /:code` (redirect) | Redirect là hành vi đọc công khai (người dùng cuối click link đã chia sẻ) — giới hạn sẽ phá trải nghiệm người nhận link, không phải người tạo spam. `@nestjs/throttler` chỉ guard endpoint tạo link. |
| DR-6 | **SuperDesign mock Home TRƯỚC khi code FE** (Step tiếp theo, task riêng) | UI hoàn toàn mới (form + result card + QR + history) — cần duyệt visual (light + dark) trước khi vào `writing-plans`/code, theo flow UI-first đã áp dụng ở `web-app-store-server-client`. `docs/ui-designs/` hiện để trống, mock thật sẽ vào task kế tiếp. |

## 3. Kiến trúc & chức năng theo side

### 3.1 Backend (NestJS + Prisma + PostgreSQL)

| Endpoint | Mô tả |
|---|---|
| `POST /api/links` | Tạo short link. Body `{ url: string, customAlias?: string }`. Validate URL (http/https, format hợp lệ) qua `class-validator` + custom rule. Nếu có `customAlias`: validate format + không thuộc reserved list (DR-4) + check `@@unique([code])` chưa tồn tại → `409 Conflict` nếu trùng. Nếu không có `customAlias`: sinh `code` bằng `nanoid` (độ dài/charset chốt ở implementation plan — xem `project-goals.md` §9). Trả `201 { code, shortUrl, originalUrl, customAlias, clickCount: 0, createdAt }`. |
| `GET /api/links/:code` | Lấy metadata 1 link theo `code` (dùng cho FE hiển thị `clickCount` cập nhật trong local history). `404` nếu không tồn tại. Trả `{ code, shortUrl, originalUrl, customAlias, clickCount, createdAt }`. |
| `GET /:code` | Redirect. Tìm `Link` theo `code` → có: tăng `clickCount` (atomic increment) rồi **302** về `originalUrl`; không có: **404** (render trang lỗi tối giản BE hoặc để FE `/404` xử lý nếu request đến từ browser điều hướng qua FE — xem §4 Error handling). |

- **Rate-limit**: `@nestjs/throttler` guard trên `POST /api/links` (DR-5) — ví dụ ngưỡng cụ thể (số request/phút) chốt ở `writing-plans` dựa trên nguy cơ abuse thực tế.
- **Module structure**: theo skill BE chuẩn của methodology (mượn pattern từ `match-cv` NestJS) — `links.module.ts` / `links.controller.ts` / `links.service.ts` / `links.repository.ts` (Prisma) / `dtos/`.
- **Validation 2 lớp cho URL**: `class-validator` `@IsUrl({ protocols: ['http', 'https'], require_protocol: true })` + kiểm tra bổ sung tuỳ nhu cầu (chặn `javascript:`, `data:` — `@IsUrl` với `require_protocol: true` đã loại các scheme này vì không nằm trong `protocols` cho phép).
- **Test**: Jest — unit `LinksService` (sinh code, validate alias, check trùng), e2e (`supertest`) cho 3 endpoint trên (bao gồm case lỗi).

### 3.2 Frontend (Vue 3 + Vuetify + Tailwind)

| Route | Nội dung |
|---|---|
| `/` (Home) | Form input URL (+ optional custom alias) → nút Shorten → result card (short URL + nút Copy + QR code render client-side qua `qrcode`). Bên dưới: **Local history section**. |
| Local history section (trong `/`, không phải route riêng) | List link đã tạo (đọc/ghi qua Pinia store, persist vào `localStorage`): mỗi item có copy / xem QR / mở (link mới) / xoá-khỏi-history. Hiện `clickCount` hiện tại — fetch lại qua `GET /api/links/:code` (Vue Query) khi mount / khi user bấm refresh. |
| `/404` | Trang "link không tồn tại" — hiện khi BE trả 404 cho 1 code (điều hướng từ redirect miss, hoặc khi refetch metadata 1 item trong history phát hiện link đã bị xoá phía server — trường hợp hiếm ở P1 vì P1 không có xoá server). |

- **State**: Pinia (`useHistoryStore` — mảng link đã tạo, đọc/ghi `localStorage`, thao tác add/remove). Server-state: TanStack Query (Vue Query) cho `POST /api/links` (mutation) và `GET /api/links/:code` (query, dùng để refresh `clickCount` từng item history).
- **Form + validate**: VeeValidate + Zod — schema `url` (bắt buộc, phải là URL http/https hợp lệ) + `customAlias` (optional, ràng buộc độ dài + charset + không thuộc reserved list — **đồng bộ rule với BE**, xem §5 Validation). HTTP: `axios` (base URL trỏ BE `:5300`).
- **i18n**: `vue-i18n`, 2 locale EN (default) + VI — bao phủ toàn bộ copy: label form, placeholder, thông báo lỗi validate, nút (Shorten/Copy/Copied!/Open/Remove), history empty-state, trang 404.
- **QR**: `qrcode` — sinh QR client-side từ `shortUrl` (không gọi API riêng cho QR).
- **UI**: Vuetify component (`v-text-field`, `v-btn`, `v-card`, `v-snackbar` cho toast copy-success) + Tailwind utility cho layout/spacing fine-tune. Xử lý preflight conflict Tailwind vs Vuetify base styles — cách chốt cụ thể (tắt preflight vs scope theo class) nằm ở `project-goals.md` §9 Open Question #4, quyết ở lúc scaffold FE.

## 4. API Contract (BE DTO ↔ FE type)

```
LinkDto = { code: string, shortUrl: string, originalUrl: string,
            customAlias: string | null, clickCount: number, createdAt: string (ISO) }
```

| Endpoint | Method | Auth | Body/Param | Response |
|---|---|---|---|---|
| `/api/links` | POST | ❌ (public, rate-limited) | `{ url: string, customAlias?: string }` | `201 LinkDto` · `400` (URL/alias invalid) · `409` (alias đã tồn tại) · `429` (rate-limit) |
| `/api/links/:code` | GET | ❌ (public) | `code` (path) | `200 LinkDto` · `404` (không tồn tại) |
| `/:code` | GET | ❌ (public) | `code` (path) | `302 Location: originalUrl` (+ tăng `clickCount`) · `404` |

## 5. Validation rules (chi tiết — dùng cho E2E §7)

### URL (`url`)
- Bắt buộc, không rỗng.
- Phải có protocol `http://` hoặc `https://` tường minh (không tự thêm protocol nếu thiếu — reject thay vì đoán).
- Phải parse được thành URL hợp lệ (có domain/host).
- Scheme khác (`ftp://`, `javascript:`, `data:`, `mailto:`) → reject.

### Custom alias (`customAlias`, optional)
- Nếu không truyền → auto-gen (`nanoid`), không áp rule này.
- Nếu có truyền: độ dài **3–30 ký tự** (biên dưới 3 để tránh alias quá ngắn dễ đoán/va chạm, biên trên 30 để short URL vẫn "ngắn" đúng nghĩa).
- Charset cho phép: chữ (a-z, A-Z), số (0-9), dấu gạch ngang `-`, gạch dưới `_`. Không khoảng trắng, không ký tự Unicode/emoji.
- Không thuộc reserved list (DR-4): `api`, `admin`, `assets`, `404`, `health`, `favicon.ico`, `robots.txt` (case-insensitive).
- Không trùng `code` đã tồn tại (check DB) → `409`.

## 6. Error handling

- **BE**: URL invalid → `400` (message theo field `url`). Alias invalid format/reserved → `400` (message theo field `customAlias`). Alias hợp lệ nhưng trùng → `409`. Rate-limit vượt ngưỡng → `429`. `GET /:code` / `GET /api/links/:code` không tìm thấy → `404`.
- **FE**: `400`/`409` từ `POST /api/links` → hiện lỗi inline dưới field tương ứng (form vẫn giữ input, không clear). `429` → toast "Bạn thao tác quá nhanh, thử lại sau" (i18n). `5xx`/network error → toast lỗi chung, nút Shorten trở lại trạng thái enable (không kẹt loading). Redirect `404` (khi user tự gõ `/:code` sai hoặc link đã hết hiệu lực — không áp dụng P1 vì không có expiration, chỉ là code chưa từng tồn tại) → route `/404`. Refetch `clickCount` trong history lỗi mạng → giữ giá trị cũ hiển thị kèm icon "chưa cập nhật được", không xoá item khỏi history.

## 7. E2E Scenario Matrix (Phase 1)

> Áp dụng skill `e2e-scenario-coverage` (12 nhóm rubric). Feature có UI mới hoàn toàn (Home form + result + QR + history) và có mutation (tạo link, redirect tăng click) ⇒ bắt buộc matrix đầy đủ. Nhóm không áp dụng ghi rõ lý do, không để trống. `[EP]`/`[BVA]`/`[DT]`/`[ST]` = kỹ thuật thiết kế test case (Equivalence Partitioning / Boundary Value Analysis / Decision Table / State Transition) áp theo rubric depth-layer.
>
> **Gate**: `A+B` = cả 2 gate (test file + Playwright MCP walk) đều chạy. `A only` = mutation-heavy (tạo link thật, tăng click, chạm rate-limit) → chỉ gate A chạy mutation để tránh 2 gate song song đụng nhau trên cùng `code`/rate-limit budget (gate B verify phần render/read tương ứng bằng dữ liệu đã có sẵn, không tự mutate lại).

| # | Nhóm | Áp dụng | Scenario + Expected | Gate |
|---|---|---|---|---|
| 1 | Happy path | ✅ | Nhập URL https hợp lệ, không alias → Shorten → nhận `code` auto-gen + `shortUrl` hiển thị + nút Copy hoạt động (clipboard) + QR render đúng `shortUrl`. Item mới xuất hiện đầu **local history** với `clickCount = 0`. Mở `shortUrl` (hoặc gọi `GET /:code`) → **302** về `originalUrl`; quay lại app, refresh history → `clickCount = 1`. Lặp lại với `customAlias` hợp lệ chưa tồn tại → `code = customAlias`, cùng hành vi. | A only |
| 2 | AuthN | **N/A** | P1 hoàn toàn ẩn danh — không có khái niệm đăng nhập, không session/token. Mọi endpoint public, không có trạng thái "chưa đăng nhập" cần redirect. | — |
| 3 | AuthZ | **N/A** | Không có role/permission phân biệt ở P1 (chỉ 1 persona hoạt động: Anonymous visitor — `project-goals.md` §2). Mọi visitor ngang quyền với mọi link (kể cả redirect link người khác tạo — đúng bản chất URL shortener public). | — |
| 4 | Validation / expected-error | ✅ | **[EP]** `url` classes: `https hợp lệ` → 201/thành công · `http hợp lệ` → 201 · rỗng → 400 (client + server) · thiếu protocol (`"example.com"`) → 400 · malformed (khoảng trắng, không domain: `"http:// abc"`) → 400 · scheme khác (`ftp://x.com`, `javascript:alert(1)`) → 400. **[EP]** `customAlias` classes: hợp lệ mới → 201 · rỗng (không truyền) → auto-gen, không lỗi · charset sai (space, emoji `"my alias 🎉"`) → 400 · thuộc reserved (`"api"`, `"404"`) → 400 · đã tồn tại → 409. **[BVA]** độ dài alias: `2` ký tự (min−1 → reject 400) · `3` (min → accept) · `30` (max → accept) · `31` (max+1 → reject 400). **[DT]** kết hợp `urlValid × aliasProvided × aliasValid × aliasTaken`: `url invalid + alias invalid` → assert lỗi `url` được báo trước/đồng thời (không nuốt lỗi alias — cả 2 field hiện lỗi nếu validate song song) · `url valid + alias hợp lệ nhưng taken` → 409 riêng biệt (không lẫn với 400) · `url valid + alias không truyền` → 201 auto-gen (case chuẩn). | A only |
| 5 | Empty / null states | ✅ | Browser lần đầu (chưa từng shorten) → local history hiện empty-state ("Chưa có link nào" / i18n). `customAlias = null` (auto-gen) → history item hiển thị `code` bình thường, không hiện label "custom" trống rỗng gây rối UI. `GET /api/links/:code` cho code hợp lệ nhưng vừa mới tạo (`clickCount = 0`) → hiển thị `0`, không phải `null`/rỗng. | A+B |
| 6 | Boundary / pagination | Pagination **N/A**; Boundary ✅ | **Pagination N/A**: P1 không có danh sách phân trang ở server (`GET /api/links/:code` chỉ trả 1 item theo code) — local history hiển thị toàn bộ mảng nhỏ trong localStorage, không cần pager (ghi nhận nếu sau này history phình to → cân nhắc virtualize, chưa cần ở P1). **Boundary** ✅: xem `[BVA]` độ dài alias ở nhóm 4. Bổ sung `url` cực dài (vd 2048 ký tự) → vẫn accept nếu hợp lệ (không có giới hạn cứng ở P1, DB `String` không giới hạn); local history với `0` item / `1` item / nhiều item (>10) → layout không vỡ ở cả 3 mốc. | A only |
| 7 | Filter / search | **N/A** | P1 không có ô tìm kiếm/lọc cho local history hay danh sách link — list nhỏ (ẩn danh, 1 trình duyệt), hiển thị toàn bộ theo thứ tự tạo mới nhất trước. Filter/search là mở rộng tương lai nếu history phình to (không có trong scope P1 — `project-goals.md` §5 Non-Goals). | — |
| 8 | Data rendering | ✅ | `shortUrl` hiển thị đầy đủ (không chỉ `code` trần) và là link bấm được. `clickCount` render số nguyên định dạng người đọc (không phải raw JSON `"0"` lẫn với text khác). `createdAt` format ngày-giờ theo locale hiện tại (không hiện chuỗi ISO thô `2026-07-24T...`). `originalUrl` dài → truncate với ellipsis trên UI nhưng `title`/tooltip hiện full URL. `customAlias = null` không render chữ "null" ra màn hình. | A+B |
| 9 | **i18n (en + vi)** | ✅ | Render Home (form, placeholder, nút Shorten/Copy/Copied!) **cả EN + VI**. Thông báo lỗi validate (`url` invalid, `customAlias` invalid/taken, rate-limit 429) hiện đúng locale, không sót key (missing-message fallback về key thô là bug). History section (empty-state, label Copy/QR/Open/Remove, `clickCount` label) cả 2 locale. Trang `/404` cả 2 locale. | A+B |
| 10 | Error / loading | ✅ | `POST /api/links` trả `5xx`/network error → toast lỗi chung (i18n), nút Shorten hết trạng thái loading, form giữ nguyên input để user thử lại. Nút Shorten hiện loading state (disabled + spinner) trong lúc chờ response — tránh double-submit vô ý (liên hệ nhóm 11). Vượt rate-limit (`429`) → thông báo riêng biệt với lỗi validate thường. `GET /:code` cho code không tồn tại → **404** — FE điều hướng `/404` với thông báo rõ ràng. `GET /api/links/:code` lỗi mạng khi refresh `clickCount` trong history → giữ giá trị cũ + icon cảnh báo nhỏ, KHÔNG xoá item khỏi history. | A only |
| 11 | Mutation safety | ✅ | **[ST]** Click Shorten 2 lần liên tiếp nhanh (double-click) với nút đã chuyển `disabled` khi pending (nhóm 10) → chỉ 1 request POST thực sự gửi đi, không tạo 2 code cho 1 lần bấm (invalid transition — bấm khi đang pending phải bị chặn ở UI). **[ST]** Redirect `GET /:code` gọi 2 lần liên tiếp (vd double-click link, hoặc bấm "Open" trong history 2 lần) → `clickCount` tăng đúng 2 lần (không mất lượt, không tăng đúp 1 lần thành 4 do race — atomic increment ở BE). **[ST]** Xoá 1 item khỏi **local history** rồi thử `GET /:code` (link cũ, code đó) trực tiếp → **vẫn 302 thành công** (chứng minh xoá-khỏi-history là thao tác client-only, KHÔNG xoá bản ghi DB — đúng DR-2/Non-Goals). Tạo lại y hệt `originalUrl` (không truyền alias) sau khi đã có 1 record cùng URL → sinh `code` **mới, khác** với record cũ (P1 không dedupe theo `originalUrl`, mỗi lần tạo là 1 record mới — ghi nhận, không phải bug). Submit `customAlias` trùng alias vừa tạo (idempotency check) → luôn `409`, không có cơ chế "trả lại code cũ nếu gọi lại y hệt". | A only |
| 12 | Accessibility | ✅ | Input URL có `<label>`/`aria-label` gắn đúng, thông báo lỗi validate liên kết `aria-describedby` + vùng lỗi có `aria-live="polite"`. Nút Shorten có accessible name rõ ràng ("Shorten" không phải icon trần). Sau khi shorten thành công, focus chuyển tới result card (short URL) để screen reader đọc ngay kết quả. Nút Copy có `aria-label` mô tả hành động + thông báo "Copied!" cũng qua `aria-live` (không chỉ đổi màu icon). Ảnh QR có `alt` text mô tả (vd "QR code for {shortUrl}"). Mỗi item trong history điều hướng được bằng bàn phím (Tab order hợp lý), nút Remove có xác nhận hoặc `aria-label` rõ ("Remove {code} from history"). | A only |
| 13 | Local history persistence (feature-specific) | ✅ | **[ST]** Sau khi tạo ≥1 link, **reload trang** (F5) → local history vẫn hiển thị đầy đủ (đọc lại từ `localStorage`, không mất state do Pinia store là in-memory + hydrate lúc mount). Xoá 1 item khỏi history rồi reload → item đó **không** xuất hiện lại (localStorage đã cập nhật, không chỉ xoá tạm trong memory). QR code hiển thị lại đúng sau reload (không cần gọi lại API tạo QR — sinh lại client-side từ `shortUrl` đã lưu). | A only |

**Artifact E2E (mở rộng ở `writing-plans`):**
- `client/e2e/shorten-link-p1/*.e2e.ts` — happy path, validation (EP/BVA/DT), empty state, boundary, data rendering, i18n en+vi, error/loading, mutation safety (double-submit, redirect click count, history-delete-not-server-delete), a11y, persistence.
- Tài liệu kịch bản thực thi: `docs/specs/shorten-link-p1/e2e.md` (viết khi vào giai đoạn implement, theo lifecycle §Outputs của skill `e2e-scenario-coverage`).
- **Completeness critic**: nếu user yêu cầu "thorough/đủ" ở `writing-plans`, dispatch 1 subagent rà soát case thiếu (paste URL có khoảng trắng đầu/cuối, unicode trong URL path, session/tab khác cùng localStorage — N/A vì mỗi tab đọc chung 1 localStorage của cùng origin nên không có "concurrent tab" thật sự tách biệt ở P1, back-button giữa 2 lần shorten) trước khi chốt plan.

## 8. Testing (BE)

- Unit `LinksService`: sinh `code` (`nanoid`) không trùng, validate `customAlias` (format + reserved list), check trùng trước khi insert.
- Unit/integration validate URL: các class EP/BVA ở §7 nhóm 4 (parse hợp lệ / reject scheme lạ / reject rỗng).
- E2E (`supertest`) 3 endpoint: `POST /api/links` (201/400/409/429), `GET /api/links/:code` (200/404), `GET /:code` (302 + tăng `clickCount`/404).
- Test tăng `clickCount` atomic (2 request đồng thời vào cùng `code` → không mất lượt — dùng Prisma `increment` chứ không phải read-modify-write thủ công).

## 9. Câu hỏi mở / ghi nhận

Đã liệt kê ở `project-goals.md` §9 (dùng chung, không lặp lại chi tiết ở đây): độ dài `nanoid`, Redis cache redirect (defer P3), cơ chế OAuth P2, Tailwind/Vuetify preflight, trang stats public theo code (defer).

Bổ sung riêng cho spec này:
1. **Ngưỡng rate-limit cụ thể** (`@nestjs/throttler` — bao nhiêu request/phút cho `POST /api/links`) → chốt ở `writing-plans` dựa trên rủi ro abuse ước lượng thực tế, không hardcode tuỳ tiện ở bootstrap này.
2. **Thông báo lỗi 404 ở `GET /:code`** — trả HTML tối giản từ BE hay luôn để FE `/404` xử lý (yêu cầu redirect qua FE trước)? Ở kiến trúc P1 (BE = "short domain" riêng biệt cổng `:5300`, FE riêng cổng `:3300`), truy cập trực tiếp `GET /:code` trên BE khi không tồn tại nên trả JSON `404` chuẩn REST (không phải HTML) — FE chỉ gặp case này khi tự gọi `GET /api/links/:code` để refresh metadata, lúc đó điều hướng `/404` phía FE. Xác nhận rõ trong `writing-plans` khi biết domain thật sẽ dùng ở production.

## 10. Bước tiếp theo trong flow

- **SuperDesign mock UI (bắt buộc trước code FE)**: dựng mock Home (form + result card + QR + local history, light + dark) theo `docs/.superdesign/design-system.md`, review trước khi `writing-plans` chia task FE. `docs/ui-designs/` hiện để trống — mock thật là deliverable của task kế tiếp trong bootstrap plan.
- `writing-plans` chia task BE (Prisma schema `Link` + module `links` + throttler + Jest) / FE (Home + history + i18n + Vue Query + Pinia) + expand E2E matrix (§7) thành file test thật.
- Env/schema: feature này **là** bản build đầu tiên → cần `server/.env` (kết nối PostgreSQL `shortenlink`, `nanoid` config nếu có) + `client/.env` (BE base URL `:5300`). Không có seeder cần thiết ở P1 (data người dùng tự tạo qua UI).
