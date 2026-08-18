import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/lib/api';

/**
 * Server state (§27, first category).
 *
 * React Query owns everything that came from an API: caching, deduplication,
 * background refresh and retry. No server data is copied into the UI store.
 */
const NON_RETRYABLE = new Set(['unauthorized', 'forbidden', 'not_found', 'validation', 'bad_request', 'aborted']);

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Client-side authorization failures never succeed on retry; retrying
        // them only delays the 403 state the user needs to see.
        retry: (failureCount, error) => {
          if (isApiError(error) && NON_RETRYABLE.has(error.kind)) return false;
          return failureCount < 2;
        },
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
