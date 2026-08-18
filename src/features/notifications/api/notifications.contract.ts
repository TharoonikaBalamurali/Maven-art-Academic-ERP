import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { Notification } from '../types';

/**
 * Notifications contract (§25).
 *
 * TBD — BACKEND CONTRACT: provisional path and query names.
 */
export const notificationsContract = {
  list: endpoint<void, Paginated<Notification>, ListQuery>({
    method: 'GET',
    path: '/notifications',
    auth: true,
    permission: 'portal.notifications.view',
  }),
} as const;
