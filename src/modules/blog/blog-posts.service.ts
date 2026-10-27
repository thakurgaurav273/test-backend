import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PublishStatus } from '../../generated/prisma/client';
import { pageArgs, paginate } from '../../common/dto/pagination.dto';
import { resolveSlug, slugify } from '../../common/utils/slug';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StorageService } from '../../core/storage/storage.service';
import {
  AdminBlogQueryDto,
  BlogQueryDto,
  CreateBlogPostDto,
  UpdateBlogPostDto,
} from './dto/blog-post.dto';

const include = {
  category: true,
  tags: { orderBy: { name: 'asc' } },
} satisfies Prisma.BlogPostInclude;

const listOrder: Prisma.BlogPostOrderByWithRelationInput[] = [
  { publishedAt: { sort: 'desc', nulls: 'last' } },
  { createdAt: 'desc' },
];

@Injectable()
export class BlogPostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  listPublished(query: BlogQueryDto) {
    return this.list(
      { ...this.filters(query), status: PublishStatus.PUBLISHED },
      query,
    );
  }

  listAll(query: AdminBlogQueryDto) {
    return this.list(
      { ...this.filters(query), ...(query.status && { status: query.status }) },
      query,
    );
  }

  async findPublishedBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED },
      include,
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async findOne(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include,
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async create(dto: CreateBlogPostDto) {
    const { tags, categoryId, ...fields } = dto;
    if (categoryId) await this.assertCategoryExists(categoryId);

    return this.prisma.blogPost.create({
      data: {
        ...fields,
        slug: resolveSlug(fields.slug, fields.title),
        seoTitle: fields.seoTitle ?? fields.title.slice(0, 70),
        seoDescription: fields.seoDescription ?? fields.excerpt.slice(0, 170),
        publishedAt:
          fields.status === PublishStatus.PUBLISHED ? new Date() : null,
        ...(categoryId && { category: { connect: { id: categoryId } } }),
        ...(tags?.length && {
          tags: { connectOrCreate: tags.map((name) => this.tagInput(name)) },
        }),
      },
      include,
    });
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const existing = await this.findOne(id);
    const { tags, categoryId, status, ...fields } = dto;
    if (categoryId) await this.assertCategoryExists(categoryId);

    // Sending null for an SEO field resets it to its default.
    if (fields.seoTitle === null)
      fields.seoTitle = (fields.title ?? existing.title).slice(0, 70);
    if (fields.seoDescription === null) {
      fields.seoDescription = (fields.excerpt ?? existing.excerpt).slice(
        0,
        170,
      );
    }

    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...fields,
        ...(status && this.statusChange(status, existing.publishedAt)),
        ...(categoryId !== undefined && {
          category: categoryId
            ? { connect: { id: categoryId } }
            : { disconnect: true },
        }),
        ...(tags !== undefined && {
          tags: {
            set: [],
            connectOrCreate: tags.map((name) => this.tagInput(name)),
          },
        }),
      },
      include,
    });
    await this.storage.removeIfReplaced(
      existing.coverImagePublicId,
      dto.coverImagePublicId,
    );
    return updated;
  }

  async setStatus(id: string, status: PublishStatus) {
    const existing = await this.findOne(id);
    return this.prisma.blogPost.update({
      where: { id },
      data: this.statusChange(status, existing.publishedAt),
      include,
    });
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.prisma.blogPost.delete({ where: { id } });
    await this.storage.remove(existing.coverImagePublicId);
  }

  private async list(where: Prisma.BlogPostWhereInput, query: BlogQueryDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        include,
        omit: { content: true },
        orderBy: listOrder,
        ...pageArgs(query),
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  private filters({
    category,
    tag,
    search,
  }: BlogQueryDto): Prisma.BlogPostWhereInput {
    return {
      ...(category && { category: { slug: category } }),
      ...(tag && { tags: { some: { slug: tag } } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
  }

  /** Keeps the original publish date when a post is unpublished and published again. */
  private statusChange(status: PublishStatus, publishedAt: Date | null) {
    return {
      status,
      ...(status === PublishStatus.PUBLISHED &&
        !publishedAt && { publishedAt: new Date() }),
    };
  }

  private tagInput(
    name: string,
  ): Prisma.BlogTagCreateOrConnectWithoutPostsInput {
    const slug = slugify(name);
    if (!slug)
      throw new BadRequestException(
        `Tag "${name}" must contain letters or numbers`,
      );
    return { where: { slug }, create: { name, slug } };
  }

  private async assertCategoryExists(id: string) {
    const category = await this.prisma.blogCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!category) throw new BadRequestException('Category not found');
  }
}
