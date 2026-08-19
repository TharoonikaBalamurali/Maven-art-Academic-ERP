import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { ReportListItem, ReportResult } from '../types';

export interface ReportExportResult {
  status: string;
  message: string;
}

/**
 * Reports contract. Viewing a report needs `reports.view`; exporting needs
 * `reports.export`. The backend computes the report and prepares any export
 * file — the frontend never computes figures or generates the file.
 *
 * TBD — BACKEND CONTRACT: provisional paths; the export endpoint returns a
 * placeholder until the document pipeline exists.
 */
export const reportsContract = {
  list: endpoint<void, Paginated<ReportListItem>, ListQuery>({
    method: 'GET',
    path: '/reports',
    auth: true,
    permission: 'reports.view',
  }),
  get: endpoint<void, ReportResult>({
    method: 'GET',
    path: '/reports/:reportId',
    auth: true,
    permission: 'reports.view',
  }),
  export: endpoint<void, ReportExportResult>({
    method: 'POST',
    path: '/reports/:reportId/export',
    auth: true,
    permission: 'reports.export',
  }),
} as const;
