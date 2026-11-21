# Design — F1 · Rút gọn link

> Feature 1/6 của Phase 1 (lộ trình: [`docs/unfinished-features.md`](../../unfinished-features.md)).
> Mock đã duyệt: [`docs/ui-designs/shorten-link/home.html`](../../ui-designs/shorten-link/home.html) (2026-11-21).
> Design system: [`docs/design-system/shorten-link/MASTER.md`](../../design-system/shorten-link/MASTER.md) · copy: [`ux-copy.md`](../../design-system/shorten-link/ux-copy.md) · icon: [`icon-map.md`](../../design-system/shorten-link/icon-map.md).

## 1. Mục đích

Phase 1 được chia thành 6 feature nhỏ. Mỗi feature cắt dọc từ database tới giao diện, để user **bấm thử
trên app chạy thật** sau từng bước rồi mới làm bước kế tiếp. F1 là lát đầu tiên: dán một link dài → nhận
link ngắn trên "vé" kết quả → Copy. F1 cũng gánh phần nền mà mọi feature sau dùng chung (theme, font,
i18n, khung trang, model `Link`).

**Thành công =** user mở `http://localhost:3300`, dán link, bấm Shorten, thấy vé với mã 7 ký tự và link
ngắn, bấm Copy được; đổi EN/VI và sáng/tối; bản ghi nằm trong bảng `Link` của DB `shortenlink`.

## 2. Phạm vi

**Trong F1**
- BE: model Prisma `Link` + migration đầu, `PrismaModule`, `LinksModule` với `POST /api/links` (chỉ `url`), validation, CORS.
- FE: theme Vuetify light/dark theo MASTER.md, font tự host, i18n EN/VI, khung trang (header: tên app, đổi ngôn ngữ, đổi theme), form rút gọn, vé kết quả + Copy, dọn scaffold `create-vue`.
- Ghi `docs/unfinished-features.md`, cập nhật README `## Features`.

**Ngoài F1 (feature sau)**
| Việc | Feature |
| --- | --- |
| `GET /:code` redirect, đếm click, trang 404, nút **Open** trên vé | F2 |
| Mã QR trên vé, tải PNG | F3 |
| Lịch sử trong `localStorage`, `GET /api/links/:code` | F4 |
| `customAlias`, từ dành riêng, `409` | F5 |
| Rate limit `POST /api/links`, thông báo `429` | F6 |

**Anti-goal:** không dựng auth, không dedupe theo `originalUrl`, không thêm Redis/cache, không thêm
endpoint ngoài `POST /api/links`.

## 3. Approaches (đã chọn)

Ba cách chia Phase 1 đã cân nhắc; user chọn **A** ngày 2026-11-21.

| | Cách | Đánh đổi |
| --- | --- | --- |
| **A ✅** | 6 feature nhỏ, phần nền gộp vào F1 | Mỗi lần xem chỉ một điều mới, sửa sớm; đổi lại 6 vòng worktree/PR/E2E |
| B | 3 feature to | Ít vòng hơn nhưng mỗi lần xem nhiều thứ, sai phát hiện muộn |
| C | Như A nhưng tách "nền" thành F0 | PR gọn hơn, nhưng F0 chỉ là trang trống — gần như không có gì để xem |

Bước mock: chỉ F1 (màn hình chính) và F4 (danh sách lịch sử) có mock riêng; F2/F3/F5/F6 chỉ thêm chi
tiết nhỏ lên màn hình đã duyệt nên xem thẳng trên app — **quyết định của agent**, user không phản đối.

## 4. Decision Records

