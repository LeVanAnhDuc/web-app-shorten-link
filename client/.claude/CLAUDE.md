# Client — Frontend Web

Vue 3 frontend cho `web-app-shorten-link`. Form rút gọn link, lịch sử, QR code — kết nối BE (`server/`, port `:5300`) qua Axios.

## Tech Stack

Chi tiết version/packages xem `package.json` (của `client/`). Tóm tắt:

- **Framework**: Vue 3 (Composition API + `<script setup>`) + Vite
- **Language**: TypeScript
- **UI components**: Vuetify 3 (Material Design)
- **Utility CSS**: Tailwind CSS v4 (`@tailwindcss/vite`, preflight **OFF** — xem `src/assets/tailwind.css`)
- **State**: Pinia (global/client state) + TanStack Vue Query (server state)
- **Routing**: Vue Router
- **Forms**: VeeValidate + Zod 4 — qua adapter `src/schemas/to-form-schema.ts` (`@vee-validate/zod` 4.15 chỉ hỗ trợ Zod 3, không dùng `toTypedSchema`)
- **i18n**: vue-i18n (`en` / `vi`)
- **HTTP**: Axios (`src/lib/axios.ts` → `apiClient`)
- **Misc**: `qrcode` (QR generation), `@mdi/font` (icon set cho Vuetify)
- **E2E**: Playwright
- **Package manager**: pnpm — dev server port `:3300`

## Skills

Thư mục `.claude/skills/` chứa các file hướng dẫn coding convention.

| Khi nào                                                                    | Skill files cần đọc                    |
| --------------------------------------------------------------------------- | --------------------------------------- |
| Viết/review `.ts`/`.vue` (type safety, tsconfig, `<script setup lang="ts">`, defineProps/defineEmits, imports) | `standard-typescript/SKILL.md` (bản Vue) |
| Viết/review Vue component, composable, Pinia store, Vue Router, Vue Query, VeeValidate+Zod form | `standard-vue/SKILL.md`                 |
| Vuetify component (props, theme, form field, feedback), mdi icon, Tailwind class / `tailwind.css`, responsive, dark mode | `standard-vuetify/SKILL.md` |
| Viết/review HTML/CSS accessibility, form, modal, navigation                   | `standard-accessibility/SKILL.md`       |

Skill dùng chung ở `<project>/.claude/skills/` (không nằm trong `client/.claude/skills/`): `standard-coding-universal` (mọi code), `standard-security` (§1 + §3 — `v-html`, link ngoài, `localStorage`, biến `VITE_*`) và `design-bootstrap` (sinh design system, một lần cho cả project).

Không có `standard-react`, `standard-nextjs`, `standard-shadcn`, `standard-seo` trong repo này — stack không dùng React/Next.js/shadcn.

## Design system

Nguồn token của toàn bộ UI (màu, font, radius, shadow, page pattern) là `docs/design-system/shorten-link/MASTER.md` (icon: `icon-map.md`, copy EN/VI: `ux-copy.md` cùng thư mục) — quyết định ở `docs/adr/0001-design-system-bootstrap.md`. Font: Atkinson Hyperlegible Next (UI) + Martian Mono (chỉ cho code/URL), tự host qua `@fontsource/*`. Token đi vào theme Vuetify (`src/plugins/vuetify.ts`, theme `light` + `dark`); Tailwind chỉ dùng cho layout/spacing/typography.

**Thứ tự ưu tiên khi mâu thuẫn**: `MASTER.md` > file này > skill ở `.claude/skills/` > skill generic. Code và skill sửa theo MASTER.md, không sửa ngược; đổi MASTER.md chỉ qua một lần chạy lại `design-bootstrap` kèm ADR mới.

## Commands

```bash
pnpm dev              # Start dev server (Vite), http://localhost:3300
pnpm build            # Type-check (vue-tsc) + production build
pnpm preview          # Preview production build
pnpm type-check       # vue-tsc --build (type check only, no emit)
pnpm lint             # oxlint --fix + eslint --fix (run-s lint:*)
pnpm test:e2e         # Playwright E2E tests
```

## Architecture

