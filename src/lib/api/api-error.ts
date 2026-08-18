import type { ApiErrorKind, FieldErrors } from '@/shared/types';

/**
 * The single error type the UI ever sees. Every transport (http, mock) is
 * responsible for converting whatever it produces into an `ApiError`, so
 * components and hooks never branch on raw status codes or fetch failures.
 *
 * Specification §29 defines the status → message mapping implemented here.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  /** Backend error code, when the contract supplies one. */
  readonly code: string | null;
  /** Field-level messages for 422 responses, ready for react-hook-form. */
  readonly fieldErrors: FieldErrors;
  /** Correlation id for support/debugging, when the backend supplies one. */
  readonly requestId: string | null;

  constructor(params: {
    kind: ApiErrorKind;
    message: string;
    status?: number | null;
    code?: string | null;
    fieldErrors?: FieldErrors;
    requestId?: string | null;
    cause?: unknown;
  }) {
    super(params.message, { cause: params.cause });
    this.name = 'ApiError';
    this.kind = params.kind;
    this.status = params.status ?? null;
    this.code = params.code ?? null;
    this.fieldErrors = params.fieldErrors ?? {};
    this.requestId = params.requestId ?? null;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** Status → normalized kind, per specification §29. */
export function kindFromStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'bad_request';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 422:
      return 'validation';
    default:
      if (status >= 500) return 'server';
      if (status >= 400) return 'bad_request';
      return 'unknown';
  }
}

/**
 * User-facing copy. Raw backend messages are never shown directly (§29);
 * they are kept on the error object for logging only.
 */
const MESSAGES: Record<ApiErrorKind, string> = {
  bad_request: 'Invalid request. Please check the information you entered.',
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: 'You do not have permission to perform this action.',
  not_found: 'The requested information could not be found.',
  conflict: 'This action conflicts with existing data.',
  validation: 'Some of the information provided is not valid.',
  server: 'Something went wrong on our side. Please try again shortly.',
  network: 'Unable to reach the server. Check your connection and try again.',
  timeout: 'The request took too long to complete. Please try again.',
  aborted: 'The request was cancelled.',
  unknown: 'An unexpected error occurred. Please try again.',
};

export function messageForKind(kind: ApiErrorKind): string {
  return MESSAGES[kind];
}

/** Safe accessor for anything caught in a `catch` block. */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError({ kind: 'aborted', message: MESSAGES.aborted, cause: error });
  }
  return new ApiError({ kind: 'unknown', message: MESSAGES.unknown, cause: error });
}
