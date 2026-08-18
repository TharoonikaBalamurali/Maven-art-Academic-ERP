import type { HttpMethod } from '@/shared/types';

/** Query values accepted by the client; `undefined` entries are dropped. */
export type QueryValue = string | number | boolean | undefined | null;

export interface ApiRequest {
  method: HttpMethod;
  /** Path relative to the API base URL, already resolved (no `:params` left). */
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Whether the request should carry the session credential. */
  auth: boolean;
  signal?: AbortSignal;
  timeoutMs: number;
}

/**
 * A transport turns an `ApiRequest` into parsed data, or throws an `ApiError`.
 * Swapping the mock transport for the http transport is the entire "connect the
 * real backend" change (§42) — no component, hook or service is touched.
 */
export interface Transport {
  readonly name: 'mock' | 'http';
  send(request: ApiRequest): Promise<unknown>;
}

/** Supplies the credential for authenticated requests, if the backend uses one. */
export type TokenProvider = () => string | null;
