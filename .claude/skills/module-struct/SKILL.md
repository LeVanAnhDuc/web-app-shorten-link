---
name: module-struct
description: File structure, naming conventions, and wiring patterns for a NestJS feature module in this project. Use when scaffolding, reviewing, or navigating any module — covers folder layout (dto, entities via Prisma, exceptions), controller/service/module wiring, DI via PrismaService, and when to split a service.
user-invocable: false
---

# Module Structure (NestJS)

## 📁 Standard feature module layout

```
src/modules/links/
├── dto/
│   ├── create-link.dto.ts
│   ├── link-response.dto.ts
│   └── index.ts                 ← barrel (2+ files → barrel required, see rule below)
├── links.module.ts               ← wires controller + service + imports
├── links.controller.ts           ← HTTP handlers only (routes via decorators)
└── links.service.ts              ← business logic, talks to PrismaService
```

This is the **entire** shape needed for P1's one module (`links`). NestJS's own decorators replace most of what a hand-rolled Express module needs (`*.routes.ts`, manual factory wiring, middleware stacking) — do not recreate those files.

⚠️ **YAGNI still applies.** Don't create `services/`, `repositories/`, `guards/`, `strategies/` folders "for later." P1 has no auth, no multi-variant use case, and no second service — a flat 4–5 file module is correct. Grow structure only when a real second concern appears (see §Splitting below).

---

## 📦 Barrel rule for `dto/`

- **1 DTO file** → no barrel needed, import directly (`from "./dto/create-link.dto"`).
- **2+ DTO files** → add `dto/index.ts` re-exporting all of them; code outside the module imports from the barrel (`from "./dto"`), not individual files.

```ts
// dto/index.ts
export { CreateLinkDto } from "./create-link.dto";
export { LinkResponseDto } from "./link-response.dto";
```

---

## 1. `dto/` — Data Transfer Objects

**Chứa:** request shape (validated with `class-validator`) and response shape (mapped from the Prisma model).

**Rules:**

- DTOs are **classes**, not interfaces — `class-validator` decorators require class metadata at runtime.
- 1 file = 1 DTO. Name by action: `create-link.dto.ts`, `link-response.dto.ts`.
- Request DTO: only fields the client sends, each with a `class-validator` decorator.
- Response DTO: only fields safe to expose — never spread the raw Prisma model (that would leak `ownerId` even when null, or any future internal column).

```ts
// dto/create-link.dto.ts
import { IsOptional, IsUrl, Matches } from "class-validator";

export class CreateLinkDto {
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  url!: string;

  @IsOptional()
  @Matches(/^[a-zA-Z0-9_-]{3,32}$/)
  customAlias?: string;
}

// dto/link-response.dto.ts
export class LinkResponseDto {
  code!: string;
  shortUrl!: string;
  originalUrl!: string;
  clickCount!: number;
  createdAt!: Date;

  static fromEntity(link: { code: string; originalUrl: string; clickCount: number; createdAt: Date }, baseUrl: string): LinkResponseDto {
    const dto = new LinkResponseDto();
    dto.code = link.code;
    dto.shortUrl = `${baseUrl}/${link.code}`;
    dto.originalUrl = link.originalUrl;
    dto.clickCount = link.clickCount;
    dto.createdAt = link.createdAt;
    return dto;
  }
}
```

---

## 2. Entities — none; Prisma is the schema

Unlike a Mongoose-based project, there is **no `entities/` folder**. The Prisma schema (`prisma/schema.prisma`) is the single source of truth for the `Link` model; the generated `@prisma/client` types (`Link`) are imported directly where needed. Do not hand-write a duplicate TypeScript entity class.

```ts
import type { Link } from "@prisma/client";
```

---

## 3. `{feature}.module.ts` — Module wiring

```ts
// links.module.ts
import { Module } from "@nestjs/common";
import { LinksController } from "./links.controller";
import { LinksService } from "./links.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [LinksController],
  providers: [LinksService],
})
export class LinksModule {}
```

- Register the module in `AppModule`'s `imports`.
- `PrismaModule` is a global-ish shared module (see `standard-prisma/SKILL.md`) providing `PrismaService` — every feature module that touches the DB imports it.

---

## 4. `{feature}.controller.ts` — HTTP handlers

```ts
// links.controller.ts
import { Body, Controller, Get, HttpStatus, NotFoundException, Param, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { LinksService } from "./links.service";
import { CreateLinkDto, LinkResponseDto } from "./dto";

@Controller("api/links")
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  async create(@Body() dto: CreateLinkDto): Promise<LinkResponseDto> {
    return this.linksService.createLink(dto);
  }

  @Get(":code")
  async getMetadata(@Param("code") code: string): Promise<LinkResponseDto> {
    const link = await this.linksService.findByCode(code);
    if (!link) throw new NotFoundException("Link not found");
    return link;
  }
}
```

