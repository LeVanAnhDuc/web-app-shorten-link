---
name: standard-tailwind
description: Tailwind CSS v4 standards for this Vite + Vuetify project — design tokens, dark mode, responsive layout, component extraction, and the Vuetify/Tailwind division of labor (preflight disabled). Use when writing or reviewing Tailwind utility classes or theme configuration.
---

> Targets Tailwind CSS v4 as wired in this project: `@tailwindcss/vite` plugin (see `vite.config.ts`) + `src/assets/tailwind.css`. No `tailwind.config.js` — v4 is CSS-first. **Preflight is intentionally disabled** — see the Vuetify section below before touching the import lines.

---

## Configuration — as wired in this project

`src/assets/tailwind.css` imports two of Tailwind's three layers, deliberately skipping `preflight`:

```css
@import 'tailwindcss/theme.css';
@import 'tailwindcss/utilities.css';
/* tailwindcss/preflight.css is intentionally NOT imported — see rationale below */
```

Build integration is the `@tailwindcss/vite` plugin in `vite.config.ts` — no PostCSS config, no `content: []` array, no `tailwind.config.js`. Content detection is automatic.

### Why preflight is off — Vuetify coexistence

Vuetify ships its own base/reset styles (typography, box-sizing, form element resets) tuned for its components. Tailwind's preflight applies a competing reset (strips button/input default styling, resets line-height) that fights Vuetify's component styling — buttons, inputs, and cards render with broken spacing/typography if both resets load.

**Resolution in this project**: import only `theme` (design tokens consumed by utility classes) and `utilities` (the utility classes themselves) — skip `preflight` entirely. Tailwind utility classes (`flex`, `p-4`, `text-sm`, …) work everywhere; Vuetify's own base styles remain the only reset applied to the page. See `standard-vuetify/SKILL.md` for the full component/utility division of labor.

**Do not** re-add `@import 'tailwindcss/preflight.css'` without auditing every Vuetify component (`v-btn`, `v-text-field`, `v-card`, etc.) for regressions across the whole app.

---

## Design Tokens — `@theme`

Define custom tokens in `@theme` in `src/assets/tailwind.css` — never as hardcoded arbitrary values scattered through components.

```css
@import 'tailwindcss/theme.css';
@import 'tailwindcss/utilities.css';

@theme {
  --color-brand-500: oklch(0.68 0.15 250);
  --color-brand-900: oklch(0.25 0.08 250);
}
```

`@theme` variables auto-generate utility classes: `--color-brand-500` → `bg-brand-500`, `text-brand-500`, `border-brand-500`.

- Any color format is valid (`hex`, `rgb`, `hsl`, `oklch`) but do not mix formats within the same project — this project's Tailwind defaults are `oklch` (v4 default palette).
- **Brand/semantic color is owned by Vuetify's theme** (`src/plugins/vuetify.ts`) for anything rendered through a Vuetify component (`color="primary"`). Only add Tailwind `@theme` color tokens for colors used in **layout-level Tailwind utility markup** that isn't a Vuetify component prop (e.g. a page background wash, a decorative divider) — don't maintain two parallel color systems for the same semantic role.
- Before adding a new arbitrary color value, check whether Vuetify's theme already names it — reuse that name/value rather than duplicating a slightly different hex in `@theme`.

---

## Dark Mode

### Class-based (manual switcher)

```css
@import 'tailwindcss/theme.css';
@import 'tailwindcss/utilities.css';
@custom-variant dark (&:where(.dark, .dark *));
```

```html
<html class="dark">
  <body class="bg-white text-black dark:bg-black dark:text-white"></body>
</html>
```

### Media-based (system preference)

No configuration needed — `dark:` variant responds to `prefers-color-scheme: dark` by default.

### Rules

- Always pair light + dark variants for every themed Tailwind-owned element
- Vuetify components handle their own dark mode via Vuetify's theme system (`theme: { defaultTheme: 'light' | 'dark' }`) — don't apply Tailwind `dark:` classes onto a Vuetify component expecting it to override Vuetify's internal theme
- Never hardcode light-only or dark-only colors without providing the opposite variant

