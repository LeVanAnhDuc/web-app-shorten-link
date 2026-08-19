---
name: standard-accessibility
description: Web accessibility standards targeting WCAG 2.1 AA compliance for HTML/CSS/JS and Vue 3 + Vuetify. Use when writing or reviewing any UI component, page layout, form, modal, navigation, or interactive element.
user-invocable: false
---

## Semantic HTML

- Use native HTML elements before reaching for ARIA — `<button>` not `<div @click>`
- Heading hierarchy must be logical and sequential: `h1` → `h2` → `h3`, never skip levels
- One `<h1>` per page
- Use landmark elements to define page regions

```html
<header>
  <!-- site header, nav -->
  <nav>
    <!-- navigation -->
    <main>
      <!-- primary content, one per page -->
      <aside>
        <!-- supplementary content -->
        <footer>
          <!-- site footer -->
          <section>
            <!-- thematic grouping, needs a heading -->
            <article><!-- self-contained content --></article>
          </section>
        </footer>
      </aside>
    </main>
  </nav>
</header>
```

- `<button>` for actions, `<a>` for navigation — never swap them. Vuetify's `<v-btn>` renders a `<button>` by default, or an `<a>` when given an `href`/`to` prop — pass `href`/`to` for navigation, not `@click="router.push(...)"` on a plain button-rendered `v-btn`.
- `<a>` must have an `href` — `<a>` without `href` is not keyboard focusable
- Use `<ul>` / `<ol>` for lists of 2+ items — never use `<div>` or `<span>` for list-like content
- Use `<table>` only for tabular data, never for layout

---

## ARIA

Use ARIA only when native HTML cannot achieve the same semantic meaning.

### Required ARIA patterns

```html
<!-- Icon-only buttons must have a label -->
<button aria-label="Close dialog">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Decorative images -->
<img src="decoration.png" alt="" />

<!-- Informative images -->
<img src="chart.png" alt="Revenue increased 23% in Q4 2024" />

<!-- Toggle state -->
<button aria-pressed="true">Mute</button>
<button aria-expanded="false" aria-controls="menu-id">Menu</button>

<!-- Invalid form field -->
<input aria-invalid="true" aria-describedby="email-error" />
<span id="email-error" role="alert">Email format is invalid</span>

<!-- Loading state -->
<div aria-live="polite" aria-busy="true">Loading results...</div>

<!-- Hidden from screen readers -->
<span aria-hidden="true">★★★★☆</span>
<span class="sr-only">4 out of 5 stars</span>
```

### ARIA rules

- Never use `aria-label` on non-interactive elements unless they have a role
- `aria-hidden="true"` removes element and all children from accessibility tree — never apply to focusable elements
- `aria-describedby` for supplementary info, `aria-labelledby` for primary label
- Dynamic content that updates without page reload must use `aria-live`

| `aria-live` value | When to use                                        |
| ------------------ | ---------------------------------------------------- |
| `polite`           | Non-urgent updates — search results, form feedback   |
| `assertive`        | Urgent updates — errors, critical alerts             |
| `off`              | Updates user doesn't need to know about              |

---

## Keyboard Navigation

- All interactive elements must be reachable and operable via keyboard alone
- Tab order must follow visual reading order (top-left to bottom-right)
- Never use `tabindex` > 0 — it breaks natural tab order
- `tabindex="0"` only when making a non-interactive element focusable (rare)
- `tabindex="-1"` for programmatic focus only (e.g. focus trap in modal)

### Keyboard interactions by component

| Component          | Required keyboard behavior                               |
| -------------------- | ------------------------------------------------------------ |
| Button              | `Enter`, `Space` activates                                    |
| Link                | `Enter` activates                                              |
| Checkbox            | `Space` toggles                                                |
| Radio group         | `Arrow` keys move between options                              |
| Select / Dropdown   | `Arrow` keys navigate, `Enter` selects, `Escape` closes        |
| Modal (`v-dialog`)  | `Escape` closes, focus trapped inside while open               |
| Tab panel (`v-tabs`)| `Arrow` keys switch tabs                                       |
| Tooltip (`v-tooltip`)| Appears on focus, dismissed with `Escape`                      |
| Date picker         | `Arrow` keys navigate dates                                    |

