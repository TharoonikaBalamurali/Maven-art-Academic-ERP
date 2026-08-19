import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { applicationsService } from '../api/applications.service';
import type { ApplicationAction } from '../types';

export const applicationKeys = {
  all: ['applications'] as const,
  list: (query: ListQuery) => [...applicationKeys.all, 'list', query] as const,
  detail: (id: Id) => [...applicationKeys.all, 'detail', id] as const,
};

export function useApplications(query: ListQuery) {
  return useQuery({
    queryKey: applicationKeys.list(query),
    queryFn: ({ signal }) => applicationsService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useApplication(id: Id) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: ({ signal }) => applicationsService.get(id, { signal }),
    enabled: id.length > 0,
  });
}

export function useApplicationTransition(id: Id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, note }: { action: ApplicationAction; note?: string }) =>
      applicationsService.transition(id, action, note),
    onSuccess: (detail) => {
      queryClient.setQueryData(applicationKeys.detail(id), detail);
      void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}
