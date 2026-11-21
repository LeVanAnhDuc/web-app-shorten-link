# F1 · Rút gọn link — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dán link dài vào `localhost:3300`, nhận vé kết quả có mã 7 ký tự + link ngắn + Copy, lưu bản ghi `Link` trong PostgreSQL; kèm phần nền (theme, font, i18n, khung trang).

**Architecture:** NestJS thêm `PrismaModule` (global) + `LinksModule` với một endpoint `POST /api/links`; config qua provider `AppConfig`. Vue thay scaffold bằng khung trang + `HomeView` gồm `ShortenForm` và `LinkTicket`, gọi API qua Vue Query; theme Vuetify light/dark lấy từ MASTER.md.

**Tech Stack:** NestJS 11, Prisma 6.19.3, PostgreSQL 18, class-validator, Jest + supertest · Vue 3.5, Vuetify 3.12, Tailwind v4, vue-i18n 11, VeeValidate 4 + Zod 4, TanStack Vue Query 5, Playwright.

**Spec:** [`design.md`](./design.md) — đọc kèm; số DR-n trong plan trỏ vào §4 của nó.

## Global Constraints

- Code mã: 7 ký tự, bảng chữ `23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz` (57 ký tự, DR-2). Regex kiểm tra: `^[2-9A-HJ-NP-Za-km-z]{7}$`.
- Sinh mã bằng `node:crypto` `randomInt` — **không** cài `nanoid` (ESM-only, vướng Jest; design §5 cho phép). Cập nhật `docs/project-goals.md` §7 ở Task 6.
- URL: chỉ `http:`/`https:`; hostname có TLD, không phải `localhost`, không phải IP literal; ≤ 2048 ký tự sau trim; lưu chuỗi đã trim, không chuẩn hoá (DR-4).
- Self-host: từ chối hostname = hoặc là subdomain của hostname `PUBLIC_BASE_URL`, không phân biệt hoa thường, bỏ qua port — chỉ server (DR-5).
- Env server: `PUBLIC_BASE_URL` (mặc định `http://localhost:5300`), `CLIENT_ORIGIN` (mặc định `http://localhost:3300`). Nạp `.env` bằng `process.loadEnvFile()` (Node built-in) khi file tồn tại — không thêm `dotenv`/`@nestjs/config` vào runtime.
- i18n key lấy đúng tên trong `docs/design-system/shorten-link/ux-copy.md`; mọi chuỗi có cả `en` và `vi`.
- Màu chỉ qua theme Vuetify (tên MASTER.md); icon chỉ `mdi-*` theo `icon-map.md`; font Atkinson Hyperlegible Next (UI) + Martian Mono (chỉ mã/URL).
- F1 không hiện chữ QR hay custom ending ở đâu trên trang (DR-12).
- Playwright chỉ project `chromium` (DR-11) và chạy trên DB dev `shortenlink`. Supertest (`server/test/*.e2e-spec.ts`) chạy trên DB riêng `shortenlink_test` (skill `standard-prisma` §Testing; DR-9 đã sửa) — `test/setup-env.ts` đặt `DATABASE_URL` sang DB test, schema áp bằng `prisma migrate deploy`.
- Theo `.claude/CLAUDE.md` §7: user yêu cầu review qua PR → commit không cần chờ duyệt từng lần.

## Review Focus

1. **URL có ký tự Unicode / host IDN** (`https://bücher.de/x`) — người dùng Việt/Đức dán thật; kỳ vọng: hợp lệ, lưu nguyên văn. Test ở Task 3 (supertest) và Task 5 (Zod).
2. **Dán link kèm xuống dòng / tab ở cuối** (copy từ email) — kỳ vọng: trim, tạo được. Test ở Task 3 và Task 5.
3. **Bấm Enter trong ô thay vì bấm nút** — kỳ vọng: submit giống bấm nút, không reload trang. Test ở Task 5 (E2E).
4. **`localStorage` bị chặn (private mode / cookie tắt)** — kỳ vọng: app vẫn chạy, theme theo hệ thống, ngôn ngữ `en`. Test ở Task 4 (unit-like E2E stub `localStorage.setItem` throw).
5. **Server trả 400 có `message` không phải về `url` (vd field lạ)** — kỳ vọng: FE vẫn hiện lỗi dưới ô, không crash. Test ở Task 5 (`route.fulfill`).

---

