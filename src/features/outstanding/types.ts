import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Outstanding fee types (§23).
 *
 * Every figure here is COMPUTED BY THE BACKEND — outstanding totals, overdue
 * amounts and severity. The frontend only surfaces the backend's report; it
 * never aggregates balances or derives a severity itself (finance invariant).
 *
 * TBD — BACKEND CONTRACT: severity names, currency (INR) and the "as of" basis
 * are provisional.
 */
export type OutstandingSeverity = KnownOr<'overdue' | 'due' | 'upcoming'>;

export const OUTSTANDING_SEVERITY_LABEL: Record<string, string> = {
  overdue: 'Overdue',
  due: 'Due',
  upcoming: 'Upcoming',
};

export interface OutstandingListItem {
  id: Id;
  student: string;
  course: string;
  /** Backend-computed amounts — never aggregated on the client. */
  outstandingAmount: number;
  overdueAmount: number;
  severity: OutstandingSeverity;
}

export interface OutstandingDetail {
  id: Id;
  student: string;
  course: string;
  feeAssignmentId: Id;
  /** All figures are backend-computed and displayed verbatim. */
  assignedTotal: number;
  paidTotal: number;
  outstandingAmount: number;
  overdueAmount: number;
  oldestDueDate: IsoDateString | null;
  asOf: IsoDateString | null;
  severity: OutstandingSeverity;
  note: string | null;
}
