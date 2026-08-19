import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { batchesService } from '../api/batches.service';

export const batchKeys = {
  all: ['batches'] as const,
  list: (query: ListQuery) => [...batchKeys.all, 'list', query] as const,
  detail: (id: Id) => [...batchKeys.all, 'detail', id] as const,
};

export function useBatches(query: ListQuery) {
  return useQuery({
    queryKey: batchKeys.list(query),
    queryFn: ({ signal }) => batchesService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useBatch(id: Id) {
  return useQuery({
    queryKey: batchKeys.detail(id),
    queryFn: ({ signal }) => batchesService.get(id, { signal }),
    enabled: id.length > 0,
  });
}
