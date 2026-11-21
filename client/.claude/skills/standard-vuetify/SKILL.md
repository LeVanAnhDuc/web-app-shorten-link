---
name: standard-vuetify
description: Vuetify 3 rules for this project — component choice, props over classes, form binding, theme colors, mdi icons. Use when writing or reviewing any Vuetify component, form field, dialog, feedback UI or icon.
user-invocable: false
---

> Sources: Vuetify 3 docs (vuetifyjs.com), `src/plugins/vuetify.ts`, `src/assets/tailwind.css`. Token values (colors, fonts, radius) come from `docs/design-system/shorten-link/MASTER.md` — it beats this skill.

Vuetify owns every component's chrome; Tailwind only spaces things around it (split stated in `client/.claude/CLAUDE.md`, utilities in `standard-tailwind`).

- If Vuetify has the component, use it — never a raw `<button>`/`<input>`/`<select>` restyled with Tailwind. No shadcn/Radix patterns ported from other projects.
- Appearance via the component's own props (`color`, `variant`, `density`, `size`, `elevation`, `rounded`) — never Tailwind `!` / `!important` overrides on a `v-*` component.
- Colors by theme name only (`color="primary"`, `color="error"`). Never a hex in `style`, a `color="#..."` prop, or `bg-[#...]`. A missing color → add it to the theme in `src/plugins/vuetify.ts` (value from MASTER.md) first.
- Dark mode is Vuetify's theme (`useTheme()`), not Tailwind `dark:` classes on a `v-*` component.
- Feedback/overlays use built-ins: `v-snackbar` (copy confirmation, toasts), `v-dialog`, `v-alert` (`type` maps color + icon), `v-progress-*`. Never hand-rolled.
- Loading buttons: `:loading="isPending"` on `v-btn` — no separate spinner, no manual loading ref.
- Navigation `v-btn` takes `:to="{ name: '...' }"` or `href` (renders `<a>`); never `@click="router.push(...)"`.
- Page-level grid that must align with Vuetify gutters → `v-container`/`v-row`/`v-col`; small local arrangements (icon + text, button groups) → Tailwind `flex`/`grid`.

## Forms

Fields are `v-text-field`/`v-textarea`/`v-select`/`v-checkbox` bound to VeeValidate (`standard-vue`). Errors render only through Vuetify — no parallel error `<span>`, no `:rules` alongside a Zod schema.

```vue
<v-text-field
  v-model="url"
  v-bind="urlAttrs"
  :label="t('shorten.urlLabel')"
  :error-messages="errors.url"
  :disabled="isPending"
  prepend-inner-icon="mdi-link-variant"
/>
```

## Icons — mdi only

- `@mdi/font` is the only icon set: `icon="mdi-content-copy"`, `prepend-icon`, `<v-icon icon="mdi-qrcode" />`. Never add lucide/heroicons/a second set.
- Icon-only `v-btn` needs an i18n'd `aria-label` naming the action, not the icon. Decorative `v-icon` next to text → `aria-hidden="true"` (see `standard-accessibility`).

## Do not

- Re-add `tailwindcss/preflight.css` — it breaks Vuetify's base styles; needs a full component regression audit first.
- Register a second component library or override `.v-*` internals in global CSS.
