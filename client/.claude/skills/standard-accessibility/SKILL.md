---
name: standard-accessibility
description: WCAG 2.1 AA rules for the Vue 3 + Vuetify client — semantics, Vuetify field labels, live announcements for shorten/copy, focus after shorten, keyboard on history actions, QR alt text, disabled explainers, reduced motion. Use before writing, and when reviewing, any template, form, dialog or interactive element.
user-invocable: false
---

> Sources: WCAG 2.1, WAI-ARIA Authoring Practices, Vuetify a11y docs. Contrast values come from `docs/design-system/shorten-link/MASTER.md` — it beats this skill. Read this **before** writing a template, not after; "existing views do it too" is no excuse.

## 1. Semantics

- Native element or Vuetify component that renders one — never `<div @click>` / `<span @click>`.
- Action → `v-btn` (renders `<button>`). Navigation → `v-btn :to`/`href` or `RouterLink` (renders `<a href>`). Never `@click="router.push(...)"`.
- One `<h1>` per view, no skipped levels. `<main>` once in `App.vue`; `<header>`/`<nav>`/`<footer>` as landmarks.
- `<section aria-labelledby="x">` paired with `<h2 id="x">` (result, history).
- Lists of 2+ items (link history, recent codes) are `<ul>`/`<li>` or `v-list` — never stacked `<div>`s.
- Wrapper components keep attrs on the real control: `inheritAttrs` stays true, or `inheritAttrs: false` + `v-bind="$attrs"` on the interactive element.

## 2. Forms (Vuetify fields)

- Every `v-text-field`/`v-select`/`v-textarea` gets a `label` prop (i18n'd) — Vuetify wires it to a real `<label>`. `placeholder` is never the label.
- Errors only via `:error-messages` — Vuetify links them with `aria-describedby`, but Vuetify 3.12 does **not** set `aria-invalid`: bind it yourself, `:aria-invalid="errors.url ? 'true' : undefined"` (verified in F1 E2E). No disconnected error `<span>`.
- URL input: `type="url"`, `inputmode="url"`, `autocomplete="url"`, `spellcheck="false"`, `autocapitalize="off"`. Optional alias field says "optional" in its label or `hint`.
- Submit with Enter: the field and `v-btn type="submit"` live in a `<form @submit.prevent>`.
- Pending submit: `:loading="isPending"` on the `v-btn` (sets `aria-busy`); don't also disable the field silently.

## 3. Announcements — `useAnnounce`

Create once (`src/composables/useAnnounce.ts`) when the first case appears: a module-level `ref` rendered by a single region in `App.vue`. No ad-hoc live regions per feature.

```vue
<!-- App.vue -->
<div id="announcer" class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement }}</div>
```

Mandatory announce (all text from `en` + `vi` locale keys, never hardcoded):

| Event | Message |
| --- | --- |
| Link shortened | short URL is ready (include the URL) |
| Copy to clipboard success / failure | copied / copy failed |
| QR downloaded | QR saved |
| History item removed / history cleared | removed / cleared, with remaining count |
| Shorten failed (network, rate-limit, invalid) | the error — `assertive` only for blocking errors |
| Route change | new page title |

`v-snackbar` alone is not enough — it is not reliably announced; pair it with `announce()` (or verify its `role="status"` reads with a screen reader).

## 4. Focus

- After shorten success: move focus to the result heading (`tabindex="-1"`) or the short-URL Copy button with `await nextTick()` — never leave focus on a button that just got re-rendered.
- After removing a history item: focus the next item's action, else the previous, else the list heading. After clear-all: focus the shorten input.
- Route change: `router.afterEach` focuses the view's `<h1>` (`tabindex="-1"`) and announces the title.
- `v-dialog` (confirm clear history, QR enlarge): `aria-labelledby` → `v-card-title id`; focus returns to the trigger on close — verify, especially with `persistent`.
- Visible focus on every control; never `outline: none` without a ≥3:1, ≥2px replacement. No `tabindex` > 0.
- First focusable element: skip link `<a href="#main" class="sr-only focus:not-sr-only">` (i18n'd).

## 5. Keyboard — history list & actions

- Each history row's actions (copy, open, QR, remove) are real `v-btn`s reachable by Tab in reading order; no hover-only actions — anything revealed on hover also shows on `:focus-within`.
- Icon-only `v-btn`: `aria-label` includes the target, e.g. `t('history.copyAria', { code })` → "Copy short link abc123", not just "Copy".
- Open-original links: `target="_blank"` + `rel="noopener noreferrer"` + sr-only "(opens in new tab)".
- `v-menu` overflow actions: Arrow keys move, Esc closes and returns focus to the trigger.
- Destructive remove/clear needs confirm or undo (snackbar action reachable by keyboard before it times out — `timeout="-1"` or ≥ 6 s).

## 6. Images, icons, color

- QR `<img>`/`<canvas>`: `alt`/`aria-label` states the destination, e.g. "QR code for https://sho.rt/abc123" — never `alt=""` or just "QR code".
- Decorative `v-icon` next to text → `aria-hidden="true"`; decorative emoji → `<span aria-hidden="true">`.
- Never color alone: copy success = icon + text; errors = icon + text, not a red border.
- Numbers need context for screen readers: `<span class="sr-only">{{ t('stats.clicks') }}: </span>{{ clicks }}`.
- Contrast: 4.5:1 text, 3:1 large text / UI / focus ring.

## 7. Disabled needs an explainer

A grey control with no reason is a bug.

- Shorten disabled because invalid → the field's inline `:error-messages` explains it; otherwise keep the button enabled and validate on submit.
- Rate-limited → visible text or `v-tooltip` with the wait time.
- Copy/QR before a link exists → hide, don't disable.
- `v-tooltip` on a `disabled` `v-btn` never fires: wrap the button in a `<span tabindex="0" v-bind="props">`, or use `aria-disabled="true"` + guard the handler.
- Before finishing a feature, grep `:disabled=` in its files and justify each.

## 8. Motion

- Every custom transition/animation honours `prefers-reduced-motion` (`motion-reduce:` utilities or a media query); success/copy feedback must not rely on animation.
- No auto-playing animation > 5 s without pause; nothing flashing ≥ 3 Hz.
