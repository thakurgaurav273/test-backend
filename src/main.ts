import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { Env } from './config/env';
import { setupSwagger, SWAGGER_PATH } from './config/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const appUrl = config.get('APP_URL', { infer: true });
  if (config.get('SWAGGER_ENABLED', { infer: true })) setupSwagger(app);

  await app.listen(config.get('PORT', { infer: true }));

  const logger = new Logger('Bootstrap');
  logger.log(`API ready at ${appUrl}/api`);
  if (config.get('SWAGGER_ENABLED', { infer: true }))
    logger.log(`Swagger docs at ${appUrl}/${SWAGGER_PATH}`);
}

void bootstrap();
