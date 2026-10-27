import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { Env, trustedOrigins } from './config/env';

/** Express-level setup shared by main.ts and the e2e tests. */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const allowedOrigins = new Set(
    trustedOrigins({
      CORS_ORIGINS: config.get('CORS_ORIGINS', { infer: true }),
      APP_URL: config.get('APP_URL', { infer: true }),
    }),
  );

  app.set('trust proxy', config.get('TRUST_PROXY', { infer: true }));
  app.disable('x-powered-by');
  // Images are loaded by the website and app from other origins.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: { scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'] },
      },
    }),
  );
  app.enableCors({
    // Requests without an Origin header (mobile app, curl, server-side fetch) are allowed.
    origin: (origin, callback) =>
      callback(null, !origin || allowedOrigins.has(origin)),
    credentials: true,
  });
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '1mb' });
  app.setGlobalPrefix('api');
  app.useStaticAssets(resolve(config.get('UPLOAD_DIR', { infer: true })), {
    prefix: '/uploads/',
    index: false,
    dotfiles: 'deny',
    fallthrough: true,
  });
  app.enableShutdownHooks();
}