| # | Quyết định | Lý do |
| --- | --- | --- |
| DR-1 | Link ngắn = `${PUBLIC_BASE_URL}/${code}`; server tự phục vụ redirect (F2) | Không cần hạ tầng domain riêng ở P1. Dev: `http://localhost:5300/aB3xK9p` |
| DR-2 | Mã auto-gen: **7 ký tự**, bảng chữ base62 **bỏ ký tự dễ nhầm** `0 O 1 l I` (57 ký tự) | Mã được đọc, gõ, quét (concept "vé gửi đồ" — ADR-0001). 57⁷ ≈ 1,95·10¹² tổ hợp, đủ cho P1 |
| DR-3 | Trùng mã khi insert (`P2002`) → sinh lại, tối đa **3 lần**, sau đó `500` | Unique constraint ở DB là nguồn chân lý, không check-then-insert |
| DR-4 | URL chỉ nhận `http`/`https`; host phải là tên miền **có TLD** — từ chối `localhost` và **mọi IP literal** (IPv4, IPv6); tối đa **2048** ký tự **đo sau khi trim**; lưu `originalUrl` là **chuỗi đã trim, không chuẩn hoá** (không dùng `new URL().href`) | Chặn `javascript:`/`data:`; link công khai không trỏ vào máy nội bộ (`@IsUrl` một mình vẫn nhận `http://127.0.0.1` nên cần rule riêng); lưu đúng thứ user dán để vé hiển thị y nguyên và biên 2048 giống nhau ở client lẫn server *(agent chốt sau builder check)* |
| DR-5 | Từ chối URL có hostname trùng hostname của `PUBLIC_BASE_URL` **hoặc là subdomain của nó** (so không phân biệt hoa thường, bỏ qua port). **Chỉ kiểm ở server** — client không biết `PUBLIC_BASE_URL` | Chống vòng lặp / xâu chuỗi redirect (`standard-security` §2) *(agent chốt sau builder check)* |
| DR-6 | Tạo lại cùng `originalUrl` → bản ghi + mã **mới** | P1 không dedupe; đơn giản, đúng `project-goals` |
| DR-7 | Theme mặc định theo `prefers-color-scheme`; ngôn ngữ mặc định `en`; lựa chọn của user nhớ trong `localStorage` | Không có tài khoản để lưu tuỳ chọn |
| DR-8 | Vé hiển thị link ngắn **không kèm** `http://`; Copy chép **đầy đủ** có protocol | Dễ đọc trên vé, nhưng link dán ra phải bấm được |
| DR-9 | Playwright chạy trên app thật với DB dev `shortenlink`, không dọn bản ghi; supertest chạy trên DB riêng `shortenlink_test` | Bản ghi ẩn danh, vô hại, không có endpoint xoá ở P1. Supertest theo luật `standard-prisma` §Testing (không dùng DB dev) — *sửa lúc implement, trước đây ghi cả hai cùng dùng DB dev* |
| DR-10 | Config đọc qua một provider nhỏ `AppConfig` (đọc `process.env` lúc khởi tạo, có mặc định dev) — **không** thêm `@nestjs/config` | Supertest override `PUBLIC_BASE_URL` bằng `overrideProvider(AppConfig)` thay vì sửa env toàn cục *(agent chốt sau builder check)* |
| DR-12 | Copy trên trang chỉ hứa những gì đã chạy: F1 dùng subtitle **không** nhắc QR và chỉ hiện điểm `features.anonymous`; F3 thêm lại QR vào subtitle + `features.qr`, F5 thêm `features.alias` | User chọn (a) ngày 2026-11-21 — app luôn khớp feature đã xong. Mock giữ nguyên làm đích cuối của trang |
| DR-11 | Playwright (gate A) chỉ chạy **Chromium** ở P1 | `clipboard-read` chỉ có ở Chromium; mở rộng trình duyệt khi có nhu cầu thật *(agent chốt sau builder check)* |

## 5. Backend

**Stack bổ sung** (cài trong F1): `class-validator`, `class-transformer`, `nanoid` (dùng `customAlphabet`).
⚠️ `nanoid` 5 là ESM-only: chạy được với `require(esm)` của Node ≥ 22.12, nhưng Jest (CommonJS) có thể
không nạp được → builder chọn một trong hai: cấu hình Jest transform cho `nanoid`, **hoặc** bỏ `nanoid`
và tự viết generator bằng `node:crypto` `randomInt` (cùng bảng chữ DR-2). Nếu bỏ, cập nhật
`docs/project-goals.md` §7 trong cùng PR.

**Prisma** (`server/prisma/schema.prisma`) — đúng `docs/erd.md`:
```prisma
model Link {
  id          String   @id @default(uuid())
  code        String   @unique
  originalUrl String
  customAlias String?
  clickCount  Int      @default(0)
  createdAt   DateTime @default(now())
  ownerId     String?
}
```
Migration: `pnpm exec prisma migrate dev --name init_link`.

