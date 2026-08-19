---
name: standard-typescript
description: TypeScript coding standards for the backend (Node.js + NestJS). Use when writing or reviewing server-side .ts files — covers type safety, tsconfig, decorators, generics, async patterns, error handling, immutability, imports, and naming conventions.
user-invocable: false
---

> Sources: TypeScript official docs (typescriptlang.org), Google TypeScript Style Guide, TypeScript Do's and Don'ts handbook, NestJS official docs.
>
> **Backend (Node.js + NestJS) variant** — examples target a Node runtime (no DOM), using NestJS decorators + Prisma. For the browser/Vue variant see `client/.claude/skills/standard-typescript`.

---

## tsconfig.json — Required Settings

NestJS scaffolds `tsconfig.json` with `experimentalDecorators` + `emitDecoratorMetadata` already on (required for DI decorators and Prisma's generated types to work). Keep these, and layer the strict-mode flags on top:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "ES2022",
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "incremental": true,
    "skipLibCheck": true
  }
}
```

`strict: true` enables: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`.

> **Node module resolution**: the backend runs on Node.js via NestJS's CommonJS build (`nest build`) — use `module: "commonjs"` / `moduleResolution: "node"`, **not** `"bundler"` (that is a frontend/Vite setting).
>
> **`exactOptionalPropertyTypes` and `verbatimModuleSyntax`**: NestJS's decorator metadata reflection and Prisma's generated input types are not fully compatible with these two flags — do not enable them here (they are safe on the frontend/Vue side).

| Flag                         | Enforces                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `noUncheckedIndexedAccess`   | Array/object index returns `T \| undefined`, not `T`     |
| `noImplicitReturns`          | All code paths must return a value                       |
| `noFallthroughCasesInSwitch` | `switch` cases must have `break` or `return`             |
| `noImplicitOverride`         | Requires `override` keyword on overridden methods        |
| `incremental`                | Enables `.tsbuildinfo` cache for faster rebuilds          |

---

## Type vs Interface

- `interface` for object shapes that may be extended or implemented by a class
- `type` for unions, intersections, mapped types, conditional types, and primitives
- Never use `interface` for unions

```ts
interface LinkSummary {
  code: string;
  originalUrl: string;
}

type LinkStatus = "active" | "gone";
type CreateLinkResult = LinkSummary & { shortUrl: string };
```

---

## NestJS Conventions

- **DTOs are classes**, not interfaces/types — `class-validator` decorators need a real class with metadata (see `module-struct/SKILL.md`)
- Constructor-based dependency injection only — no service locator, no manual `new XxxService()` outside of tests
- One class per file, filename matches class purpose: `create-link.dto.ts`, `links.service.ts`, `links.controller.ts`
- Prefer `readonly` on injected dependencies: `constructor(private readonly prisma: PrismaService) {}`
- Never `@Inject()` a concrete class when an interface/token would decouple modules — for this project's size, injecting the concrete `PrismaService` directly is acceptable (no repository abstraction layer required for P1)

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
const data: any = fetchData();

// ✅
const data: unknown = fetchData();
if (isLink(data)) {
  data.code;
}
```

### `as` type assertion — last resort only

```ts
// ❌ Assertion without verification
const link = response.data as Link;

// ✅ Type guard first, then use
function isLink(x: unknown): x is Link {
  return typeof x === "object" && x !== null && "code" in x;
}
if (isLink(response.data)) {
  response.data.code;
}

// ❌ Double assertion — always wrong
const x = foo as unknown as Bar;
```

### Non-null assertion `!` — forbidden without structural guarantee

```ts
// ❌
const baseUrl = process.env.BASE_URL!;

// ✅
const baseUrl = process.env.BASE_URL;
if (!baseUrl) throw new Error("BASE_URL is not configured");
```

### `@ts-ignore` — never use

```ts
// ❌
// @ts-ignore

// ✅ Only with explanation, only when suppressing a known TS bug
// @ts-expect-error: Prisma type narrowing issue — tracked in #123
```

---

## Null & Undefined Handling

- `null` = intentionally absent value (matches Prisma's `null` for nullable columns like `customAlias`, `ownerId`)
- `undefined` = value was never set
- Never use `||` for defaults when `0` or `''` are valid values — use `??`

```ts
// ❌
const alias = dto.customAlias || generateCode(); // treats '' as falsy incorrectly

// ✅
const alias = dto.customAlias ?? generateCode();

// ✅ Optional chaining
console.log(link?.originalUrl);
```

---

## Type Narrowing

```ts
// instanceof — Prisma throws typed errors
import { Prisma } from "@prisma/client";

try {
  await this.prisma.link.create({ data });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new ConflictException("customAlias already in use");
  }
  throw error;
}

// Discriminated union
type ShortenResult =
  | { kind: "created"; code: string }
  | { kind: "conflict"; code: string };

