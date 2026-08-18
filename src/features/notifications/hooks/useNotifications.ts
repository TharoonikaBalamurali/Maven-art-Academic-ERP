import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ListQuery } from '@/shared/types';
import { notificationsService } from '../api/notifications.service';

/** Query keys are colocated with the feature so caches stay easy to invalidate. */
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (query: ListQuery) => [...notificationKeys.all, 'list', query] as const,
};

/**
 * The hook layer components consume (§26, §38).
 *
 * Components never call the service or the API client directly; they call a
 * hook, which owns caching and request cancellation.
 */
export function useNotifications(query: ListQuery) {
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: ({ signal }) => notificationsService.list(query, { signal }),
    // Keeps the previous page visible while the next one loads, so paginating
    // does not flash a full-page spinner.
    placeholderData: keepPreviousData,
  });
}
