---
name: standard-typescript
description: TypeScript rules for the Vue 3 client — strictness, narrowing, imports, Vue SFC typing, axios errors. Use when writing or reviewing client .ts/.vue files.
user-invocable: false
---

> Sources: TypeScript docs (typescriptlang.org), TypeScript Do's and Don'ts, Vue "TypeScript with Composition API" guide. `tsconfig.app.json` extends `@vue/tsconfig` (strict, `verbatimModuleSyntax`) + `noUncheckedIndexedAccess`; `.vue` is checked only by `vue-tsc` (`pnpm type-check`), never by Vite.

## Types

- `interface` for object shapes, `type` for unions/intersections/mapped types. No `enum` — union or `as const` object.
- No `any` (use `unknown` + guard), no boxed `String`/`Number`/`Object`, no `@ts-ignore` (`@ts-expect-error` + reason).
- `as` and `!` only when nothing else works; `e.target as HTMLInputElement` in a DOM handler is the accepted case — narrow once, don't propagate.
- `noUncheckedIndexedAccess` is on: `arr[0]` is `T | undefined` — handle it, don't `!` it away.
- `??` for defaults, never `||` when `0`/`''` are valid.
- Derive with utility types (`Pick`, `Omit`, `Partial`, `ReturnType`) instead of copying shapes; `satisfies` to keep literal types.
- `readonly` / `Readonly<T>` for data not meant to change; replace `ref` arrays wholesale (`list.value = [...]`).
- Request/response types come from Zod (`z.infer<typeof schema>`) where a schema exists — never a hand-written twin.
- Format dates/numbers with `Intl.*` using the current vue-i18n locale — never hardcoded formats.

## Imports & exports

- Type-only imports use `import type` / inline `type` (`verbatimModuleSyntax` errors otherwise).
- `@/` alias for `src/`; no deep `../../..`.
- Named exports for composables, stores, utils, API functions. `.vue` SFCs are the only default exports.
- Barrel `index.ts` only in `src/types/`; never inside feature folders. No circular imports.

## Vue SFC typing

```ts
const props = withDefaults(defineProps<{ code: string; compact?: boolean }>(), { compact: false })
const emit = defineEmits<{ copy: [shortUrl: string]; remove: [code: string] }>()
const inputRef = ref<HTMLInputElement | null>(null)
```

- Props/emits via type generics only — never the runtime array/object form. Inline the literal; extract to `src/types/` only when ≥2 files share it.
- `defineModel<T>()` for `v-model`; `defineExpose({...})` typed explicitly when a parent calls into a child.

## Async & errors

- Independent requests → `Promise.all` / `allSettled`, never sequential `await`.
- No floating promises at `<script setup>` top level — server calls go through Vue Query (`standard-vue`).
- `catch (e)` is `unknown`: narrow with `isAxiosError(e)` (axios throws on non-2xx — no `response.ok` checks) then `e instanceof Error`.
- Error messages shown to users are i18n keys mapped from status/code, never `e.message` or raw server text.