**App bootstrap (`src/main.ts`) — plugin registration order:**

```
createApp(App)
  .use(createPinia())
  .use(router)
  .use(vuetify)
  .use(VueQueryPlugin, vueQueryPluginOptions)
  .use(i18n)
  .mount('#app')
```

Order matters only where a plugin depends on another at setup time — keep new global plugins registered in this same block, after `router`/`vuetify` unless there's a documented reason to reorder.

**API client:** All HTTP calls go through `apiClient` (`src/lib/axios.ts`), configured with `baseURL: import.meta.env.VITE_API_BASE_URL`. Never hardcode the backend URL or call `axios` directly in components/composables.

**Vuetify + Tailwind division of labor:** Vuetify owns all component styling (`v-btn`, `v-text-field`, `v-card`, …); Tailwind — imported **without preflight** so it never fights Vuetify's reset — owns layout/spacing/typography around them. Icons: `@mdi/font` only. Full rules: `standard-vuetify/SKILL.md`.

**i18n:** `vue-i18n` in Composition API mode (`legacy: false`). Messages live in `src/locales/en.json` + `vi.json` (keys from `docs/design-system/shorten-link/ux-copy.md`), loaded by `src/plugins/i18n.ts` (default `en`). Theme + locale choice: `usePreferences()` (called once in `App.vue`, remembered in `localStorage` with a guarded fallback). Screen-reader announcements: one live region in `App.vue`, fed by `useAnnounce()`. Use `useI18n()` in `<script setup>`, `$t(...)` in templates — never hardcode user-facing strings.

**Server state:** TanStack Vue Query (`src/plugins/vue-query.ts`) — `refetchOnWindowFocus: false`, `retry: 1` by default. Use `useQuery`/`useMutation` for all BE calls (link creation, history, click count) — never call `apiClient` directly inside a component without wrapping in Vue Query.

## Folder Conventions

- `src/views/` — route-level page components (mapped 1:1 in `src/router/index.ts`)
- `src/components/` — reusable presentational/composed components (not routed)
- `src/composables/` — Vue composables (`useXxx.ts`), the Vue equivalent of React hooks — shared reactive logic, not tied to one component
- `src/stores/` — Pinia stores (`defineStore`), one file per domain store
- `src/plugins/` — app-level plugin setup/config (`vuetify.ts`, `i18n.ts`, `vue-query.ts`) — registered once in `src/main.ts`
- `src/lib/` — library wrappers (`axios.ts` → `apiClient`)
- `src/router/` — Vue Router instance + route table
- `src/assets/` — global CSS: `tailwind.css` (theme + utilities, no preflight), `app.css` (font variables, `.font-code`, focus ring)
- `src/locales/` — `en.json`, `vi.json`
- `src/schemas/` — Zod schemas (`link.ts`: URL rules mirroring the server's DR-4) + the VeeValidate adapter
- `src/types/` — shared TS types used across ≥2 files (`LinkDto`), re-exported from `index.ts`; component-local prop/emit types stay inline via `defineProps`/`defineEmits` generics

Current screen (F1): `App.vue` (skip link, `AppHeader`, `<main>`, live region) → `HomeView` → `ShortenForm` (emits `created`) + `LinkTicket` (the tear-off stub, Copy). E2E specs: `e2e/shorten-link/*.spec.ts` — need the server on `:5300` running.

## Quality & Workflow

**MANDATORY: After completing ANY code task in this directory, run these checks in order:**

```bash
pnpm lint         # auto-fix lint errors (oxlint + eslint)
pnpm type-check   # vue-tsc --build (errors must be fixed manually)
```

- Run both even if you think the code is clean
- If `pnpm lint` or `pnpm type-check` report errors → fix ALL errors before responding to the user
- Only after both pass with no errors can you hand over to the user
- `pnpm lint` may auto-fix files — always re-read modified files after running it
- Before finalizing UI work, self-audit against `standard-accessibility/SKILL.md` (a11y) and `docs/design-system/shorten-link/MASTER.md` (no hardcoded colors bypassing the Vuetify theme tokens) — lint/type-check passing does not mean these are satisfied
