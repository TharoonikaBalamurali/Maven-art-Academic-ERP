import { endpoint } from '@/lib/api';
import type { DashboardSummary } from '../types';

/**
 * Dashboard contract (§13).
 *
 * Auth-only, no specific permission: the dashboard is the landing surface for
 * any authenticated management user, and the backend scopes the payload to the
 * caller's role (like `/auth/me`). Individual widgets inside each dashboard are
 * permission-gated in the UI.
 *
 * TBD — BACKEND CONTRACT: a real backend most likely exposes one role-aware
 * `/dashboard` and returns the matching shape; this mirrors that.
 */
export const dashboardContract = {
  summary: endpoint<void, DashboardSummary>({
    method: 'GET',
    path: '/dashboard',
    auth: true,
  }),
} as const;