**Module**
- `PrismaModule` `@Global()` export `PrismaService` (extends `PrismaClient`, `onModuleInit` → `$connect`), import một lần ở `AppModule`.
- `LinksModule`: `LinksController` (`@Controller('api/links')`), `LinksService`, `dto/create-link.dto.ts`, `dto/link-response.dto.ts`. Layout theo skill `module-struct`.
- Giữ `GET /` (health) của `AppController`.

**`main.ts`**
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
- `app.enableCors({ origin: CLIENT_ORIGIN })`.

**Env mới** (`server/.env.example`):
| Key | Mặc định dev | Dùng cho |
| --- | --- | --- |
| `PUBLIC_BASE_URL` | `http://localhost:5300` | Ghép `shortUrl`, so host ở DR-5 |
| `CLIENT_ORIGIN` | `http://localhost:3300` | CORS |

Worktree runner (`.claude/scripts/lib/env.mjs`, repo `.claude`) nên patch `PUBLIC_BASE_URL` theo port
worktree — ghi nhận follow-up, không chặn F1.

### API contract (BE DTO ↔ FE type)

```ts
// POST /api/links
type CreateLinkRequest = { url: string }

// 201
type LinkDto = {
  code: string            // 'aB3xK9p'
  shortUrl: string        // 'http://localhost:5300/aB3xK9p'
  originalUrl: string
  customAlias: string | null   // luôn null ở F1
  clickCount: number      // 0
  createdAt: string       // ISO 8601
}
```

| Tình huống | Status | Body |
| --- | --- | --- |
| Hợp lệ | `201` | `LinkDto` |
| `url` thiếu / rỗng / sai scheme / không TLD / > 2048 / trùng host shortener | `400` | `{ statusCode, message: string[], error }` (Nest mặc định) |
| Field lạ (vd `customAlias` ở F1) | `400` | `forbidNonWhitelisted` |
| Trùng mã 3 lần liên tiếp / DB lỗi | `500` | Nest mặc định, không lộ chi tiết Prisma |

Response header `Cache-Control: no-store`.

## 6. Frontend

**Stack bổ sung**: `@fontsource/atkinson-hyperlegible-next`, `@fontsource/martian-mono`.

**Theme** (`src/plugins/vuetify.ts`): hai theme `light`/`dark` với đúng bảng màu MASTER.md (gồm custom
`stub`, `on-stub`, `divider`, `outline`); defaults: `VBtn { variant: 'flat', class: 'text-none' }`,
`VCard { variant: 'flat' }`, `VTextField { variant: 'outlined', density: 'comfortable' }`; font
Atkinson cho body, Martian Mono qua một class/`--font-mono` chỉ cho mã và URL.

**i18n**: chuyển message sang `src/locales/en.json` + `vi.json` (hoặc giữ trong `i18n.ts` — builder quyết),
key lấy đúng từ `ux-copy.md`, chỉ những key F1 dùng: `home.*`, `form.url.*`, `form.submit*`,
`result.*`, `action.copy/copied`, `features.*`, `error.url.*`, `error.network`, `error.copy`,
`a11y.copyCode`, `a11y.created`, `theme.*`, `lang.switch`. Thêm key mới `home.subtitleNoQr` (en: "Paste a long link and get a short one. No account needed." · vi: "Dán link dài, nhận link ngắn. Không cần tài khoản.") — cập nhật `ux-copy.md` trong cùng PR (DR-12).

**Dọn scaffold**: xoá `HelloWorld`, `TheWelcome`, `WelcomeItem`, `components/icons/*`, `AboutView`,
route `/about`, `stores/counter.ts`, `assets/logo.svg`, CSS mẫu trong `assets/base.css`/`main.css`
(giữ `tailwind.css`).

**Cấu trúc**
| File | Vai trò |
| --- | --- |
| `App.vue` | `v-app` + `AppHeader` + `RouterView` |
| `components/AppHeader.vue` | Tên app + nút ngôn ngữ + nút theme (icon theo `icon-map.md`) |
| `views/HomeView.vue` | Tiêu đề, `ShortenForm`, `LinkTicket` khi có kết quả, khối "What you get" khi chưa có — F1 chỉ một điểm `features.anonymous` (DR-12) |
| `components/ShortenForm.vue` | `v-text-field` + nút Shorten; VeeValidate + Zod |
| `components/LinkTicket.vue` | Vé: trái = link gốc, phải = stub (mã, link ngắn, Copy); spec ở MASTER.md "Signature element" |
| `composables/useCreateLink.ts` | `useMutation` gọi `apiClient.post('/api/links')` |
| `composables/usePreferences.ts` | Theme + ngôn ngữ, đọc/ghi `localStorage` (try/catch) |
| `schemas/link.ts` | Zod schema URL — cùng luật DR-4 |
| `types/link.ts` | `LinkDto` |

