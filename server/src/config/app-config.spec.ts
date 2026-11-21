import { AppConfig } from './app-config';

describe('AppConfig.fromEnv', () => {
  it('falls back to the local dev defaults', () => {
    const config = AppConfig.fromEnv({});

    expect(config.publicBaseUrl).toBe('http://localhost:5300');
    expect(config.clientOrigin).toBe('http://localhost:3300');
  });

  it('drops a trailing slash from PUBLIC_BASE_URL', () => {
    const config = AppConfig.fromEnv({ PUBLIC_BASE_URL: 'https://sho.rt/' });

    expect(config.publicBaseUrl).toBe('https://sho.rt');
  });

  it('exposes the hostname of the public base URL', () => {
    const config = AppConfig.fromEnv({
      PUBLIC_BASE_URL: 'https://Sho.RT:8443',
    });

    expect(config.publicHostname).toBe('sho.rt');
  });
});
