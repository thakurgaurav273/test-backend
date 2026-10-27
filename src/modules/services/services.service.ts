import { Injectable, NotFoundException } from '@nestjs/common';
import { resolveSlug } from '../../common/utils/slug';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StorageService } from '../../core/storage/storage.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

const order = [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }];

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  findPublished() {
    return this.prisma.service.findMany({
      where: { isPublished: true },
      orderBy: order,
    });
  }

  async findPublishedBySlug(slug: string) {
    const service = await this.prisma.service.findFirst({
      where: { slug, isPublished: true },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  findAll() {
    return this.prisma.service.findMany({ orderBy: order });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: { ...dto, slug: resolveSlug(dto.slug, dto.title) },
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.service.update({
      where: { id },
      data: dto,
    });
    await this.storage.removeIfReplaced(
      existing.imagePublicId,
      dto.imagePublicId,
    );
    return updated;
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.prisma.service.delete({ where: { id } });
    await this.storage.remove(existing.imagePublicId);
  }
}
