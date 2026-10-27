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

  @Get('me')
  @AdminApi()
  @ApiOperation({ summary: 'Current admin profile' })
  @ApiEnvelope(AdminProfileEntity)
  me(@CurrentAdmin() admin: AuthenticatedAdmin): Promise<AdminProfileEntity> {
    return this.auth.profile(admin.id);
  }

  @Patch('password')
  @AdminApi()
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @ApiOperation({ summary: 'Change own password' })
  @ApiEnvelope(null)
  async changePassword(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ changed: true }> {
    await this.auth.changePassword(admin.id, dto);
    return { changed: true };
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
