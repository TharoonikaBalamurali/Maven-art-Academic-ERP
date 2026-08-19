import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { feeAssignmentsService } from '../api/fee-assignments.service';

export const feeAssignmentKeys = {
  all: ['fee-assignments'] as const,
  list: (query: ListQuery) => [...feeAssignmentKeys.all, 'list', query] as const,
  detail: (id: Id) => [...feeAssignmentKeys.all, 'detail', id] as const,
};

export function useFeeAssignments(query: ListQuery) {
  return useQuery({
    queryKey: feeAssignmentKeys.list(query),
    queryFn: ({ signal }) => feeAssignmentsService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useFeeAssignment(id: Id) {
  return useQuery({
    queryKey: feeAssignmentKeys.detail(id),
    queryFn: ({ signal }) => feeAssignmentsService.get(id, { signal }),
    enabled: id.length > 0,
  });
}
