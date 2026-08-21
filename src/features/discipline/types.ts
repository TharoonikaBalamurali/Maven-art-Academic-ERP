import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Discipline types (§ student affairs).
 *
 * Confidential records. The backend owns the case state machine and decides
 * which actions are legal; the UI renders only what it advertises, and summary
 * counts never expose case detail on a dashboard (§31).
 *
 * TBD — BACKEND CONTRACT: state/category names are provisional.
 */
export type DisciplineStatus = KnownOr<'open' | 'under_review' | 'action_required' | 'resolved'>;
export type DisciplineSeverity = KnownOr<'low' | 'medium' | 'high'>;

export const DISCIPLINE_STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  under_review: 'Under review',
  action_required: 'Action required',
  resolved: 'Resolved',
};

export const DISCIPLINE_SEVERITY_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export interface DisciplineListItem {
  id: Id;
  incidentNo: string;
  student: string;
  category: string;
  date: IsoDateString;
  severity: DisciplineSeverity;
  status: DisciplineStatus;
}

export interface DisciplineDetail {
  id: Id;
  incidentNo: string;
  studentId: Id;
  student: string;
  registerNo: string;
  category: string;
  date: IsoDateString;
  time: string;
  location: string;
  description: string;
  reportedBy: string;
  actionTaken: string;
  resolution: string;
  followUpDate: IsoDateString | null;
  remarks: string;
  severity: DisciplineSeverity;
  status: DisciplineStatus;
}
