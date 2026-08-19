import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { reportsService } from '../api/reports.service';

export const reportKeys = {
  all: ['reports'] as const,
  list: (query: ListQuery) => [...reportKeys.all, 'list', query] as const,
  detail: (id: Id) => [...reportKeys.all, 'detail', id] as const,
};

export function useReports(query: ListQuery) {
  return useQuery({
    queryKey: reportKeys.list(query),
    queryFn: ({ signal }) => reportsService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useReport(id: Id) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: ({ signal }) => reportsService.get(id, { signal }),
    enabled: id.length > 0,
  });
}

export function useExportReport(id: Id) {
  return useMutation({
    mutationFn: () => reportsService.export(id),
  });
}
