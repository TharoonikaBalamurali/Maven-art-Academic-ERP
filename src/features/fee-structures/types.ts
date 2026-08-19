import type { Id, KnownOr } from '@/shared/types';

/**
 * Fee structure types (§19).
 *
 * A fee structure defines the fee for a course, broken into components. Every
 * monetary value — including the total — is authoritative and comes from the
 * backend; the frontend only DISPLAYS amounts and never sums or recomputes them
 * (§ finance invariants).
 *
 * TBD — BACKEND CONTRACT: component labels, currency (INR) and status names are
 * provisional.
 */
export type FeeStructureStatus = KnownOr<'active' | 'draft' | 'archived'>;

export const FEE_STRUCTURE_STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  archived: 'Archived',
};

export interface FeeComponent {
  label: string;
  /** Authoritative amount from the backend (minor unit assumptions TBD). */
  amount: number;
}

export interface FeeStructureListItem {
  id: Id;
  name: string;
  courseCode: string;
  courseName: string;
  academicYear: string;
  componentCount: number;
  /** Backend-provided total — never computed on the client. */
  total: number;
  status: FeeStructureStatus;
}

export interface FeeStructureDetail {
  id: Id;
  name: string;
  courseCode: string;
  courseName: string;
  academicYear: string;
  status: FeeStructureStatus;
  components: FeeComponent[];
  /** Backend-provided total — never computed on the client. */
  total: number;
  note: string | null;
}
