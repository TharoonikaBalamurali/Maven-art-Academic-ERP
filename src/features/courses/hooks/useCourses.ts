import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { coursesService } from '../api/courses.service';

export const courseKeys = {
  all: ['courses'] as const,
  list: (query: ListQuery) => [...courseKeys.all, 'list', query] as const,
  detail: (id: Id) => [...courseKeys.all, 'detail', id] as const,
};

export function useCourses(query: ListQuery) {
  return useQuery({
    queryKey: courseKeys.list(query),
    queryFn: ({ signal }) => coursesService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useCourse(id: Id) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: ({ signal }) => coursesService.get(id, { signal }),
    enabled: id.length > 0,
  });
}
