---
name: standard-typescript
description: TypeScript/JavaScript coding standards for the frontend (Vue 3 + Vite). Use when writing or reviewing client-side .ts/.vue/.js files — covers type safety, tsconfig, generics, async patterns, error handling, immutability, imports, and Vue script setup / props / emits typing.
user-invocable: false
---

> Sources: TypeScript official docs (typescriptlang.org), Google TypeScript Style Guide, TypeScript Do's and Don'ts handbook.
>
> **Frontend (Vue 3 + Vite) variant** — examples target the browser/DOM and `<script setup lang="ts">`. For the Node backend variant see `server/.claude/skills/standard-typescript`.

---

## tsconfig.json — Required Settings

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "esModuleInterop": true,
    "incremental": true,
    "skipLibCheck": true
  }
}
```

`strict: true` enables: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`.

> **Frontend resolution**: bundled by Vite, so use `module: "ESNext"` + `moduleResolution: "Bundler"`, and include `"DOM"` in `lib`. `.vue` files are type-checked via `vue-tsc` (`yarn type-check` / `vue-tsc --build`), which understands `<script setup lang="ts">` blocks — Vite itself does not type-check on `yarn dev`/`yarn build`'s transform step, so `vue-tsc` must be run explicitly (it already is, via `yarn build` → `run-p type-check "build-only"`).

Additional required flags:

| Flag                          | Enforces                                                  |
| ------------------------------ | ----------------------------------------------------------- |
| `noUncheckedIndexedAccess`     | Array/object index returns `T \| undefined`, not `T`      |
| `noImplicitReturns`            | All code paths must return a value                        |
| `noFallthroughCasesInSwitch`   | `switch` cases must have `break` or `return`               |
| `exactOptionalPropertyTypes`   | Distinguishes `undefined` from missing optional property   |
| `noImplicitOverride`           | Requires `override` keyword on overridden methods           |
| `verbatimModuleSyntax`         | Enforces `import type` for type-only imports                |
| `incremental`                  | Enables `.tsbuildinfo` cache for faster rebuilds            |

---

## Type vs Interface

- `interface` for object shapes that may be extended or implemented by a class
- `type` for unions, intersections, mapped types, conditional types, and primitives
- Never use `interface` for unions

```ts
interface Link {
  id: string
  code: string
  originalUrl: string
}

type SortOrder = 'asc' | 'desc'
type LinkWithClicks = Link & { clickCount: number }
type UpdateLinkInput = Partial<Pick<Link, 'originalUrl'>>
```

---

## Forbidden Patterns (Official TypeScript Do's and Don'ts)

### Boxed primitives — never use

```ts
// ❌
function parse(s: String): Number {}

// ✅
function parse(s: string): number {}
```

Never use `Number`, `String`, `Boolean`, `Symbol`, `Object` as types. Use `number`, `string`, `boolean`, `symbol`, `object` or `Record<string, unknown>`.

### `any` — forbidden except during JS migration

```ts
// ❌
const data: any = fetchData()

// ✅
const data: unknown = fetchData()
if (isLink(data)) {
  data.code
}
```

### `as` type assertion — last resort only

```ts
// ❌ Assertion without verification
const link = response.data as Link

// ✅ Type guard first, then use
function isLink(x: unknown): x is Link {
  return typeof x === 'object' && x !== null && 'code' in x
}
if (isLink(response.data)) {
  response.data.code
}

// ❌ Double assertion — always wrong
const x = foo as unknown as Bar
```

### Non-null assertion `!` — forbidden without structural guarantee

```ts
// ❌
const el = document.getElementById('app')!

// ✅
const el = document.getElementById('app')
if (!el) throw new Error('Element #app not found')
el.style.display = 'none'
```

### `@ts-ignore` — never use

```ts
// ❌
// @ts-ignore

// ✅ Only with explanation, only when suppressing a known TS bug
// @ts-expect-error: TS incorrectly infers return type — tracked in #1234
```

---

## Null & Undefined Handling

- `null` = intentionally absent value
- `undefined` = value was never set
- Never use `||` for defaults when `0` or `''` are valid values — use `??`

```ts
// ❌
const label = link.label || 'Untitled' // treats '' as falsy

// ✅
const label = link.label ?? 'Untitled'

// ✅ Optional chaining
console.log(link?.stats?.clickCount)
```

---

## Type Narrowing

