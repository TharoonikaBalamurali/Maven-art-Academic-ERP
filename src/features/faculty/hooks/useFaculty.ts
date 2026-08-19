import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { facultyService } from '../api/faculty.service';

export const facultyKeys = {
  all: ['faculty'] as const,
  list: (query: ListQuery) => [...facultyKeys.all, 'list', query] as const,
  detail: (id: Id) => [...facultyKeys.all, 'detail', id] as const,
};

export function useFacultyList(query: ListQuery) {
  return useQuery({
    queryKey: facultyKeys.list(query),
    queryFn: ({ signal }) => facultyService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useFacultyMember(id: Id) {
  return useQuery({
    queryKey: facultyKeys.detail(id),
    queryFn: ({ signal }) => facultyService.get(id, { signal }),
    enabled: id.length > 0,
  });
}