Vuetify's `v-dialog`, `v-menu`, `v-tabs`, `v-tooltip` implement most of this out of the box — verify, don't assume, especially for `v-dialog` focus-trap and `Escape`-to-close when custom `persistent`/`no-click-animation` props are set.

---

## Focus Management

- Visible focus indicator required on all interactive elements — never `outline: none` without a replacement
- Focus indicator: minimum 3:1 contrast ratio against adjacent colors, minimum 2px outline

```css
/* Never */
:focus {
  outline: none;
}

/* Acceptable — custom focus style */
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

- On modal open: move focus to first focusable element inside modal (Vuetify's `v-dialog` does this by default)
- On modal close: return focus to the element that triggered the modal
- On route change (Vue Router): move focus to `<main>` or the page heading
- Focus trap in modals: Tab cycles through focusable elements inside, never escapes to background

### Skip navigation

Every page must have a skip link as the first focusable element:

```html
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>
<main id="main-content">...</main>
```

---

## Color & Contrast

WCAG 2.1 AA minimum contrast ratios:

| Text type                                | Ratio |
| ------------------------------------------- | ----- |
| Normal text (< 24px or < 18px bold)         | 4.5:1 |
| Large text (≥ 24px or ≥ 18px bold)          | 3:1   |
| UI components, icons, focus indicators      | 3:1   |

- Never convey information by color alone — always pair with text, icon, or pattern
- Error states: red color + error icon + error text (not red border alone)
- Disabled elements are exempt from contrast requirements but must still look disabled

```html
<!-- Bad — color only -->
<span style="color: red">Required</span>

<!-- Good — color + text indicator -->
<span style="color: red" aria-hidden="true">*</span>
<span class="sr-only">Required</span>
```

---

## Forms

- Every input must have a visible `<label>` — never use `placeholder` as a label substitute. Vuetify field components (`v-text-field`, `v-select`, `v-textarea`) render a proper associated `<label>` from their `label` prop — always pass `label`, never rely on `placeholder` alone.
- `<label>` must be programmatically associated via `for`/`id` or wrapping (handled automatically by Vuetify field components when given `label`)

```html
<!-- Explicit association -->
<label for="email">Email address</label>
<input id="email" type="email" name="email" />
```

- Required fields: use `required` attribute + visual indicator (not asterisk alone)
- Validation errors: bind to Vuetify's `:error-messages`/`:error` props (see `standard-vue/SKILL.md` VeeValidate example) — this wires `aria-invalid`/`aria-describedby` for you; do not build a parallel error `<span>` disconnected from the field
- Error messages must appear inline, below the field — not at top of form only
- Group related inputs with `<fieldset>` + `<legend>` (radio groups, checkboxes), or Vuetify's `v-radio-group`/`v-checkbox` with a `label` prop describing the group
- `autocomplete` attribute required on common fields: `name`, `email`, `tel`, `new-password`, `current-password`, `street-address` — pass through as a native attr on Vuetify field components (they forward unrecognized attrs to the underlying `<input>`)

```html
<fieldset>
  <legend>Notification preference</legend>
  <label><input type="radio" name="notify" value="email" /> Email</label>
  <label><input type="radio" name="notify" value="sms" /> SMS</label>
