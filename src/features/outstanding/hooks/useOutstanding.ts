import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { outstandingService } from '../api/outstanding.service';

export const outstandingKeys = {
  all: ['outstanding'] as const,
  list: (query: ListQuery) => [...outstandingKeys.all, 'list', query] as const,
  detail: (id: Id) => [...outstandingKeys.all, 'detail', id] as const,
};

export function useOutstandingList(query: ListQuery) {
  return useQuery({
    queryKey: outstandingKeys.list(query),
    queryFn: ({ signal }) => outstandingService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useOutstanding(id: Id) {
  return useQuery({
    queryKey: outstandingKeys.detail(id),
    queryFn: ({ signal }) => outstandingService.get(id, { signal }),
    enabled: id.length > 0,
  });
}
