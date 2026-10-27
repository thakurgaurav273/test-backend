import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import {
  IsOptionalPublicId,
  IsOptionalSlug,
  IsOptionalUrl,
  OptionalSortOrder,
  OptionalStringList,
  OptionalText,
  RequiredText,
} from '../../../common/decorators/validation.decorators';

export class CreateServiceDto {
  /** @example Website Development */
  @RequiredText(3, 120)
  title: string;

  /** Generated from the title when omitted. @example website-development */
  @IsOptionalSlug()
  slug?: string;

  @RequiredText(10, 300)
  shortDescription: string;

  @OptionalText(10000)
  description?: string | null;

  /** Icon key used by the web/mobile apps. @example globe */
  @OptionalText(60)
  icon?: string | null;

  /** @example ["Next.js", "NestJS", "PostgreSQL"] */
  @OptionalStringList(30, 50)
  technologies?: string[];

  @IsOptionalUrl()
  imageUrl?: string | null;

  @IsOptionalPublicId()
  imagePublicId?: string | null;

  @OptionalText(200)
  imageAlt?: string | null;

  @OptionalText(70)
  seoTitle?: string | null;

  @OptionalText(170)
  seoDescription?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @OptionalSortOrder()
  sortOrder?: number;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
