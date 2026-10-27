import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    // Vercel's Postgres integration exposes the direct URL as DB_DATABASE_URL.
    url: process.env.DATABASE_URL ?? process.env.DB_DATABASE_URL,
  },
});
