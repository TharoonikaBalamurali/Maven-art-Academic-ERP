import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { ReportListItem, ReportResult } from '../types';
import { reportsContract, type ReportExportResult } from './reports.contract';

export const reportsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<ReportListItem>> {
    return apiClient.call(reportsContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(reportId: Id, options?: RequestOptions): Promise<ReportResult> {
    return apiClient.call(reportsContract.get, { params: { reportId }, options });
  },
  /** Requests an export; the backend prepares the file (§ reporting). */
  export(reportId: Id, options?: RequestOptions): Promise<ReportExportResult> {
    return apiClient.call(reportsContract.export, { params: { reportId }, options });
  },
};
