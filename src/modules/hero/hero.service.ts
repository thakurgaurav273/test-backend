import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StorageService } from '../../core/storage/storage.service';
import { CreateHeroDto, UpdateHeroDto } from './dto/hero.dto';

const order = [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }];

@Injectable()
export class HeroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  findPublished() {
    return this.prisma.heroSection.findMany({
      where: { isPublished: true },
      orderBy: order,
    });
  }

  findAll() {
    return this.prisma.heroSection.findMany({ orderBy: order });
  }

  async findOne(id: string) {
    const hero = await this.prisma.heroSection.findUnique({ where: { id } });
    if (!hero) throw new NotFoundException('Hero section not found');
    return hero;
  }

  create(dto: CreateHeroDto) {
    return this.prisma.heroSection.create({ data: dto });
  }

  async update(id: string, dto: UpdateHeroDto) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.heroSection.update({
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
    await this.prisma.heroSection.delete({ where: { id } });
    await this.storage.remove(existing.imagePublicId);
  }
}
