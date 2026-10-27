import { PartialType } from '@nestjs/swagger';
import {
  IsOptionalSlug,
  OptionalText,
  RequiredText,
} from '../../../common/decorators/validation.decorators';

export class CreateBlogCategoryDto {
  /** @example Web Development */
  @RequiredText(2, 60)
  name: string;

  /** Generated from the name when omitted */
  @IsOptionalSlug()
  slug?: string;

  @OptionalText(300)
  description?: string | null;
}

export class UpdateBlogCategoryDto extends PartialType(CreateBlogCategoryDto) {}

export class CreateBlogTagDto {
  /** @example NestJS */
  @RequiredText(1, 40)
  name: string;

  /** Generated from the name when omitted */
  @IsOptionalSlug()
  slug?: string;
}

export class UpdateBlogTagDto extends PartialType(CreateBlogTagDto) {}
