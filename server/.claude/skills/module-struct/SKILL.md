---
name: module-struct
description: File layout, naming and wiring for a NestJS feature module in this project. Use when scaffolding a module, adding a file to one, deciding where code belongs, or reviewing module layout — covers the flat links module, dto/ barrel rule, response-DTO mapping, the separate root-level RedirectController, and when a service may be split.
user-invocable: false
---

# Module layout

```
src/
├── app.setup.ts                  ← configureApp(): ValidationPipe + CORS, shared by main.ts and e2e
├── config/app-config.ts          ← AppConfig provider (@Global AppConfigModule) + loadEnv()
└── modules/
    ├── prisma/                   ← PrismaModule (@Global) + PrismaService — see standard-prisma
    └── links/
        ├── dto/
        │   ├── create-link.dto.ts
        │   ├── link-response.dto.ts
        │   └── index.ts          ← barrel (2+ files)
        ├── code-generator.ts     ← generateCode(): 7 chars, base62 minus 0 O 1 l I
        ├── url-rules.ts          ← isPublicHttpUrl (DR-4), pointsToHost (DR-5), MAX_URL_LENGTH
        ├── links.module.ts
        ├── links.controller.ts   ← @Controller('api/links')
        ├── redirect.controller.ts← @Controller() — GET /:code, NOT under /api (F2)
        ├── links.service.ts
        └── *.spec.ts             ← unit tests co-located
```

Pure rule modules (`code-generator.ts`, `url-rules.ts`) sit next to the service as plain functions — no class, no DI, unit-tested directly.

- This flat shape is all P1 needs. **YAGNI**: no `services/`, `repositories/`, `guards/`, `strategies/`, `entities/`, `*.routes.ts` until a real second concern exists. Never create an empty folder "for later".
- **No `entities/`** — `prisma/schema.prisma` is the model; import generated types (`import type { Link } from '@prisma/client'`). Never hand-write a duplicate entity class.
- **No repository layer** — services inject `PrismaService` directly.
- Folder names plural (`dto/` is the one fixed exception by Nest convention); files kebab-case with suffix `.module.ts` / `.controller.ts` / `.service.ts` / `.dto.ts`; classes `XxxModule` / `XxxController` / `XxxService` / `XxxDto`.

## `dto/` barrel rule

- 1 DTO file → import it directly. 2+ files → `dto/index.ts` re-exports all; outside the folder import only `from './dto'`.
- DTOs are **classes** (class-validator needs runtime metadata), 1 DTO per file, named by action.

```ts
// dto/create-link.dto.ts
export class CreateLinkDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url!: string;

  @IsOptional()
  @Matches(/^[a-zA-Z0-9_-]{3,32}$/)
  customAlias?: string;
}

// dto/link-response.dto.ts — explicit whitelist, never spread the Prisma row
export class LinkResponseDto {
  code!: string;
  shortUrl!: string;
  originalUrl!: string;
  clickCount!: number;
  createdAt!: Date;

  static fromEntity(link: Link, baseUrl: string): LinkResponseDto {
    return Object.assign(new LinkResponseDto(), {
      code: link.code,
      shortUrl: `${baseUrl}/${link.code}`,
      originalUrl: link.originalUrl,
      clickCount: link.clickCount,
      createdAt: link.createdAt,
    });
  }
}
```

`ownerId` (reserved for P2) never appears in a response DTO. Base URL comes from `AppConfig` (injected), never `process.env.X!`.

## Wiring

```ts
@Module({
  controllers: [LinksController, RedirectController],
  providers: [LinksService],
})
export class LinksModule {}
```

- `PrismaModule` is `@Global()` and imported once in `AppModule` — feature modules do **not** re-import it.
- Register `LinksModule` in `AppModule.imports`. Both controllers share the module's providers.
- `RedirectController` is `@Controller()` with `@Get(':code')` and `@Res()` → `res.redirect(HttpStatus.FOUND, url)`. It must not live under `@Controller('api/links')` (see `standard-restful-api`).

## Layer rules

- **Controller**: bind DTO/params, call the service, return a response DTO (or redirect). No `PrismaService`, no business logic. A plain "not found" check (`if (!link) throw new NotFoundException('Link not found')`) may sit here.
- **Service**: takes primitives/DTOs, returns DTOs or `null` — never `Request`/`Response`. Owns code generation (`code-generator.ts`, `node:crypto`), alias handling, click counting, and Prisma error mapping (`P2002` → `ConflictException`, `P2025` → `null`/`NotFoundException`; rethrow anything else — never `.catch(() => null)` on all errors).
- Alias conflict = DB `@unique` + catch `P2002`. Never pre-check with `findUnique` then `create` (race).

## Splitting a service

Only when a distinct second concern actually exists (e.g. P3 analytics): move to `services/` with `links.service.ts`, `links-analytics.service.ts`, `index.ts` barrel. Not before.

## Inter-module dependency

Module B `exports: [BService]`; module A `imports: [BModule]` and injects via constructor. Never import another module's internal files. On a cycle, extract the shared logic into a third module — `forwardRef()` is last resort.
