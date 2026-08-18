import type { ReactNode } from 'react';
import { isApiError } from '@/lib/api';
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
} from './DataStates';

export interface QueryBoundaryProps {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry?: () => void;
  /** Replaces the default spinner — pass a skeleton that matches the content. */
  loadingFallback?: ReactNode;
  loadingLabel?: string;
  children: ReactNode;
}

/**
 * Maps a query result to the correct data state (§28, §29).
 *
 * Pages should not branch on status codes. They hand the query state to this
 * boundary, which renders "loading", "access denied", "not found" or a generic
 * failure with a retry, using the already-normalized `ApiError.kind`.
 *
 * Empty vs. non-empty is intentionally NOT decided here: only the page knows
 * whether zero rows means "no data yet" or "no search results".
 */
export function QueryBoundary({
  isPending,
  isError,
  error,
  onRetry,
  loadingFallback,
  loadingLabel,
  children,
}: QueryBoundaryProps) {
  if (isPending) {
    return <>{loadingFallback ?? <LoadingState label={loadingLabel} />}</>;
  }

  if (isError) {
    if (isApiError(error)) {
      if (error.kind === 'forbidden') return <ForbiddenState />;
      if (error.kind === 'not_found') return <NotFoundState />;
      // 401 is handled centrally by the API client, which ends the session and
      // sends the user to /login — showing an error box here would be noise.
      if (error.kind === 'unauthorized') return <LoadingState label="Signing you out…" />;
      return <ErrorState description={error.message} onRetry={onRetry} />;
    }
    return <ErrorState onRetry={onRetry} />;
  }

  return <>{children}</>;
}
