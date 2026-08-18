import type { Id, KnownOr } from '@/shared/types';

/**
 * Student list row (§14.1).
 *
 * TBD — BACKEND CONTRACT: field names are provisional. The list endpoint
 * returns display-ready course/batch names so the table needs no second lookup;
 * the ids are included for links and filtering.
 */
export type StudentStatus = KnownOr<'active' | 'on_leave' | 'graduated'>;

export interface StudentListItem {
  id: Id;
  registerNo: string;
  name: string;
  courseId: Id;
  course: string;
  courseCode: string;
  batchId: Id;
  batch: string;
  section: string;
  status: StudentStatus;
}

/** Options for the list's server-driven filters. */
export interface StudentFilterOptions {
  courses: { id: Id; name: string }[];
  statuses: { value: string; label: string }[];
}

export const STUDENT_STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  on_leave: 'On leave',
  graduated: 'Graduated',
};
