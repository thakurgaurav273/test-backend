import { BadRequestException } from '@nestjs/common';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 120)
    .replace(/^-+|-+$/g, '');
}

/** Uses the explicit slug when given, otherwise derives one from the title. */
export function resolveSlug(slug: string | undefined, title: string): string {
  const result = slug ?? slugify(title);
  if (!result) {
    throw new BadRequestException(
      'Could not generate a slug from the title; please provide one',
    );
  }
  return result;
}
