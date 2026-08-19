import type { Id, IsoDateString } from '@/shared/types';

/**
 * Audit log types (§ administration).
 *
 * The audit trail is RECORDED BY THE BACKEND (§12). This module is strictly
 * read-only — there is no client-side mutation of audit entries.
 */
export interface AuditListItem {
  id: Id;
  actor: string;
  action: string;
  target: string;
  at: IsoDateString;
}

export interface AuditDetail {
  id: Id;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  at: IsoDateString;
  ip: string;
  details: string | null;
}