**Hành vi**
- Submit khi đang pending → nút `:loading`, không gửi request thứ hai.
- Lỗi validate client → hiện dưới ô, focus về ô; `400` từ server → hiện `error.url.invalid` dưới ô.
- Network / `5xx` → snackbar `error.network`, giữ nguyên input.
- Thành công → vé trượt ra (240ms, tắt khi reduced-motion), focus chuyển tới vùng kết quả, `aria-live` đọc `a11y.created`; ẩn khối "What you get".
- Copy → `navigator.clipboard.writeText(shortUrl)`; ok → nút đổi `action.copied` 2s + snackbar; lỗi → snackbar `error.copy`.
- Shorten lần nữa → vé thay bằng kết quả mới (chưa có lịch sử ở F1).

**Playwright**: chỉnh `playwright.config.ts` cho `baseURL` `http://localhost:3300` (README ghi đang lệch);
xoá `e2e/vue.spec.ts` mẫu.

## 7. Testing (BE)

- Unit `LinksService`: sinh mã đúng độ dài + bảng chữ; retry khi `P2002` (mock Prisma) và dừng sau 3 lần; ghép `shortUrl` từ `PUBLIC_BASE_URL`.
- E2E supertest `POST /api/links` (DB `shortenlink_test`, DR-9): `201` + shape `LinkDto`; các lớp `400` ở matrix §8 nhóm 4 gồm IP literal (`http://127.0.0.1`, `http://[::1]`) và DR-5 (override `AppConfig` với `PUBLIC_BASE_URL=https://sho.rt`, gửi `https://sho.rt/x`, `https://www.sho.rt/x`, `https://SHO.RT:8443/x` → đều 400); field lạ → `400`.
- `app.e2e-spec.ts` có sẵn sẽ cần DB chạy khi `PrismaModule` kết nối lúc khởi động — chấp nhận, cập nhật nếu cần. `test:e2e` server chưa nằm trong green checks (methodology chỉ yêu cầu `pnpm test`); chạy nó ở bước verify của F1.

## 8. E2E Scenario Matrix

Gate: `A+B` = cả suite Playwright (A) và MCP walk (B). `A only` = có tạo bản ghi / thao tác clipboard
nên gate B chỉ kiểm tra phần hiển thị. DB: dev `shortenlink` (DR-9).

