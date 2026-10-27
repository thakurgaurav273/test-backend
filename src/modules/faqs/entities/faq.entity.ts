import type { Faq } from '../../../generated/prisma/client';

export class FaqEntity implements Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
