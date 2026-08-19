import type { Id } from '@/shared/types';

/**
 * Course types (§19).
 *
 * A course *has* batches; the batches (and through them faculty and students)
 * stay related collections, not fields folded into the course.
 *
 * TBD — BACKEND CONTRACT: provisional field names.
 */
export interface CourseListItem {
  id: Id;
  code: string;
  name: string;
  batchCount: number;
  studentCount: number;
}

export interface CourseBatch {
  id: Id;
  name: string;
  section: string;
  faculty: string;
  studentCount: number;
  active: boolean;
}

export interface CourseDetail {
  id: Id;
  code: string;
  name: string;
  batchCount: number;
  studentCount: number;
  batches: CourseBatch[];
}
