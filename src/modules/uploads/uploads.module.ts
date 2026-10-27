import { Module, UnsupportedMediaTypeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Env } from '../../config/env';
import { ALLOWED_IMAGE_MIME_TYPES } from '../../core/storage/image-signature';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        storage: memoryStorage(),
        limits: {
          fileSize:
            config.get('UPLOAD_MAX_SIZE_MB', { infer: true }) * 1024 * 1024,
          files: 1,
          fields: 5,
        },
        // Cheap early rejection by declared type; the real check is on file content.
        fileFilter: (_req, file, callback) => {
          if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype))
            callback(null, true);
          else
            callback(
              new UnsupportedMediaTypeException(
                'Only JPEG, PNG, WebP or GIF images are allowed',
              ),
              false,
            );
        },
      }),
    }),
  ],
  controllers: [UploadsController],
})
export class UploadsModule {}
