import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** At least 12 characters with an uppercase letter, a lowercase letter and a number. */
export const StrongPassword = () =>
  applyDecorators(
    IsString(),
    MinLength(12),
    MaxLength(128),
    Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message:
        '$property must contain an uppercase letter, a lowercase letter and a number',
    }),
  );

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword: string;

  /** At least 12 characters with an uppercase letter, a lowercase letter and a number */
  @StrongPassword()
  newPassword: string;
}