### Task 1 (BE): Config, Prisma model, PrismaModule

**Files:**
- Create: `server/src/config/app-config.ts`, `server/src/config/app-config.spec.ts`, `server/src/modules/prisma/prisma.service.ts`, `server/src/modules/prisma/prisma.module.ts`, `server/prisma/migrations/<ts>_init_link/migration.sql` (sinh tự động)
- Modify: `server/prisma/schema.prisma` (thêm model `Link` y hệt design §5), `server/src/app.module.ts`, `server/src/main.ts`, `server/.env.example`, `server/test/jest-e2e.json` (thêm `setupFiles`), Create `server/test/setup-env.ts`

**Interfaces:**
- Produces: `class AppConfig { readonly publicBaseUrl: string; readonly clientOrigin: string; static fromEnv(env?: NodeJS.ProcessEnv): AppConfig }` — bỏ `/` cuối của `publicBaseUrl`; provider `{ provide: AppConfig, useFactory: () => AppConfig.fromEnv() }` export từ một `ConfigModule` `@Global()` trong `app-config.ts`.
- Produces: `PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy`; `PrismaModule` `@Global()` export nó.
- Produces: `loadEnv(): void` trong `app-config.ts` — gọi `process.loadEnvFile('.env')` nếu file tồn tại; dùng ở `main.ts` và `test/setup-env.ts`.

- [ ] **Step 1: Test `AppConfig.fromEnv`**: `fromEnv({})` → `publicBaseUrl === 'http://localhost:5300'`, `clientOrigin === 'http://localhost:3300'`; `fromEnv({ PUBLIC_BASE_URL: 'https://sho.rt/' })` → `'https://sho.rt'`.
- [ ] **Step 2:** `pnpm test -- app-config` → FAIL (module không tồn tại).
- [ ] **Step 3:** Viết `app-config.ts`, `prisma.service.ts`, `prisma.module.ts`; thêm model `Link`; `AppModule` import `ConfigModule` + `PrismaModule`; `main.ts` gọi `loadEnv()` trước `NestFactory.create`; `.env.example` thêm 2 key; worktree `.env` copy từ checkout chính rồi thêm 2 key.
- [ ] **Step 4:** `pnpm exec prisma migrate dev --name init_link` → migration được tạo, bảng `Link` có trong DB `shortenlink`. `pnpm test` → PASS. `pnpm test:e2e` → `/ (GET)` vẫn PASS.
- [ ] **Step 5: Commit** `feat(links): add Link model, Prisma and app config`.

### Task 2 (BE): Sinh mã và tạo link (`LinksService`)

**Files:**
- Create: `server/src/modules/links/code-generator.ts`, `server/src/modules/links/code-generator.spec.ts`, `server/src/modules/links/links.service.ts`, `server/src/modules/links/links.service.spec.ts`, `server/src/modules/links/dto/link-response.dto.ts`

**Interfaces:**
- Consumes: `PrismaService`, `AppConfig` (Task 1).
- Produces: `CODE_ALPHABET`, `CODE_LENGTH = 7`, `generateCode(): string` trong `code-generator.ts`.
- Produces: `class LinkResponseDto { code; shortUrl; originalUrl; customAlias: string | null; clickCount: number; createdAt: string; static fromEntity(link: Link, publicBaseUrl: string): LinkResponseDto }`.
- Produces: `LinksService.create(originalUrl: string): Promise<LinkResponseDto>` — `MAX_CODE_ATTEMPTS = 3`.

- [ ] **Step 1: Tests**
  - `generateCode()` 1000 lần: mọi kết quả khớp `^[2-9A-HJ-NP-Za-km-z]{7}$`.
  - `create('https://example.com')` với Prisma mock trả bản ghi → DTO có `shortUrl === 'http://localhost:5300/' + code`, `customAlias === null`, `createdAt` là ISO string.
  - Prisma `link.create` reject `PrismaClientKnownRequestError` code `P2002` hai lần rồi thành công → gọi `create` đúng 3 lần, trả DTO.
  - Reject `P2002` ba lần → throw `InternalServerErrorException`, `create` gọi đúng 3 lần.
  - Reject lỗi khác (vd `P1001`) → rethrow ngay, gọi 1 lần.
- [ ] **Step 2:** `pnpm test -- links` → FAIL.
- [ ] **Step 3:** Implement. Không check-then-insert; chỉ bắt `P2002` (DR-3).
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5: Commit** `feat(links): generate short codes and create links`.