</fieldset>
```

---

## Images & Media

- All `<img>` must have `alt` attribute — empty string `alt=""` for decorative images
- Alt text describes the purpose, not the appearance: "Bar chart showing 23% revenue increase" not "image of a chart"
- SVG used as content: add `role="img"` + `<title>` inside SVG
- SVG used as decoration: `aria-hidden="true"`
- QR code images (this project generates them via `qrcode`) are informational, not decorative — `alt` must describe what scanning it does, e.g. `alt="QR code linking to the shortened URL"`, never `alt=""` or `alt="QR code"` alone
- Video must have captions (auto-generated captions do not count as WCAG-compliant)
- Audio must have transcript
- Never use images of text — use real text with CSS styling

---

## Motion & Animation

- All animations must respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- Auto-playing animations that last more than 5 seconds must have pause/stop control
- Never use flashing content with frequency 3Hz or more (seizure risk)

---

## Vue 3 / Vuetify Specific

### Component rules

- Prefer native HTML elements or Vuetify components that render them correctly — `<v-btn>`/`<button>`, not `<div @click>`
- Pass `aria-*`/`id`/`role` attributes through to the underlying DOM element in custom wrapper components. Vue 3 forwards non-prop attributes to the root element automatically (`inheritAttrs: true` by default) — verify this isn't disabled, and if a component has multiple root-level candidates, bind `v-bind="$attrs"` explicitly to the intended element:

```vue
<!-- ❌ inheritAttrs disabled with no explicit forwarding — aria-label is lost -->
<script setup lang="ts">
defineOptions({ inheritAttrs: false })
</script>
<template>
  <div class="wrapper">
    <button @click="$emit('click')"><slot /></button>
  </div>
</template>

<!-- ✅ Explicitly forward attrs to the actual interactive element -->
<script setup lang="ts">
defineOptions({ inheritAttrs: false })
</script>
<template>
  <div class="wrapper">
    <button v-bind="$attrs" @click="$emit('click')"><slot /></button>
  </div>
</template>
```

### Dynamic content

- Use `aria-live` regions for content that updates without navigation
- Mount a single announcer region at the app root (e.g. in `App.vue`) and update it via a small composable rather than sprinkling ad hoc live regions per feature:

```vue
<!-- App.vue -->
<template>
  <div aria-live="polite" aria-atomic="true" class="sr-only" id="announcer">{{ announcement }}</div>
  <RouterView />
</template>
```

```ts
// src/composables/useAnnounce.ts
import { ref } from 'vue'

const announcement = ref('')

export function useAnnounce() {
  function announce(message: string) {
    announcement.value = message
  }
  return { announcement, announce }
}
```

### Route changes (Vue Router)

- On every route change, move focus to `<main>` or the page `<h1>`
- Announce the route change to screen readers via the shared live region

```ts
// src/router/index.ts
router.afterEach((to) => {
  const heading = document.querySelector('h1')
  if (heading) {
    heading.setAttribute('tabindex', '-1')
    heading.focus()
  }
})
```

### Modal / Dialog

- Vuetify's `v-dialog` sets `role="dialog"` and manages `aria-modal`/focus-trap by default — still pass an explicit `aria-labelledby` (or `v-card-title` with a matching `id`) so the dialog has an accessible name
- Return focus to the trigger element on close — verify this holds when `v-dialog` is driven by a `v-model` bound to a ref set from multiple trigger points (each trigger's element reference must be tracked if you need to return focus to the *specific* trigger)

```vue
<v-dialog v-model="isOpen" aria-labelledby="confirm-title">
  <v-card>
    <v-card-title id="confirm-title">Confirm deletion</v-card-title>
    ...
  </v-card>
