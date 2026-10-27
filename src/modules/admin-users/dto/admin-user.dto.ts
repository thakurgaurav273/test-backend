import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TrimLower } from '../../../common/decorators/transform.decorators';
import { AdminRole } from '../../../generated/prisma/client';
import { StrongPassword } from '../../auth/dto/change-password.dto';

export class CreateAdminUserDto {
  /** @example sales@zoycoders.com */
  @TrimLower()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: AdminRole, enumName: 'AdminRole' })
  @IsEnum(AdminRole)
  role: AdminRole;

  /** Initial password. The user can change it later or use forgot-password. */
  @StrongPassword()
  password: string;
}

export class UpdateAdminUserDto extends PartialType(
  PickType(CreateAdminUserDto, ['name', 'role'] as const),
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
