import type { UserDetail, UserListItem, UserStatus } from '@/features/users/types';
import type { ListQuery, Paginated, Role } from '@/shared/types';

/** Users mock (§ administration). In-memory for the session. */
interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string | null;
  lastActiveAt: string | null;
}

function buildStore(): UserRecord[] {
  return [
    { id: 'u-admin', name: 'Aarthi Ramesh', email: 'admin@mavenart.test', phone: '+91 90000 00001', role: 'admin', status: 'active', createdAt: '2025-01-05', lastActiveAt: '2026-08-19' },
    { id: 'u-accounts', name: 'Devi Krishnan', email: 'accounts@mavenart.test', phone: '+91 90000 00002', role: 'accounts', status: 'active', createdAt: '2025-01-06', lastActiveAt: '2026-08-18' },
    { id: 'u-faculty', name: 'Suresh Iyer', email: 'faculty@mavenart.test', phone: '+91 90000 00003', role: 'faculty', status: 'active', createdAt: '2025-02-01', lastActiveAt: '2026-08-19' },
    { id: 'u-fac-2', name: 'Meera Nair', email: 'meera.nair@mavenart.test', phone: '+91 90000 00010', role: 'faculty', status: 'active', createdAt: '2025-06-15', lastActiveAt: '2026-08-17' },
    { id: 'u-fac-3', name: 'Rahul Deshpande', email: 'rahul.deshpande@mavenart.test', phone: null, role: 'faculty', status: 'invited', createdAt: '2026-08-10', lastActiveAt: null },
    { id: 'u-acc-2', name: 'Priya Venkatesh', email: 'priya.venkatesh@mavenart.test', phone: '+91 90000 00011', role: 'accounts', status: 'suspended', createdAt: '2025-03-20', lastActiveAt: '2026-05-30' },
  ];
}

const store = buildStore();
function toListItem(r: UserRecord): UserListItem { return { id: r.id, name: r.name, email: r.email, role: r.role, status: r.status }; }
function toDetail(r: UserRecord): UserDetail { return { id: r.id, name: r.name, email: r.email, phone: r.phone, role: r.role, status: r.status, createdAt: r.createdAt, lastActiveAt: r.lastActiveAt }; }

export function listUsers(query: ListQuery): Paginated<UserListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const role = String(query.filters?.role ?? '');
  const status = String(query.filters?.status ?? '');
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;
  const rows = store.map(toListItem).filter((r) => {
    if (search && !r.name.toLowerCase().includes(search) && !r.email.toLowerCase().includes(search)) return false;
    if (role && r.role !== role) return false;
    if (status && r.status !== status) return false;
    return true;
  });
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}
export function getUser(id: string): UserDetail | null { const r = store.find((u) => u.id === id); return r ? toDetail(r) : null; }
