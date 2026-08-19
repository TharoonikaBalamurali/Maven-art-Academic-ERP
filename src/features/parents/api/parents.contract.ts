import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { ParentDetail, ParentListItem } from '../types';

/** Parents contract (§ Phase 2) — read views. Create/update are TBD backend contract. */
export const parentsContract = {
  list: endpoint<void, Paginated<ParentListItem>, ListQuery>({ method: 'GET', path: '/parents', auth: true, permission: 'parents.view' }),
  get: endpoint<void, ParentDetail>({ method: 'GET', path: '/parents/:parentId', auth: true, permission: 'parents.view' }),
} as const;
