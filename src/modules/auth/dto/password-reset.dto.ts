import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { TrimLower } from '../../../common/decorators/transform.decorators';
import { StrongPassword } from './change-password.dto';

export class ForgotPasswordDto {
  /** @example admin@zoycoders.com */
  @TrimLower()
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class ResetPasswordDto {
  /** Token from the reset link */
  @IsString()
  @MinLength(32)
  @MaxLength(128)
  token: string;

  /** At least 12 characters with an uppercase letter, a lowercase letter and a number */
  @StrongPassword()
  newPassword: string;
}
