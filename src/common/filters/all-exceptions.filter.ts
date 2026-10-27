import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { Request, Response } from 'express';

interface ResolvedError {
  status: number;
  message: string;
  errors?: string[];
}

interface UniqueViolationCause {
  table?: string;
  constraint?: { fields?: string[]; index?: string };
}

/**
 * Names the fields behind a unique-constraint error. Driver adapters report the
 * constraint instead of `meta.target`; Postgres gives its index name, which
 * Prisma builds as `<Model>_<field>_key`.
 */
function uniqueFields(error: Prisma.PrismaClientKnownRequestError): string {
  const cause = (
    error.meta?.driverAdapterError as { cause?: UniqueViolationCause }
  )?.cause;
  const fields = cause?.constraint?.fields;
  if (fields?.length) return fields.join(', ');

  const index = cause?.constraint?.index;
  const prefix = `${cause?.table}_`;
  if (index?.startsWith(prefix) && index.endsWith('_key')) {
    return index.slice(prefix.length, -'_key'.length).split('_').join(', ');
  }
  return 'value';
}

/**
 * Sends every error as `{ success: false, statusCode, message, errors? }`.
 * Unexpected errors are logged in full but answered with a generic message.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { status, message, errors } = this.resolve(exception);

    if (status >= 500 && exception instanceof HttpException) {
      // Deliberate 5xx responses (e.g. email provider down) need no stack trace.
      this.logger.warn(
        `${request.method} ${request.originalUrl} -> ${status}: ${message}`,
      );
    } else if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors && { errors }),
    });
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') return { status, message: body };
      const message = (body as { message?: string | string[] }).message;
      if (Array.isArray(message))
        return { status, message: 'Validation failed', errors: message };
      return { status, message: message ?? exception.message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return {
            status: HttpStatus.CONFLICT,
            message: `A record with this ${uniqueFields(exception)} already exists`,
          };
        case 'P2025':
          return { status: HttpStatus.NOT_FOUND, message: 'Record not found' };
        case 'P2003':
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'A related record does not exist',
          };
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid data for this operation',
      };
    }

    // Errors raised by Express middleware such as the JSON body parser.
    const status = (exception as { status?: unknown })?.status;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return {
        status,
        message: status === 400 ? 'Malformed request body' : 'Request rejected',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
