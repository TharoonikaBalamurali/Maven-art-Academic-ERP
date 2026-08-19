import type { IsoDateString } from '@/shared/types';

/**
 * Student/Parent portal types (§7, §8, §37).
 *
 * All portal data is SCOPED BY THE BACKEND to the authenticated student — or,
 * for a parent, to the selected linked child (§8). The frontend never widens
 * that scope; it renders what the backend returns for "me". Amounts, attendance
 * percentages and grades are backend-authoritative (finance/academic invariants).
 *
 * TBD — BACKEND CONTRACT: the selected-child header and field shapes are provisional.
 */
export interface PortalStudentRef {
  name: string;
  registerNo: string;
  course: string;
  batch: string;
}

export interface PortalOverview {
  student: PortalStudentRef;
  attendance: { percentage: number; present: number; total: number } | null;
  fees: { outstanding: number; status: string } | null;
  nextClass: { subject: string; day: string; time: string; room: string } | null;
  latestGrade: { assessment: string; grade: string } | null;
}

export interface PortalProfile {
  name: string;
  registerNo: string;
  email: string;
  phone: string;
  dateOfBirth: IsoDateString | null;
  address: string;
  course: string;
  batch: string;
  admittedOn: IsoDateString | null;
  guardianName: string;
  guardianPhone: string;
}
