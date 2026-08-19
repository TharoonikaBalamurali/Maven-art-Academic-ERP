import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { usersService } from '../api/users.service';

export const userKeys = {
  all: ['users'] as const,
  list: (query: ListQuery) => [...userKeys.all, 'list', query] as const,
  detail: (id: Id) => [...userKeys.all, 'detail', id] as const,
};
export function useUsers(query: ListQuery) {
  return useQuery({ queryKey: userKeys.list(query), queryFn: ({ signal }) => usersService.list(query, { signal }), placeholderData: keepPreviousData });
}
export function useUser(id: Id) {
  return useQuery({ queryKey: userKeys.detail(id), queryFn: ({ signal }) => usersService.get(id, { signal }), enabled: id.length > 0 });
}
