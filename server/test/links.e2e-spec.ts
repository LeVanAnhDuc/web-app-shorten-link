import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { AppConfig } from '../src/config/app-config';

const CODE = /^[2-9A-HJ-NP-Za-km-z]{7}$/;

interface LinkBody {
  code: string;
  shortUrl: string;
  originalUrl: string;
}

interface ErrorBody {
  statusCode: number;
  message: unknown;
}

/** supertest types `body` as any; tests read it through these shapes. */
function bodyOf<T>(res: { body: unknown }): T {
  return res.body as T;
}

async function createApp(config?: AppConfig): Promise<INestApplication<App>> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (config) builder = builder.overrideProvider(AppConfig).useValue(config);
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

/** `https://example.com/` padded with `a` to exactly `length` characters. */
function urlOfLength(length: number): string {
  const base = 'https://example.com/';
  return base + 'a'.repeat(length - base.length);
}

describe('POST /api/links (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp(
      AppConfig.of({ publicBaseUrl: 'http://localhost:5300' }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (body: unknown) =>
    request(app.getHttpServer())
      .post('/api/links')
      .send(body as object);

  it('creates a link and returns the LinkDto', async () => {
    const res = await post({
      url: 'https://example.com/blog?utm_source=x',
    }).expect(201);

    expect(res.headers['cache-control']).toBe('no-store');
    const body = bodyOf<Record<string, unknown>>(res);
    expect(Object.keys(body).sort()).toEqual([
      'clickCount',
      'code',
      'createdAt',
      'customAlias',
      'originalUrl',
      'shortUrl',
    ]);
    expect(body.code).toMatch(CODE);
    expect(body.shortUrl).toBe(`http://localhost:5300/${String(body.code)}`);
    expect(body.originalUrl).toBe('https://example.com/blog?utm_source=x');
    expect(body.customAlias).toBeNull();
    expect(body.clickCount).toBe(0);
    expect(Number.isNaN(Date.parse(String(body.createdAt)))).toBe(false);
  });

  it('trims surrounding whitespace and stores the URL as typed', async () => {
    const res = await post({ url: '  https://example.com/x\n\t' }).expect(201);
    expect(bodyOf<LinkBody>(res).originalUrl).toBe('https://example.com/x');
  });

  it('keeps a non-ASCII host as typed', async () => {
    const res = await post({ url: 'https://bücher.de/x' }).expect(201);
    expect(bodyOf<LinkBody>(res).originalUrl).toBe('https://bücher.de/x');
  });

  it('creates a new code each time for the same URL', async () => {
    const a = await post({ url: 'https://example.com/same' }).expect(201);
    const b = await post({ url: 'https://example.com/same' }).expect(201);
    expect(bodyOf<LinkBody>(a).code).not.toBe(bodyOf<LinkBody>(b).code);
  });

  it.each([
    ['missing url', {}],
    ['empty url', { url: '' }],
    ['no scheme', { url: 'example.com' }],
    ['ftp scheme', { url: 'ftp://x.com' }],
    ['javascript scheme', { url: 'javascript:alert(1)' }],
    ['localhost', { url: 'http://localhost:8080' }],
    ['IPv4 literal', { url: 'http://127.0.0.1' }],
    ['IPv6 literal', { url: 'http://[::1]' }],
    ['non-string url', { url: 42 }],
    ['unknown field', { url: 'https://example.com', customAlias: 'x' }],
  ])('rejects %s with 400', async (_case, body) => {
    const res = await post(body).expect(400);
    expect(bodyOf<ErrorBody>(res).statusCode).toBe(400);
    expect(Array.isArray(bodyOf<ErrorBody>(res).message)).toBe(true);
  });

  it('accepts 2048 characters and rejects 2049 (after trim)', async () => {
    await post({ url: urlOfLength(2048) }).expect(201);
    await post({ url: `  ${urlOfLength(2048)}  ` }).expect(201);
    await post({ url: urlOfLength(2049) }).expect(400);
  });
});

describe('POST /api/links with a public shortener host (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp(AppConfig.of({ publicBaseUrl: 'https://sho.rt' }));
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    'https://sho.rt/x',
    'https://www.sho.rt/x',
    'https://SHO.RT:8443/x',
  ])('refuses %s, which points back at the shortener', async (url) => {
    await request(app.getHttpServer())
      .post('/api/links')
      .send({ url })
      .expect(400);
  });

  it('builds short URLs on the public base URL', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/links')
      .send({ url: 'https://example.com' })
      .expect(201);
    expect(bodyOf<LinkBody>(res).shortUrl).toMatch(
      /^https:\/\/sho\.rt\/[2-9A-HJ-NP-Za-km-z]{7}$/,
    );
  });
});
