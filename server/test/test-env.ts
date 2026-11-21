import { loadEnv } from '../src/config/app-config';

/**
 * Points DATABASE_URL at the dedicated e2e database: the dev DB name with a
 * `_test` suffix (standard-prisma §Testing — e2e never touches the dev DB).
 */
export function useTestDatabase(): void {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url)
    throw new Error('DATABASE_URL is not set (copy .env.example to .env)');
  const parsed = new URL(url);
  if (!parsed.pathname.endsWith('_test')) parsed.pathname += '_test';
  process.env.DATABASE_URL = parsed.toString();
}
