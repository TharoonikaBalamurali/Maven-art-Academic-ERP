import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { UserDetail, UserListItem } from '../types';
import { usersContract } from './users.contract';

export const usersService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<UserListItem>> {
    return apiClient.call(usersContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(userId: Id, options?: RequestOptions): Promise<UserDetail> {
    return apiClient.call(usersContract.get, { params: { userId }, options });
  },
};
