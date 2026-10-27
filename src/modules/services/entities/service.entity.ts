import type { Service } from '../../../generated/prisma/client';

export class ServiceEntity implements Service {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string | null;
  icon: string | null;
  technologies: string[];
  imageUrl: string | null;
  imagePublicId: string | null;
  imageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
