import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import {
  IsOptionalLink,
  IsOptionalPublicId,
  IsOptionalUrl,
  OptionalSortOrder,
  OptionalText,
  RequiredText,
} from '../../../common/decorators/validation.decorators';

export class CreateHeroDto {
  /** @example Building digital products that grow your business */
  @RequiredText(3, 160)
  heading: string;

  @OptionalText(200)
  subheading?: string | null;

  @OptionalText(1000)
  description?: string | null;

  /** @example Start a project */
  @OptionalText(40)
  primaryCtaLabel?: string | null;

  /** @example /contact */
  @IsOptionalLink()
  primaryCtaUrl?: string | null;

  @OptionalText(40)
  secondaryCtaLabel?: string | null;

  @IsOptionalLink()
  secondaryCtaUrl?: string | null;

  @IsOptionalUrl()
  imageUrl?: string | null;

  @IsOptionalPublicId()
  imagePublicId?: string | null;

  @OptionalText(200)
  imageAlt?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @OptionalSortOrder()
  sortOrder?: number;
}

export class UpdateHeroDto extends PartialType(CreateHeroDto) {}
