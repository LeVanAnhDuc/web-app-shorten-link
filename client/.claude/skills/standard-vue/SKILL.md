---
name: standard-vue
description: Vue 3 rules for this project — SFC layout, props/reactivity, composables, Pinia, Vue Router, TanStack Vue Query, VeeValidate + Zod, vue-i18n. Use when writing or reviewing any .vue component, composable, store, route or form.
user-invocable: false
---

> Sources: Vue 3 docs (vuejs.org), Pinia, TanStack Vue Query, VeeValidate docs. Folder layout and plugin order live in `client/.claude/CLAUDE.md` — not repeated here.

## Components

- `<script setup lang="ts">` only — no Options API, no React patterns. Block order: script → template → style.
- `PascalCase.vue`, one component per file. `<style scoped>` only when Tailwind + Vuetify props can't express it; never unscoped `<style>` in a component.
- Views orchestrate (queries, store, router); `src/components/` stay presentational — no `apiClient`, no `useRouter` unless explicitly a container.
- Never mutate a prop; copy into a `ref`/`computed`. Prefer `defineModel()` for `v-model`. Extract a component when a block repeats or has its own responsibility (result card, QR panel, history item).

## Reactivity & composables

- `ref` by default; `reactive` only for a cohesive object, never destructured without `toRefs`.
- `computed` for derived values; `watch` only for side effects; state `{ immediate: true }` explicitly.
- Composables (`src/composables/useXxx.ts`) return a plain object of refs/functions, are called unconditionally, and clean up their own timers/listeners in `onUnmounted`.

## Server state — Vue Query

- Every BE call is `useQuery`/`useMutation` wrapping `apiClient`, defined in a composable (`useCreateLink`, `useLinkStats`) — never `apiClient` in `onMounted`/`watch`.
- Query keys are arrays, generic-first (`['links', code]`); invalidate the narrowest key, never bare `invalidateQueries()`.
- UI reads `isPending`/`isError`/`error` — no hand-kept loading refs. Query defaults (`retry: 1`, no refetch on focus) are overridden only with a stated reason; never add `retry` to a link-creating mutation (duplicate links).

## Client state — Pinia

- Setup-store syntax, one store per domain (`useLinkHistoryStore` in `src/stores/linkHistory.ts`).
- Pinia holds client-only state; the anonymous link history persists to `localStorage` from the store (versioned key, `JSON.parse` in `try/catch`, validate with Zod, cap the list length). Never copy Vue Query data into a store.

## Router

- Named routes; navigate by name (`{ name: 'home' }`). Lazy `() => import(...)` for every view except the landing one.
- `useRoute()`/`useRouter()` in components; the raw `router` instance only in `main.ts` and non-component code.

## Forms — VeeValidate + Zod

```ts
const schema = toTypedSchema(z.object({ url: z.string().url('validation.url') }))
const { handleSubmit, defineField, errors } = useForm({ validationSchema: schema })
const [url, urlAttrs] = defineField('url')
```

- Zod schema is the single source of rules and types; messages are i18n keys, translated where rendered (`:error-messages="errors.url && t(errors.url)"`). Shared schemas → `src/schemas/` once a second form needs them.

## i18n

- Every user-facing string (labels, buttons, snackbars, `aria-label`, page titles, errors) is a key in both `en` and `vi` — add both in the same change. `const { t } = useI18n()` in script, `t(...)` in template; no string concatenation for sentences — use named interpolation.