```ts
// typeof
if (typeof value === 'string') {
  value.toUpperCase()
}

// instanceof
if (error instanceof AppError) {
  error.code
}

// Discriminated union
type QueryState =
  | { status: 'pending' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: Link[] }

function render(state: QueryState): string {
  switch (state.status) {
    case 'pending':
      return 'Loading…'
    case 'error':
      return state.error
    case 'success':
      return `${state.data.length} links`
    default:
      return assertNever(state)
  }
}

// Exhaustiveness check
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`)
}
```

---

## Generics

- Generic type parameter must be used — never create a generic that ignores its parameter
- Constrain with `extends` when specific properties are needed
- Descriptive names for multiple parameters: `TKey`, `TValue`, not `T`, `U`

```ts
// ❌ Useless generic
function wrap<T>(): void {}

// ✅
function wrap<T>(value: T): { value: T } {
  return { value }
}

// Constraint
function getProperty<TObj, TKey extends keyof TObj>(obj: TObj, key: TKey): TObj[TKey] {
  return obj[key]
}

// Result type pattern
type Result<T> = { success: true; data: T } | { success: false; error: string }
```

---

## Utility Types — Use Instead of Manual Duplication

```ts
Partial<T> // all properties optional
Required<T> // all properties required
Readonly<T> // all properties readonly
Pick<T, K> // select subset of properties
Omit<T, K> // exclude properties
Record<K, V> // object with keys K and values V
ReturnType<T> // infer return type of function
Parameters<T> // infer parameter types of function
NonNullable<T> // exclude null and undefined
Awaited<T> // unwrap Promise type
```

---

## Function Types

- `void` return type for callbacks whose value is ignored — never `any`
- Prefer optional parameters over multiple overloads for trailing params
- Prefer union types over overloads that differ only in argument type
- Sort overloads from most specific to most general

```ts
// ❌
function run(cb: () => any): void {
  cb()
}
// ✅
function run(cb: () => void): void {
  cb()
}

// ❌ Overloads for trailing optional
function create(name: string): Link
function create(name: string, code: string): Link
// ✅
function create(name: string, code?: string): Link

// ❌ Overloads differing only by argument type
function format(x: string): string
function format(x: number): string
// ✅
function format(x: string | number): string
```

---

## Immutability

- Use spread operator over direct mutation
- Use `Readonly<T>` and `readonly` for data that should not be modified
- Prefer `.map()`, `.filter()`, `.reduce()` over mutating loops
- Inside a Pinia store or composable, replace a `ref` array wholesale (`codes.value = [...]`) rather than mutating via index assignment, when the update is a derived/new list

```ts
// ❌
obj.key = val
arr.push(item)

// ✅
const newObj = { ...obj, key: val }
const newArr = [...arr, item]

// readonly in interfaces
interface Point {
  readonly x: number
  readonly y: number
}

// ReadonlyArray
function process(items: readonly string[]): void {}
```

---

## Enums — Avoid, Use Union Types Instead

```ts
// ❌ Enum — generates runtime JS, not tree-shakeable
enum Direction {
  Up = 'UP',
  Down = 'DOWN',
}

// ✅ Union type — zero runtime cost
type Direction = 'UP' | 'DOWN'

// ✅ Const object — when runtime values needed
const Direction = { Up: 'UP', Down: 'DOWN' } as const
type Direction = (typeof Direction)[keyof typeof Direction]
```

---

## `const` and `satisfies`

```ts
// as const — preserves literal types
const config = { baseUrl: '/api', timeout: 3000 } as const

// satisfies — validates type without widening inference
const palette = {
  red: ['#ff0000'],
} satisfies Record<string, string[]>
// palette.red is still string[], not widened
```

---

## Async Patterns

- `Promise.all()` for independent concurrent calls — never sequential when unnecessary
- `Promise.allSettled()` when partial failure is acceptable
- Always handle promise rejections — an unhandled rejection surfaces as a `window` `unhandledrejection` event and breaks the UI flow. Let async state land through TanStack Vue Query (`useQuery`/`useMutation`) or a Pinia action, never a floating `.then()` inside a `<script setup>` top level

```ts
// ❌ Sequential — adds full latency per call
const link = await getLink(code)
const stats = await getStats(code)

// ✅ Parallel
const [link, stats] = await Promise.all([getLink(code), getStats(code)])

// When partial failure is OK
const results = await Promise.allSettled([fetchA(), fetchB()])
results.forEach((r) => {
  if (r.status === 'fulfilled') use(r.value)
  else console.error(r.reason)
})
```

---

## Error Handling

- `catch` type is `unknown` in strict mode — always narrow before use
- Use typed error classes for domain-specific failures
- Always check `response.ok` before parsing a raw `fetch` response (not applicable to `axios`, which throws on non-2xx by default — still narrow the caught error)

```ts
// ✅ Narrow catch type
try {
  await doSomething()
} catch (e) {
  if (e instanceof Error) console.error(e.message)
  else console.error(String(e))
}

// ✅ Typed error class
class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// ✅ Narrowing an axios error
import { isAxiosError } from 'axios'

