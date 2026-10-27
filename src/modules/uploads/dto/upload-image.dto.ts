import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  UPLOAD_FOLDERS,
  type UploadFolder,
} from '../../../core/storage/storage.service';

export class UploadImageDto {
  @ApiProperty({ enum: UPLOAD_FOLDERS, required: false, default: 'general' })
  @IsOptional()
  @IsIn(UPLOAD_FOLDERS)
  folder: UploadFolder = 'general';
}
