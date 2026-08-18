/** Normalized error kinds, mapped from HTTP status per specification §29. */
export type ApiErrorKind =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'server'
  | 'network'
  | 'timeout'
  | 'aborted'
  | 'unknown';

/** Field-level validation errors, keyed by form field path. */
export type FieldErrors = Record<string, string[]>;

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type SortDirection = 'asc' | 'desc';

/** Query shape for every server-driven list: search/filter/sort/paginate (§31–§32). */
export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: SortDirection;
  filters?: Record<string, string | number | boolean | undefined>;
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Set false for endpoints that must not carry credentials (e.g. login). */
  auth?: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
