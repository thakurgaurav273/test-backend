import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PublishStatus } from '../../../generated/prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  IsOptionalPublicId,
  IsOptionalSlug,
  IsOptionalUrl,
  OptionalStringList,
  OptionalText,
  RequiredText,
} from '../../../common/decorators/validation.decorators';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateBlogPostDto {
  /** @example Why we chose NestJS for our APIs */
  @RequiredText(3, 200)
  title: string;

  /** Generated from the title when omitted. Must be unique. @example why-we-chose-nestjs */
  @IsOptionalSlug()
  slug?: string;

  /** Short summary for cards and as the default SEO description */
  @RequiredText(10, 500)
  excerpt: string;

  /** Markdown or HTML body */
  @RequiredText(1, 200000)
  content: string;

  @IsOptionalUrl()
  coverImageUrl?: string | null;

  @IsOptionalPublicId()
  coverImagePublicId?: string | null;

  @OptionalText(200)
  coverImageAlt?: string | null;

  /** @example ZoyCoders Team */
  @RequiredText(2, 100)
  authorName: string;

  /** Defaults to the title (max 70 chars) */
  @OptionalText(70)
  seoTitle?: string | null;

  /** Defaults to the excerpt (max 170 chars) */
  @OptionalText(170)
  seoDescription?: string | null;

  /** Category id; send null to remove the category */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  categoryId?: string | null;

  /** Tag names; missing tags are created automatically. @example ["NestJS", "Backend"] */
  @OptionalStringList(20, 40)
  tags?: string[];

  @ApiProperty({
    enum: PublishStatus,
    required: false,
    default: PublishStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;
}

export class UpdateBlogPostDto extends PartialType(CreateBlogPostDto) {}

export class BlogQueryDto extends PaginationQueryDto {
  /** Category slug */
  @OptionalText(120)
  category?: string;

  /** Tag slug */
  @OptionalText(120)
  tag?: string;

  /** Searches title and excerpt */
  @OptionalText(100)
  search?: string;
}

export class AdminBlogQueryDto extends BlogQueryDto {
  @ApiProperty({ enum: PublishStatus, required: false })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;
}
