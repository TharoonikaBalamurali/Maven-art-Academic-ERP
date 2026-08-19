import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { certificatesService } from '../api/certificates.service';
import type { IssueCertificateInput } from '../types';

export const certificateKeys = {
  all: ['certificates'] as const,
  list: (query: ListQuery) => [...certificateKeys.all, 'list', query] as const,
  detail: (id: Id) => [...certificateKeys.all, 'detail', id] as const,
};

export function useCertificates(query: ListQuery) {
  return useQuery({
    queryKey: certificateKeys.list(query),
    queryFn: ({ signal }) => certificatesService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useCertificate(id: Id) {
  return useQuery({
    queryKey: certificateKeys.detail(id),
    queryFn: ({ signal }) => certificatesService.get(id, { signal }),
    enabled: id.length > 0,
  });
}

export function useIssueCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IssueCertificateInput) => certificatesService.issue(input),
    onSuccess: (detail) => {
      queryClient.setQueryData(certificateKeys.detail(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}
