import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { feeStructuresService } from '../api/fee-structures.service';

export const feeStructureKeys = {
  all: ['fee-structures'] as const,
  list: (query: ListQuery) => [...feeStructureKeys.all, 'list', query] as const,
  detail: (id: Id) => [...feeStructureKeys.all, 'detail', id] as const,
};

export function useFeeStructures(query: ListQuery) {
  return useQuery({
    queryKey: feeStructureKeys.list(query),
    queryFn: ({ signal }) => feeStructuresService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useFeeStructure(id: Id) {
  return useQuery({
    queryKey: feeStructureKeys.detail(id),
    queryFn: ({ signal }) => feeStructuresService.get(id, { signal }),
    enabled: id.length > 0,
  });
}
