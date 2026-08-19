---
name: standard-vuetify
description: Vuetify 3 component usage, theming, and the Tailwind/Vuetify division of labor for this project (Tailwind preflight disabled). Use when writing or reviewing any Vuetify component, layout, form field, dialog, or icon usage.
user-invocable: false
---

> Targets Vuetify 3 (Material Design components) as installed in `src/plugins/vuetify.ts`. This project uses Vuetify + Tailwind **together** — the two are not competing systems, they have a fixed division of labor (see below). Do not port shadcn/Radix patterns from other projects; this stack has no shadcn.

---

## Division of Labor — Vuetify vs Tailwind

Full rationale lives in `src/assets/tailwind.css`. Summary:

| Concern                                                              | Owner        |
| --------------------------------------------------------------------- | ------------ |
| Buttons, inputs, selects, cards, dialogs, tables, menus, navigation    | **Vuetify**  |
| Layout, spacing, flex/grid, typography sizing, color utility, responsive breakpoints between/around components | **Tailwind** |
| Base reset / normalize                                                 | **Vuetify** (Tailwind preflight is OFF) |
| Icons                                                                  | **mdi** via Vuetify's icon system |

```vue
<!-- ✅ Vuetify component + Tailwind layout utilities -->
<div class="flex flex-col gap-4 p-6">
  <v-text-field v-model="url" label="URL to shorten" />
  <v-btn color="primary" block>Shorten</v-btn>
</div>

<!-- ❌ Hand-rolled button styled with Tailwind instead of v-btn -->
<button class="rounded bg-blue-600 px-4 py-2 text-white">Shorten</button>
```

- Never re-style a raw HTML element with Tailwind to imitate a Vuetify component that already exists (`v-btn`, `v-text-field`, `v-select`, `v-checkbox`, `v-card`, `v-dialog`, `v-alert`, `v-snackbar`, `v-progress-circular`, …). If Vuetify has it, use it.
- Tailwind utilities are for the **space between** and **around** Vuetify components (`flex`, `gap-*`, `p-*`, `grid-cols-*`, `text-sm`, `max-w-*`) — not for reimplementing component chrome (borders, shadows, focus rings) that Vuetify already provides via `variant`/`color` props.
- **Why preflight is off**: Tailwind's preflight resets button/input default styling and line-height, which conflicts with Vuetify's own base styles (broken spacing/typography on `v-btn`, `v-text-field`, etc. if both resets load). `src/assets/tailwind.css` imports only `tailwindcss/theme.css` + `tailwindcss/utilities.css` — no `tailwindcss/preflight.css`. Do not re-add preflight without re-auditing every Vuetify component for regressions.

---

## Component Usage

### Props over classes for component behavior/appearance

Vuetify components expose their own styling API (`color`, `variant`, `density`, `size`, `elevation`) — prefer these over overriding with Tailwind/CSS when a prop exists.

```vue
<!-- ✅ Use Vuetify's own props -->
<v-btn color="primary" variant="flat" size="large" :loading="isSubmitting">Shorten</v-btn>

<!-- ❌ Fighting Vuetify's styling with utility overrides -->
<v-btn class="bg-blue-600! text-white!">Shorten</v-btn>
```

### Forms

Use Vuetify field components (`v-text-field`, `v-select`, `v-checkbox`, `v-radio-group`, `v-textarea`) bound via VeeValidate (see `standard-vue/SKILL.md`). Bind validation state to Vuetify's native props — don't build a parallel error UI:

```vue
<v-text-field
  v-model="url"
  v-bind="urlAttrs"
  :error-messages="errors.url"
  label="URL"
  :disabled="isSubmitting"
/>
```

### Layout components

Prefer Vuetify's grid (`v-container`, `v-row`, `v-col`) for page-level responsive layout that needs Vuetify breakpoint alignment (matches Vuetify component gutters); use Tailwind `flex`/`grid` for smaller, local arrangements (icon + text rows, button groups, card internals) where Vuetify's grid would be overkill.

