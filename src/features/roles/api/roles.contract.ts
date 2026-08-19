import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { RoleDetail, RoleListItem } from '../types';

/** Roles contract (§ administration) — read views. Editing is roles.update (TBD backend contract). */
export const rolesContract = {
  list: endpoint<void, Paginated<RoleListItem>, ListQuery>({ method: 'GET', path: '/roles', auth: true, permission: 'roles.view' }),
  get: endpoint<void, RoleDetail>({ method: 'GET', path: '/roles/:roleId', auth: true, permission: 'roles.view' }),
} as const;
