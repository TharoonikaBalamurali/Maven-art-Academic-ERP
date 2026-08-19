import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { AuditDetail, AuditListItem } from '../types';

/** Audit contract (§ administration) — read only; the backend records the trail. */
export const auditContract = {
  list: endpoint<void, Paginated<AuditListItem>, ListQuery>({ method: 'GET', path: '/audit', auth: true, permission: 'audit.view' }),
  get: endpoint<void, AuditDetail>({ method: 'GET', path: '/audit/:auditId', auth: true, permission: 'audit.view' }),
} as const;