function toResponse(result: ShortenResult) {
  switch (result.kind) {
    case "created":
      return { code: result.code };
    case "conflict":
      throw new ConflictException(`Alias "${result.code}" already exists`);
    default:
      return assertNever(result);
  }
}

function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}
```

---

## Generics

- Generic type parameter must be used — never create a generic that ignores its parameter
- Constrain with `extends` when specific properties are needed
- Descriptive names for multiple parameters: `TKey`, `TValue`, not `T`, `U`

```ts
// ✅
function wrap<T>(value: T): { value: T } {
  return { value };
}

// Result type pattern
type Result<T> = { success: true; data: T } | { success: false; error: string };
```

---

## Utility Types — Use Instead of Manual Duplication

```ts
Partial<T>; // all properties optional
Required<T>; // all properties required
Readonly<T>; // all properties readonly
Pick<T, K>; // select subset of properties
Omit<T, K>; // exclude properties — e.g. Omit<Link, "ownerId"> for the public response DTO
Record<K, V>; // object with keys K and values V
ReturnType<T>; // infer return type of function
Parameters<T>; // infer parameter types of function
NonNullable<T>; // exclude null and undefined
Awaited<T>; // unwrap Promise type
```

---

## Async Patterns

- `Promise.all()` for independent concurrent calls — never sequential when unnecessary
- `Promise.allSettled()` when partial failure is acceptable
- Always handle promise rejections — unhandled rejections crash Node.js
- NestJS route handlers may be `async` directly — Nest awaits the returned promise and serializes the result (or, for the redirect handler, calls `res.redirect()` and returns `void`)

```ts
// ✅ Async controller method
@Get(":code")
async redirect(@Param("code") code: string, @Res() res: Response): Promise<void> {
  const link = await this.linksService.findAndTrackClick(code);
  if (!link) throw new NotFoundException();
  res.redirect(HttpStatus.FOUND, link.originalUrl);
}
```

---

## Error Handling

- `catch` type is `unknown` in strict mode — always narrow before use
- Use NestJS's built-in `HttpException` subclasses (`BadRequestException`, `NotFoundException`, `ConflictException`) for domain errors — Nest's exception filter maps them to the right status code automatically
- Never construct a raw `Error` in a controller/service when an `HttpException` subclass exists for the case

```ts
// ✅ Narrow catch type
try {
  await doSomething();
} catch (e) {
  if (e instanceof Error) this.logger.error(e.message);
  else this.logger.error(String(e));
}
```

---

## Imports

```ts
// ❌ Regular import for type
import { Link } from "@prisma/client";

// ✅ Type-only import when only used as a type
import type { Link } from "@prisma/client";

// ✅ Mixed
import { Injectable, type OnModuleInit } from "@nestjs/common";
```

- No default exports — named exports only (NestJS CLI schematics generate named exports by default — keep it that way)
- Barrel files (`index.ts`): allowed for a folder's public surface (e.g. `dto/index.ts`) — not required for single-file cases
- No circular dependencies between modules — if two modules need each other, use NestJS's `forwardRef()` only as a last resort; prefer extracting shared logic to a third module

---

## DO NOT

- Use `Number`, `String`, `Boolean`, `Symbol`, `Object` as types
- Use `any` in production code — use `unknown` + type guard
- Use `as` to bypass type errors — fix the type instead
- Use `// @ts-ignore` — use `// @ts-expect-error` with explanation
- Use `!` non-null assertion without a structural guarantee
- Use `||` for default values when `0` or `''` are valid — use `??`
- Use default exports
- Throw raw `Error`/`new Error(...)` in a controller or service — use an `HttpException` subclass
- Read `process.env` directly outside of `ConfigService`/module bootstrap
- Call `PrismaService` directly from a controller — always go through the module's service

---

## Code Review Checklist

### Blocking

- [ ] `any` used in non-migration code
- [ ] `// @ts-ignore` present
- [ ] `as` assertion without prior type guard
- [ ] `!` non-null assertion without structural guarantee
- [ ] `catch (e)` with `e` used without narrowing
- [ ] Default export used
- [ ] Sequential `await` for independent operations
- [ ] Unhandled promise rejection
- [ ] Raw `Error` thrown instead of `HttpException` subclass

### Warning

- [ ] `interface` used for union — should be `type`
- [ ] Manual type duplication instead of utility type (`Omit`, `Pick`)
- [ ] `||` used for default when `0`/`''` is valid — use `??`
- [ ] DTO defined as `interface`/`type` instead of `class` (breaks `class-validator`)
- [ ] Controller calling `PrismaService` directly instead of the service layer

### Suggestion

- [ ] Discriminated union could replace boolean flag on type
- [ ] `readonly` missing on injected constructor dependencies
- [ ] JSDoc missing on exported function
