import { Injectable, NotFoundException } from '@nestjs/common';
import { resolveSlug } from '../../common/utils/slug';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StorageService } from '../../core/storage/storage.service';
import {
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dto/project.dto';

const order = [{ sortOrder: 'asc' as const }, { createdAt: 'desc' as const }];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  findPublished({ featured }: ProjectQueryDto) {
    return this.prisma.project.findMany({
      where: {
        isPublished: true,
        ...(featured !== undefined && { isFeatured: featured }),
      },
      orderBy: order,
    });
  }

  async findPublishedBySlug(slug: string) {
    const project = await this.prisma.project.findFirst({
      where: { slug, isPublished: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  findAll() {
    return this.prisma.project.findMany({ orderBy: order });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { ...dto, slug: resolveSlug(dto.slug, dto.title) },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    const existing = await this.findOne(id);
    const updated = await this.prisma.project.update({
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
    await this.prisma.project.delete({ where: { id } });
    await this.storage.remove(existing.imagePublicId);
  }
}
