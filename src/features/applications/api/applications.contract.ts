import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { ApplicationDetail, ApplicationListItem } from '../types';

export interface DecisionInput {
  note?: string;
}

/**
 * Applications contract (§16). Transition endpoints carry an optional decision
 * note; the backend decides whether the transition is legal from the current
 * stage and rejects it (409) otherwise.
 *
 * TBD — BACKEND CONTRACT: provisional paths.
 */
export const applicationsContract = {
  list: endpoint<void, Paginated<ApplicationListItem>, ListQuery>({
    method: 'GET',
    path: '/applications',
    auth: true,
    permission: 'applications.view',
  }),
  get: endpoint<void, ApplicationDetail>({
    method: 'GET',
    path: '/applications/:applicationId',
    auth: true,
    permission: 'applications.view',
  }),
  submit: endpoint<void, ApplicationDetail>({
    method: 'POST',
    path: '/applications/:applicationId/submit',
    auth: true,
    permission: 'applications.review',
  }),
  startReview: endpoint<void, ApplicationDetail>({
    method: 'POST',
    path: '/applications/:applicationId/start-review',
    auth: true,
    permission: 'applications.review',
  }),
  approve: endpoint<DecisionInput, ApplicationDetail>({
    method: 'POST',
    path: '/applications/:applicationId/approve',
    auth: true,
    permission: 'applications.review',
  }),
  reject: endpoint<DecisionInput, ApplicationDetail>({
    method: 'POST',
    path: '/applications/:applicationId/reject',
    auth: true,
    permission: 'applications.review',
  }),
} as const;
