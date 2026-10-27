import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Env } from '../../config/env';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import {
  AdminProfileEntity,
  LoginResultEntity,
} from './entities/admin-profile.entity';

export const BCRYPT_ROUNDS = 12;

export interface JwtPayload {
  sub: string;
  email: string;
}

const profileSelect = {
  id: true,
  email: true,
  name: true,
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
    const payload: JwtPayload = { sub: admin.id, email: admin.email };
    const token = await this.jwt.signAsync(payload);

    return { token, expiresIn: this.tokenTtlSeconds, admin: updated };
  }

  async profile(adminId: string): Promise<AdminProfileEntity> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: profileSelect,
    });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  async changePassword(adminId: string, dto: ChangePasswordDto): Promise<void> {
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
      data: { passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS) },
    });
  }
}
