import type { Project } from '../../../generated/prisma/client';

export class ProjectEntity implements Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  client: string | null;
  technologies: string[];
  imageUrl: string | null;
  imagePublicId: string | null;
  imageAlt: string | null;
  demoUrl: string | null;
  repoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
