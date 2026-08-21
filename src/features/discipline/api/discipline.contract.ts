import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { DisciplineDetail, DisciplineListItem } from '../types';

/**
 * Discipline contract (§ student affairs) — read views. Case creation and
 * resolution are backend-owned; the keys exist so the UI can be gated now.
 *
 * TBD — BACKEND CONTRACT: provisional paths; create/update pending.
 */
export const disciplineContract = {
  list: endpoint<void, Paginated<DisciplineListItem>, ListQuery>({
    method: 'GET', path: '/discipline', auth: true, permission: 'discipline.view',
  }),
  get: endpoint<void, DisciplineDetail>({
    method: 'GET', path: '/discipline/:caseId', auth: true, permission: 'discipline.view',
  }),
} as const;
