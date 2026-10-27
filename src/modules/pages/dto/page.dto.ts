import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import {
  IsOptionalSlug,
  OptionalText,
  RequiredText,
} from '../../../common/decorators/validation.decorators';

export class CreatePageDto {
  /** @example Privacy Policy */
  @RequiredText(2, 150)
  title: string;

  /** Generated from the title when omitted. @example privacy-policy */
  @IsOptionalSlug()
  slug?: string;

  /** Markdown or HTML */
  @RequiredText(1, 100000)
  content: string;

  @OptionalText(70)
  seoTitle?: string | null;

  @OptionalText(170)
  seoDescription?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdatePageDto extends PartialType(CreatePageDto) {}
