import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  IsOptionalPublicId,
  IsOptionalUrl,
  OptionalSortOrder,
  OptionalText,
  RequiredText,
} from '../../../common/decorators/validation.decorators';

export class CreateTestimonialDto {
  @RequiredText(2, 100)
  name: string;

  /** @example CTO */
  @OptionalText(100)
  role?: string | null;

  @OptionalText(120)
  company?: string | null;

  @RequiredText(10, 1500)
  quote: string;

  /** 1 to 5 */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number | null;

  @IsOptionalUrl()
  avatarUrl?: string | null;

  @IsOptionalPublicId()
  avatarPublicId?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @OptionalSortOrder()
  sortOrder?: number;
}

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}
