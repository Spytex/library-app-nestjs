import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { IApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status: number;
    let errorResponse: IApiErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorResponse = {
        success: false,
        error: {
          code: this.getErrorCode(status),
          message: this.getErrorMessage(exception),
          details: {
            statusCode: status,
            ...this.getErrorDetails(exceptionResponse),
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      };
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;

      errorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          details: {
            statusCode: status,
            ...(process.env.NODE_ENV !== 'production' && {
              stack: exception.stack,
            }),
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      };

      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const errorCodes = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
    };

    return errorCodes[status] || `ERROR_${status}`;
  }

  private getErrorMessage(exception: HttpException): string {
    const response = exception.getResponse() as any;

    if (typeof response === 'object' && response.message) {
      return Array.isArray(response.message)
        ? response.message[0]
        : response.message;
    }

    return exception.message;
  }

  private getErrorDetails(exceptionResponse: any): any {
    if (typeof exceptionResponse === 'object') {
      const { message, ...rest } = exceptionResponse;

      if (Array.isArray(message) && message.length > 0) {
        return { validationErrors: message };
      }

      if (Object.keys(rest).length > 0) {
        return rest;
      }
    }

    return undefined;
  }
}
