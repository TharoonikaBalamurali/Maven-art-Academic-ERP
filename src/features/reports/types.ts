import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Report types (§ reporting).
 *
 * Reports are COMPUTED BY THE BACKEND. Every metric, total and table cell
 * arrives display-ready from the backend; the frontend renders values verbatim
 * and never aggregates, sums or derives a figure. Export is a backend
 * operation gated on `reports.export` — the client never generates the file.
 *
 * TBD — BACKEND CONTRACT: report catalog, result shape and the export/download
 * endpoint are provisional.
 */
export type ReportCategory = KnownOr<'financial' | 'operational'>;

export const REPORT_CATEGORY_LABEL: Record<string, string> = {
  financial: 'Financial',
  operational: 'Operational',
};

export interface ReportListItem {
  id: Id;
  name: string;
  category: ReportCategory;
  description: string;
}

export interface ReportMetric {
  label: string;
  /** Display-ready value from the backend — never computed on the client. */
  value: string;
}

export interface ReportTable {
  columns: string[];
  /** Each row is display-ready cells from the backend. */
  rows: string[][];
}

export interface ReportResult {
  id: Id;
  name: string;
  category: ReportCategory;
  generatedAt: IsoDateString | null;
  summary: string;
  metrics: ReportMetric[];
  table: ReportTable | null;
}