### Task 3 (BE): `POST /api/links` — DTO, validation, controller, CORS

**Files:**
- Create: `server/src/modules/links/dto/create-link.dto.ts`, `server/src/modules/links/validators/public-http-url.validator.ts`, `server/src/modules/links/validators/public-http-url.validator.spec.ts`, `server/src/modules/links/links.controller.ts`, `server/src/modules/links/links.module.ts`, `server/test/links.e2e-spec.ts`
- Modify: `server/src/app.module.ts` (import `LinksModule`), `server/src/main.ts` (pipe + CORS — gom vào hàm `configureApp(app)` export từ `server/src/app.setup.ts` để e2e dùng chung)

**Interfaces:**
- Consumes: `LinksService.create`, `AppConfig`.
- Produces: `isPublicHttpUrl(value: string, shortenerHost: string): boolean` — luật DR-4 + DR-5 (IP: dùng `node:net` `isIP` trên hostname đã bỏ `[]`); decorator `@IsPublicHttpUrl()` đọc `shortenerHost` qua `AppConfig` (validator class `@ValidatorConstraint` + `@Injectable`, đăng ký `useContainer(app.select(AppModule), { fallbackOnErrors: true })` trong `configureApp`).
- Produces: `CreateLinkDto { url: string }` — `@Transform` trim, `@IsString`, `@MaxLength(2048)`, `@IsPublicHttpUrl()`.
- Produces: `configureApp(app: INestApplication): void` — `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`, `enableCors({ origin: config.clientOrigin })`, `useContainer`.
- Produces: `LinksController` `@Controller('api/links')`, `@Post()` `@HttpCode(201)` `@Header('Cache-Control', 'no-store')`.

- [ ] **Step 1: Unit tests `isPublicHttpUrl`** (shortenerHost `sho.rt`): true cho `https://example.com`, `http://example.com/a?b=1`, `https://bücher.de/x`; false cho `example.com`, `ftp://x.com`, `javascript:alert(1)`, `data:text/html,x`, `http://localhost:8080`, `http://127.0.0.1`, `http://192.168.1.5`, `http://[::1]`, `https://sho.rt/x`, `https://www.sho.rt/x`, `https://SHO.RT:8443/x`, `https://notsho.rt/x` → **true** (không phải subdomain).
- [ ] **Step 2: E2E `links.e2e-spec.ts`** (DB `shortenlink_test`, `configureApp`): `201` + body khớp `LinkDto` + code regex + header `cache-control: no-store`; `"  https://example.com/x\n\t"` → 201, `originalUrl === 'https://example.com/x'`; 400 cho `{}`, `{ url: '' }`, `{ url: 'example.com' }`, `{ url: 'http://127.0.0.1' }`, `{ url: 'https://example.com', customAlias: 'x' }`; độ dài: `'https://example.com/' + 'a'.repeat(n)` với tổng 2048 → 201, 2049 → 400; override `AppConfig` (`publicBaseUrl: 'https://sho.rt'`) → `https://www.sho.rt/x` 400.
- [ ] **Step 3:** `pnpm test` và `pnpm test:e2e` → FAIL.
- [ ] **Step 4:** Implement; `main.ts` gọi `configureApp`.
- [ ] **Step 5:** `pnpm test` + `pnpm test:e2e` → PASS. `curl -X POST localhost:5300/api/links -H 'content-type: application/json' -d '{"url":"https://example.com"}'` → 201.
- [ ] **Step 6: Commit** `feat(links): add POST /api/links with URL validation`.

### Task 4 (FE): Nền — theme, font, i18n, preferences, khung trang

**Files:**
- Create: `client/src/locales/en.json`, `client/src/locales/vi.json`, `client/src/composables/usePreferences.ts`, `client/src/components/AppHeader.vue`, `client/src/assets/app.css`, `client/e2e/shorten-link/shell.spec.ts`
- Modify: `client/src/plugins/vuetify.ts`, `client/src/plugins/i18n.ts`, `client/src/main.ts`, `client/src/App.vue`, `client/src/router/index.ts`, `client/src/views/HomeView.vue` (khung tạm: tiêu đề + subtitle + khối "What you get"), `client/index.html` (title `Shorten Link`, `lang`), `client/playwright.config.ts`
- Delete: `HelloWorld.vue`, `TheWelcome.vue`, `WelcomeItem.vue`, `components/icons/`, `views/AboutView.vue`, `stores/counter.ts`, `assets/logo.svg`, `assets/base.css`, `assets/main.css`, `e2e/vue.spec.ts`
- Deps: `pnpm add @fontsource/atkinson-hyperlegible-next @fontsource/martian-mono`

