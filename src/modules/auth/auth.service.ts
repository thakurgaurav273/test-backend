import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Env } from '../../config/env';
import { MailService } from '../../core/mail/mail.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import {
  AdminProfileEntity,
  LoginResultEntity,
} from './entities/admin-profile.entity';

export const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60_000;

export interface JwtPayload {
  sub: string;
  email: string;
  /** Issued-at (seconds), added by the JWT library */
  iat?: number;
}

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const profileSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  /** Compared against when the email is unknown so both paths take the same time. */
  private readonly dummyHash = bcrypt.hashSync(
    'timing-equaliser',
    BCRYPT_ROUNDS,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly mail: MailService,
  ) {}

  get tokenTtlSeconds(): number {
    return this.config.get('JWT_EXPIRES_IN_HOURS', { infer: true }) * 3600;
  }

  async login({ email, password }: LoginDto): Promise<LoginResultEntity> {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    const passwordOk = await bcrypt.compare(
      password,
      admin?.passwordHash ?? this.dummyHash,
    );

    if (!admin || !passwordOk || !admin.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const updated = await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
      select: profileSelect,
    });
    return {
      token: await this.signToken(admin),
      expiresIn: this.tokenTtlSeconds,
      admin: updated,
    };
  }

  signToken(admin: { id: string; email: string }): Promise<string> {
    const payload: JwtPayload = { sub: admin.id, email: admin.email };
    return this.jwt.signAsync(payload);
  }

  async profile(adminId: string): Promise<AdminProfileEntity> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: profileSelect,
    });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  /** Revokes all existing sessions; returns a fresh token for the caller. */
  async changePassword(
    adminId: string,
    dto: ChangePasswordDto,
  ): Promise<string> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });
    if (
      !admin ||
      !(await bcrypt.compare(dto.currentPassword, admin.passwordHash))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.prisma.admin.update({
      where: { id: adminId },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS),
        passwordChangedAt: new Date(),
      },
    });
    return this.signToken(admin);
  }

  /** Always resolves the same way so callers cannot probe which emails exist. */
  async forgotPassword({ email }: ForgotPasswordDto): Promise<void> {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin?.isActive) return;

    const token = randomBytes(32).toString('hex');
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordResetTokenHash: hashToken(token),
        passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const link = `${this.config.get('ADMIN_PANEL_URL', { infer: true })}/reset-password?token=${token}`;
    await this.mail.send({
      to: admin.email,
      subject: 'Reset your ZoyCoders admin password',
      text: `Hi ${admin.name},\n\nUse this link within 1 hour to set a new password:\n${link}\n\nIf you did not request this, you can ignore this email.`,
    });
  }

  async resetPassword({ token, newPassword }: ResetPasswordDto): Promise<void> {
    const admin = await this.prisma.admin.findUnique({
      where: { passwordResetTokenHash: hashToken(token) },
    });
    if (
      !admin?.isActive ||
      !admin.passwordResetExpiresAt ||
      admin.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException('Reset link is invalid or has expired');
    }
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
        passwordChangedAt: new Date(),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });
  }
}
