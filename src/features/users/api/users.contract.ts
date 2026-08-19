import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { UserDetail, UserListItem } from '../types';

/** Users contract (§ administration) — read views. Create/update are TBD backend contract. */
export const usersContract = {
  list: endpoint<void, Paginated<UserListItem>, ListQuery>({ method: 'GET', path: '/users', auth: true, permission: 'users.view' }),
  get: endpoint<void, UserDetail>({ method: 'GET', path: '/users/:userId', auth: true, permission: 'users.view' }),
} as const;
