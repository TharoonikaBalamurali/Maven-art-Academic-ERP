import { apiClient } from '@/lib/api';
import type { ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { Notification } from '../types';
import { notificationsContract } from './notifications.contract';

/**
 * Flattens `ListQuery` into the flat query-string shape the API expects.
 *
 * Every future list service reuses this, which is what keeps search, sort,
 * filtering and pagination consistent across the whole ERP (§31, §32).
 */
export function toListParams(query: ListQuery): Record<string, string | number | boolean | undefined> {
  const { filters, ...rest } = query;
  return { ...rest, ...(filters ?? {}) };
}

export const notificationsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<Notification>> {
    return apiClient.call(notificationsContract.list, {
      query: toListParams(query) as ListQuery,
      options,
    });
  },
};