try {
  await apiClient.post('/links', { url })
} catch (e) {
  if (isAxiosError(e)) {
    console.error(e.response?.status, e.response?.data)
  } else if (e instanceof Error) {
    console.error(e.message)
  }
}
```

---

## Imports

```ts
// ❌ Regular import for type
import { Link } from './types'

// ✅ Type-only import
import type { Link } from './types'

// ✅ Mixed
import { fetchLink, type Link } from './api'
```

- Named exports only for utilities, composables, stores — **except** Vue Router lazy route components, which use `component: () => import('../views/HistoryView.vue')` (the `.vue` SFC default-exports the component object, this is a framework/build contract, not a style choice)
- Barrel files (`index.ts`): allowed in `types/` and public API surface only — not inside feature folders
- No circular dependencies — restructure or use `import type` to break cycles

### Vue SFC default-export contract

`.vue` Single File Components compile to a default export (the component definition) — this is how `<script setup>` works and is not optional:

```ts
// HomeView.vue compiles to a default export automatically — no action needed
import HomeView from '../views/HomeView.vue'
```

Everywhere else (composables, stores, utils, API request functions, plain `.ts` modules) → **named exports only**.

---

## Vue `<script setup lang="ts">` Typing

- **Type props/emits via the generic on `defineProps<T>()` / `defineEmits<T>()`** — never the runtime array form, never a separately-exported `Props` interface reused elsewhere unless genuinely shared. Inline the type literal directly in the generic for component-local shapes:

```vue
<script setup lang="ts">
// ✅ Inline generic type — component-local prop shape
const props = defineProps<{ label: string; disabled?: boolean }>()
const emit = defineEmits<{ submit: [value: string] }>()
</script>
```

- Extract a named `type` only when the same prop shape is genuinely reused across multiple components — then it belongs in a shared module (e.g. co-located `types.ts` next to the components that share it), not duplicated.
- Template refs: type via the generic on `ref<T>(null)` and the element/component type:

```ts
const inputRef = ref<HTMLInputElement | null>(null)
```

- Event handlers on native elements use the precise DOM event type in the handler signature: `(e: Event) => { const target = e.target as HTMLInputElement }` is acceptable here specifically because `Event.target` is typed as the looser `EventTarget | null` by the DOM lib — narrow immediately, don't propagate the cast.
- `defineExpose()` for anything a parent needs to call imperatively on a child — type its argument object explicitly.

---

## DO NOT

- Use `Number`, `String`, `Boolean`, `Symbol`, `Object` as types
- Use `any` in production code — use `unknown` + type guard
- Use `as` to bypass type errors — fix the type instead
- Use `// @ts-ignore` — use `// @ts-expect-error` with explanation
- Use `!` non-null assertion without a structural guarantee
- Use `||` for default values when `0` or `''` are valid — use `??`
- Create enums when union types or const objects suffice
- Use `defineProps`/`defineEmits` runtime array form instead of the typed generic
- Write overloads differing only in argument type — use union
- Duplicate type definitions when utility types can derive them
- Use generic parameters not referenced in the signature
- Use barrel files inside feature folders
- Hardcode date/number formats — use `Intl.*`
- Leave unhandled promise rejections

---

## Code Review Checklist

### Blocking

- [ ] `any` used in non-migration code
- [ ] `// @ts-ignore` present
- [ ] `as` assertion without prior type guard
- [ ] `!` non-null assertion without structural guarantee
- [ ] Boxed primitive types used: `String`, `Number`, `Boolean`, `Object`
- [ ] `catch (e)` with `e` used without narrowing
- [ ] `import type` missing for type-only import (`verbatimModuleSyntax`)
- [ ] `defineProps`/`defineEmits` using runtime array form instead of typed generic
- [ ] Sequential `await` for independent operations
- [ ] Unhandled promise rejection

### Warning

- [ ] `interface` used for union — should be `type`
- [ ] Manual type duplication instead of utility type
- [ ] Enum used instead of union type or const object
- [ ] Overloads differing only in argument type — use union
- [ ] Generic parameter not referenced in signature
- [ ] `||` used for default when `0`/`''` is valid — use `??`
- [ ] Axios error caught without `isAxiosError` narrowing
- [ ] Fetch/timer/subscription not cleaned up in `onUnmounted`
- [ ] Date or number hardcoded format — use `Intl.*`

### Suggestion

- [ ] `satisfies` could replace type annotation to preserve literal types
- [ ] Discriminated union could replace boolean flag on type
- [ ] `readonly` missing on immutable properties
- [ ] JSDoc missing on exported function
- [ ] `@deprecated` tag missing on deprecated export
- [ ] `Promise.allSettled` could replace `Promise.all` for fault-tolerant flows
