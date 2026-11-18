import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ApiErrorBody, ErrorCode } from '@coinbook/shared';
import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error';

const HTTP_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'UNAUTHORIZED',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
};

interface ErrorResult {
  status: number;
  body: ApiErrorBody;
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<Request>();
    const { status, body } = this.toResult(exception);
    if (status >= 500) {
      const detail = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${req.method} ${req.originalUrl}`, detail);
    }
    res.status(status).json(body);
  }

  private toResult(exception: unknown): ErrorResult {
    if (exception instanceof AppError) {
      return {
        status: exception.status,
        body: {
          error: { code: exception.code, message: exception.message, fields: exception.fields },
        },
      };
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2025') {
      return {
        status: HttpStatus.NOT_FOUND,
        body: { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
      };
    }
    if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      exception.code === 'P2002' &&
      String(exception.meta?.target ?? '').includes('name')
    ) {
      return {
        status: HttpStatus.CONFLICT,
        body: {
          error: {
            code: 'DUPLICATE_NAME',
            message: 'Name already used',
            fields: { name: 'duplicate' },
          },
        },
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = HTTP_CODE[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR');
      return { status, body: { error: { code, message: exception.message } } };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
    };
  }
}
