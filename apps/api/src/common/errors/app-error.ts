import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@coinbook/shared';

const DEFAULT_STATUS: Record<ErrorCode, HttpStatus> = {
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  TRANSACTION_LOCKED: HttpStatus.CONFLICT,
  SAME_WALLET: HttpStatus.UNPROCESSABLE_ENTITY,
  WALLET_ARCHIVED: HttpStatus.UNPROCESSABLE_ENTITY,
  ITEM_UNASSIGNED: HttpStatus.UNPROCESSABLE_ENTITY,
  DEBT_ALREADY_PAID: HttpStatus.CONFLICT,
  RATE_LIMITED: HttpStatus.TOO_MANY_REQUESTS,
  INTERNAL_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
};

export class AppError extends Error {
  readonly status: HttpStatus;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
    status?: HttpStatus,
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status ?? DEFAULT_STATUS[code];
  }

  static notFound(what: string): AppError {
    return new AppError('NOT_FOUND', `${what} not found`);
  }
}
