export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'NOT_FOUND',
  'TRANSACTION_LOCKED',
  'SAME_WALLET',
  'WALLET_ARCHIVED',
  'ITEM_UNASSIGNED',
  'DEBT_ALREADY_PAID',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];
export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
}
