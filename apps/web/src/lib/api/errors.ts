import { ERROR_CODES, type ApiErrorBody, type ErrorCode } from '@coinbook/shared';

export const DEFAULT_ERROR_MESSAGE = 'Gagal menyimpan. Periksa koneksi lalu coba lagi.';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const error = (value as { error: unknown }).error;
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ERROR_CODES.includes((error as { code: ErrorCode }).code)
  );
}

export async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  if (isErrorBody(body)) {
    return new ApiError(response.status, body.error.code, body.error.message, body.error.fields);
  }
  return new ApiError(response.status, 'INTERNAL_ERROR', response.statusText);
}
