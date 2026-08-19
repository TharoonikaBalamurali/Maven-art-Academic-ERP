import type { Id, IsoDateString, KnownOr } from '@/shared/types';
import type { Role } from '@/shared/types';

/**
 * User account types (§ administration).
 *
 * Accounts and their role. The role → permission mapping is owned by the
 * backend and shown through the Roles module. Create/update are gated by the
 * backend (`users.create`/`users.update`).
 *
 * TBD — BACKEND CONTRACT: status names and the create/update payloads are provisional.
 */
export type UserStatus = KnownOr<'active' | 'invited' | 'suspended'>;

export const USER_STATUS_LABEL: Record<string, string> = { active: 'Active', invited: 'Invited', suspended: 'Suspended' };
export const ROLE_LABEL: Record<string, string> = { admin: 'Administrator', accounts: 'Accounts', faculty: 'Faculty', student: 'Student', parent: 'Parent' };

export interface UserListItem {
  id: Id;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
}

export interface UserDetail {
  id: Id;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  createdAt: IsoDateString | null;
  lastActiveAt: IsoDateString | null;
}
