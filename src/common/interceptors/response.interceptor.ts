import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface ApiSuccess<T> {
  success: true;
  data: T | null;
}

/** Wraps every successful response as `{ success: true, data }`. */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccess<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccess<T>> {
    return next
      .handle()
      .pipe(map((data) => ({ success: true, data: data ?? null })));
  }
}
