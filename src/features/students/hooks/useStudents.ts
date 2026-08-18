import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ListQuery } from '@/shared/types';
import { studentsService } from '../api/students.service';

export const studentKeys = {
  all: ['students'] as const,
  list: (query: ListQuery) => [...studentKeys.all, 'list', query] as const,
  filterOptions: () => [...studentKeys.all, 'filter-options'] as const,
};

export function useStudents(query: ListQuery) {
  return useQuery({
    queryKey: studentKeys.list(query),
    queryFn: ({ signal }) => studentsService.list(query, { signal }),
    // Keep the current page visible while the next loads, so paging does not
    // flash a full-page spinner.
    placeholderData: keepPreviousData,
  });
}

export function useStudentFilterOptions() {
  return useQuery({
    queryKey: studentKeys.filterOptions(),
    queryFn: ({ signal }) => studentsService.filterOptions({ signal }),
    // Reference data changes rarely; cache it for the session.
    staleTime: 5 * 60_000,
  });
}
