import { ApiProperty } from '@nestjs/swagger';
import { InquiryStatus, InquiryType } from '../../../generated/prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';
import { TrimLower } from '../../../common/decorators/transform.decorators';
import {
  OptionalText,
  RequiredText,
} from '../../../common/decorators/validation.decorators';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateInquiryDto {
  /** CONTACT for the contact form, PROJECT for the project inquiry form */
  @ApiProperty({
    enum: InquiryType,
    required: false,
    default: InquiryType.CONTACT,
  })
  @IsOptional()
  @IsEnum(InquiryType)
  type?: InquiryType;

  /** @example Priya Sharma */
  @RequiredText(2, 100)
  name: string;

  /** @example priya@example.com */
  @TrimLower()
  @IsEmail()
  @MaxLength(254)
  email: string;

  /** @example +91 98765 43210 */
  @IsOptional()
  @Matches(/^[+\d\s()-]{6,30}$/, {
    message: 'phone must be a valid phone number',
  })
  phone?: string;

  @OptionalText(120)
  company?: string;

  /** @example Need a company website */
  @RequiredText(3, 150)
  @Matches(/^[^\r\n]*$/, { message: 'subject must be a single line' })
  subject: string;

  @RequiredText(10, 5000)
  message: string;

  /** Service the visitor is interested in. @example Website Development */
  @OptionalText(100)
  service?: string;

  /** @example 2,000 - 5,000 USD */
  @OptionalText(50)
  budget?: string;
}

export class InquiryQueryDto extends PaginationQueryDto {
  @ApiProperty({ enum: InquiryStatus, required: false })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  @ApiProperty({ enum: InquiryType, required: false })
  @IsOptional()
  @IsEnum(InquiryType)
  type?: InquiryType;

  /** Searches name, email and subject */
  @OptionalText(100)
  search?: string;
}

export class UpdateInquiryStatusDto {
  @ApiProperty({ enum: InquiryStatus })
  @IsEnum(InquiryStatus)
  status: InquiryStatus;
}

export class ReplyInquiryDto {
  /** Defaults to "Re: <original subject>" */
  @OptionalText(200)
  @Matches(/^[^\r\n]*$/, { message: 'subject must be a single line' })
  subject?: string;

  @RequiredText(1, 10000)
  message: string;
}
