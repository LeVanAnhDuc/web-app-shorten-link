---
name: standard-vue
description: Vue 3 Composition API standards — script setup, component boundaries, props/emits typing, composables, Pinia stores, Vue Router, TanStack Vue Query, VeeValidate + Zod forms. Use when writing or reviewing any .vue component, composable, store, route, or form.
user-invocable: false
---

> Targets Vue 3 with `<script setup lang="ts">` (Composition API) exclusively. This project does not use the Options API or React — do not port React patterns (hooks rules, JSX, `useEffect`) verbatim; Vue has its own reactivity and lifecycle model.

---

## Single File Component Structure

Always order blocks `<script setup>` → `<template>` → `<style>` (script first makes props/emits visible before markup that uses them):

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ label: string; modelValue: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const isActive = ref(false)
const doubled = computed(() => props.modelValue * 2)
</script>

<template>
  <div>{{ label }}: {{ doubled }}</div>
</template>

<style scoped>
/* component-local overrides only — prefer Tailwind utilities in template first */
</style>
```

- `<style scoped>` only when Tailwind utilities + Vuetify props cannot express the rule (rare) — never global unscoped `<style>` in a component.
- One component per file; filename `PascalCase.vue` matching the component name.

---

## Props & Emits — Typed, Never Runtime-Only

Use the type-based declaration (`defineProps<T>()` / `defineEmits<T>()`) — never the runtime array/object form (`defineProps(['label'])`), which loses type safety.

```ts
// ✅ Type-based props with defaults via withDefaults
const props = withDefaults(
  defineProps<{
    label: string
    disabled?: boolean
    variant?: 'primary' | 'secondary'
  }>(),
  { disabled: false, variant: 'primary' },
)

// ✅ Type-based emits — payload tuple per event
const emit = defineEmits<{
  submit: [payload: { code: string }]
  cancel: []
}>()

// ❌ Runtime-only — no type checking on consumers
defineProps(['label', 'disabled'])
defineEmits(['submit', 'cancel'])
```

- `v-model` on a component: prop `modelValue` + event `update:modelValue` (or named `v-model:code` → prop `code` + event `update:code`). Type both explicitly.
- Boolean props default to `false` unless the component is meaningless without it being `true`.
- Never mutate a prop directly — props are read-only; copy to a `ref`/`computed` if local mutation is needed.

```ts
// ❌ Mutating a prop
props.disabled = true

// ✅ Local writable copy
const localDisabled = ref(props.disabled)
```

---

## Component Boundaries

- **Views** (`src/views/`) are route targets — they orchestrate data fetching (Vue Query) and compose components; keep them thin, push presentation into `src/components/`.
- **Components** (`src/components/`) are reusable and presentation-focused — avoid importing `vue-router` or calling `apiClient` directly inside a component unless it is explicitly a data-aware container.
- Extract a new component when: the same template block is duplicated 2+ times, or a section of a view has an independent responsibility (e.g. `LinkResultCard`, `QrCodePanel`) that can be tested/reasoned about on its own.
- Prefer composition (slots, props) over deep prop-drilling through 3+ layers — lift shared state to a composable or Pinia store instead.

---

## Composables — the Vue Equivalent of Hooks

A composable is a plain function starting with `use`, living in `src/composables/`, that encapsulates reactive state + logic reusable across components.

```ts
// src/composables/useClipboard.ts
import { ref } from 'vue'

export function useClipboard() {
  const copied = ref(false)

  async function copy(text: string): Promise<void> {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }

  return { copied, copy }
}
```

Rules:

- Return a **plain object** of refs/computed/functions — never return `.value`-unwrapped primitives that lose reactivity.
- Composables can call other composables, but never call them conditionally or inside loops (same rule as React hooks — reactivity setup must run unconditionally on every invocation of the enclosing `<script setup>`).
- Side-effect cleanup (timers, listeners, subscriptions) goes in `onUnmounted` inside the composable that created the effect — not left to the consuming component to remember.
- A composable that only wraps a single Vue Query call belongs next to its feature (e.g. `useLinkHistory.ts` calling `useQuery` for the link list) rather than duplicating the query key/options at each call site.

---

## Reactivity Fundamentals

```ts
import { ref, reactive, computed, watch, watchEffect } from 'vue'

// ref — primitives and values you reassign wholesale
const count = ref(0)
count.value++

// reactive — object/array you mutate in place; never destructure (breaks reactivity)
const state = reactive({ code: '', clicks: 0 })

// ❌ Destructuring a reactive object loses reactivity
const { code } = state

// ✅ Use toRefs when you need to destructure
import { toRefs } from 'vue'
const { code } = toRefs(state)

// computed — derived, cached, read-only unless given a setter
const isValid = computed(() => count.value > 0)

// watch — explicit dependency, side effect on change
watch(count, (next, prev) => {
  /* react to count change */
})