**Interfaces:**
- Produces: `usePreferences(): { theme: Ref<'light'|'dark'>; locale: Ref<'en'|'vi'>; toggleTheme(): void; toggleLocale(): void }` — storage keys `shorten-link:theme`, `shorten-link:locale`; mọi truy cập `localStorage` trong try/catch; theme mặc định theo `matchMedia('(prefers-color-scheme: dark)')`; đặt `document.documentElement.lang`. Gọi một lần trong `App.vue`.
- Produces: theme names `light`/`dark` với màu MASTER.md, custom `stub`, `on-stub`, `divider`, `outline`; class `.font-mono` (Martian Mono) trong `app.css`.
- Produces: i18n message files với key F1 (design §6) + `home.subtitleNoQr`, `app.name`.

- [ ] **Step 1: E2E `shell.spec.ts`**: (a) mặc định `en`: `h1` = "Shorten a link", subtitle = "Paste a long link and get a short one. No account needed.", có "No sign-up, no account", trang **không** chứa `/QR|custom ending/i`; (b) bấm nút "Tiếng Việt" → `h1` "Rút gọn link", `html[lang=vi]`; reload → vẫn `vi`; (c) `emulateMedia({ colorScheme: 'dark' })` → `.v-theme--dark` trên `.v-application`; bấm nút name "Switch to light theme" → `.v-theme--light`; reload → vẫn light; (d) `addInitScript` làm `localStorage.setItem` throw → trang vẫn render `h1`, đổi ngôn ngữ vẫn hoạt động trong phiên.
- [ ] **Step 2:** `playwright.config.ts`: `baseURL` `http://localhost:3300`, chỉ project `chromium`, `webServer` `{ command: 'pnpm dev', port: 3300, reuseExistingServer: true }`, reporter `list`. `pnpm exec playwright install chromium` nếu chưa có. Chạy `pnpm test:e2e -- shell` → FAIL.
- [ ] **Step 3:** Implement + xoá scaffold.
- [ ] **Step 4:** `pnpm test:e2e -- shell` → PASS; `pnpm lint && pnpm build` → xanh.
- [ ] **Step 5: Commit** `feat(ui): theme, fonts, i18n and app shell from the design system`.

### Task 5 (FS): Form rút gọn, vé kết quả, Copy

**Files:**
- Create: `client/src/types/link.ts`, `client/src/schemas/link.ts`, `client/src/composables/useCreateLink.ts`, `client/src/components/ShortenForm.vue`, `client/src/components/LinkTicket.vue`, `client/e2e/shorten-link/shorten.spec.ts`
- Modify: `client/src/views/HomeView.vue`, `client/src/locales/*.json` (nếu thiếu key)

**Interfaces:**
- Consumes: `POST /api/links` → `LinkDto` (Task 3); theme + i18n (Task 4).
- Produces: `type LinkDto` (design §5); `MAX_URL_LENGTH = 2048`; `urlSchema` (Zod) — trim, required → message key `error.url.required`, luật DR-4 (không DR-5) → `error.url.invalid`; `isPublicHttpUrl` client dùng `new URL()` + regex IP (`/^\d{1,3}(\.\d{1,3}){3}$/`, hostname bắt đầu `[`).
- Produces: `useCreateLink()` = `useMutation<LinkDto, AxiosError, string>`; không có `retry`.
- Produces: `ShortenForm` emit `created(link: LinkDto)`; prop không có. `LinkTicket` prop `link: LinkDto`, tự xử lý Copy + snackbar; hiển thị `shortUrl` bỏ `^https?://`.
- `HomeView` giữ `link: Ref<LinkDto | null>`; khi có `link` → ẩn khối "What you get", hiện `LinkTicket` (key theo `code` để animation chạy lại), focus vùng kết quả (`tabindex="-1"`), đặt text vào vùng `aria-live`.

