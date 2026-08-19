import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { EnrollmentDetail, EnrollmentListItem } from '../types';

/**
 * Enrollments contract (§18) — read views. Enrollments are created by the
 * admission → enrol handoff (§17); a manual create endpoint and any status
 * transitions are owned by the backend.
 *
 * TBD — BACKEND CONTRACT: provisional paths; create/transition endpoints
 * pending the backend contract.
 */
export const enrollmentsContract = {
  list: endpoint<void, Paginated<EnrollmentListItem>, ListQuery>({
    method: 'GET',
    path: '/enrollments',
    auth: true,
    permission: 'enrollments.view',
  }),
  get: endpoint<void, EnrollmentDetail>({
    method: 'GET',
    path: '/enrollments/:enrollmentId',
    auth: true,
    permission: 'enrollments.view',
  }),
} as const;
