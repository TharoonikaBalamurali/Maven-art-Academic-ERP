import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { paymentsService } from '../api/payments.service';
import type { RecordPaymentInput } from '../types';

export const paymentKeys = {
  all: ['payments'] as const,
  list: (query: ListQuery) => [...paymentKeys.all, 'list', query] as const,
  detail: (id: Id) => [...paymentKeys.all, 'detail', id] as const,
};

export function usePayments(query: ListQuery) {
  return useQuery({
    queryKey: paymentKeys.list(query),
    queryFn: ({ signal }) => paymentsService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function usePayment(id: Id) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: ({ signal }) => paymentsService.get(id, { signal }),
    enabled: id.length > 0,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => paymentsService.record(input),
    onSuccess: (detail) => {
      queryClient.setQueryData(paymentKeys.detail(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}
