import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import {
  OptionalSortOrder,
  OptionalText,
  RequiredText,
} from '../../../common/decorators/validation.decorators';

export class CreateFaqDto {
  @RequiredText(5, 300)
  question: string;

  @RequiredText(2, 5000)
  answer: string;

  /** Optional grouping, e.g. "Pricing" */
  @OptionalText(60)
  category?: string | null;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @OptionalSortOrder()
  sortOrder?: number;
}

export class UpdateFaqDto extends PartialType(CreateFaqDto) {}

export class FaqQueryDto {
  @OptionalText(60)
  category?: string;
}
