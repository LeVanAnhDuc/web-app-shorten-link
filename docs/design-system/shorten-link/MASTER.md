# Design System Master File — Shorten Link

> **LOGIC:** When building a specific page, first check `docs/design-system/shorten-link/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file. If not, follow the rules below.
>
> **Precedence:** this file > `client/.claude/CLAUDE.md` > client skills > generic UI skills.
> Change it only by re-running the `design-bootstrap` skill with a new ADR — see
> [ADR-0001](../../adr/0001-design-system-bootstrap.md).

**Project:** Shorten Link — public, anonymous URL shortener + client-side QR
**Bootstrapped:** 2026-11-21 · step 1 `ui-ux-pro-max` 2.15.0 (brief: "developer utility tool single-purpose productivity web app") · step 2 `frontend-design`
**Category:** Productivity tool (single-purpose)
**Stack constraints (not negotiable here):** Vuetify 3 owns component styling, tokens enter through the Vuetify theme; Tailwind v4 (no preflight) only for layout/spacing/typography; icons `@mdi/font` only; fonts self-hosted via `@fontsource/*`; no GSAP.

---

## Concept — the claim ticket

A short link works like a coat-check ticket: you hand over something long and awkward and get back
a small token that someone else will **read, type or scan**. Everything in this system serves that
token:

- The **short code** is the hero of the page, set in a monospace that keeps `0/O` and `1/l/I` apart.
- UI text uses a typeface built for legibility, for the same reason.
- The result is presented as a **tear-off stub** — the one signature element (see below).

---

## Color tokens

Each role has a light and a dark value; map them 1:1 to the Vuetify themes `light` and `dark` in
`client/src/plugins/vuetify.ts` (`theme.themes.<name>.colors`). Vuetify name in brackets.

| Role | Light | Dark | Used for |
| --- | --- | --- | --- |
| Background `[background]` | `#F7F8FA` | `#12142A` | Page |
| Surface `[surface]` | `#FFFFFF` | `#1B1E38` | Cards, inputs, menus |
| On surface / text `[on-surface]` | `#1A1F3D` | `#ECEEF6` | Body text, headings |
| Muted text `[on-surface-variant]` | `#565D77` | `#A3A8C3` | Secondary text, the long URL on the stub |
| Ink — primary `[primary]` | `#23306B` | `#9DB0FF` | Primary button, links, focus ring, selected states |
| On primary `[on-primary]` | `#FFFFFF` | `#12142A` | Text/icons on primary |
| Stub `[stub]` (custom) | `#F4C542` | `#E9B935` | **Only** the signature stub surface and the history-item edge strip |
| On stub `[on-stub]` (custom) | `#1A1F3D` | `#1A1F3D` | Code + icons on the stub (stays dark in both themes) |
| Control outline `[outline]` | `#8A90A8` | `#6B7194` | Input borders, outlined buttons (≥ 3:1 vs surface) |
| Divider `[divider]` (custom) | `#D9DCE5` | `#2E3254` | Decorative separators only — never the only boundary of a control |
| Error `[error]` | `#B42318` | `#F97066` | Validation, failed requests |
| Success `[success]` | `#1E7A4C` | `#5BC88A` | "Copied", link created |
| Warning `[warning]` | `#B54708` | `#FDB022` | Rate-limited, alias taken |
| Info `[info]` | = primary | = primary | Neutral notices |

Measured contrast (WCAG 2.1): body text ≥ 14:1, muted text ≥ 6.1:1, on-primary 12.3:1 (light) /
8.7:1 (dark), on-stub ≥ 8.7:1, status colors ≥ 5.3:1 on surface, control outline ≥ 3.1:1.
Any new pairing must be measured before use — 4.5:1 for text, 3:1 for UI boundaries and focus.

**Rules**
- Primary is the only action color. There is no separate "accent/CTA" color; the stub yellow is a
  surface, never a button.
- No gradients, no tinted overlays, no glass/blur.
- Never hardcode a hex in a component — use the Vuetify theme (`color="primary"`,
  `bg-surface`) or the CSS variables Vuetify emits (`rgb(var(--v-theme-primary))`).

---

## Typography

| Role | Family | Package | Weights |
| --- | --- | --- | --- |
| UI, body, headings | **Atkinson Hyperlegible Next** | `@fontsource/atkinson-hyperlegible-next` | 400, 600, 700 |
| Short codes, URLs in display, QR caption | **Martian Mono** | `@fontsource/martian-mono` | 400, 600 |

Import both in `client/src/main.ts`; set Vuetify's `$body-font-family` / `--v-font-family` to
Atkinson, fallback `system-ui, sans-serif`; mono fallback `ui-monospace, monospace`.
Never load fonts from Google Fonts (`<link>` or `@import url(...)`).

Martian Mono is for **literal strings the user may retype** (the code, the short URL, the long URL
on the stub). It is not a decoration for labels, counters or metadata.

**Scale** (ratio 1.25, base 16px; line-height 1.5 for body, 1.2 for headings, 1.1 for the code):

| Token | Size | Use |
| --- | --- | --- |
| `text-caption` | 12.8px | Helper text, timestamps |
| `text-body-2` | 14px | Dense lists (history) |
| `text-body-1` | 16px | Default body, inputs |
| `text-h6` | 20px | Card titles |
| `text-h5` | 25px | Section headings |
| `text-h4` | 31.25px | Page title |
| `code-display` | 32px Martian Mono 600, letter-spacing 0.02em | The short code on the stub |

Sentence case everywhere. No all-caps labels, no letter-spaced eyebrows above headings.
Line length ≤ 70ch for prose.

---

## Spacing, shape, elevation

**Spacing** (4px base — from step 1, unchanged): `xs 4` · `sm 8` · `md 16` · `lg 24` · `xl 32` ·
`2xl 48` · `3xl 64`. Tailwind classes map directly (`gap-4` = 16px).

**Radius by hierarchy** (not one radius for everything):

| Element | Radius |
| --- | --- |
| Inputs, buttons, chips | 6px |
| Cards, menus, snackbars | 10px |
| Stub | 10px outer corners + perforation notches (see below) |
| QR frame | 4px |

**Elevation:** Flat Design — no resting shadows. Separate layers with surface color + a 1px
`divider` border. The only shadow allowed is on overlays (menus, dialogs): `0 8px 24px rgb(0 0 0 / 0.18)`
light, `0 8px 24px rgb(0 0 0 / 0.45)` dark. Set Vuetify defaults to `variant="flat"` /
`elevation="0"` for `VCard`, `VBtn`.

---

## Signature element — the stub

The result of a shorten action is a ticket with a tear-off stub. It appears in exactly two places:
the result card and (as a thin edge) each history item. Nowhere else.

```
┌───────────────────────────────┬╌╌╌┬───────────────────────────┐
│ Original                      ┊   ┊  ▓▓ stub yellow ▓▓▓▓▓▓▓▓▓▓ │
│ https://example.com/blog/2026 ●   ●  aB3xK9p                  │
│ /very-long-path?utm=…  (muted, ┊   ┊  sho.rt/aB3xK9p            │
│ Martian Mono 14, 2 lines max) ┊   ┊  [QR 120px]  [Copy] [Open] │
└───────────────────────────────┴╌╌╌┴───────────────────────────┘
          surface                perforation        stub
```

- **Perforation:** a 24px strip on the stub's leading edge, filled with stub yellow, with a
  half-circle notch (18px diameter) cut out of its top and bottom edge so the page background shows
  through, and a vertical 2px dashed line in `on-stub` at 40% opacity down its middle. Built with
  `radial-gradient` masks, no images. (A `divider`-colored dash and 12px notches were tried in the
  preview and disappeared against the yellow.)
- **Mobile (< 600px):** the stub drops **below** the original; the perforation turns horizontal,
  notches on the left and right edges.
- **Code:** `code-display` on the stub; the full short URL under it in Martian Mono 14px.
- **Actions on the stub:** Copy (primary, flat, `on-stub` text on a `primary` button), Open (text
  button), QR toggle on mobile. Icons from the icon map.
- **The one motion moment:** when a link is created, the stub slides out from behind the left part
  (`transform: translateX(-16px) → 0`, `opacity 0 → 1`, 240ms, `cubic-bezier(0.2, 0, 0, 1)`).
  Under `prefers-reduced-motion: reduce` it simply appears. No other entrance animations on the page.
- **History item:** a 6px stub-yellow strip on the leading edge + the code in Martian Mono 16px.
  No perforation, no notches.

---

## Components (Vuetify)

| Component | Spec |
| --- | --- |
| URL input | `v-text-field`, `variant="outlined"`, `density="comfortable"` (min height 48px), outline `outline` color, `type="url"`, `inputmode="url"`, `autocomplete="off"`, visible label (no placeholder-as-label) |
| Primary button | `v-btn color="primary" variant="flat"`, radius 6px, height 48px, weight 600, sentence case (`text-transform: none`) |
| Secondary button | `variant="outlined"`, outline color, same size |
| Text button | `variant="text"` for low-emphasis actions (Open, Remove) |
| Card | `v-card variant="flat"` + 1px `divider` border, radius 10px, padding 24px (16px on mobile) |
| Snackbar | bottom-center, radius 10px, `aria-live="polite"`; undo snackbars ≥ 6s |
| Focus | 2px solid `primary` outline, 2px offset, on every interactive element — never removed |
| Touch targets | ≥ 44×44px, including icon buttons in history rows |
| Hover | color/opacity shift only, 150–200ms ease; no translate/scale on hover (avoids layout shift) |

Set `textTransform: none` globally in Vuetify defaults for `VBtn` — Vuetify uppercases buttons by default.

---

## Page pattern

**From step 1:** Product Demo + Features — Hero > product demo > feature breakdown > CTA.

**Applied to this tool:** the demo *is* the product. The hero holds the live form, so the first
thing a visitor does is shorten a link; there is no video or mockup.

1. **Hero:** page title + one-line description + URL input + optional custom alias + Shorten.
2. **Result:** the stub, directly under the form, replacing nothing (form stays usable).
3. **Your links:** local history list (newest first), empty state invites the first shorten.
4. **What you get** (only while history is empty): three short points — QR included, custom alias,
   no account. Plain text with icons, not cards.

Layout: single column, max width 720px, centered on the page, content **left-aligned** inside it.
Breakpoints to verify: 375, 768, 1024, 1440.

---

## Anti-patterns (do NOT use)

- ❌ Complex onboarding, sign-up walls (P1 is anonymous)
- ❌ Slow performance — no heavy hero media, no blocking font loads
- ❌ Emojis as icons — `mdi-*` only (`icon-map.md`)
- ❌ Missing pointer cursor on clickable elements
- ❌ Layout-shifting hovers (scale/translate on hover)
- ❌ Text below 4.5:1, UI boundaries below 3:1
- ❌ Instant state changes on user-triggered UI — 150–300ms transitions
- ❌ Invisible or removed focus states
- ❌ Gradients, glassmorphism, resting drop shadows
- ❌ Stub yellow on anything other than the stub
- ❌ All-caps labels, letter-spaced eyebrows, "→" appended to buttons

---

## Pre-delivery checklist

- [ ] Colors come from the Vuetify theme; no hex literals in components
- [ ] Every new color pairing measured (4.5:1 text, 3:1 UI)
- [ ] Atkinson for UI, Martian Mono only for codes/URLs
- [ ] Icons only from `icon-map.md` (`mdi-*`)
- [ ] Pointer cursor on all clickable elements
- [ ] Hover = color/opacity, 150–200ms
- [ ] Focus visible on every control
- [ ] `prefers-reduced-motion` respected (stub appears without sliding)
- [ ] Copy follows `ux-copy.md`, both `en` and `vi` keys added
- [ ] Responsive at 375 / 768 / 1024 / 1440, no horizontal scroll
- [ ] Light **and** dark checked