| # | Nhóm | Áp dụng | Scenario + kỳ vọng | Gate |
| --- | --- | --- | --- | --- |
| 1 | Happy path | ✅ | Dán `https://example.com/blog/2026/11/how-we-ship?utm_source=x` → Shorten → vé hiện mã 7 ký tự khớp `^[2-9A-HJ-NP-Za-km-z]{7}$`, link ngắn `localhost:5300/<code>`, link gốc ở bên trái; bản ghi tồn tại trong DB với `clickCount = 0`, `customAlias = null`. `http://` hợp lệ cũng tạo được | A only |
| 2 | AuthN | N/A | P1 ẩn danh, không có đăng nhập | — |
| 3 | AuthZ | N/A | Không có vai trò; mọi visitor ngang quyền | — |
| 4 | Validation | ✅ | **[EP]** lớp `url`: hợp lệ https → 201 · hợp lệ http → 201 · rỗng → lỗi `error.url.required` (client, không gửi request) · thiếu scheme `example.com` → `error.url.invalid` · scheme lạ `ftp://x.com`, `javascript:alert(1)`, `data:text/html,x` → invalid · không TLD `http://localhost:8080` → invalid · IP literal `http://127.0.0.1`, `http://192.168.1.5`, `http://[::1]` → invalid · host trùng / subdomain shortener → chỉ server kiểm (DR-5), test bằng supertest §7 · có khoảng trắng hai đầu `"  https://example.com  "` → trim, 201. **[DT]** client vs server: input client cho qua nhưng server từ chối (thực tế chỉ xảy ra với DR-5) — giả lập bằng `route.fulfill` trả `400` → FE hiển thị `error.url.invalid` dưới ô, không phải snackbar · field lạ `{ url, customAlias: "x" }` qua API → 400 | A+B (render lỗi) / A only (gửi) |
| 5 | Empty / null | ✅ | Lần đầu vào: chưa có vé, hiện khối "What you get" chỉ với điểm "No sign-up, no account" và **không** có chữ QR / custom ending ở đâu trên trang (DR-12); `customAlias: null` không render chữ "null" ở đâu | A+B |
| 6 | Boundary | ✅ | **[BVA]** độ dài `url` sau trim: 2047 → 201 · 2048 → 201 · 2049 → 400 (client + server); 2048 ký tự + khoảng trắng hai đầu → 201 (trim trước khi đo). Mã luôn đúng 7 ký tự qua 5 lần tạo liên tiếp. Pagination N/A (không có danh sách) | A only |
| 7 | Filter / search | N/A | F1 không có danh sách | — |
| 8 | Data rendering | ✅ | Link ngắn hiển thị không có `http://`; mã dùng font mono; link gốc dài > 3 dòng bị cắt bằng `…` và không tràn ngang ở 375px | A+B |
| 9 | i18n | ✅ | Render trạng thái đầu, trạng thái lỗi (`required`, `invalid`), vé kết quả, nút Copy/Copied ở **cả `en` và `vi`**; không còn key thô kiểu `form.url.label`; đổi ngôn ngữ khi đang có lỗi → lỗi đổi theo; tải lại trang giữ ngôn ngữ đã chọn | A+B |
| 10 | Error / loading | ✅ | Server tắt / network lỗi (Playwright `route.abort()`) → snackbar `error.network`, nút hết loading, input giữ nguyên. Server trả `500` (`route.fulfill`) → như trên. Trong lúc chờ (`route` trễ 1s) → nút ở trạng thái loading + disabled | A only |
| 11 | Mutation safety | ✅ | **[ST]** double-click Shorten khi pending → đúng **1** request `POST` (đếm qua `page.on('request')`) · Shorten 2 lần cùng URL → 2 mã **khác nhau** (DR-6) · **[ST] invalid transition:** sửa ô URL sau khi có vé rồi Shorten với URL sai → lỗi hiện, vé cũ **vẫn giữ** (không bị xoá bởi lần gửi hỏng) | A only |
| 12 | Accessibility | ✅ | Ô URL có label gắn đúng (`getByLabel`); lỗi gắn `aria-describedby` + `aria-invalid="true"`; sau khi tạo: focus ở vùng kết quả và vùng `aria-live` chứa `a11y.created`; nút Copy có accessible name `a11y.copyCode` chứa mã; nút theme có name `theme.toDark`/`toLight`; Tab đi qua header → ô URL → Shorten → Copy theo đúng thứ tự | A+B |
| 13 | Copy (feature-specific) | ✅ | Bấm Copy → clipboard chứa `http://localhost:5300/<code>` (cấp quyền `clipboard-read` trong Playwright) · nút đổi "Copied" rồi trở lại sau ~2s · snackbar hiện · clipboard bị chặn (stub `navigator.clipboard.writeText` reject) → snackbar `error.copy` | A only |
| 14 | Theme (feature-specific) | ✅ | **[ST]** `emulateMedia({ colorScheme: 'dark' })` lần đầu → theme tối · bấm đổi → sáng · tải lại → vẫn sáng (nhớ lựa chọn, thắng system) | A+B |

**Artifact**: `client/e2e/shorten-link/*.spec.ts`; kịch bản thực thi `docs/specs/shorten-link/e2e.md`
(viết ở bước E2E).

## 9. Để lại cho builder

- `nanoid` vs `node:crypto` (§5) — chọn cái chạy được trong Jest không cần hack.
- Message i18n ở JSON riêng hay trong `i18n.ts`.
- Cách áp perforation của vé trong Vuetify (CSS scoped trong `LinkTicket.vue` là chấp nhận được — đây là chrome riêng của component tự dựng, không phải restyle `v-*`).
- Cách đếm request ở nhóm 11 và stub clipboard ở nhóm 13.
