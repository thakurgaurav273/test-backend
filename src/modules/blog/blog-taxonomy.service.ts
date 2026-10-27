import { Injectable, NotFoundException } from '@nestjs/common';
import { resolveSlug } from '../../common/utils/slug';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CreateBlogCategoryDto,
  CreateBlogTagDto,
  UpdateBlogCategoryDto,
  UpdateBlogTagDto,
} from './dto/taxonomy.dto';

@Injectable()
export class BlogTaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories() {
    return this.prisma.blogCategory.findMany({ orderBy: { name: 'asc' } });
  }

  createCategory(dto: CreateBlogCategoryDto) {
    return this.prisma.blogCategory.create({
      data: { ...dto, slug: resolveSlug(dto.slug, dto.name) },
    });
  }

  async updateCategory(id: string, dto: UpdateBlogCategoryDto) {
    await this.ensureCategory(id);
    return this.prisma.blogCategory.update({ where: { id }, data: dto });
  }

  /** Posts in the category are kept and become uncategorised. */
  async removeCategory(id: string) {
    await this.ensureCategory(id);
    await this.prisma.blogCategory.delete({ where: { id } });
  }

  listTags() {
    return this.prisma.blogTag.findMany({ orderBy: { name: 'asc' } });
  }

  createTag(dto: CreateBlogTagDto) {
    return this.prisma.blogTag.create({
      data: { ...dto, slug: resolveSlug(dto.slug, dto.name) },
    });
  }

  async updateTag(id: string, dto: UpdateBlogTagDto) {
    await this.ensureTag(id);
    return this.prisma.blogTag.update({ where: { id }, data: dto });
  }

  async removeTag(id: string) {
    await this.ensureTag(id);
    await this.prisma.blogTag.delete({ where: { id } });
  }

  private async ensureCategory(id: string) {
    const found = await this.prisma.blogCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Category not found');
  }

  private async ensureTag(id: string) {
    const found = await this.prisma.blogTag.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Tag not found');
  }
}
