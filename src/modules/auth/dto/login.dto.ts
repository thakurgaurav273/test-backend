import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { TrimLower } from '../../../common/decorators/transform.decorators';

export class LoginDto {
  /** @example admin@zoycoders.com */
  @TrimLower()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