---

## Responsive Design

Mobile-first always. Base styles = mobile, scale up with breakpoints:

```html
<div class="flex flex-col md:flex-row lg:gap-8"></div>
```

### Viewport breakpoints vs Container queries

| Use                          | When                                                    |
| ----------------------------- | -------------------------------------------------------- |
| `sm:`, `md:`, `lg:`            | Page-level layouts — respond to viewport width          |
| `@container`, `@sm:`, `@lg:`   | Reusable components — respond to parent container width |

```html
<!-- Viewport: page layout -->
<main class="grid grid-cols-1 md:grid-cols-3">
  <!-- Container: reusable card component -->
  <div class="@container">
    <div class="flex flex-col @md:flex-row"></div>
  </div>
</main>
```

Container queries are built into v4 core — no plugin needed. For page-level responsive grid that should follow **Vuetify's** breakpoints (matching Vuetify component gutters), prefer `v-container`/`v-row`/`v-col` instead (see `standard-vuetify/SKILL.md`) — reserve Tailwind viewport breakpoints for layout outside/around Vuetify's grid.

---

## Component Extraction

Extract when:

- Same class combination appears **3+ times** across the codebase
- Class list has **complex state variants** (hover, focus, disabled, aria)
- The block has meaningful semantic identity

Extract to:

- **A Vue component** for dynamic or interactive elements — preferred
- **`@apply` in CSS** only for static, non-interactive patterns (e.g. prose styles)

```css
/* ✅ Acceptable @apply — static pattern */
@layer components {
  .badge {
    @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium;
  }
}
```

Never use `@apply` heavily — it defeats the utility-first approach and produces larger, harder-to-maintain CSS. And never reach for `@apply` to reimplement something a Vuetify component prop already does (see `standard-vuetify/SKILL.md`).

---

## Custom Utilities — `@utility`

For reusable utilities that compose with variants (`hover:`, `md:`, `dark:`):

```css
@utility container-fluid {
  width: 100%;
  max-width: 1440px;
  margin-inline: auto;
  padding-inline: 1rem;
}

/* Usage: class="container-fluid" or "md:container-fluid" */
```

---

## Animations

Define animations in `@theme` to generate `animate-*` utilities:

```css
@theme {
  --animate-fade-in: fade-in 0.3s ease-out;

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

### Animation rules

- Use `transition-colors` or `transition-transform` — never `transition-all` (animates every property, expensive)
- Interaction transitions: 150–200ms. Layout changes: 300ms max
- Every animation must be purposeful — no decorative animations without intent
- Vuetify components already provide their own transitions (ripple, dialog enter/leave) — don't layer a competing Tailwind transition on top of a Vuetify component's built-in one
- Always implement `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Plugins — `@plugin` directive

```css
/* ✅ v4 */
@plugin "@tailwindcss/typography";

/* ❌ Does not work as CSS import */
@import "@tailwindcss/typography";
```

### Deprecated packages — do not install

```
tailwindcss-animate    ← deprecated, causes build errors
tw-animate-css         ← does not exist
```

Use native `@keyframes` in `@theme` instead.

---

## Arbitrary Values

```html
<div class="top-[117px]">
  <div class="bg-[#1da1f2]">
    <div class="grid-cols-[200px_1fr_1fr]"></div>
  </div>
</div>
```

- Use `_` for spaces: `grid-cols-[200px_1fr]`
- Arbitrary value used 3+ times → move to `@theme` token
- Prefer design system scale over one-off arbitrary values
- Arbitrary color values (`bg-[#...]`) are a signal to check Vuetify's theme first — see Design Tokens section above

---

## Performance

- v4 auto-detects template files (including `.vue` SFCs) — no `content: []` configuration needed
- Never construct class names dynamically with template/string interpolation:

```ts
// ❌ Tailwind cannot detect — class will be purged
const cls = `bg-${color}-500`

// ✅ Complete class names only
const colorMap: Record<string, string> = { blue: 'bg-blue-500', red: 'bg-red-500' }
const cls = colorMap[color]
```

