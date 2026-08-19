import type { Id } from '@/shared/types';

/**
 * Batch types (§19).
 *
 * The specification is explicit that Course, Batch, Faculty assignment and
 * Schedule are SEPARATE concepts and must not be merged. So a batch references
 * a course and a faculty member by id (with display names for convenience), and
 * carries its schedule and roster as related collections — not as fields folded
 * into the batch itself.
 *
 * TBD — BACKEND CONTRACT: field names are provisional.
 */
export interface BatchListItem {
  id: Id;
  name: string;
  courseId: Id;
  course: string;
  courseCode: string;
  section: string;
  facultyId: Id;
  faculty: string;
  studentCount: number;
  active: boolean;
}

export interface BatchScheduleSlot {
  id: Id;
  subject: string;
  room: string;
  start: string;
  end: string;
  facultyId: Id;
  faculty: string;
}

export interface BatchRosterStudent {
  id: Id;
  registerNo: string;
  name: string;
  status: string;
}

export interface BatchDetail {
  id: Id;
  name: string;
  section: string;
  active: boolean;
  course: { id: Id; code: string; name: string };
  faculty: { id: Id; name: string };
  studentCount: number;
  schedule: BatchScheduleSlot[];
  students: BatchRosterStudent[];
}
