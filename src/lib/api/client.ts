import { env } from '@/config/env';
import type { RequestOptions } from '@/shared/types';
import { type ApiError, toApiError } from './api-error';
import { buildPath, type EndpointSpec } from './contract';
import { createHttpTransport } from './http-transport';
import { createMockTransport } from './mock-transport';
import type { ApiRequest, QueryValue, TokenProvider, Transport } from './types';

/**
 * The one API client (Day 1 step 12).
 *
 * Component → Hook → Service → ApiClient → Transport → (mock | backend)
 *
 * Nothing above the service layer knows the base URL, the auth scheme, or
 * whether the response came from the mock API or a real backend.
 */
export interface CallArgs<TRequest, TQuery> {
  /** Values for `:params` in the endpoint path template. */
  params?: Record<string, string | number>;
  query?: TQuery;
  body?: TRequest;
  options?: RequestOptions;
}

export class ApiClient {
  #transport: Transport;
  #defaultTimeoutMs: number;
  #onUnauthorized: (() => void) | null = null;

  constructor(transport: Transport, defaultTimeoutMs: number) {
    this.#transport = transport;
    this.#defaultTimeoutMs = defaultTimeoutMs;
  }

  get transportName(): Transport['name'] {
    return this.#transport.name;
  }

  /**
   * Registered by the auth layer. A 401 from any endpoint means the session is
   * gone, so the app clears it once, centrally, instead of in every caller.
   */
  setUnauthorizedHandler(handler: (() => void) | null): void {
    this.#onUnauthorized = handler;
  }

  /** Swapping transports at runtime keeps tests from needing module mocks. */
  setTransport(transport: Transport): void {
    this.#transport = transport;
  }

  async call<TRequest, TResponse, TQuery>(
    spec: EndpointSpec<TRequest, TResponse, TQuery>,
    args: CallArgs<TRequest, TQuery> = {},
  ): Promise<TResponse> {
    const request: ApiRequest = {
      method: spec.method,
      path: buildPath(spec.path, args.params),
      query: args.query as Record<string, QueryValue> | undefined,
      body: args.body,
      auth: args.options?.auth ?? spec.auth,
      signal: args.options?.signal,
      timeoutMs: args.options?.timeoutMs ?? this.#defaultTimeoutMs,
    };

    try {
      return (await this.#transport.send(request)) as TResponse;
    } catch (caught) {
      const error: ApiError = toApiError(caught);
      if (error.kind === 'unauthorized') this.#onUnauthorized?.();
      throw error;
    }
  }
}

function createTransport(getToken: TokenProvider): Transport {
  return env.apiMode === 'mock'
    ? createMockTransport({ latencyMs: env.mockLatencyMs, getToken })
    : createHttpTransport({ baseUrl: env.apiBaseUrl, getToken });
}

/**
 * The credential is held here rather than read from storage inside the
 * transport, so the storage decision stays in the auth feature.
 */
let tokenProvider: TokenProvider = () => null;

export function setTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

export const apiClient = new ApiClient(
  createTransport(() => tokenProvider()),
  env.apiTimeoutMs,
);
