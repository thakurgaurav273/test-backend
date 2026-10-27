import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import {
  type AuthenticatedAdmin,
  CurrentAdmin,
} from '../../common/decorators/current-admin.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ALL_ROLES, Roles } from '../../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import {
  AdminApi,
  ApiEnvelope,
} from '../../common/swagger/api-envelope.decorator';
import { Env } from '../../config/env';
import { AUTH_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import {
  AdminProfileEntity,
  LoginResultEntity,
} from './entities/admin-profile.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Admin login',
    description:
      'Sets an httpOnly session cookie and also returns the JWT for API clients. Limited to 10 attempts per 15 minutes per IP.',
  })
  @ApiEnvelope(LoginResultEntity)
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Invalid email or password',
  })
  @ApiTooManyRequestsResponse({ type: ErrorResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResultEntity> {
    const result = await this.auth.login(dto);
    res.cookie(AUTH_COOKIE, result.token, {
      ...this.cookieOptions(),
      maxAge: result.expiresIn * 1000,
    });
    return result;
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Clear the session cookie' })
  @ApiEnvelope(null)
  logout(@Res({ passthrough: true }) res: Response): { loggedOut: true } {
    res.clearCookie(AUTH_COOKIE, this.cookieOptions());
    return { loggedOut: true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Email a password-reset link',
    description:
      'Always succeeds so the response does not reveal whether the email exists. The link is valid for 1 hour.',
  })
  @ApiEnvelope(null)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ sent: true }> {
    await this.auth.forgotPassword(dto);
    return { sent: true };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Set a new password using the emailed token',
    description: 'Signs out every existing session for that account.',
  })
  @ApiEnvelope(null)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ reset: true }> {
    await this.auth.resetPassword(dto);
    return { reset: true };
  }

  @Get('me')
  @Roles(...ALL_ROLES)
  @AdminApi()
  @ApiOperation({ summary: 'Current admin profile' })
  @ApiEnvelope(AdminProfileEntity)
  me(@CurrentAdmin() admin: AuthenticatedAdmin): Promise<AdminProfileEntity> {
    return this.auth.profile(admin.id);
  }

  @Patch('password')
  @Roles(...ALL_ROLES)
  @AdminApi()
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @ApiOperation({
    summary: 'Change own password',
    description:
      'Signs out other sessions. The session cookie is refreshed and the new token is returned.',
  })
  @ApiEnvelope(null)
  async changePassword(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ changed: true; token: string; expiresIn: number }> {
    const token = await this.auth.changePassword(admin.id, dto);
    const expiresIn = this.auth.tokenTtlSeconds;
    res.cookie(AUTH_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: expiresIn * 1000,
    });
    return { changed: true, token, expiresIn };
  }

  private cookieOptions(): CookieOptions {
    const sameSite = this.config.get('COOKIE_SAMESITE', { infer: true });
    const isProd =
      this.config.get('NODE_ENV', { infer: true }) === 'production';
    return {
      httpOnly: true,
      secure: isProd || sameSite === 'none',
      sameSite,
      path: '/',
    };
  }
}
