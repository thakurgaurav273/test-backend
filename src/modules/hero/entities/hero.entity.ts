import type { HeroSection } from '../../../generated/prisma/client';

export class HeroEntity implements HeroSection {
  id: string;
  heading: string;
  subheading: string | null;
  description: string | null;
  primaryCtaLabel: string | null;
  primaryCtaUrl: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  imageAlt: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
