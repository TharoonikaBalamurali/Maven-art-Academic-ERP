import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { studentsService } from '../api/students.service';
import type { StudentInput } from '../types';

export const studentKeys = {
  all: ['students'] as const,
  list: (query: ListQuery) => [...studentKeys.all, 'list', query] as const,
  filterOptions: () => [...studentKeys.all, 'filter-options'] as const,
  detail: (id: Id) => [...studentKeys.all, 'detail', id] as const,
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

export function useStudent(id: Id) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: ({ signal }) => studentsService.get(id, { signal }),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StudentInput) => studentsService.create(input),
    onSuccess: () => {
      // The roster changed; drop cached list pages so the new record shows.
      void queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
}

export function useUpdateStudent(id: Id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StudentInput) => studentsService.update(id, input),
    onSuccess: (detail) => {
      queryClient.setQueryData(studentKeys.detail(id), detail);
      void queryClient.invalidateQueries({ queryKey: studentKeys.list({}) });
      void queryClient.invalidateQueries({ queryKey: [...studentKeys.all, 'list'] });
    },
  });
}
