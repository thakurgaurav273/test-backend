import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateFaqDto, FaqQueryDto, UpdateFaqDto } from './dto/faq.dto';

const order = [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }];

@Injectable()
export class FaqsService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished({ category }: FaqQueryDto) {
    return this.prisma.faq.findMany({
      where: {
        isPublished: true,
        ...(category && {
          category: { equals: category, mode: 'insensitive' },
        }),
      },
      orderBy: order,
    });
  }

  findAll() {
    return this.prisma.faq.findMany({ orderBy: order });
  }

  async findOne(id: string) {
    const faq = await this.prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ not found');
    return faq;
  }

  create(dto: CreateFaqDto) {
    return this.prisma.faq.create({ data: dto });
  }

  async update(id: string, dto: UpdateFaqDto) {
    await this.findOne(id);
    return this.prisma.faq.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.faq.delete({ where: { id } });
  }
}
