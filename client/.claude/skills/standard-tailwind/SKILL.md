---
name: standard-tailwind
description: Tailwind CSS v4 rules for this Vite + Vuetify project (preflight off, utilities for layout/spacing/typography only). Use when writing or reviewing Tailwind classes or src/assets/tailwind.css.
user-invocable: false
---

> Sources: Tailwind CSS v4 docs (tailwindcss.com), `src/assets/tailwind.css`. Token values come from `docs/design-system/shorten-link/MASTER.md` — it beats this skill.

## Setup — do not change

- v4 CSS-first via `@tailwindcss/vite`: no `tailwind.config.js`, no PostCSS config, no `content: []`.
- `src/assets/tailwind.css` imports only `tailwindcss/theme.css` + `tailwindcss/utilities.css`. Never add `preflight.css` or `@import 'tailwindcss'` (pulls preflight back in) — Vuetify owns the reset.
- Plugins load with `@plugin "..."`, never `@import`. Never install `tailwindcss-animate` / `@tailwindcss/container-queries` (built in).

## Scope

- Tailwind = layout, spacing, sizing, typography and responsive arrangement **around** Vuetify components (`flex`, `gap-4`, `p-6`, `max-w-*`, `text-sm`).
- Never restyle a `v-*` component's chrome (bg, border, shadow, focus ring) with utilities — use its props (`standard-vuetify`).
- Color: anything rendered by a Vuetify component uses the Vuetify theme. Add a `@theme` `--color-*` token only for Tailwind-owned markup (page wash, divider), taking the value from MASTER.md — never a second, parallel color system for the same role.
- No palette classes picked by taste (`bg-indigo-500`, `text-slate-600`) and no arbitrary colors (`bg-[#...]`) — tokens only.
- `dark:` only on Tailwind-owned elements, always paired with the light value; Vuetify components follow Vuetify's theme.

## Rules

- Mobile-first: base = mobile, scale up with `sm:`/`md:`/`lg:`; container queries (`@container`, `@md:`) for reusable components.
- Complete class names only — Tailwind cannot see `` `bg-${color}-500` ``; map to full strings.
- Conditional classes via Vue's array/object `:class`; add `clsx` + `tailwind-merge` only once a caller-supplied `class` must override internals.
- Arbitrary value used 3+ times → `@theme` token. `w-* h-*` same value → `size-*`.
- Extract a Vue component (not `@apply`) for a class list repeated 3+ times; `@apply` only for static, non-interactive styles.
- Transitions: `transition-colors`/`transition-transform`, never `transition-all`; 150–200 ms for interaction. Don't layer Tailwind transitions on Vuetify's built-in ones. Every animation honours `motion-safe:`/`motion-reduce:` or a `prefers-reduced-motion` rule.
- No `!important` / `!` modifier — fix specificity instead.
- `sr-only` is the screen-reader utility (works without preflight).
