import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { auditService } from '../api/audit.service';

export const auditKeys = {
  all: ['audit'] as const,
  list: (query: ListQuery) => [...auditKeys.all, 'list', query] as const,
  detail: (id: Id) => [...auditKeys.all, 'detail', id] as const,
};
export function useAuditLog(query: ListQuery) {
  return useQuery({ queryKey: auditKeys.list(query), queryFn: ({ signal }) => auditService.list(query, { signal }), placeholderData: keepPreviousData });
}
export function useAuditEntry(id: Id) {
  return useQuery({ queryKey: auditKeys.detail(id), queryFn: ({ signal }) => auditService.get(id, { signal }), enabled: id.length > 0 });
}
