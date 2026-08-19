import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { receiptsService } from '../api/receipts.service';

export const receiptKeys = {
  all: ['receipts'] as const,
  list: (query: ListQuery) => [...receiptKeys.all, 'list', query] as const,
  detail: (id: Id) => [...receiptKeys.all, 'detail', id] as const,
};

export function useReceipts(query: ListQuery) {
  return useQuery({
    queryKey: receiptKeys.list(query),
    queryFn: ({ signal }) => receiptsService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useReceipt(id: Id) {
  return useQuery({
    queryKey: receiptKeys.detail(id),
    queryFn: ({ signal }) => receiptsService.get(id, { signal }),
    enabled: id.length > 0,
  });
}
