import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type { ApiResponseSchemaHost } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { PaginationMetaDto } from '../dto/pagination.dto';

type SchemaObject = ApiResponseSchemaHost['schema'];

interface EnvelopeOptions {
  status?: number;
  description?: string;
  isArray?: boolean;
  paginated?: boolean;
}

/**
 * Documents the `{ success: true, data }` envelope added by ResponseInterceptor.
 * Pass `null` as the model for endpoints whose data is a small ad-hoc object.
 */
export function ApiEnvelope(
  model: Type<unknown> | null,
  options: EnvelopeOptions = {},
) {
  const { status = 200, description, isArray, paginated } = options;
  const ref = model ? { $ref: getSchemaPath(model) } : undefined;

  let data: SchemaObject;
  if (!ref) data = { type: 'object', nullable: true };
  else if (paginated)
    data = {
      type: 'object',
      required: ['items', 'meta'],
      properties: {
        items: { type: 'array', items: ref },
        meta: { $ref: getSchemaPath(PaginationMetaDto) },
      },
    };
  else if (isArray) data = { type: 'array', items: ref };
  else data = ref;

  const models = [model, paginated ? PaginationMetaDto : null].filter(
    (m): m is Type<unknown> => m !== null,
  );

  return applyDecorators(
    ...(models.length ? [ApiExtraModels(...models)] : []),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        required: ['success', 'data'],
        properties: { success: { type: 'boolean', example: true }, data },
      },
    }),
  );
}

/** Marks a controller as admin-only in the docs (bearer token or session cookie). */
export function AdminApi() {
  return applyDecorators(
    ApiBearerAuth('bearer'),
    ApiCookieAuth('cookie'),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid admin session',
      type: ErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'Cookie-authenticated write from an untrusted origin',
      type: ErrorResponseDto,
    }),
  );
}
