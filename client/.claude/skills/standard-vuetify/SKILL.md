---
name: standard-vuetify
description: Styling rules for this project — Vuetify 3 owns every component's chrome, Tailwind v4 (preflight off) only lays things out around it. Covers component choice, props over classes, theme colors, dark mode, form binding, mdi icons, Tailwind setup and utility rules. Use when writing or reviewing any Vuetify component, form field, dialog, feedback UI, icon, Tailwind class or src/assets/tailwind.css.
user-invocable: false
---

> Sources: Vuetify 3 docs (vuetifyjs.com), Tailwind CSS v4 docs, `src/plugins/vuetify.ts`, `src/assets/tailwind.css`. Token values (colors, fonts, radius) come from `docs/design-system/shorten-link/MASTER.md` — it beats this skill.

## Who owns what

- **Vuetify** owns component chrome: background, border, radius, shadow, focus ring, states. If Vuetify has the component, use it — never a raw `<button>`/`<input>`/`<select>` restyled with Tailwind. No shadcn/Radix patterns ported from other projects.
- **Tailwind** owns layout, spacing, sizing, typography and responsive arrangement **around** Vuetify components (`flex`, `gap-4`, `p-6`, `max-w-*`, `text-sm`).
- Appearance of a `v-*` component goes through its props (`color`, `variant`, `density`, `size`, `elevation`, `rounded`) — never utilities, `!`/`!important`, or global CSS on `.v-*` internals.
- Page-level grid that must align with Vuetify gutters → `v-container`/`v-row`/`v-col`; small local arrangements (icon + text, button groups) → Tailwind `flex`/`grid`.

## Color and dark mode

- One color system: the Vuetify theme in `src/plugins/vuetify.ts`, values from MASTER.md. Reference by name (`color="primary"`, `bg-surface`, `rgb(var(--v-theme-primary))`). A missing color → add it to the theme first.
- Never a hex in `style`, a `color="#..."` prop, `bg-[#...]`, or a palette class picked by taste (`bg-indigo-500`). Add a Tailwind `@theme` `--color-*` token only for Tailwind-owned markup, taking its value from MASTER.md — never a parallel color for the same role.
- Dark mode is Vuetify's theme (`useTheme()`). `dark:` only on Tailwind-owned elements, always paired with the light value.

## Components and feedback

- Feedback/overlays use built-ins: `v-snackbar` (copy confirmation, toasts), `v-dialog`, `v-alert` (`type` maps color + icon), `v-progress-*`. Never hand-rolled.
- Loading buttons: `:loading="isPending"` on `v-btn` — no separate spinner, no manual loading ref.
- Navigation `v-btn` takes `:to="{ name: '...' }"` or `href` (renders `<a>`); never `@click="router.push(...)"`.

## Forms

Fields are `v-text-field`/`v-textarea`/`v-select`/`v-checkbox` bound to VeeValidate (`standard-vue`). Errors render only through Vuetify — no parallel error `<span>`, no `:rules` alongside a Zod schema.

```vue
<v-text-field
  v-model="url"
  v-bind="urlAttrs"
  :label="t('form.url.label')"
  :error-messages="errors.url && t(errors.url)"
  :disabled="isPending"
  prepend-inner-icon="mdi-link-variant"
/>
```

## Icons — mdi only

- `@mdi/font` is the only icon set (`icon="mdi-content-copy"`, `prepend-icon`, `<v-icon icon="mdi-qrcode" />`); the concept → icon table is `docs/design-system/shorten-link/icon-map.md`. Never add lucide/heroicons/a second set.
- Icon-only `v-btn` needs an i18n'd `aria-label` naming the action, not the icon. Decorative `v-icon` next to text → `aria-hidden="true"` (see `standard-accessibility`).

## Tailwind setup — do not change

- v4 CSS-first via `@tailwindcss/vite`: no `tailwind.config.js`, no PostCSS config, no `content: []`.
- `src/assets/tailwind.css` imports only `tailwindcss/theme.css` + `tailwindcss/utilities.css`. Never add `preflight.css` or `@import 'tailwindcss'` (pulls preflight back in) — it breaks Vuetify's base styles.
- Plugins load with `@plugin "..."`, never `@import`. Never install `tailwindcss-animate` / `@tailwindcss/container-queries` (built in).

## Tailwind rules

- Mobile-first: base = mobile, scale up with `sm:`/`md:`/`lg:`; container queries (`@container`, `@md:`) for reusable components.
- Complete class names only — Tailwind cannot see `` `bg-${color}-500` ``; map to full strings.
- Conditional classes via Vue's array/object `:class`; add `clsx` + `tailwind-merge` only once a caller-supplied `class` must override internals.
- Arbitrary value used 3+ times → `@theme` token. `w-* h-*` same value → `size-*`.
- Extract a Vue component (not `@apply`) for a class list repeated 3+ times; `@apply` only for static, non-interactive styles.
- Transitions: `transition-colors`/`transition-transform`, never `transition-all`; 150–200 ms. Don't layer Tailwind transitions on Vuetify's built-in ones. Every animation honours `motion-safe:`/`motion-reduce:`.
- `sr-only` is the screen-reader utility (works without preflight).
