import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword: string;

  /** At least 12 characters with an uppercase letter, a lowercase letter and a number */
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'newPassword must contain an uppercase letter, a lowercase letter and a number',
  })
  newPassword: string;
}
