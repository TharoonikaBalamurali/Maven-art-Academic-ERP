import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { progressService } from '../api/progress.service';

export const progressKeys = {
  all: ['progress'] as const,
  list: (query: ListQuery) => [...progressKeys.all, 'list', query] as const,
  detail: (id: Id) => [...progressKeys.all, 'detail', id] as const,
};

export function useProgressList(query: ListQuery) {
  return useQuery({
    queryKey: progressKeys.list(query),
    queryFn: ({ signal }) => progressService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useProgress(id: Id) {
  return useQuery({
    queryKey: progressKeys.detail(id),
    queryFn: ({ signal }) => progressService.get(id, { signal }),
    enabled: id.length > 0,
  });
}
