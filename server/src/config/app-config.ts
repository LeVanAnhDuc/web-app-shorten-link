import { existsSync } from 'node:fs';
import { Global, Module } from '@nestjs/common';

const DEFAULT_PUBLIC_BASE_URL = 'http://localhost:5300';
const DEFAULT_CLIENT_ORIGIN = 'http://localhost:3300';

/**
 * Loads `.env` from the working directory with Node's built-in loader, so the
 * runtime needs neither dotenv nor @nestjs/config. Existing env vars win.
 */
export function loadEnv(path = '.env'): void {
  if (existsSync(path)) process.loadEnvFile(path);
}

/** Runtime config, injected as a provider so tests can override it. */
export class AppConfig {
  private constructor(
    readonly publicBaseUrl: string,
    readonly clientOrigin: string,
  ) {}

  /** Lowercased hostname of the public base URL, without port. */
  get publicHostname(): string {
    return new URL(this.publicBaseUrl).hostname.toLowerCase();
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env): AppConfig {
    const publicBaseUrl = (
      env.PUBLIC_BASE_URL ?? DEFAULT_PUBLIC_BASE_URL
    ).replace(/\/+$/, '');
    // Fail at startup rather than on the first request (publicHostname parses it).
    if (!URL.canParse(publicBaseUrl)) {
      throw new Error(`PUBLIC_BASE_URL is not a valid URL: "${publicBaseUrl}"`);
    }
    return new AppConfig(
      publicBaseUrl,
      env.CLIENT_ORIGIN ?? DEFAULT_CLIENT_ORIGIN,
    );
  }

  /** Builds a config with explicit values — for tests. */
  static of(values: {
    publicBaseUrl: string;
    clientOrigin?: string;
  }): AppConfig {
    return AppConfig.fromEnv({
      PUBLIC_BASE_URL: values.publicBaseUrl,
      CLIENT_ORIGIN: values.clientOrigin ?? DEFAULT_CLIENT_ORIGIN,
    });
  }
}

@Global()
@Module({
  providers: [{ provide: AppConfig, useFactory: () => AppConfig.fromEnv() }],
  exports: [AppConfig],
})
export class AppConfigModule {}
