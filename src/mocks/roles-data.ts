import type { PermissionGroup, RoleDetail, RoleListItem } from '@/features/roles/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Roles mock (§ administration).
 *
 * The role → permission mapping the backend enforces (§12). Grouped by domain
 * for display. In-memory for the session.
 */
interface RoleRecord {
  id: string;
  name: string;
  description: string;
  userCount: number;
  groups: PermissionGroup[];
}

function buildStore(): RoleRecord[] {
  return [
    {
      id: 'admin', name: 'Administrator', description: 'Full management access across every module.', userCount: 1,
      groups: [
        { domain: 'Academics', permissions: ['students.*', 'faculty.*', 'courses.*', 'batches.*', 'timetable.*', 'attendance.*'] },
        { domain: 'Admissions', permissions: ['enquiries.*', 'applications.review', 'admissions.approve', 'enrollments.create'] },
        { domain: 'Finance', permissions: ['fee_structures.*', 'fee_assignments.*', 'installments.view', 'payments.view', 'outstanding.view'] },
        { domain: 'Records', permissions: ['progress.view', 'certificates.issue', 'reports.export'] },
        { domain: 'Administration', permissions: ['users.*', 'roles.update', 'audit.view', 'settings.update'] },
      ],
    },
    {
      id: 'accounts', name: 'Accounts', description: 'Finance operations: fees, payments and receipts.', userCount: 2,
      groups: [
        { domain: 'Academics', permissions: ['students.view'] },
        { domain: 'Finance', permissions: ['fee_structures.*', 'fee_assignments.*', 'installments.view', 'payments.create', 'receipts.view', 'outstanding.view'] },
        { domain: 'Records', permissions: ['reports.export'] },
      ],
    },
    {
      id: 'faculty', name: 'Faculty', description: 'Teaching: assigned batches, attendance and progress.', userCount: 3,
      groups: [
        { domain: 'Academics', permissions: ['students.view', 'courses.view', 'batches.view', 'timetable.view', 'attendance.mark'] },
        { domain: 'Records', permissions: ['progress.update', 'reports.view'] },
      ],
    },
    {
      id: 'student', name: 'Student', description: 'Student portal access to their own records.', userCount: 0,
      groups: [{ domain: 'Portal', permissions: ['portal.dashboard.view', 'portal.academic.view', 'portal.fees.view', 'portal.certificates.view'] }],
    },
    {
      id: 'parent', name: 'Parent', description: 'Parent portal access to linked children only (§8).', userCount: 0,
      groups: [{ domain: 'Portal', permissions: ['portal.children.view', 'portal.progress.view', 'portal.fees.view'] }],
    },
  ];
}

const store = buildStore();
function toListItem(r: RoleRecord): RoleListItem {
  return { id: r.id, name: r.name, description: r.description, userCount: r.userCount, permissionCount: r.groups.reduce((n, g) => n + g.permissions.length, 0) };
}
function toDetail(r: RoleRecord): RoleDetail { return { id: r.id, name: r.name, description: r.description, userCount: r.userCount, groups: r.groups.map((g) => ({ ...g, permissions: [...g.permissions] })) }; }

export function listRoles(query: ListQuery): Paginated<RoleListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const rows = store.map(toListItem).filter((r) => !search || r.name.toLowerCase().includes(search));
  const total = rows.length;
  return { data: rows, page: 1, limit: Math.max(total, 1), total, totalPages: 1 };
}
export function getRole(id: string): RoleDetail | null { const r = store.find((x) => x.id === id); return r ? toDetail(r) : null; }
