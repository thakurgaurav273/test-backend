import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import {
  AdminApi,
  ApiEnvelope,
} from '../../common/swagger/api-envelope.decorator';
import { detectImage } from '../../core/storage/image-signature';
import {
  StorageService,
  UPLOAD_FOLDERS,
} from '../../core/storage/storage.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { StoredFileEntity } from './entities/stored-file.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../generated/prisma/client';

@ApiTags('Admin / Uploads')
@Roles(AdminRole.CONTENT)
@AdminApi()
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload an image',
    description:
      'JPEG, PNG, WebP or GIF only (checked by file content). Max size is UPLOAD_MAX_SIZE_MB (default 5 MB).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: {
          type: 'string',
          enum: [...UPLOAD_FOLDERS],
          default: 'general',
        },
      },
    },
  })
  @ApiEnvelope(StoredFileEntity, { status: 201 })
  @ApiPayloadTooLargeResponse({ type: ErrorResponseDto })
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadImageDto,
  ): Promise<StoredFileEntity> {
    if (!file) throw new BadRequestException('file is required');
    const image = detectImage(file.buffer);
    if (!image)
      throw new BadRequestException(
        'Only JPEG, PNG, WebP or GIF images are allowed',
      );
    return this.storage.save(file.buffer, image.extension, dto.folder);
  }
}
