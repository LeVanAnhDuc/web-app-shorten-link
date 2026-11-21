import { isPublicHttpUrl, pointsToHost } from './url-rules';

describe('isPublicHttpUrl (DR-4)', () => {
  it.each([
    'https://example.com',
    'http://example.com/a?b=1#c',
    'https://bücher.de/x',
    'https://sub.example.co.uk/path',
    'HTTPS://EXAMPLE.COM',
  ])('accepts %s', (url) => {
    expect(isPublicHttpUrl(url)).toBe(true);
  });

  it.each([
    '',
    'example.com',
    'http:example.com',
    'ftp://x.com',
    'javascript:alert(1)',
    'data:text/html,x',
    'mailto:a@example.com',
    'http://localhost:8080',
    'http://intranet/page',
    'http://127.0.0.1',
    'http://127.1',
    'http://192.168.1.5',
    'http://[::1]',
    'https://exa mple.com',
    'https://example.123',
    'http://.com',
    'http://a..com',
    'http://-.com',
    'http://a-.example.com',
    'https://google.com@evil.tk',
    'https://user:pass@example.com',
    'https://exa\nmple.com/a',
    'https://example.com/a\tb',
    'https://example.com/\r\nSet-Cookie:x',
    'https://example.com/a b',
    'https://example.com/\u0000',
  ])('rejects %s', (url) => {
    expect(isPublicHttpUrl(url)).toBe(false);
  });
});

describe('pointsToHost (DR-5)', () => {
  it.each([
    'https://sho.rt/x',
    'https://www.sho.rt/x',
    'https://SHO.RT:8443/x',
    'http://a.b.sho.rt',
  ])('matches %s against sho.rt', (url) => {
    expect(pointsToHost(url, 'sho.rt')).toBe(true);
  });

  it.each([
    'https://notsho.rt/x',
    'https://sho.rt.example.com',
    'https://example.com',
  ])('does not match %s against sho.rt', (url) => {
    expect(pointsToHost(url, 'sho.rt')).toBe(false);
  });
});
