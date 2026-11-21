# 0001 — Design system bootstrap: claim-ticket identity

- **Status:** Proposed (accepted on merge)
- **Date:** 2026-11-21

## Context

The first design system (brand "Ember" + "Signal Teal", built with SuperDesign) and the approved Home
mock were removed on 2026-11-21 so the UI could be redesigned with the `ui-ux-pro-max` +
`frontend-design` plugins, the same pairing Ducker ID uses. The output is
`docs/design-system/shorten-link/MASTER.md`, which outranks client CLAUDE.md and skills for colors,
fonts, style and page pattern.

The skill `design-bootstrap` splits the work: step 1 (`ui-ux-pro-max`) owns constraints — a11y/UX
rules, style family, page pattern, spacing; step 2 (`frontend-design`) owns palette, type pairing
and the one signature element.

## Step 1 — what the catalog proposed

Three briefs were tried; all returned category defaults:

| Brief | Pattern | Style | Palette | Type |
| --- | --- | --- | --- | --- |
| "url shortener qr code utility tool anonymous" | Event/Conference Landing (wrong category) | Vibrant & Block-based | near-black + green | Inter / Playfair |
| "url shortener link management utility tool" | Real-Time / Operations Landing | Soft UI Evolution | indigo `#6366F1` + green | — |
| **"developer utility tool single-purpose productivity web app"** (kept) | **Product Demo + Features** | **Flat Design** | teal `#0D9488` + orange `#EA580C` | Inter for both roles |

The third was persisted because its constraints fit a single-purpose tool on Vuetify (Material):
Flat Design is low-cost and low-risk for a11y, and its pattern maps onto "the tool is the demo".

## Decision

**Kept from step 1 (constraints):** Flat Design (no gradients, no resting shadows, color/opacity
hover 150–200ms), the Product Demo + Features order — applied as *hero = the live form*, no video —,
the 4px spacing scale, the anti-pattern list, the pre-delivery checklist, WCAG 4.5:1 / 3:1,
visible focus, 44px targets, reduced motion.

**Overridden in step 2 (choices):**

| Axis | Catalog | Chosen | Why |
| --- | --- | --- | --- |
| Concept | none | The short link as a **claim ticket** | The product's output is a small token people read, type or scan; the identity is built around that token |
| Primary | teal `#0D9488` | ink blue `#23306B` / `#9DB0FF` dark | Teal + orange is the stock "productivity SaaS" pairing; a stamp-ink blue reads as print, fits the ticket idea, and holds 12:1 with white |
| Accent | orange `#EA580C` as CTA | **none** — stub yellow `#F4C542` is a surface, not a button | One action color keeps the single-form page unambiguous; the yellow is reserved for the signature element so it stays recognisable |
| Background | teal tint `#F0FDFA` | cool paper `#F7F8FA` / navy `#12142A` | Neutral page lets the stub carry the color; avoids both the warm-cream and the tinted-black defaults |
| Type | Inter for heading and body | **Atkinson Hyperlegible Next** (UI) + **Martian Mono** (codes/URLs) | Catalog gave one family for two roles. Codes must keep `0/O`, `1/l/I` apart — Atkinson was designed for character distinction, Martian Mono gives the code a printed-ticket voice. Mono is used only for literal strings, not labels |
| Signature | none | **Tear-off stub** with perforation + notches; one 240ms slide-out when a link is created | A single memorable element, tied to the concept, used in two places only |
| Icons | Heroicons / Lucide (checklist) | `@mdi/font` | Stack constraint: Vuetify's default set, one set only |
| Fonts delivery | Google Fonts `@import` | `@fontsource/*` self-hosted | Stack constraint; no third-party font requests |

All color pairings were measured against WCAG 2.1 in both themes before adoption (results in MASTER.md).

## Consequences

- `client/src/plugins/vuetify.ts` gets the token table as `light` and `dark` themes, plus custom
  colors `stub`, `on-stub`, `divider`; Vuetify defaults switch to flat variants and
  `textTransform: none` on buttons.
- Two packages to add when the first UI is built: `@fontsource/atkinson-hyperlegible-next`,
  `@fontsource/martian-mono`.
- Every mock under `docs/ui-designs/<feature>/` uses these tokens; a mock that drifts is rejected.
- The stub yellow must not spread to other UI. If a future feature needs a second accent, that is a
  new ADR, not a local choice.
- Changing palette, fonts or the signature element requires re-running `design-bootstrap` and a new
  ADR that supersedes this one.
