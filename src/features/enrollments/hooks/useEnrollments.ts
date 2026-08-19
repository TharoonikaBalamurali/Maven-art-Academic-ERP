import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { enrollmentsService } from '../api/enrollments.service';

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  list: (query: ListQuery) => [...enrollmentKeys.all, 'list', query] as const,
  detail: (id: Id) => [...enrollmentKeys.all, 'detail', id] as const,
};

export function useEnrollments(query: ListQuery) {
  return useQuery({
    queryKey: enrollmentKeys.list(query),
    queryFn: ({ signal }) => enrollmentsService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useEnrollment(id: Id) {
  return useQuery({
    queryKey: enrollmentKeys.detail(id),
    queryFn: ({ signal }) => enrollmentsService.get(id, { signal }),
    enabled: id.length > 0,
  });
}
