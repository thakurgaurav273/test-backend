import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string;
}

export type AuthenticatedRequest = Request & { admin?: AuthenticatedAdmin };

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedAdmin => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.admin as AuthenticatedAdmin;
  },
);
