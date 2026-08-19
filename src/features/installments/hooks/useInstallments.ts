import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { installmentsService } from '../api/installments.service';

export const installmentKeys = {
  all: ['installments'] as const,
  list: (query: ListQuery) => [...installmentKeys.all, 'list', query] as const,
  detail: (id: Id) => [...installmentKeys.all, 'detail', id] as const,
};

export function useInstallments(query: ListQuery) {
  return useQuery({
    queryKey: installmentKeys.list(query),
    queryFn: ({ signal }) => installmentsService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useInstallment(id: Id) {
  return useQuery({
    queryKey: installmentKeys.detail(id),
    queryFn: ({ signal }) => installmentsService.get(id, { signal }),
    enabled: id.length > 0,
  });
}
