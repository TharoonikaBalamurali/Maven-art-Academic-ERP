import { handleMockRequest } from '@/mocks/mock-router';
import type { ApiRequest, TokenProvider, Transport } from './types';

/**
 * Mock transport (Day 1 step 14).
 *
 * This file is the ONLY bridge between the application and `src/mocks`. An
 * ESLint rule forbids every other module from importing `@/mocks`, which is what
 * guarantees the mock layer can be dropped at integration time (§42) without
 * touching a single component, hook or service.
 */
export function createMockTransport(options: {
  latencyMs: number;
  getToken: TokenProvider;
}): Transport {
  return {
    name: 'mock',
    async send(request: ApiRequest): Promise<unknown> {
      await delay(options.latencyMs, request.signal);
      return handleMockRequest(request, request.auth ? options.getToken() : null);
    },
  };
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const id = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}
