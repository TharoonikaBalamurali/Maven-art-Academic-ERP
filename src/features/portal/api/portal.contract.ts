import { endpoint } from '@/lib/api';
import type { PortalOverview, PortalProfile } from '../types';

/**
 * Portal contract (§7, §37) — the authenticated student's own data. The backend
 * scopes every response to the caller (and the selected child for a parent, §8).
 *
 * TBD — BACKEND CONTRACT: provisional paths.
 */
export const portalContract = {
  overview: endpoint<void, PortalOverview>({ method: 'GET', path: '/portal/overview', auth: true, permission: 'portal.dashboard.view' }),
  profile: endpoint<void, PortalProfile>({ method: 'GET', path: '/portal/profile', auth: true, permission: 'portal.profile.view' }),
} as const;
