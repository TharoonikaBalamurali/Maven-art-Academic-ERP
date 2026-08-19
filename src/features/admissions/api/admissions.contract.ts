import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { AdmissionDetail, AdmissionListItem } from '../types';

export interface AdmissionDecisionInput {
  note?: string;
}

/**
 * Admissions contract (§17). Transition endpoints carry an optional note; the
 * backend decides whether the transition is legal from the current stage and
 * rejects it (409) otherwise. Enrolling creates an enrollment record (§18).
 *
 * TBD — BACKEND CONTRACT: provisional paths.
 */
export const admissionsContract = {
  list: endpoint<void, Paginated<AdmissionListItem>, ListQuery>({
    method: 'GET',
    path: '/admissions',
    auth: true,
    permission: 'admissions.view',
  }),
  get: endpoint<void, AdmissionDetail>({
    method: 'GET',
    path: '/admissions/:admissionId',
    auth: true,
    permission: 'admissions.view',
  }),
  confirm: endpoint<AdmissionDecisionInput, AdmissionDetail>({
    method: 'POST',
    path: '/admissions/:admissionId/confirm',
    auth: true,
    permission: 'admissions.approve',
  }),
  enroll: endpoint<AdmissionDecisionInput, AdmissionDetail>({
    method: 'POST',
    path: '/admissions/:admissionId/enroll',
    auth: true,
    permission: 'admissions.approve',
  }),
  cancel: endpoint<AdmissionDecisionInput, AdmissionDetail>({
    method: 'POST',
    path: '/admissions/:admissionId/cancel',
    auth: true,
    permission: 'admissions.approve',
  }),
} as const;
