# Shorten Link — Design System (STRICT — SuperDesign MUST obey)

> The ONLY visual source of truth for generated designs. Stack: **Vue 3 + Vuetify 3 + Tailwind CSS v4** + Material Design Icons (`mdi`). This file is the initial baseline authored during docs bootstrap (before `client/` is scaffolded) — when `client/src/plugins/vuetify.ts` and `client/src/assets/main.css` are created, their theme tokens MUST mirror the OKLCH values in §1 exactly. If they ever drift, this file wins — update the code to match, not the other way around.
>
> ⛔ The generic AI look (indigo/violet/sky gradient, Plus Jakarta Sans / any Google Font, `shadow-xl`, `rounded-2xl` everywhere) is WRONG. Do NOT produce it.
> ✅ Brand identity for this project: **"Ember"** — a warm, energetic amber-orange primary (the "click" that turns a long link into a short one) paired with **"Signal Teal"** as a cool secondary accent (the redirect/link itself). Every design MUST be rendered in BOTH light AND dark, using the real dark tokens (§1a).

---

## 0. MANDATORY BOILERPLATE — copy this `<head>` VERBATIM into every generated HTML

Colors are wired as CSS variables (`:root` = light, `.dark` = dark) so opacity utilities (`bg-primary/10`) AND dark mode both work. Do NOT change these values. Do NOT add Google Fonts.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            background: 'oklch(var(--background) / <alpha-value>)',
            foreground: 'oklch(var(--foreground) / <alpha-value>)',
            card: 'oklch(var(--card) / <alpha-value>)',
            'card-foreground': 'oklch(var(--card-foreground) / <alpha-value>)',
            popover: 'oklch(var(--popover) / <alpha-value>)',
            'popover-foreground': 'oklch(var(--popover-foreground) / <alpha-value>)',
            primary: 'oklch(var(--primary) / <alpha-value>)',
            'primary-foreground': 'oklch(var(--primary-foreground) / <alpha-value>)',
            secondary: 'oklch(var(--secondary) / <alpha-value>)',
            'secondary-foreground': 'oklch(var(--secondary-foreground) / <alpha-value>)',
            muted: 'oklch(var(--muted) / <alpha-value>)',
            'muted-foreground': 'oklch(var(--muted-foreground) / <alpha-value>)',
            accent: 'oklch(var(--accent) / <alpha-value>)',
            'accent-foreground': 'oklch(var(--accent-foreground) / <alpha-value>)',
            destructive: 'oklch(var(--destructive) / <alpha-value>)',
            border: 'oklch(var(--border) / <alpha-value>)',
            input: 'oklch(var(--input) / <alpha-value>)',
            'input-background': 'oklch(var(--input-background) / <alpha-value>)',
            ring: 'oklch(var(--ring) / <alpha-value>)',
            success: 'oklch(var(--success) / <alpha-value>)',
            warning: 'oklch(var(--warning) / <alpha-value>)',
            info: 'oklch(var(--info) / <alpha-value>)',
            'brand-teal': 'oklch(var(--brand-teal) / <alpha-value>)',
            'brand-teal-foreground': 'oklch(var(--brand-teal-foreground) / <alpha-value>)'
          },
          borderRadius: { sm: '0.375rem', md: '0.5rem', lg: '0.625rem', xl: '0.875rem' },
          boxShadow: {
            xs: '0 1px 2px oklch(0 0 0 / 0.06)',
            sm: '0 1px 2px oklch(0 0 0 / 0.06)',
            md: '0 4px 6px oklch(0 0 0 / 0.08)',
            lg: '0 10px 15px oklch(0 0 0 / 0.12)'
          },
          fontFamily: {
            sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
          }
        }
      }
    };
  </script>
  <style>
    :root {
      --background: 0.985 0.004 60;
      --foreground: 0.18 0.02 50;
      --card: 1 0 0;
      --card-foreground: 0.18 0.02 50;
      --popover: 1 0 0;
      --popover-foreground: 0.18 0.02 50;
      --primary: 0.62 0.19 35;
      --primary-foreground: 0.99 0 0;
      --secondary: 0.95 0.01 60;
      --secondary-foreground: 0.25 0.02 50;
      --muted: 0.95 0.01 60;
      --muted-foreground: 0.5 0.02 55;
      --accent: 0.93 0.04 200;
      --accent-foreground: 0.25 0.06 200;
      --destructive: 0.58 0.22 25;
      --border: 0.9 0.01 60;
      --input: 0.9 0.01 60;
      --input-background: 0.98 0.005 60;
      --ring: 0.62 0.19 35;
      --success: 0.6 0.14 150;
      --warning: 0.75 0.15 85;
      --info: 0.55 0.12 210;
      --brand-teal: 0.55 0.1 200;
      --brand-teal-foreground: 0.99 0 0;
    }
    .dark {
      --background: 0.16 0.015 50;
      --foreground: 0.97 0.005 60;
      --card: 0.21 0.015 50;
      --card-foreground: 0.97 0.005 60;
      --popover: 0.21 0.015 50;
      --popover-foreground: 0.97 0.005 60;
      --primary: 0.68 0.18 35;
      --primary-foreground: 0.15 0.02 50;
      --secondary: 0.27 0.015 50;
      --secondary-foreground: 0.95 0.005 60;
      --muted: 0.27 0.015 50;
      --muted-foreground: 0.65 0.015 55;
      --accent: 0.3 0.04 200;
      --accent-foreground: 0.9 0.03 200;
      --destructive: 0.65 0.2 25;
      --border: 0.34 0.015 50;
      --input: 0.34 0.015 50;
      --input-background: 0.24 0.015 50;
      --ring: 0.68 0.18 35;
      --success: 0.62 0.13 150;
      --warning: 0.75 0.15 85;
      --info: 0.62 0.11 210;
      --brand-teal: 0.62 0.09 200;
      --brand-teal-foreground: 0.15 0.02 50;
    }
    body { font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  </style>
</head>
```

**Vuetify theme sync** (when `client/` is scaffolded): mirror these OKLCH values as hex/rgb in `client/src/plugins/vuetify.ts` `themes.light.colors` / `themes.dark.colors` (`primary`, `secondary`, `background`, `surface`, `error` ← `destructive`, `success`, `warning`, `info`). Vuetify does not consume CSS vars natively for its own component theming, so the hex conversion is a manual sync step — do it whenever a token here changes.

---

## 1a. BOTH themes — MANDATORY page structure

Every generated `<body>` MUST render the SAME design TWICE, stacked, so light and dark are reviewed together. Dark works simply by adding `class="dark"` on the section wrapper:

```html
<body class="bg-background text-foreground">
  <section class="bg-background text-foreground">
    <div class="px-6 py-3 text-xs font-medium text-muted-foreground">Light</div>
    <!-- design here -->
  </section>
  <section class="dark bg-background text-foreground">
    <div class="px-6 py-3 text-xs font-medium text-muted-foreground">Dark</div>
    <!-- EXACT same design here -->
  </section>
</body>
```

Both frames must be byte-identical in markup — only the wrapper `class="dark"` differs. Never hand-pick different colors for dark; let the tokens flip.

---

## 1b. HARD RULES (a design is REJECTED if it breaks any)

- **Both themes present** (§1a). Missing dark or light = reject.
- **Font**: system UI sans only (`font-sans` stack). ❌ NEVER a Google Font `<link>` / Inter / Plus Jakarta.
- **Color**: ONLY the token classes above. ❌ NEVER Tailwind's literal `indigo/slate/sky/rose/violet/emerald/blue/purple/gray/zinc/*` utility classes.
  - Primary action (Shorten button, main CTA) = `bg-primary text-primary-foreground` — the warm ember tone, NEVER blue/indigo/purple.
  - Brand-teal (`bg-brand-teal text-brand-teal-foreground`) is reserved for the **redirect/QR/short-link identity** (QR frame accent, short-URL chip border) — never used as the primary CTA color. Keeps "action" (ember) and "the link itself" (teal) visually distinct.
  - Icon tiles / soft brand tint = `bg-primary/10 text-primary`, ALL tiles identical (no rainbow of colors).
  - Secondary text `text-muted-foreground` · surfaces `bg-card`/`bg-background`/`bg-popover` · hover `bg-accent` · borders `border-border` · form fields `bg-input-background border-input`.
  - Copy-success flash = `bg-success/10 text-success`. Validation error = `text-destructive` + `border-destructive`.
- **Radius**: chips/list rows `rounded-md` (8px) · buttons/inputs `rounded-lg` (10px) · cards `rounded-xl` (14px). ❌ No `rounded-2xl+` on controls.
- **Shadow**: cards/popovers = `shadow-sm`/`shadow-md` ONLY. ❌ No `shadow-xl`, no extra `ring-1 ring-black/5`.
- **Icons**: iconify **`mdi:`** set only (Material Design Icons — matches Vuetify's default icon font, so SuperDesign previews and the real Vuetify build read the same glyphs). 20px standard, 24px section-header/QR frame corners, 16px inline/inside chips.
- **Control height**: 36px `h-9` compact (chip actions) · 40px `h-10` default (inputs, secondary buttons) · 48px `h-12` large (primary Shorten button — it's the single most important action on the page, give it weight).

---

## 2. Typography tiers

| Tier | Classes |
| --- | --- |
| Page title (`h1`, e.g. "Shorten Link") | `text-2xl font-bold tracking-tight` |
| Section heading (`h2`, e.g. "Your links") | `text-xl font-bold` |
| Card/section title (`h3`, e.g. result card label) | `text-base font-semibold` |
| Short URL display (the hero output) | `text-lg font-semibold` (monospace-adjacent feel via `tracking-tight`, still system sans — no code font) |
| Label / meta (created date, click count) | `text-xs text-muted-foreground font-medium` |
| Body | `text-sm` |

## 3. Header (reproduce faithfully once a real mock exists)

Simple, `h-16`, `border-b border-border`, `bg-card/80 backdrop-blur-sm`, `px-4 lg:px-6`. Left: logo tile `bg-primary text-primary-foreground rounded-lg size-8` (`mdi:link-variant`) + `Shorten Link` (`text-lg font-semibold`). Right (P1): locale switch (EN/VI text toggle, `text-sm text-muted-foreground hover:text-foreground`) + theme toggle icon-button (`mdi:weather-sunny` / `mdi:weather-night`, `size-10 rounded-full hover:bg-accent`). No auth/avatar UI in P1 (anonymous — see `project-goals.md` §2).

## 4. Core components (this project's screens)

- **Shorten form**: `max-w-xl` card `bg-card border border-border rounded-xl shadow-sm p-6`. URL input `h-12 w-full rounded-lg border border-input bg-input-background pl-4 pr-4 text-sm placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none transition`, `mdi:link` icon optional at `left-3`. Optional custom-alias input below, `h-10`, prefixed with a static `text-muted-foreground text-sm` segment showing the short-domain root (e.g. `short.link/`). Primary button `h-12 w-full rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50` — label "Shorten" (loading state: spinner + disabled, never a bare disabled button with no feedback).
- **Result card**: appears below the form after success, `border border-brand-teal/30 bg-brand-teal/5 rounded-xl p-4 flex items-center gap-4`. Left: QR image `size-20 rounded-md border border-border bg-card p-1`. Middle: short URL `text-lg font-semibold text-foreground truncate` + original URL `text-xs text-muted-foreground truncate` below it. Right: Copy icon-button (`mdi:content-copy` → `mdi:check` flash `text-success` on success, `size-10 rounded-lg hover:bg-accent`).
- **History list item** (local history): `flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent/40 transition-colors`. Left: small QR thumbnail or link icon tile `size-10 rounded-md bg-primary/10 text-primary` (`mdi:link-variant`). Middle: short URL `text-sm font-semibold` + `clickCount` chip `text-xs text-muted-foreground` (`mdi:cursor-default-click` 14px + number) + relative created-date. Right: icon-button row (Copy / QR / Open `mdi:open-in-new` / Remove `mdi:trash-can-outline text-destructive`), each `size-9 rounded-md hover:bg-accent`.
- **Empty history state**: centered, muted `mdi:link-off` 32px, `text-sm font-medium text-foreground` "No links yet", `text-xs text-muted-foreground` "Shorten your first link above".
- **404 page**: centered `mdi:map-marker-off` or `mdi:link-off` 48px `text-muted-foreground`, `text-2xl font-bold` "Link not found", `text-sm text-muted-foreground` explainer, primary button back Home.

## 5. UX copy (EN, short, friendly-directive)

`Shorten` · `Paste a long link here...` · `Custom alias (optional)` · `Copy` · `Copied!` · `Open` · `Remove` · `No links yet` · `Shorten your first link above` · `Link not found` · `Back to Home` · `Too many requests, try again shortly` (429) · `This alias is already taken` (409) · `Enter a valid http:// or https:// URL` (400).

## 6. Accessibility

Shorten input has a visible `<label>` (not placeholder-only). Error text linked via `aria-describedby`, error region `aria-live="polite"`. Result card receives focus (`tabindex="-1"` + programmatic focus) right after a successful shorten so screen readers announce the new short URL immediately. Copy button: `aria-label="Copy short link"`, success state announced via the same live region (not just a color/icon change). QR `<img>` has descriptive `alt` (e.g. `QR code for short.link/abc123`). History item action buttons all have `aria-label` naming the target code (e.g. `Remove abc123 from history`). Visible focus ring on every control (`focus:ring-2 focus:ring-ring/20`); never bare `outline:none`.
