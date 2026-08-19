import type { Id } from '@/shared/types';

/**
 * Faculty types (§3.1, §6).
 *
 * The management view of faculty members. A faculty member *is assigned to*
 * batches and *teaches* subjects — those stay as related collections on the
 * detail, not fields folded into the record.
 *
 * TBD — BACKEND CONTRACT: provisional field names.
 */
export interface FacultyListItem {
  id: Id;
  name: string;
  email: string;
  batchCount: number;
  studentCount: number;
}

export interface FacultyBatch {
  id: Id;
  name: string;
  course: string;
  studentCount: number;
}

export interface FacultyDetail {
  id: Id;
  name: string;
  email: string;
  batchCount: number;
  studentCount: number;
  subjects: string[];
  batches: FacultyBatch[];
}
