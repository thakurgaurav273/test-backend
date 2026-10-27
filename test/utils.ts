import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { MailService } from '../src/core/mail/mail.service';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { setupSwagger } from '../src/config/swagger';

export const ADMIN = { email: 'admin@test.dev', password: 'Correct-Horse-42' };
export const TRUSTED_ORIGIN = 'http://localhost:3000';

export const mailMock = { send: jest.fn() };

export interface TestContext {
  app: NestExpressApplication;
  http: App;
  prisma: PrismaService;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useValue(mailMock)
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: ['error'],
  });
  configureApp(app);
  setupSwagger(app);
  await app.init();

  const prisma = app.get(PrismaService);
  await resetDatabase(prisma);
  await prisma.admin.create({
    data: {
      email: ADMIN.email,
      name: 'Test Admin',
      passwordHash: await bcrypt.hash(ADMIN.password, 4),
    },
  });

  return { app, http: app.getHttpServer() as App, prisma };
}

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const [{ db }] = await prisma.$queryRaw<
    { db: string }[]
  >`SELECT current_database() AS db`;
  if (!db.endsWith('_test'))
    throw new Error(`Refusing to truncate non-test database "${db}"`);
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables
    .map(({ tablename }) => `"public"."${tablename}"`)
    .join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
  );
}

export async function loginToken(http: App): Promise<string> {
  const res = await request(http)
    .post('/api/auth/login')
    .send(ADMIN)
    .expect(200);
  return (res.body as { data: { token: string } }).data.token;
}
