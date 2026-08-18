import type { FieldErrors } from '@/shared/types';
import { ApiError, kindFromStatus, messageForKind } from './api-error';
import type { ApiRequest, QueryValue, TokenProvider, Transport } from './types';

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * TBD — BACKEND CONTRACT: the error body shape below is provisional. Only this
 * function needs to change once the backend error envelope is fixed.
 */
function parseErrorBody(body: unknown): { message?: string; code?: string; fieldErrors?: FieldErrors } {
  if (typeof body !== 'object' || body === null) return {};
  const record = body as Record<string, unknown>;
  const errors = record.errors;
  return {
    message: typeof record.message === 'string' ? record.message : undefined,
    code: typeof record.code === 'string' ? record.code : undefined,
    fieldErrors:
      typeof errors === 'object' && errors !== null ? (errors as FieldErrors) : undefined,
  };
}

export function createHttpTransport(options: {
  baseUrl: string;
  getToken: TokenProvider;
}): Transport {
  return {
    name: 'http',
    async send(request: ApiRequest): Promise<unknown> {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(new Error('timeout')), request.timeoutMs);

      const onExternalAbort = () => controller.abort(request.signal?.reason);
      request.signal?.addEventListener('abort', onExternalAbort, { once: true });

      const headers = new Headers({ Accept: 'application/json' });
      if (request.body !== undefined) headers.set('Content-Type', 'application/json');

      if (request.auth) {
        const token = options.getToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);
      }

      let response: Response;
      try {
        response = await fetch(buildUrl(options.baseUrl, request.path, request.query), {
          method: request.method,
          headers,
          // Supports a cookie-based session without any other change.
          credentials: request.auth ? 'include' : 'same-origin',
          body: request.body === undefined ? undefined : JSON.stringify(request.body),
          signal: controller.signal,
        });
      } catch (cause) {
        if (request.signal?.aborted) {
          throw new ApiError({ kind: 'aborted', message: messageForKind('aborted'), cause });
        }
        const timedOut = controller.signal.aborted;
        const kind = timedOut ? 'timeout' : 'network';
        throw new ApiError({ kind, message: messageForKind(kind), cause });
      } finally {
        window.clearTimeout(timeoutId);
        request.signal?.removeEventListener('abort', onExternalAbort);
      }

      const requestId = response.headers.get('x-request-id');
      const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
      const payload: unknown = response.status === 204 ? null : isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const kind = kindFromStatus(response.status);
        const parsed = parseErrorBody(payload);
        throw new ApiError({
          kind,
          // User-facing copy is normalized; the backend message is kept as `cause`.
          message: messageForKind(kind),
          status: response.status,
          code: parsed.code ?? null,
          fieldErrors: parsed.fieldErrors ?? {},
          requestId,
          cause: parsed.message,
        });
      }

      return payload;
    },
  };
}