- [ ] **Step 1: E2E `shorten.spec.ts`** (server + DB thật, matrix design §8):
  - happy: điền URL ở ô `getByLabel('Long link')`, bấm "Shorten" → vé hiện; text mã khớp regex; text `localhost:5300/<code>`; link gốc hiển thị; bấm Enter thay vì nút cũng tạo được (Review Focus 3).
  - validation: rỗng → "Paste a link to shorten." và **0** request `POST`; `example.com`, `ftp://x.com`, `http://localhost:8080`, `http://127.0.0.1` → message `error.url.invalid`, `aria-invalid="true"`; `"  https://example.com/a\n"` → tạo được; `https://bücher.de/x` → tạo được.
  - server 400 (`route.fulfill` status 400, body `{ statusCode:400, message:['customAlias should not exist'], error:'Bad Request' }`) → lỗi `error.url.invalid` dưới ô, không snackbar.
  - boundary: URL dài 2048 → tạo được; 2049 → lỗi client, 0 request.
  - error/loading: `route.abort()` → snackbar "Couldn't reach the server…", nút bấm lại được, input giữ nguyên; `route.fulfill({ status: 500 })` → như trên; route trễ 1s → nút có `.v-btn--loading` và disabled.
  - mutation: double-click khi pending (route trễ 500ms) → đúng 1 request; 2 lần cùng URL → 2 mã khác; sau khi có vé, nhập URL sai rồi submit → lỗi hiện, vé cũ vẫn còn.
  - a11y: vùng kết quả được focus; vùng `aria-live` chứa "Short link created:"; nút Copy có name chứa mã.
  - copy (`context.grantPermissions(['clipboard-read','clipboard-write'])`): bấm Copy → `navigator.clipboard.readText()` = `http://localhost:5300/<code>`; nút hiện "Copied"; snackbar "Copied"; stub `writeText` reject → snackbar "Couldn't copy…".
  - i18n: chuyển `vi` → lỗi rỗng "Hãy dán link cần rút gọn.", nút "Rút gọn", sau khi tạo nút "Sao chép".
  - render: link gốc dài 600 ký tự ở viewport 375px → `document.documentElement.scrollWidth <= 375`.
- [ ] **Step 2:** Server worktree đang chạy (`:5300`, `.env` worktree), `pnpm test:e2e -- shorten` → FAIL.
- [ ] **Step 3:** Implement. Vé theo MASTER.md "Signature element" (perforation, notch 18px, dash `on-stub` 40%, slide 240ms, reduced-motion tắt, xếp dọc < 600px).
- [ ] **Step 4:** `pnpm test:e2e` (cả `shell` + `shorten`) → PASS; `pnpm lint && pnpm build` → xanh.
- [ ] **Step 5: Commit** `feat(ui): shorten form, result ticket and copy`.

### Task 6 (FS): Tài liệu và đồng bộ

**Files:**
- Modify: `README.md` (`## Features` + bảng stack: thêm class-validator, bỏ "nanoid planned", thêm @fontsource; mục "Not built yet"), `docs/project-goals.md` §7 (`nanoid` → `node:crypto` + lý do) + changelog, `docs/design-system/shorten-link/ux-copy.md` (thêm `home.subtitleNoQr`), `docs/erd.md` (ghi model đã có migration), `server/.claude/CLAUDE.md` + `client/.claude/CLAUDE.md` (trạng thái "Phase 1 chưa build" → F1 đã có; cấu trúc `src/modules/links`, `src/modules/prisma`, `src/config`, `locales`, components mới), `CLAUDE.md` gốc (mô tả trạng thái), `docs/unfinished-features.md` (F1 🟡 giữ tới khi merge)
- Create: `docs/specs/shorten-link/e2e.md` (danh sách scenario đã tự động hoá + kết quả 2 gate), `docs/specs/shorten-link/security-report.md` (sau review bảo mật)

- [ ] **Step 1:** Cập nhật tài liệu; grep không còn "no `Link` model" / "chưa build" sai sự thật.
- [ ] **Step 2: Commit** `docs: record F1 in README, goals and CLAUDE.md files`.

### Sau các task (theo `.claude/CLAUDE.md` §4)

- [ ] E2E dual-gate: gate A `pnpm test:e2e` (client) + gate B MCP walk các dòng `A+B` của matrix.
- [ ] Code review toàn nhánh; security review → `security-report.md`.
- [ ] Green checks: `cd server && pnpm lint && pnpm build && pnpm test && pnpm test:e2e`; `cd client && pnpm lint && pnpm build`.
- [ ] Push, mở PR, **không merge** — báo user.