// watchEffect — auto-tracks dependencies used inside
watchEffect(() => {
  document.title = `Count: ${count.value}`
})
```

- Default to `ref` for component-local state; use `reactive` only for a cohesive object you always access as a whole.
- Prefer `computed` over `watch` for derived values — `watch` is for side effects (API calls, DOM, logging), not for producing a new value.
- Always specify `{ immediate: true }` explicitly when a watcher must run on mount — don't rely on accidental double-invocation patterns.

---

## Pinia Stores

One store per domain, `defineStore` with the **setup-store syntax** (mirrors Composition API, consistent with the rest of the codebase):

```ts
// src/stores/linkHistory.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLinkHistoryStore = defineStore('linkHistory', () => {
  const codes = ref<string[]>([])

  const count = computed(() => codes.value.length)

  function addCode(code: string) {
    codes.value = [code, ...codes.value]
  }

  return { codes, count, addCode }
})
```

- Store ids are camelCase and unique; filename matches the store's domain (`linkHistory.ts` → `useLinkHistoryStore`).
- Pinia is for **client-only state** (UI preferences, locally-cached history, form drafts) — server data (the link list from the API, click counts) belongs in Vue Query, not duplicated into a Pinia store.
- Access a store only via its `useXxxStore()` composable inside `<script setup>` — never construct store state manually or read `store.$state` directly.
- Actions that call the API still go through `apiClient`/Vue Query — a store action can trigger a mutation, but the request/cache logic itself lives in the Vue Query layer.

---

## Vue Router

```ts
// src/router/index.ts
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/history', name: 'history', component: () => import('../views/HistoryView.vue') },
  ],
})
```

- Route-level components: lazy-load with dynamic `import()` for any view beyond the initial landing route — keeps the entry bundle small.
- Access route/router inside components via `useRoute()` / `useRouter()` — never import the raw `router` instance into a component (breaks testability); the raw instance is only for `app.use(router)` in `main.ts` and for non-component code (e.g. an axios interceptor redirecting on 401).
- Name every route (`name: 'home'`) and navigate by name (`router.push({ name: 'history' })`), not by hardcoded path string, so renaming a path doesn't silently break links.

---

## TanStack Vue Query — Server State

All backend reads/writes go through `useQuery` / `useMutation`, never a bare `apiClient.get()` call inside a component's `onMounted`.

```ts
// src/composables/useLinks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiClient } from '@/lib/axios'

export function useLinks() {
  return useQuery({
    queryKey: ['links'],
    queryFn: async () => (await apiClient.get('/links')).data,
  })
}

export function useCreateLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (url: string) => apiClient.post('/links', { url }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['links'] }),
  })
}
```

- Query keys are arrays, most-generic-first (`['links']`, `['links', code]`) — never string-concatenated keys.
- Invalidate the narrowest matching key on mutation success — don't `invalidateQueries()` with no key (refetches everything).
- Loading/error UI reads `isPending` / `isError` / `error` from the query result — don't track a parallel `ref(false)` loading flag by hand.
- Defaults (`refetchOnWindowFocus: false`, `retry: 1`) are set once in `src/plugins/vue-query.ts` — override per-query only with a stated reason (e.g. disabling retry for a mutation with side effects).

---

## Forms — VeeValidate + Zod

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const schema = toTypedSchema(
  z.object({
    url: z.string().url('Enter a valid URL'),
  }),
)

const { handleSubmit, defineField, errors } = useForm({
  validationSchema: schema,
})
const [url, urlAttrs] = defineField('url')

const onSubmit = handleSubmit(async (values) => {
  // values.url is typed as string
})
</script>

<template>
  <form @submit="onSubmit">
    <v-text-field v-model="url" v-bind="urlAttrs" :error-messages="errors.url" label="URL" />
    <v-btn type="submit">Shorten</v-btn>
  </form>
</template>
```

- The Zod schema is the single source of truth for validation rules and the inferred TS type — never duplicate validation logic in a template `:rules` array alongside a Zod schema for the same field.
- Bind field error messages to Vuetify's `:error-messages`/`:error` props so validation state renders through Vuetify's own styling, not a hand-rolled error `<span>`.
- Shared schemas used by 2+ forms go in a dedicated module (e.g. `src/schemas/`) — create the folder when the second consumer appears.

---

## DO NOT

- Use the Options API (`data()`, `methods`, `export default { … }`) in new code
- Use runtime-only `defineProps(['x'])` / `defineEmits(['x'])` — always type-based
- Destructure a `reactive()` object without `toRefs`
- Mutate a prop directly
- Call `apiClient` directly inside a component's `onMounted`/`watch` instead of `useQuery`/`useMutation`
- Duplicate server data into a Pinia store when Vue Query already caches it
- Import the raw `router` singleton into a component — use `useRouter()`
- Call a composable conditionally or inside a loop/branch
- Hardcode a validation rule in both a Zod schema and a template `:rules` array for the same field
- Leave a `watch`/`setInterval`/event listener without cleanup in `onUnmounted`

---

## Code Review Checklist

### Blocking

- [ ] Options API used in new component
- [ ] `defineProps`/`defineEmits` using runtime array/object form instead of type-based generics
- [ ] Prop mutated directly inside the component
- [ ] `reactive()` object destructured without `toRefs`
- [ ] Direct `apiClient` call bypassing Vue Query for server data
- [ ] Composable called conditionally
- [ ] Missing cleanup for timer/listener/subscription in `onUnmounted`

### Warning

- [ ] Server data duplicated into a Pinia store instead of relying on Vue Query cache
- [ ] Route navigated by hardcoded path string instead of named route
- [ ] `watch` used where `computed` would suffice (no side effect, just derived value)
- [ ] Query key not array-based or not ordered generic-first
- [ ] `invalidateQueries()` called with no key (over-broad refetch)
- [ ] View component contains presentation logic that should be extracted to `src/components/`

### Suggestion

- [ ] Repeated template block (2+ occurrences) not extracted to a component
- [ ] `withDefaults` could simplify optional prop handling
- [ ] Composable could absorb duplicated Vue Query boilerplate across call sites
- [ ] `<style scoped>` used where Tailwind utilities/Vuetify props would suffice
