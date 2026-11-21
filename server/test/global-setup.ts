import { execSync } from 'node:child_process';
import { useTestDatabase } from './test-env';

/** Applies all migrations to the e2e database (creates it if missing). */
export default function globalSetup(): void {
  useTestDatabase();
  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });
}
