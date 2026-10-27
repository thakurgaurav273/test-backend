import { ApiProperty } from '@nestjs/swagger';
import {
  BlogCategory,
  BlogPost,
  BlogTag,
  PublishStatus,
} from '../../../generated/prisma/client';

export class BlogCategoryEntity implements BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BlogTagEntity implements BlogTag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

/** Blog post without its body, used in listings. */
export class BlogPostSummaryEntity implements Omit<BlogPost, 'content'> {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
  coverImageAlt: string | null;
  authorName: string;
  seoTitle: string | null;
  seoDescription: string | null;
  @ApiProperty({ enum: PublishStatus, enumName: 'PublishStatus' })
  status: PublishStatus;
  publishedAt: Date | null;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: BlogCategoryEntity | null;
  tags: BlogTagEntity[];
}

export class BlogPostEntity extends BlogPostSummaryEntity implements BlogPost {
  content: string;
}