The **redirect** handler (`GET /:code`, no `/api` prefix) lives in its own controller, or in a separate root-level controller — do not nest it under `@Controller("api/links")`, since its route is deliberately not under `/api` (see `standard-restful-api/SKILL.md`):

```ts
// redirect.controller.ts
@Controller()
export class RedirectController {
  constructor(private readonly linksService: LinksService) {}

  @Get(":code")
  async redirect(@Param("code") code: string, @Res() res: Response): Promise<void> {
    const link = await this.linksService.findAndTrackClick(code);
    if (!link) throw new NotFoundException("Link not found");
    res.redirect(HttpStatus.FOUND, link.originalUrl);
  }
}
```

Both controllers can live in the same `links` module and share `LinksModule`'s `providers`.

**Rules:**

- Controllers only parse input (via `@Param`/`@Body` + DTO) and delegate to the service — no Prisma calls, no business logic here.
- Throw `HttpException` subclasses (`NotFoundException`, `ConflictException`) directly from the controller when the check is purely "does this exist" — push actual business rules (alias generation, click counting) into the service.

---

## 5. `{feature}.service.ts` — Business logic

```ts
// links.service.ts
import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { customAlphabet } from "nanoid";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLinkDto, LinkResponseDto } from "./dto";

const generateCode = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 7);

@Injectable()
export class LinksService {
  constructor(private readonly prisma: PrismaService) {}

  async createLink(dto: CreateLinkDto): Promise<LinkResponseDto> {
    const code = dto.customAlias ?? generateCode();
    try {
      const link = await this.prisma.link.create({
        data: { code, originalUrl: dto.url, customAlias: dto.customAlias ?? null },
      });
      return LinkResponseDto.fromEntity(link, process.env.BASE_URL!);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException(`Alias "${dto.customAlias}" is already in use`);
      }
      throw error;
    }
  }

  async findByCode(code: string) {
    const link = await this.prisma.link.findUnique({ where: { code } });
    return link ? LinkResponseDto.fromEntity(link, process.env.BASE_URL!) : null;
  }

  async findAndTrackClick(code: string) {
    return this.prisma.link
      .update({ where: { code }, data: { clickCount: { increment: 1 } } })
      .catch(() => null); // P2025 (not found) → null, let controller 404
  }
}
```

**Rules:**

- Service methods take primitives/DTOs, return DTOs or `null` — never take/return `Request`/`Response`.
- Rely on the `@@unique([code])` DB constraint + catching `P2002` for alias-conflict detection — do not pre-check existence then insert (TOCTOU race under concurrent requests).
- One service per module is enough for all of P1. Split only per §Splitting below.

---

## Splitting a service (only when actually needed)

Split `{feature}.service.ts` into `services/` (2+ files) only when a **second, distinct concern** appears — e.g. a future `links-analytics.service.ts` for P3 click-breakdown aggregation. Until that concern exists, do not create the folder pre-emptively. When it does:

```
links/
├── services/
│   ├── links.service.ts          ← core CRUD + redirect logic
│   ├── links-analytics.service.ts
│   └── index.ts
```

---

## Inter-Module Dependency

When module A needs module B's service, `import` B's module in A's `@Module({ imports: [...] })` and export the service from B's module (`exports: [BService]`). Inject via constructor — never reach into another module's internals directly.

```ts
// b.module.ts
@Module({ providers: [BService], exports: [BService] })
export class BModule {}

// a.module.ts
@Module({ imports: [BModule], providers: [AService] })
export class AModule {}
```

**Circular:** if A needs B and B needs A, extract the shared logic into a third module rather than reaching for `forwardRef()` as a first resort.

---

## 📛 Naming summary

| File                        | Suffix              | Class suffix |
| ----------------------------- | ---------------------- | -------------- |
| `*.module.ts`               | `.module.ts`         | `Module`     |
| `*.controller.ts`           | `.controller.ts`     | `Controller` |
| `*.service.ts`              | `.service.ts`        | `Service`    |
| `dto/*.dto.ts`               | `.dto.ts`            | `Dto`        |
| test co-located              | `.spec.ts`           | —            |
| e2e test (`test/`)          | `.e2e-spec.ts`       | —            |

---

## 🏆 Golden rules

1. **YAGNI** — a module needs `dto/` + 3 core files (module/controller/service) until proven otherwise. Don't scaffold empty `guards/`/`repositories/`/`strategies/` folders.
2. **No Prisma calls outside services** — controllers never import `PrismaService`.
3. **Folder names are plural** — `dto/` convention in this codebase, and any future multi-file folder (`services/`) follows suit.
4. **Response DTOs are explicit** — never return a raw Prisma model object from a controller method; always map through a DTO (see `standard-restful-api/SKILL.md`).
