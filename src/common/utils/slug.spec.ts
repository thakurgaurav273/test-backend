import { BadRequestException } from '@nestjs/common';
import { resolveSlug, SLUG_PATTERN, slugify } from './slug';

describe('slugify', () => {
  it.each([
    ['Hello World', 'hello-world'],
    ['  Next.js + NestJS: A Guide!  ', 'next-js-nestjs-a-guide'],
    ['Café Déjà Vu', 'cafe-deja-vu'],
    ['---multiple---dashes---', 'multiple-dashes'],
  ])('%s -> %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
    expect(SLUG_PATTERN.test(expected)).toBe(true);
  });

  it('never ends with a hyphen after truncation', () => {
    const slug = slugify(`${'a'.repeat(119)} b`);
    expect(slug.endsWith('-')).toBe(false);
    expect(slug.length).toBeLessThanOrEqual(120);
  });
});

describe('resolveSlug', () => {
  it('prefers the explicit slug', () => {
    expect(resolveSlug('custom-slug', 'Some Title')).toBe('custom-slug');
  });

  it('rejects titles that produce an empty slug', () => {
    expect(() => resolveSlug(undefined, '!!!')).toThrow(BadRequestException);
  });
});
