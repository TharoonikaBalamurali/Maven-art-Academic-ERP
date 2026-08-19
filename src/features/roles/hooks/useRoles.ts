import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { rolesService } from '../api/roles.service';

export const roleKeys = {
  all: ['roles'] as const,
  list: (query: ListQuery) => [...roleKeys.all, 'list', query] as const,
  detail: (id: Id) => [...roleKeys.all, 'detail', id] as const,
};
export function useRoles(query: ListQuery) {
  return useQuery({ queryKey: roleKeys.list(query), queryFn: ({ signal }) => rolesService.list(query, { signal }), placeholderData: keepPreviousData });
}
export function useRole(id: Id) {
  return useQuery({ queryKey: roleKeys.detail(id), queryFn: ({ signal }) => rolesService.get(id, { signal }), enabled: id.length > 0 });
}
