import type { HttpMethod, PermissionKey } from '@/shared/types';

/**
 * Typed API contract descriptors (Day 1 step 13).
 *
 * An endpoint is declared once, in a domain contract file, together with the
 * authentication and permission requirements the backend will enforce. Services
 * reference the descriptor instead of hard-coding a URL string, which gives us:
 *
 *   - one place to change when the real backend contract lands;
 *   - request/response types attached to the endpoint itself;
 *   - a machine-readable record of the permission each endpoint expects, so the
 *     contract can be diffed against the backend document during integration.
 *
 * TBD — BACKEND CONTRACT: every path below is provisional. The authoritative
 * naming comes from the backend API document (§40).
 */
export interface EndpointSpec<TRequest = void, TResponse = unknown, TQuery = void> {
  readonly method: HttpMethod;
  /** Path template relative to the API base URL, e.g. `/students/:id`. */
  readonly path: string;
  /** Whether the endpoint requires an authenticated session. */
  readonly auth: boolean;
  /** Permission the backend is expected to enforce. Documentation + guard input. */
  readonly permission?: PermissionKey;
  /** Phantom types — never present at runtime. */
  readonly __request?: TRequest;
  readonly __response?: TResponse;
  readonly __query?: TQuery;
}

export function endpoint<TRequest = void, TResponse = unknown, TQuery = void>(
  spec: Omit<EndpointSpec<TRequest, TResponse, TQuery>, '__request' | '__response' | '__query'>,
): EndpointSpec<TRequest, TResponse, TQuery> {
  return spec;
}

export type EndpointResponse<E> = E extends EndpointSpec<never, infer R, never> ? R : never;

/** Fills `:param` placeholders in a path template. */
export function buildPath(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = params[key];
    if (value === undefined) {
      throw new Error(`Missing path parameter "${key}" for "${template}".`);
    }
    return encodeURIComponent(String(value));
  });
}
