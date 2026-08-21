import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { leaveService } from '../api/leave.service';
import type { LeaveAction } from '../types';

export const leaveKeys = {
  all: ['leave'] as const,
  list: (query: ListQuery) => [...leaveKeys.all, 'list', query] as const,
  detail: (id: Id) => [...leaveKeys.all, 'detail', id] as const,
};

export function useLeaveRequests(query: ListQuery) {
  return useQuery({ queryKey: leaveKeys.list(query), queryFn: ({ signal }) => leaveService.list(query, { signal }), placeholderData: keepPreviousData });
}
export function useLeaveRequest(id: Id) {
  return useQuery({ queryKey: leaveKeys.detail(id), queryFn: ({ signal }) => leaveService.get(id, { signal }), enabled: id.length > 0 });
}
export function useLeaveDecision(id: Id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, note }: { action: LeaveAction; note?: string }) => leaveService.decide(id, action, note),
    onSuccess: (detail) => {
      queryClient.setQueryData(leaveKeys.detail(id), detail);
      void queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}
