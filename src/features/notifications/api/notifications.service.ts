import { apiClient, toListParams } from '@/lib/api';
import type { ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { Notification } from '../types';
import { notificationsContract } from './notifications.contract';

export const notificationsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<Notification>> {
    return apiClient.call(notificationsContract.list, {
      query: toListParams(query) as ListQuery,
      options,
    });
  },
};
