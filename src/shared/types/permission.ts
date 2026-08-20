/**
 * Central permission catalogue.
 *
 * TBD — BACKEND CONTRACT: the authoritative permission list is owned by the
 * backend RBAC tables. This catalogue mirrors the conceptual permissions in
 * specification §11 and the modules listed in §3.1, §5, §6 and §36 so the
 * frontend can build navigation and guards before the backend exists.
 *
 * Runtime checks never rely on this union being exhaustive: `PermissionKey`
 * also accepts unknown strings, so a backend that adds a permission does not
 * require a frontend release.
 */
import type { KnownOr } from './common';

export const PERMISSIONS = [
  // Academic
  'students.view',
  'students.create',
  'students.update',
  'students.delete',
  'students.export',
  'parents.view',
  'parents.create',
  'parents.update',
  'faculty.view',
  'faculty.create',
  'faculty.update',
  'courses.view',
  'courses.create',
  'courses.update',
  'batches.view',
  'batches.create',
  'batches.update',
  'timetable.view',
  'timetable.manage',
  'attendance.view',
  'attendance.mark',
  'attendance.update',

  // Admissions
  'enquiries.view',
  'enquiries.create',
  'enquiries.update',
  'applications.view',
  'applications.review',
  'admissions.view',
  'admissions.create',
  'admissions.approve',
  'enrollments.view',
  'enrollments.create',

  // Finance
  'fee_structures.view',
  'fee_structures.create',
  'fee_structures.update',
  'fee_assignments.view',
  'fee_assignments.create',
  'installments.view',
  'fees.view',
  'fees.create',
  'payments.view',
  'payments.create',
  'payments.export',
  'receipts.view',
  'outstanding.view',

  // Academic records
  'progress.view',
  'progress.update',
  'certificates.view',
  'certificates.issue',
  'reports.view',
  'reports.export',

  // Student affairs — confidential; summary counts only on dashboards (§31).
  // TBD — BACKEND CONTRACT: the detail modules are pending; these keys exist so
  // the Admin overview can be permission-gated from the start.
  'discipline.view',
  'discipline.create',
  'discipline.update',
  'leave.view',
  'leave.approve',
  'od.view',
  'od.approve',

  // Communication
  'announcements.view',
  'announcements.create',

  // Administration
  'users.view',
  'users.create',
  'users.update',
  'roles.view',
  'roles.update',
  'audit.view',
  'settings.view',
  'settings.update',

  // Cross-portal: notifications are centralised for every role (§25).
  'notifications.view',

  // Student / Parent portal
  'portal.dashboard.view',
  'portal.profile.view',
  'portal.academic.view',
  'portal.timetable.view',
  'portal.attendance.view',
  'portal.progress.view',
  'portal.fees.view',
  'portal.payments.view',
  'portal.certificates.view',
  'portal.children.view',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** A permission as it arrives from the backend — it may not be in our catalogue yet. */
export type PermissionKey = KnownOr<Permission>;

const PERMISSION_SET: ReadonlySet<string> = new Set(PERMISSIONS);

export function isKnownPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value);
}