### Feedback / overlay components

Use Vuetify's built-ins for all transient UI:

- `v-snackbar` for toast/copy-confirmation feedback (not a hand-rolled toast)
- `v-dialog` for modals — comes with focus trap and `Escape`-to-close built in (verify against `standard-accessibility/SKILL.md` regardless)
- `v-progress-circular` / `v-progress-linear` for loading states — pair with `aria-busy` on the containing region for screen readers
- `v-alert` for inline success/error/warning banners (has a `type` prop mapping to color + icon automatically)

---

## Theming

- Vuetify theme (light/dark, brand colors) is configured centrally in `src/plugins/vuetify.ts` via `createVuetify({ theme: { ... } })` — add new brand tokens there, not as one-off `color` hex props scattered across components.
- Reference theme colors by name (`color="primary"`, `color="error"`) so dark mode and future re-theming apply automatically — never hardcode a hex value in a `style` binding or Tailwind arbitrary value (`bg-[#1976d2]`) for something Vuetify's theme already names.
- When a design needs a color Vuetify's theme doesn't have, add it to the theme config first (`colors: { brand: '#...' }`) rather than reaching for an inline value.

---

## Icons — mdi

`@mdi/font` is registered as Vuetify's default icon set (`src/plugins/vuetify.ts`):

```vue
<!-- ✅ mdi via Vuetify's icon prop -->
<v-btn icon="mdi-content-copy" aria-label="Copy link" />
<v-icon icon="mdi-qrcode" />

<!-- ✅ mdi via prepend/append slots -->
<v-text-field prepend-inner-icon="mdi-link-variant" />
```

- Icon names follow `mdi-<kebab-case-name>` — browse available icons at the MDI icon set before assuming one doesn't exist.
- Do not add a second icon library (lucide, heroicons, feather) — mdi covers the icon surface for this project; introducing a second set means two font/SVG payloads and inconsistent visual weight.
- Icon-only buttons (`<v-btn icon="...">` with no visible text) must carry `aria-label` describing the action — same rule as any icon-only control (see `standard-accessibility/SKILL.md`).
- Decorative icons alongside text (e.g. `prepend-icon` next to a labeled button) don't need `aria-label` — the visible text is already the accessible name.

---

## DO NOT

- Re-style a raw `<button>`/`<input>`/`<select>` with Tailwind when a Vuetify component already covers that role
- Re-add `tailwindcss/preflight.css` without auditing every Vuetify component for style regressions
- Hardcode hex colors in `style`/arbitrary Tailwind values when a Vuetify theme color name applies
- Build a hand-rolled toast/modal/spinner when `v-snackbar`/`v-dialog`/`v-progress-*` already exist
- Add a second icon library alongside mdi
- Override Vuetify component internals with `!important`/Tailwind `!` modifier instead of using the component's own `variant`/`color`/`density` props

---

## Code Review Checklist

### Blocking

- [ ] Raw HTML element hand-styled to imitate an existing Vuetify component
- [ ] `tailwindcss/preflight.css` re-introduced without regression audit
- [ ] Icon-only `v-btn`/`v-icon` button missing `aria-label`
- [ ] Hardcoded hex color used where a Vuetify theme token exists

### Warning

- [ ] Tailwind `!` modifier or `!important` used to fight a Vuetify component's own styling
- [ ] Second icon library introduced alongside mdi
- [ ] Custom toast/modal/spinner built instead of `v-snackbar`/`v-dialog`/`v-progress-*`
- [ ] Form field error rendered outside Vuetify's `:error-messages`/`:error` props

### Suggestion

- [ ] `v-container`/`v-row`/`v-col` used for a small local arrangement where a plain Tailwind flex/grid would be simpler
- [ ] Repeated `color`/`variant` combination across many components — consider a theme preset or wrapper component
- [ ] One-off Tailwind arbitrary color value that could become a named Vuetify theme color
