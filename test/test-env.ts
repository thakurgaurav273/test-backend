import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Test settings; set before AppModule loads so the developer's .env values are not used. */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/zoycoders_test?schema=public';
process.env.JWT_SECRET = 'e2e-test-secret-that-is-definitely-long-enough';
process.env.APP_URL = 'http://localhost:4000';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.UPLOAD_DIR = join(tmpdir(), 'zoycoders-e2e-uploads');
process.env.UPLOAD_MAX_SIZE_MB = '1';
process.env.CLOUDINARY_CLOUD_NAME = '';
process.env.CLOUDINARY_API_KEY = '';
process.env.CLOUDINARY_API_SECRET = '';
process.env.SMTP_HOST = '';
process.env.INQUIRY_NOTIFY_EMAIL = '';
