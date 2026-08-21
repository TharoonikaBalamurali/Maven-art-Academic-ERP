import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { disciplineService } from '../api/discipline.service';

export const disciplineKeys = {
  all: ['discipline'] as const,
  list: (query: ListQuery) => [...disciplineKeys.all, 'list', query] as const,
  detail: (id: Id) => [...disciplineKeys.all, 'detail', id] as const,
};

export function useDisciplineCases(query: ListQuery) {
  return useQuery({ queryKey: disciplineKeys.list(query), queryFn: ({ signal }) => disciplineService.list(query, { signal }), placeholderData: keepPreviousData });
}
export function useDisciplineCase(id: Id) {
  return useQuery({ queryKey: disciplineKeys.detail(id), queryFn: ({ signal }) => disciplineService.get(id, { signal }), enabled: id.length > 0 });
}