</v-dialog>
```

---

## Screen Reader Only Utility

Required in every project:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

Use `.sr-only` for: skip links (visible on focus), supplementary labels, status announcements, icon button labels.

---

## DO NOT

- Use `<div>` or `<span>` for interactive elements — use `<button>`/`<v-btn>` or `<a>`
- Remove focus outline without providing a visible replacement
- Use `tabindex` > 0
- Use placeholder text as the only label for an input
- Convey information with color alone
- Apply `aria-hidden="true"` to focusable elements
- Auto-play video or audio with sound
- Use images of text
- Skip heading levels (h1 → h3)
- Use `<table>` for layout
- Rely on auto-generated captions for video compliance
- Use `aria-label` on non-interactive, non-landmark elements
- Disable `inheritAttrs` without explicitly forwarding `v-bind="$attrs"` to the real interactive element

---

## Code Review Checklist

### Blocking

- [ ] Interactive element not reachable by keyboard
- [ ] `<input>`/Vuetify field missing associated `label`
- [ ] `outline: none` with no replacement focus style
- [ ] Color used as the only means to convey information
- [ ] `aria-hidden="true"` on focusable element
- [ ] Image (or generated QR code) missing meaningful `alt` attribute
- [ ] Modal missing focus trap or accessible name (`aria-labelledby`)
- [ ] `<div>` or `<span>` used for button/link behavior
- [ ] Heading levels skipped
- [ ] `inheritAttrs: false` set without forwarding `v-bind="$attrs"` to the intended element

### Warning

- [ ] Contrast ratio below 4.5:1 for normal text or 3:1 for large text / UI
- [ ] `tabindex` > 0 used
- [ ] Dynamic content update without `aria-live` region
- [ ] Icon-only button (`v-btn icon`) missing `aria-label`
- [ ] Form error not linked to field via `:error-messages`/`aria-describedby`
- [ ] `aria-invalid` not set on invalid field
- [ ] Animation missing `prefers-reduced-motion` handling
- [ ] Route change missing focus management (Vue Router `afterEach`)
- [ ] `autocomplete` missing on common form fields

### Suggestion

- [ ] `<section>` or `<article>` missing a heading
- [ ] Radio/checkbox group missing `<fieldset>` + `<legend>` (or Vuetify group `label`)
- [ ] Skip navigation link missing
- [ ] SVG content missing `role="img"` + `<title>`
- [ ] Custom wrapper component not forwarding `aria-*` props to the DOM element

---

## A11y Baseline Patterns (MANDATORY on every UI build)

`lint`/`type-check` pass ≠ a11y pass — no lint rule catches `aria-pressed`, `aria-current`, `scope`, `caption`, label association. Manual audit against the checklist below is **required** before finalizing a feature.

Khi user hỏi "có a11y chưa" — câu trả lời mặc định nếu không proactive audit là **"chưa đủ"**. Pre-empt bằng cách audit ngay khi finalize feature, không chờ user hỏi.

### Quick-fix table

| Pattern                                                                                       | Rule                                                                                                                       |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Decorative mdi icon (inside a button that already has text, gradient bg, rating row, dropdown chevron) | `aria-hidden="true"` on the `<v-icon>` (mdi doesn't auto-hide itself)                                                        |
| Icon-only `v-btn`                                                                               | `aria-label="..."` mô tả action (không phải tên icon)                                                                        |
| Toggle button (chip filter, view mode, favorite)                                                | `aria-pressed={isActive}`                                                                                                    |
| Pagination current page                                                                         | `aria-current="page"`                                                                                                        |
| Search `v-text-field`                                                                           | `label` prop set (Vuetify wires it to a real `<label>`) — KHÔNG dựa `placeholder` alone                                     |
| `v-data-table` / raw `<table>`                                                                   | `<caption class="sr-only">` + `scope="col"` trên `<th>` nếu dùng raw `<table>`; `v-data-table` handles this internally — verify with a screen reader before trusting defaults |
| Card click / clickable surface                                                                  | `<v-btn variant="text">` wrapping the card content, or `<div role="button" tabindex="0" @keydown.enter>` only as a last resort — prefer a real button |
| Section landmark                                                                                 | `<section aria-labelledby="...">` link tới `<h2 id="...">` để region landmark có accessible name                            |
| Toolbar wrapper (e.g. history filters)                                                          | `<nav aria-label="...">` HOẶC `role="toolbar" aria-label="..."`                                                              |
| List of items (link history rows, recent codes)                                                 | `<ul>` + `<li>` cho list-like content — không `<div>` (SR không announce "list of N items")                                 |
| Emoji decorative ("🔗", "✅")                                                                     | `<span aria-hidden="true">🔗</span>` (SR sẽ đọc tên emoji dài dòng nếu không hide)                                          |
| Status conveyed by color + text (copy-success dot + label)                                      | Dot phải `aria-hidden="true"` (text đã đủ context, đọc dot là duplicate)                                                     |
| Number-with-context (click count)                                                                | `<span class="sr-only">Clicks: </span>{{ clickCount }}` để SR đọc "Clicks: 12" thay vì đọc số trần                          |

### Process

- Khi build component mới, đọc `standard-accessibility/SKILL.md` **TRƯỚC** khi viết template, không phải sau.
- "Pre-existing views cũng dùng pattern này" → **KHÔNG** phải excuse. Phải chủ động fix khi thêm code mới.
- Focus của build phase thường là "match design" (visual + interaction) → semantic layer bị bỏ quên. Audit theo bảng trên trước khi merge.

---

## Silent Disabled — Mọi disable phải kèm explainer

Disable = **2 nửa**: gate hành động + giải thích lý do. Thiếu nửa thứ 2 = UX broken + vi phạm WCAG 3.3.1 (Error Identification), 3.3.3 (Error Suggestion), 4.1.2 (Name, Role, Value).

User KHÔNG biết business rule ("URL không hợp lệ", "đã đạt giới hạn rate-limit", "form còn field invalid"). Mọi disable đều cần explainer trừ khi lý do hiển nhiên 100% từ visual liền kề.

### Quick-fix table

| Tình huống disable                                | Bắt buộc kèm theo                                                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Submit button (Shorten) vì form invalid            | `<v-tooltip>` liệt kê field thiếu HOẶC inline `:error-messages` trên field — không cần tooltip riêng nếu lỗi đã hiện ngay trên field                    |
| Button loading/pending (đang gọi API tạo link)     | `:loading="isPending"` trên `v-btn` (Vuetify tự thêm spinner + `aria-busy`) — không cần tooltip riêng cho loading                                       |
| Button countdown (resend, retry)                    | Hiển thị countdown ngay trong button text (`Retry (30s)`) — explainer inline, không cần tooltip riêng                                                   |
| Business rule (rate-limit đạt giới hạn)             | `<v-tooltip>` mô tả rule ("Bạn đã tạo quá nhiều link, thử lại sau X phút")                                                                              |
| Copy button khi chưa có link                        | `<v-tooltip>` "Tạo link trước khi copy" HOẶC ẩn nút cho tới khi có kết quả (ẩn thường tốt hơn disable ở đây)                                            |

### Pattern: `aria-disabled` thay vì `disabled` khi cần tooltip vẫn trigger được

`disabled` HTML attribute (và Vuetify's `disabled` prop) remove element khỏi tab order → keyboard user không focus được → tooltip on-focus không trigger → mất explainer.

Vuetify's `v-tooltip` wrapping a `disabled` `v-btn` has this exact problem — the disabled button doesn't fire pointer/focus events, so the tooltip never shows. Wrap in a focusable element instead:

```vue
<v-tooltip :disabled="isValid && !isSubmitting">
  <template #activator="{ props: tooltipProps }">
    <span v-bind="tooltipProps" tabindex="0">
      <v-btn
        type="submit"
        :aria-disabled="!isValid || isSubmitting"
        :loading="isSubmitting"
        @click="
          (e) => {
            if (!isValid || isSubmitting) {
              e.preventDefault()
              return
            }
            handleSubmit()
          }
        "
      >
        Shorten
      </v-btn>
    </span>
  </template>
  <span>{{ !isValid ? 'Enter a valid URL first' : 'Submitting…' }}</span>
</v-tooltip>
```

**Trade-off:** using `aria-disabled` instead of Vuetify's `disabled` prop means the click handler must self-guard (early return) — the button is still clickable at the DOM level.

### Khi nào KHÔNG cần explainer (redundant)

- Pagination "Previous" ở trang 1, "Next" ở trang cuối với page indicator hiển thị ngay cạnh
- "Copy" button hidden entirely (not disabled) before a link exists — no explainer needed for something that isn't shown at all

→ Quy tắc: **explainer = redundant** chỉ khi visual liền kề (≤ 1 element xa) đã chứa lý do. Còn lại đều phải có.

### Pre-empt audit

- Khi gõ `:disabled="..."` hoặc `:aria-disabled="..."` → dừng, hỏi "user nhìn thấy element xám này → có biết lý do không?". Không 100% rõ → wrap `v-tooltip` hoặc add helper text.
- Khi finalize feature: grep `:disabled="|:aria-disabled="` toàn folder feature, list từng case + lý do, verify có explainer. Checklist ngang hàng với a11y audit.
