import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { parentsService } from '../api/parents.service';

export const parentKeys = {
  all: ['parents'] as const,
  list: (query: ListQuery) => [...parentKeys.all, 'list', query] as const,
  detail: (id: Id) => [...parentKeys.all, 'detail', id] as const,
};

export function useParents(query: ListQuery) {
  return useQuery({ queryKey: parentKeys.list(query), queryFn: ({ signal }) => parentsService.list(query, { signal }), placeholderData: keepPreviousData });
}
export function useParent(id: Id) {
  return useQuery({ queryKey: parentKeys.detail(id), queryFn: ({ signal }) => parentsService.get(id, { signal }), enabled: id.length > 0 });
}
