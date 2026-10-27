import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim, TrimArray } from './transform.decorators';
import { SLUG_PATTERN } from '../utils/slug';

/** Optional absolute http(s) URL, e.g. an uploaded image or a demo link. */
export const IsOptionalUrl = () =>
  applyDecorators(
    IsOptional(),
    IsUrl(
      {
        protocols: ['http', 'https'],
        require_protocol: true,
        require_tld: false,
      },
      { message: '$property must be a valid http(s) URL' },
    ),
    MaxLength(2048),
  );

/** Optional link target for buttons: absolute URL, site path, #anchor or mailto/tel. */
export const IsOptionalLink = () =>
  applyDecorators(
    IsOptional(),
    Matches(/^(https?:\/\/\S+|\/\S*|#[\w-]*|mailto:\S+|tel:[+\d\s()-]+)$/, {
      message:
        '$property must be a URL, a path starting with "/", an #anchor, mailto: or tel:',
    }),
    MaxLength(2048),
  );

/** Optional storage id returned by POST /admin/uploads. */
export const IsOptionalPublicId = () =>
  applyDecorators(
    IsOptional(),
    Matches(/^[\w\-/:.]+$/, {
      message: '$property contains invalid characters',
    }),
    MaxLength(255),
  );

export const IsOptionalSlug = () =>
  applyDecorators(
    IsOptional(),
    Matches(SLUG_PATTERN, {
      message:
        '$property must be lowercase letters, numbers and single hyphens (e.g. my-first-post)',
    }),
    MaxLength(120),
  );

// The Swagger plugin cannot see inside composed decorators, so these also
// declare their limits for the docs.
export const RequiredText = (min: number, max: number) =>
  applyDecorators(
    ApiProperty({ minLength: min, maxLength: max }),
    Trim(),
    IsString(),
    Length(min, max),
  );

export const OptionalText = (max: number) =>
  applyDecorators(
    ApiPropertyOptional({ maxLength: max }),
    IsOptional(),
    Trim(),
    IsString(),
    MaxLength(max),
  );

export const OptionalSortOrder = () =>
  applyDecorators(IsOptional(), IsInt(), Min(0), Max(100000));

export const OptionalStringList = (maxItems: number, maxLength: number) =>
  applyDecorators(
    IsOptional(),
    TrimArray(),
    IsArray(),
    ArrayMaxSize(maxItems),
    ArrayUnique(),
    IsString({ each: true }),
    MaxLength(maxLength, { each: true }),
  );
