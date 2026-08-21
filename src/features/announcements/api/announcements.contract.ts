import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { AnnouncementDetail, AnnouncementInput, AnnouncementListItem } from '../types';

/**
 * Announcements contract (§ communication). Creating requires
 * `announcements.create`; the backend decides audience delivery.
 *
 * TBD — BACKEND CONTRACT: provisional paths; edit/archive pending.
 */
export const announcementsContract = {
  list: endpoint<void, Paginated<AnnouncementListItem>, ListQuery>({
    method: 'GET', path: '/announcements', auth: true, permission: 'announcements.view',
  }),
  get: endpoint<void, AnnouncementDetail>({
    method: 'GET', path: '/announcements/:announcementId', auth: true, permission: 'announcements.view',
  }),
  create: endpoint<AnnouncementInput, AnnouncementDetail>({
    method: 'POST', path: '/announcements', auth: true, permission: 'announcements.create',
  }),
} as const;
