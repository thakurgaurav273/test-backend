import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest } from '../../../common/decorators/current-admin.decorator';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { Env, trustedOrigins } from '../../../config/env';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AUTH_COOKIE } from '../auth.constants';
import type { JwtPayload } from '../auth.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Global guard: every route needs a valid admin JWT unless marked @Public().
 * Accepts `Authorization: Bearer <token>` (mobile, Swagger, Postman) or the httpOnly cookie (admin panel).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.allowedOrigins = new Set(
      trustedOrigins({
        CORS_ORIGINS: config.get('CORS_ORIGINS', { infer: true }),
        APP_URL: config.get('APP_URL', { infer: true }),
      }),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { token, fromCookie } = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Authentication required');

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Cookies are sent automatically by browsers, so block cookie-authenticated
    // writes coming from sites we do not trust (CSRF protection).
    const origin = request.headers.origin;
    if (
      fromCookie &&
      !SAFE_METHODS.has(request.method) &&
      origin &&
      !this.allowedOrigins.has(origin)
    ) {
      throw new ForbiddenException('Cross-site request blocked');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, isActive: true },
    });
    if (!admin?.isActive)
      throw new UnauthorizedException('Account is not active');

    request.admin = { id: admin.id, email: admin.email, name: admin.name };
    return true;
  }

  private extractToken(request: AuthenticatedRequest): {
    token?: string;
    fromCookie: boolean;
  } {
    const [scheme, value] = request.headers.authorization?.split(' ') ?? [];
    if (scheme === 'Bearer' && value)
      return { token: value, fromCookie: false };
    const cookies = request.cookies as
      Record<string, string | undefined> | undefined;
    return { token: cookies?.[AUTH_COOKIE], fromCookie: true };
  }
}
