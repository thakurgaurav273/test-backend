import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ToBoolean } from '../../../common/decorators/transform.decorators';
import {
  IsOptionalPublicId,
  IsOptionalSlug,
  IsOptionalUrl,
  OptionalSortOrder,
  OptionalStringList,
  OptionalText,
  RequiredText,
} from '../../../common/decorators/validation.decorators';

export class CreateProjectDto {
  /** @example Calcutta Sweets Storefront */
  @RequiredText(3, 150)
  title: string;

  /** Generated from the title when omitted. */
  @IsOptionalSlug()
  slug?: string;

  @RequiredText(10, 400)
  summary: string;

  @OptionalText(20000)
  description?: string | null;

  @OptionalText(120)
  client?: string | null;

  /** @example ["Next.js", "Express", "PostgreSQL"] */
  @OptionalStringList(30, 50)
  technologies?: string[];

  @IsOptionalUrl()
  imageUrl?: string | null;

  @IsOptionalPublicId()
  imagePublicId?: string | null;

  @OptionalText(200)
  imageAlt?: string | null;

  @IsOptionalUrl()
  demoUrl?: string | null;

  @IsOptionalUrl()
  repoUrl?: string | null;

  @OptionalText(70)
  seoTitle?: string | null;

  @OptionalText(170)
  seoDescription?: string | null;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @OptionalSortOrder()
  sortOrder?: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class ProjectQueryDto {
  /** Only featured projects (for the home page) */
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  featured?: boolean;
}
