import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { RoleDetail, RoleListItem } from '../types';
import { rolesContract } from './roles.contract';

export const rolesService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<RoleListItem>> {
    return apiClient.call(rolesContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(roleId: Id, options?: RequestOptions): Promise<RoleDetail> {
    return apiClient.call(rolesContract.get, { params: { roleId }, options });
  },
};
