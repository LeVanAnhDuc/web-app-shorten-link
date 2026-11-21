import type { Link } from '@prisma/client';

/** Public shape of a link — explicit whitelist, never the raw Prisma row. */
export class LinkResponseDto {
  code!: string;
  shortUrl!: string;
  originalUrl!: string;
  customAlias!: string | null;
  clickCount!: number;
  createdAt!: string;

  static fromEntity(link: Link, publicBaseUrl: string): LinkResponseDto {
    return Object.assign(new LinkResponseDto(), {
      code: link.code,
      shortUrl: `${publicBaseUrl}/${link.code}`,
      originalUrl: link.originalUrl,
      customAlias: link.customAlias,
      clickCount: link.clickCount,
      createdAt: link.createdAt.toISOString(),
    });
  }
}
