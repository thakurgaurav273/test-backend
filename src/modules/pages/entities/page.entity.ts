import type { Page } from '../../../generated/prisma/client';

export class PageEntity implements Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}
