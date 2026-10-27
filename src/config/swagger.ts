import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AUTH_COOKIE } from '../modules/auth/auth.constants';

export const SWAGGER_PATH = 'api/docs';
const SWAGGER_UI_CDN = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.13';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('ZoyCoders API')
    .setDescription(
      [
        'Backend for the ZoyCoders website, admin panel and mobile app.',
        '',
        '**Responses** are wrapped as `{ success: true, data }`; errors as `{ success: false, statusCode, message, errors? }`.',
        '',
        '**Admin auth:** call `POST /api/auth/login`, copy `data.token`, click **Authorize** and paste it into `bearer`.',
        'The admin panel can rely on the httpOnly `token` cookie instead.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addCookieAuth(
      AUTH_COOKIE,
      { type: 'apiKey', in: 'cookie', name: AUTH_COOKIE },
      'cookie',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
  });

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    jsonDocumentUrl: `${SWAGGER_PATH}-json`,
    customSiteTitle: 'ZoyCoders API Docs',
    // Serverless hosts (Vercel) don't ship swagger-ui-dist's static files, so load them from a CDN.
    customCssUrl: `${SWAGGER_UI_CDN}/swagger-ui.css`,
    customJs: [
      `${SWAGGER_UI_CDN}/swagger-ui-bundle.js`,
      `${SWAGGER_UI_CDN}/swagger-ui-standalone-preset.js`,
    ],
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      docExpansion: 'none',
    },
  });
}
