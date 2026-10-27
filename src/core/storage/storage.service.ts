import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { Env } from '../../config/env';

export const UPLOAD_FOLDERS = [
  'hero',
  'services',
  'projects',
  'blog',
  'testimonials',
  'general',
] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export interface StoredFile {
  url: string;
  publicId: string;
}

const LOCAL_PREFIX = 'local:';

/**
 * Stores images on Cloudinary when it is configured, otherwise on local disk
 * (served from /uploads) so the team can develop without cloud credentials.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly useCloudinary: boolean;
  private readonly localRoot: string;
  private readonly appUrl: string;

  constructor(config: ConfigService<Env, true>) {
    const cloudName = config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    const apiKey = config.get('CLOUDINARY_API_KEY', { infer: true });
    const apiSecret = config.get('CLOUDINARY_API_SECRET', { infer: true });
    this.useCloudinary = Boolean(cloudName && apiKey && apiSecret);
    this.localRoot = resolve(config.get('UPLOAD_DIR', { infer: true }));
    this.appUrl = config.get('APP_URL', { infer: true });

    if (this.useCloudinary) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } else {
      this.logger.warn(
        `Cloudinary not configured; storing uploads on disk in ${this.localRoot}`,
      );
    }
  }

  async save(
    buffer: Buffer,
    extension: string,
    folder: UploadFolder,
  ): Promise<StoredFile> {
    try {
      return this.useCloudinary
        ? await this.saveToCloudinary(buffer, folder)
        : await this.saveToDisk(buffer, extension, folder);
    } catch (error) {
      this.logger.error(
        'Image upload failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadGatewayException('Image upload failed, please try again');
    }
  }

  /** Best-effort delete; a failure is logged but never fails the request. */
  async remove(publicId: string | null | undefined): Promise<void> {
    if (!publicId) return;
    try {
      if (publicId.startsWith(LOCAL_PREFIX)) {
        const target = resolve(
          this.localRoot,
          publicId.slice(LOCAL_PREFIX.length),
        );
        if (!target.startsWith(this.localRoot + sep)) {
          this.logger.warn(
            `Refusing to delete path outside upload dir: ${publicId}`,
          );
          return;
        }
        await rm(target, { force: true });
      } else if (this.useCloudinary) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      this.logger.warn(
        `Could not delete ${publicId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Deletes the previous image when an update replaced or cleared it.
   * `next === undefined` means the field was not part of the update.
   */
  async removeIfReplaced(
    previous: string | null,
    next: string | null | undefined,
  ): Promise<void> {
    if (next !== undefined && previous && previous !== next)
      await this.remove(previous);
  }

  private saveToCloudinary(
    buffer: Buffer,
    folder: UploadFolder,
  ): Promise<StoredFile> {
    return new Promise((resolvePromise, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `zoycoders/${folder}`, resource_type: 'image' },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(new Error(error?.message ?? 'Empty Cloudinary response'));
            return;
          }
          resolvePromise({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );
      stream.end(buffer);
    });
  }

  private async saveToDisk(
    buffer: Buffer,
    extension: string,
    folder: UploadFolder,
  ): Promise<StoredFile> {
    const fileName = `${randomUUID()}.${extension}`;
    await mkdir(join(this.localRoot, folder), { recursive: true });
    await writeFile(join(this.localRoot, folder, fileName), buffer);
    return {
      url: `${this.appUrl}/uploads/${folder}/${fileName}`,
      publicId: `${LOCAL_PREFIX}${folder}/${fileName}`,
    };
  }
}
