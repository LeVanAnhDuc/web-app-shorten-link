# Icon map — Shorten Link

One icon set for the whole app: **`@mdi/font`** (Vuetify's default `mdi` set). Use
`<v-icon icon="mdi-…" />` or the `prepend-icon` / `append-icon` props. No emoji, no second library.

An icon that carries meaning on its own (icon-only button) needs an `aria-label` from i18n; an icon
next to visible text is decorative (`aria-hidden="true"`, which `v-icon` sets by default).

| Concept / action | Icon | Notes |
| --- | --- | --- |
| Shorten (primary action) | `mdi-link-variant` | On the Shorten button, leading |
| Long / original URL | `mdi-link` | Left part of the stub |
| Short link / code | `mdi-ticket-outline` | Ties to the stub concept; history section heading |
| Custom alias | `mdi-pencil-outline` | Toggle that reveals the alias field |
| Copy | `mdi-content-copy` | Switches to `mdi-check` for 2s after a successful copy |
| Copied (confirmation) | `mdi-check` | Paired with the "Copied" snackbar |
| Open link | `mdi-open-in-new` | Always `target="_blank" rel="noopener noreferrer"` |
| Show QR | `mdi-qrcode` | Mobile toggle; desktop shows the QR inline |
| Download QR | `mdi-download` | Saves the QR as PNG |
| Remove from history | `mdi-close` | Removes the local entry only; offers Undo |
| Refresh click count | `mdi-refresh` | Re-fetches `GET /api/links/:code` |
| Click count | `mdi-cursor-default-click-outline` | Next to the number in history |
| No account needed | `mdi-incognito` | "What you get" point |
| Error | `mdi-alert-circle-outline` | Inline field errors, error snackbar |
| Rate limited / warning | `mdi-timer-sand` | "Too many links, try again in …" |
| Link not found (404 page) | `mdi-ticket-confirmation-outline` | 404 illustration-free page |
| Theme toggle | `mdi-weather-night` / `mdi-white-balance-sunny` | Shows the theme you will switch **to** |
| Language toggle | `mdi-translate` | EN ↔ VI |
