import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StorageService } from '../../core/storage/storage.service';
import {
  CreateTestimonialDto,
  UpdateTestimonialDto,
} from './dto/testimonial.dto';

const order = [{ sortOrder: 'asc' as const }, { createdAt: 'desc' as const }];

@Injectable()
export class TestimonialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  findPublished() {
    return this.prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: order,
    });
  }

  findAll() {
    return this.prisma.testimonial.findMany({ orderBy: order });
  }

  async findOne(id: string) {
    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id },
    });
    if (!testimonial) throw new NotFoundException('Testimonial not found');
    return testimonial;
  }

  create(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({ data: dto });
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.testimonial.update({
      where: { id },
      data: dto,
    });
    await this.storage.removeIfReplaced(
      existing.avatarPublicId,
      dto.avatarPublicId,
    );
    return updated;
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.prisma.testimonial.delete({ where: { id } });
    await this.storage.remove(existing.avatarPublicId);
  }
}
