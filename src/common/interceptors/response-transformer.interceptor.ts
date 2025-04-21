import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  IApiResponse,
  IResponseMeta,
} from '../interfaces/api-response.interface';

@Injectable()
export class ResponseTransformerInterceptor<T>
  implements NestInterceptor<T, IApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data) => {
        if (data && data.success !== undefined && data.meta !== undefined) {
          return data;
        }

        const meta: IResponseMeta = {
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        if (data && data.items && data.meta && data.meta.pagination) {
          return {
            success: true,
            data: data.items,
            meta: {
              ...meta,
              pagination: data.meta.pagination,
            },
          };
        }

        return {
          success: true,
          data,
          meta,
        };
      }),
    );
  }
}
