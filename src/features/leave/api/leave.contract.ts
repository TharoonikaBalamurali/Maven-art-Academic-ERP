import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { LeaveDetail, LeaveListItem } from '../types';

export interface LeaveDecisionInput { note?: string }

/**
 * Leave / OD contract (§ student affairs). Approving needs `leave.approve`
 * (or `od.approve` for OD); the backend decides whether the transition is legal
 * from the current status and rejects it (409) otherwise.
 *
 * TBD — BACKEND CONTRACT: provisional paths.
 */
export const leaveContract = {
  list: endpoint<void, Paginated<LeaveListItem>, ListQuery>({
    method: 'GET', path: '/leave', auth: true, permission: 'leave.view',
  }),
  get: endpoint<void, LeaveDetail>({
    method: 'GET', path: '/leave/:requestId', auth: true, permission: 'leave.view',
  }),
  approve: endpoint<LeaveDecisionInput, LeaveDetail>({
    method: 'POST', path: '/leave/:requestId/approve', auth: true, permission: 'leave.approve',
  }),
  reject: endpoint<LeaveDecisionInput, LeaveDetail>({
    method: 'POST', path: '/leave/:requestId/reject', auth: true, permission: 'leave.approve',
  }),
} as const;
