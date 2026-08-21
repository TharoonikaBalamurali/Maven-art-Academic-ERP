import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { archiveService } from '../api/archive.service';

export const archiveKeys = {
  all: ['archive'] as const,
  batches: (query: ListQuery) => [...archiveKeys.all, 'batches', query] as const,
  batch: (id: Id) => [...archiveKeys.all, 'batch', id] as const,
  students: (query: ListQuery) => [...archiveKeys.all, 'students', query] as const,
  student: (id: Id) => [...archiveKeys.all, 'student', id] as const,
};

export function useArchivedBatches(query: ListQuery) {
  return useQuery({ queryKey: archiveKeys.batches(query), queryFn: ({ signal }) => archiveService.batches(query, { signal }), placeholderData: keepPreviousData });
}
export function useArchivedBatch(id: Id) {
  return useQuery({ queryKey: archiveKeys.batch(id), queryFn: ({ signal }) => archiveService.batch(id, { signal }), enabled: id.length > 0 });
}

export function useClosedStudents(query: ListQuery) {
  return useQuery({ queryKey: archiveKeys.students(query), queryFn: ({ signal }) => archiveService.students(query, { signal }), placeholderData: keepPreviousData });
}

export function useArchivedStudent(id: Id) {
  return useQuery({ queryKey: archiveKeys.student(id), queryFn: ({ signal }) => archiveService.student(id, { signal }), enabled: id.length > 0 });
}
