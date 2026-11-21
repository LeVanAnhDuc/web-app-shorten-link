---
name: standard-typescript
description: TypeScript standards for the NestJS backend. Use when writing or reviewing server-side .ts files — type safety, decorator/DI pitfalls, null handling, error narrowing, imports, naming.
user-invocable: false
---

> Sources: TypeScript handbook (Do's and Don'ts), Google TypeScript Style Guide, NestJS docs. Browser/Vue variant: `client/.claude/skills/standard-typescript`.

- `tsconfig.json` is the Nest scaffold: `module`/`moduleResolution` `nodenext` (CommonJS output — no `"type": "module"`), `isolatedModules`, decorators + `emitDecoratorMetadata` on, `strictNullChecks` on but `noImplicitAny` off. Write code as if full `strict` were on; changing tsconfig flags is its own change, not part of a feature.
- **DI pitfall**: a class used as a constructor-injected type (`PrismaService`, `LinksService`, `ConfigService`) must be a **value** import — `import type` erases it and breaks decorator metadata/DI at runtime. Use `import type` only for pure types (`import type { Link } from '@prisma/client'`, `import type { Response } from 'express'`).
- DTOs are classes (class-validator), definite-assigned with `!`; that is the only routine use of `!`. Elsewhere, no non-null assertion without a structural guarantee — e.g. never `process.env.BASE_URL!`.
- No `any` — use `unknown` + narrowing. `as` only after a guard; never `as unknown as X`. No `@ts-ignore`; `@ts-expect-error` with a reason only.
- `catch (e)` is `unknown`: narrow with `instanceof Prisma.PrismaClientKnownRequestError` / `instanceof Error` before use, and rethrow what you do not handle.
- Domain errors are Nest `HttpException` subclasses, never `new Error(...)` in a controller/service.
- `??` for defaults (`dto.customAlias ?? generateCode()`), not `||`. Prisma nullable columns are `null`, optional DTO fields are `undefined` — convert explicitly (`customAlias ?? null`) when writing.
- `interface` for object shapes, `type` for unions/intersections/mapped types. Prefer union literals or `as const` objects over `enum`. Derive with utility types (`Pick<Link, …>`) instead of duplicating Prisma shapes.
- Constructor injection only, `private readonly`. No `new XxxService()` outside tests.
- Named exports only (no default exports); one class per file; files kebab-case with role suffix.
- `Promise.all` for independent awaits; no floating promises (`bootstrap()` is the only top-level call and must not swallow rejections).
- No `Number`/`String`/`Boolean`/`Object` boxed types.