- Never use `@apply` inside a loop — generates duplicate CSS
- Use `content-visibility: auto` for long scrollable lists (add as custom utility)
- Compose conditional classes with Vue's native array/object class binding (no `tailwind-merge` needed for simple cases):

```vue
<div :class="['flex gap-4', isActive && 'bg-brand-500', props.class]"></div>
```

If class-conflict resolution becomes necessary (merging a caller-supplied `class` prop with internal conditional classes reliably), add `tailwind-merge` + `clsx` rather than hand-rolling precedence logic.

---

## v3 → v4 Migration Reference

| v3                                     | v4                                     | Note                              |
| --------------------------------------- | --------------------------------------- | ---------------------------------- |
| `tailwind.config.js`                   | `@theme {}` in CSS                     | Config still works but is legacy  |
| `@tailwind base/components/utilities`  | `@import "tailwindcss/theme.css"` etc. | This project imports layers individually to skip preflight |
| `plugins: [require('...')]`            | `@plugin "..."`                        | Require syntax breaks             |
| `content: [...]`                       | Auto-detected                          | No config needed                  |
| `theme.extend.colors`                  | `--color-*` in `@theme`                | CSS variables replace JS          |
| `@tailwindcss/container-queries`       | Built-in core                          | Remove plugin                     |
| `tailwindcss-animate`                  | native `@keyframes` in `@theme`        | Deprecated                        |
| `darkMode: 'class'` in config           | `@custom-variant dark` in CSS          | —                                  |
| PostCSS plugin (`postcss.config.js`)   | `@tailwindcss/vite` plugin             | This project uses the Vite plugin, not PostCSS |
| Colors in `rgb` / `hsl`                | `oklch` default                        | Can still use other formats       |
| `w-* h-*` pair                         | `size-*`                               | New shorthand                     |

---

## Anti-Patterns

- **Arbitrary values everywhere** (`w-[237px]`) — use design system scale
- **`!important`** — fix specificity, never force override
- **Dynamic class strings** (`` `text-${color}-500` ``) — Tailwind purges these at build
- **Duplicate long class lists** — extract to a Vue component
- **Heavy `@apply`** — prefer component extraction
- **`transition-all`** — use specific properties (`transition-colors`, `transition-transform`)
- **`@import "..."`** for plugins — use `@plugin "..."` in v4
- **Mixing color formats** (`oklch` + `hsl`) in same project
- **Re-adding `preflight.css`** without a full Vuetify regression audit
- **Restyling a Vuetify component's chrome with Tailwind** instead of using its own props (see `standard-vuetify/SKILL.md`)

---

## Code Review Checklist

### Blocking

- [ ] `tailwindcss-animate` in dependencies
- [ ] `@import "@tailwindcss/..."` instead of `@plugin`
- [ ] Dynamic class construction with string interpolation
- [ ] `tailwindcss/preflight.css` re-introduced without a Vuetify regression audit
- [ ] Color formats mixed in same project (`oklch` + `hsl`)

### Warning

- [ ] `tailwind.config.js` added instead of using `@theme`
- [ ] `@tailwindcss/container-queries` plugin installed — redundant in v4
- [ ] `@apply` inside a component rendered in a loop
- [ ] Arbitrary value used 3+ times — move to `@theme`
- [ ] `transition-all` used instead of specific transition property
- [ ] Dark mode missing opposite variant for a Tailwind-owned themed element
- [ ] Animation missing `prefers-reduced-motion` handling
- [ ] Tailwind used to restyle a Vuetify component's own chrome instead of using its props

### Suggestion

- [ ] Same class combo 3+ times — consider component extraction
- [ ] Custom color as arbitrary `bg-[#...]` where a Vuetify theme color already exists
- [ ] Viewport breakpoint used where a container query, or Vuetify's own grid, would be more appropriate
- [ ] Decorative animation without intent justification
- [ ] `w-* h-*` pair replaceable with `size-*`
