# Client — Frontend Web

Vue 3 frontend cho `web-app-shorten-link`. Form rút gọn link, lịch sử, QR code — kết nối BE (`server/`, port `:5300`) qua Axios.

## Tech Stack

Chi tiết version/packages xem `../package.json`. Tóm tắt:

- **Framework**: Vue 3 (Composition API + `<script setup>`) + Vite
- **Language**: TypeScript
- **UI components**: Vuetify 3 (Material Design)
- **Utility CSS**: Tailwind CSS v4 (`@tailwindcss/vite`, preflight **OFF** — xem `src/assets/tailwind.css`)
- **State**: Pinia (global/client state) + TanStack Vue Query (server state)
- **Routing**: Vue Router
- **Forms**: VeeValidate + Zod
- **i18n**: vue-i18n (`en` / `vi`)
- **HTTP**: Axios (`src/lib/axios.ts` → `apiClient`)
- **Misc**: `qrcode` (QR generation), `@mdi/font` (icon set cho Vuetify)
- **E2E**: Playwright
- **Package manager**: pnpm — dev server port `:3300`

## Skills

Thư mục `.claude/skills/` chứa các file hướng dẫn coding convention.

| Khi nào                                                                    | Skill files cần đọc                    |
| --------------------------------------------------------------------------- | --------------------------------------- |
| Viết/review BẤT KỲ code (mọi ngôn ngữ) — nguyên tắc chung                    | `standard-coding-universal/SKILL.md`    |
| Viết/review `.ts`/`.vue` (type safety, tsconfig, `<script setup lang="ts">`, defineProps/defineEmits, imports) | `standard-typescript/SKILL.md` (bản Vue) |
| Viết/review Vue component, composable, Pinia store, Vue Router, Vue Query, VeeValidate+Zod form | `standard-vue/SKILL.md`                 |
| Dùng Vuetify component (props, slots, theme) + phân chia việc với Tailwind utility, mdi icon | `standard-vuetify/SKILL.md`             |
| Viết/review Tailwind utility classes, theme token, responsive, dark mode      | `standard-tailwind/SKILL.md` (bản v4)   |
| Viết/review HTML/CSS accessibility, form, modal, navigation                   | `standard-accessibility/SKILL.md`       |

Không có `standard-react`, `standard-nextjs`, `standard-shadcn`, `standard-seo` trong repo này — stack không dùng React/Next.js/shadcn.

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

**Vuetify + Tailwind division of labor** (see `src/assets/tailwind.css` for full rationale):

- Tailwind is imported **without preflight** (`@import 'tailwindcss/theme.css'; @import 'tailwindcss/utilities.css';` — no `@import 'tailwindcss/preflight.css'`) so it never fights Vuetify's own base/reset styles.
- **Vuetify owns all component styling** — buttons, inputs, cards, dialogs, forms use Vuetify components (`v-btn`, `v-text-field`, `v-card`, …), never raw styled HTML replicas.
- **Tailwind owns layout/spacing/typography utilities** around and between Vuetify components — `flex`, `gap-4`, `p-6`, `text-sm`, grid layouts, responsive breakpoints.
- Icons: `@mdi/font` registered as Vuetify's default icon set (`mdi:` aliases) — use `<v-icon icon="mdi-content-copy" />` or Vuetify component `prepend-icon`/`append-icon` props, not a second icon library.

**i18n:** `vue-i18n` in Composition API mode (`legacy: false`). Messages defined per-locale in `src/plugins/i18n.ts` (`en`, `vi`, default `en`). Use `useI18n()` in `<script setup>`, `$t(...)` in templates — never hardcode user-facing strings.

**Server state:** TanStack Vue Query (`src/plugins/vue-query.ts`) — `refetchOnWindowFocus: false`, `retry: 1` by default. Use `useQuery`/`useMutation` for all BE calls (link creation, history, click count) — never call `apiClient` directly inside a component without wrapping in Vue Query.

## Folder Conventions

- `src/views/` — route-level page components (mapped 1:1 in `src/router/index.ts`)
- `src/components/` — reusable presentational/composed components (not routed)
- `src/composables/` — Vue composables (`useXxx.ts`), the Vue equivalent of React hooks — shared reactive logic, not tied to one component
- `src/stores/` — Pinia stores (`defineStore`), one file per domain store
- `src/plugins/` — app-level plugin setup/config (`vuetify.ts`, `i18n.ts`, `vue-query.ts`) — registered once in `src/main.ts`
- `src/lib/` — library wrappers (`axios.ts` → `apiClient`)
- `src/router/` — Vue Router instance + route table
- `src/assets/` — static assets + global CSS (`main.css`, `tailwind.css`)
- `src/types/` (create when first shared type is needed) — shared TS types/interfaces used across ≥2 files; component-local prop/emit types stay inline via `defineProps`/`defineEmits` generics

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
- Before finalizing UI work, self-audit against `standard-accessibility/SKILL.md` (a11y) and `standard-tailwind/SKILL.md` (no hardcoded palette colors bypassing tokens) — lint/type-check passing does not mean these are satisfied
