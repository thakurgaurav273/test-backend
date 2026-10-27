import type { Testimonial } from '../../../generated/prisma/client';

export class TestimonialEntity implements Testimonial {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  quote: string;
  rating: number | null;
  avatarUrl: string | null;
  avatarPublicId: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
