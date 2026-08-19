import type { Id, KnownOr } from '@/shared/types';

/**
 * Parent types (§ Phase 2).
 *
 * Parent records and the students linked to them. The linkage is owned by the
 * backend (§8: a parent sees only their linked children).
 *
 * TBD — BACKEND CONTRACT: relation values are provisional.
 */
export type ParentRelation = KnownOr<'father' | 'mother' | 'guardian'>;

export const PARENT_RELATION_LABEL: Record<string, string> = {
  father: 'Father',
  mother: 'Mother',
  guardian: 'Guardian',
};

export interface ParentListItem {
  id: Id;
  name: string;
  email: string;
  phone: string;
  relation: ParentRelation;
  studentCount: number;
}

export interface LinkedStudent {
  id: Id;
  name: string;
  course: string;
}

export interface ParentDetail {
  id: Id;
  name: string;
  email: string;
  phone: string;
  relation: ParentRelation;
  students: LinkedStudent[];
  note: string | null;
}
