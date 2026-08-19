import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { admissionsService } from '../api/admissions.service';
import type { AdmissionAction } from '../types';

export const admissionKeys = {
  all: ['admissions'] as const,
  list: (query: ListQuery) => [...admissionKeys.all, 'list', query] as const,
  detail: (id: Id) => [...admissionKeys.all, 'detail', id] as const,
};

export function useAdmissions(query: ListQuery) {
  return useQuery({
    queryKey: admissionKeys.list(query),
    queryFn: ({ signal }) => admissionsService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useAdmission(id: Id) {
  return useQuery({
    queryKey: admissionKeys.detail(id),
    queryFn: ({ signal }) => admissionsService.get(id, { signal }),
    enabled: id.length > 0,
  });
}

export function useAdmissionTransition(id: Id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, note }: { action: AdmissionAction; note?: string }) =>
      admissionsService.transition(id, action, note),
    onSuccess: (detail) => {
      queryClient.setQueryData(admissionKeys.detail(id), detail);
      void queryClient.invalidateQueries({ queryKey: admissionKeys.all });
    },
  });
}
