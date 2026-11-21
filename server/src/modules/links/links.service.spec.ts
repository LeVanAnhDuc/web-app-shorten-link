import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Link } from '@prisma/client';
import { AppConfig } from '../../config/app-config';
import { PrismaService } from '../prisma/prisma.service';
import { LinksService, MAX_CODE_ATTEMPTS } from './links.service';

function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('boom', {
    code,
    clientVersion: '6.19.3',
  });
}

function storedLink(data: { code: string; originalUrl: string }): Link {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    code: data.code,
    originalUrl: data.originalUrl,
    customAlias: null,
    clickCount: 0,
    createdAt: new Date('2026-11-21T00:00:00.000Z'),
    ownerId: null,
  };
}

describe('LinksService.create', () => {
  let create: jest.Mock;
  let service: LinksService;

  beforeEach(() => {
    create = jest.fn(
      ({ data }: { data: { code: string; originalUrl: string } }) =>
        Promise.resolve(storedLink(data)),
    );
    const prisma = { link: { create } } as unknown as PrismaService;
    service = new LinksService(
      prisma,
      AppConfig.of({ publicBaseUrl: 'http://localhost:5300' }),
    );
  });

  it('stores the link and returns the response DTO', async () => {
    const dto = await service.create('https://example.com');

    expect(dto.code).toMatch(/^[2-9A-HJ-NP-Za-km-z]{7}$/);
    expect(dto.shortUrl).toBe(`http://localhost:5300/${dto.code}`);
    expect(dto.originalUrl).toBe('https://example.com');
    expect(dto.customAlias).toBeNull();
    expect(dto.clickCount).toBe(0);
    expect(dto.createdAt).toBe('2026-11-21T00:00:00.000Z');
    expect(dto).not.toHaveProperty('ownerId');
    expect(dto).not.toHaveProperty('id');
  });

  it('retries with a new code when the code is taken', async () => {
    create
      .mockRejectedValueOnce(prismaError('P2002'))
      .mockRejectedValueOnce(prismaError('P2002'));

    const dto = await service.create('https://example.com');

    expect(create).toHaveBeenCalledTimes(3);
    expect(dto.originalUrl).toBe('https://example.com');
  });

  it(`gives up after ${MAX_CODE_ATTEMPTS} collisions`, async () => {
    create.mockRejectedValue(prismaError('P2002'));

    await expect(service.create('https://example.com')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(create).toHaveBeenCalledTimes(MAX_CODE_ATTEMPTS);
  });

  it('rethrows any other database error at once', async () => {
    const error = prismaError('P1001');
    create.mockRejectedValue(error);

    await expect(service.create('https://example.com')).rejects.toBe(error);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('refuses a URL pointing back at the shortener without touching the DB', async () => {
    await expect(
      service.create('http://www.localhost:5300/x'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });
});
