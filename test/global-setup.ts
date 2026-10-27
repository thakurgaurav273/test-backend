import { execSync } from 'node:child_process';
import './test-env';

/** Brings the test database schema up to date; each suite truncates its tables in createTestApp(). */
export default function globalSetup(): void {
  const dbName = new URL(process.env.DATABASE_URL as string).pathname.slice(1);
  if (!dbName.endsWith('_test')) {
    throw new Error(
      `Refusing to use "${dbName}": e2e tests only run against a database ending in _test`,
    );
  }
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
