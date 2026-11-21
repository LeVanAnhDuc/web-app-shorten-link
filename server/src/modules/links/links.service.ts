import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppConfig } from '../../config/app-config';
import { PrismaService } from '../prisma/prisma.service';
import { generateCode } from './code-generator';
import { LinkResponseDto } from './dto/link-response.dto';

/** Generated codes collide rarely; retry this many times before failing (DR-3). */
export const MAX_CODE_ATTEMPTS = 3;

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  async create(originalUrl: string): Promise<LinkResponseDto> {
    for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
      try {
        const link = await this.prisma.link.create({
          data: { code: generateCode(), originalUrl },
        });
        return LinkResponseDto.fromEntity(link, this.config.publicBaseUrl);
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }
    throw new InternalServerErrorException('Could not allocate a short code');
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
