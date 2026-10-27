import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { BCRYPT_ROUNDS, profileSelect } from '../auth/auth.service';
import { CreateAdminUserDto, UpdateAdminUserDto } from './dto/admin-user.dto';

const select = { ...profileSelect, isActive: true, updatedAt: true } as const;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.admin.findMany({
      select,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const admin = await this.prisma.admin.findUnique({ where: { id }, select });
    if (!admin) throw new NotFoundException('Admin user not found');
    return admin;
  }

  async create({ password, ...dto }: CreateAdminUserDto) {
    try {
      return await this.prisma.admin.create({
        data: {
          ...dto,
          passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        },
        select,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An admin with this email already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateAdminUserDto, currentAdminId: string) {
    await this.findOne(id);
    if (
      id === currentAdminId &&
      (dto.isActive === false || (dto.role && dto.role !== 'ADMIN'))
    ) {
      throw new BadRequestException(
        'You cannot deactivate or demote your own account',
      );
    }
    return this.prisma.admin.update({ where: { id }, data: dto, select });
  }

  async remove(id: string, currentAdminId: string) {
    if (id === currentAdminId)
      throw new BadRequestException('You cannot delete your own account');
    await this.findOne(id);
    await this.prisma.admin.delete({ where: { id } });
  }
}
