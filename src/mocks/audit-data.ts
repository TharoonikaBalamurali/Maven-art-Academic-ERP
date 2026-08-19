import type { AuditDetail, AuditListItem } from '@/features/audit/types';
import type { ListQuery, Paginated } from '@/shared/types';

/** Audit log mock (§ administration). Recorded by the backend; read-only. In-memory for the session. */
interface AuditRecord {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  at: string;
  ip: string;
  details: string | null;
}

function buildStore(): AuditRecord[] {
  return [
    { id: 'aud-1201', actor: 'Devi Krishnan', actorRole: 'Accounts', action: 'payment.record', target: 'pay-903', at: '2026-08-19T10:24:00+05:30', ip: '10.4.2.18', details: 'Recorded ₹76,500 for Kabir Menon (card).' },
    { id: 'aud-1200', actor: 'Aarthi Ramesh', actorRole: 'Administrator', action: 'certificate.issue', target: 'cert-403', at: '2026-08-13T15:02:00+05:30', ip: '10.4.2.10', details: 'Issued merit certificate for Neha Krishnan.' },
    { id: 'aud-1199', actor: 'Aarthi Ramesh', actorRole: 'Administrator', action: 'application.approve', target: 'app-118', at: '2026-08-14T11:40:00+05:30', ip: '10.4.2.10', details: 'Approved application; admission adm-500 created.' },
    { id: 'aud-1198', actor: 'Suresh Iyer', actorRole: 'Faculty', action: 'attendance.mark', target: 'bat-bfa-1a', at: '2026-08-12T09:15:00+05:30', ip: '10.4.3.55', details: 'Marked attendance for BFA Year 1 · A.' },
    { id: 'aud-1197', actor: 'Aarthi Ramesh', actorRole: 'Administrator', action: 'user.invite', target: 'u-fac-3', at: '2026-08-10T16:30:00+05:30', ip: '10.4.2.10', details: 'Invited Rahul Deshpande (faculty).' },
    { id: 'aud-1196', actor: 'Devi Krishnan', actorRole: 'Accounts', action: 'fee_structure.update', target: 'fs-anim-2026', at: '2026-08-09T13:05:00+05:30', ip: '10.4.2.18', details: 'Updated Animation Year 1 fee structure (draft).' },
  ];
}

const store = buildStore();
function toListItem(r: AuditRecord): AuditListItem { return { id: r.id, actor: r.actor, action: r.action, target: r.target, at: r.at }; }
function toDetail(r: AuditRecord): AuditDetail { return { ...r }; }

export function listAudit(query: ListQuery): Paginated<AuditListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 20) || 20;
  const rows = store.map(toListItem).filter((r) => !search || r.actor.toLowerCase().includes(search) || r.action.toLowerCase().includes(search) || r.target.toLowerCase().includes(search));
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}
export function getAudit(id: string): AuditDetail | null { const r = store.find((x) => x.id === id); return r ? toDetail(r) : null; }
