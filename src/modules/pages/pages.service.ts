import { Injectable, NotFoundException } from '@nestjs/common';
import { resolveSlug } from '../../common/utils/slug';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreatePageDto, UpdatePageDto } from './dto/page.dto';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublishedBySlug(slug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug, isPublished: true },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  findAll() {
    return this.prisma.page.findMany({ orderBy: { title: 'asc' } });
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  create(dto: CreatePageDto) {
    return this.prisma.page.create({
      data: { ...dto, slug: resolveSlug(dto.slug, dto.title) },
    });
  }

  async update(id: string, dto: UpdatePageDto) {
    await this.findOne(id);
    return this.prisma.page.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.page.delete({ where: { id } });
  }
}
