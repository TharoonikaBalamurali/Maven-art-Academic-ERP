import type { AuthenticatedIdentity, PermissionKey, Profile, Role, User } from '@/shared/types';

/**
 * Mock fixtures (Day 1 step 14).
 *
 * NOTE: none of this is security. Role → permission mapping is owned by the
 * backend RBAC tables (§2, §41). These fixtures exist only so the frontend can
 * be developed and demonstrated before the backend exists, and they are deleted
 * at integration time (§42).
 */

// §25: notifications are centralised — every role receives them; the backend
// decides which notifications each user actually gets.
const MANAGEMENT_COMMON: PermissionKey[] = ['reports.view', 'notifications.view'];

const ADMIN_PERMISSIONS: PermissionKey[] = [
  'students.view', 'students.create', 'students.update', 'students.delete', 'students.export',
  'parents.view', 'parents.create', 'parents.update',
  'faculty.view', 'faculty.create', 'faculty.update',
  'courses.view', 'courses.create', 'courses.update',
  'batches.view', 'batches.create', 'batches.update',
  'timetable.view', 'timetable.manage',
  'attendance.view', 'attendance.update',
  'enquiries.view', 'enquiries.create', 'enquiries.update',
  'applications.view', 'applications.review',
  'admissions.view', 'admissions.create', 'admissions.approve',
  'enrollments.view', 'enrollments.create',
  'fee_structures.view', 'fee_structures.create', 'fee_structures.update',
  'fee_assignments.view', 'fee_assignments.create',
  'installments.view', 'fees.view', 'payments.view', 'payments.export',
  'receipts.view', 'outstanding.view',
  'progress.view', 'certificates.view', 'certificates.issue',
  'reports.export',
  'users.view', 'users.create', 'users.update',
  'roles.view', 'roles.update',
  'audit.view', 'settings.view', 'settings.update',
];

const ACCOUNTS_PERMISSIONS: PermissionKey[] = [
  'students.view',
  'fee_structures.view', 'fee_structures.create', 'fee_structures.update',
  'fee_assignments.view', 'fee_assignments.create',
  'installments.view',
  'fees.view', 'fees.create',
  'payments.view', 'payments.create', 'payments.export',
  'receipts.view', 'outstanding.view',
  'reports.export',
];

const FACULTY_PERMISSIONS: PermissionKey[] = [
  'students.view',
  'courses.view', 'batches.view', 'timetable.view',
  'attendance.view', 'attendance.mark', 'attendance.update',
  'progress.view', 'progress.update',
];

const STUDENT_PERMISSIONS: PermissionKey[] = [
  'portal.dashboard.view', 'portal.profile.view', 'portal.academic.view',
  'portal.timetable.view', 'portal.attendance.view', 'portal.progress.view',
  'portal.fees.view', 'portal.payments.view', 'portal.certificates.view',
  'notifications.view',
];

const PARENT_PERMISSIONS: PermissionKey[] = [...STUDENT_PERMISSIONS, 'portal.children.view'];

export const MOCK_PERMISSIONS_BY_ROLE: Record<Role, readonly PermissionKey[]> = {
  admin: [...MANAGEMENT_COMMON, ...ADMIN_PERMISSIONS],
  accounts: [...MANAGEMENT_COMMON, ...ACCOUNTS_PERMISSIONS],
  faculty: [...MANAGEMENT_COMMON, ...FACULTY_PERMISSIONS],
  student: STUDENT_PERMISSIONS,
  parent: PARENT_PERMISSIONS,
};

interface MockAccount {
  password: string;
  identity: AuthenticatedIdentity;
}

function makeUser(id: string, email: string): User {
  return { id, email, status: 'active', createdAt: '2026-01-05T09:00:00.000Z' };
}

function makeProfile(id: string, userId: string, fullName: string, phone: string | null): Profile {
  return {
    id,
    userId,
    fullName,
    displayName: fullName.split(' ')[0] ?? fullName,
    avatarUrl: null,
    phone,
  };
}

function account(
  id: string,
  email: string,
  fullName: string,
  role: Role,
  phone: string | null = null,
): MockAccount {
  return {
    // Shared demo password. Mock only — never a production credential.
    password: 'password',
    identity: {
      user: makeUser(id, email),
      profile: makeProfile(`profile-${id}`, id, fullName, phone),
      role,
      permissions: MOCK_PERMISSIONS_BY_ROLE[role],
    },
  };
}

export const MOCK_ACCOUNTS: readonly MockAccount[] = [
  account('u-admin', 'admin@mavenart.test', 'Aarthi Ramesh', 'admin', '+91 90000 00001'),
  account('u-accounts', 'accounts@mavenart.test', 'Devi Krishnan', 'accounts', '+91 90000 00002'),
  account('u-faculty', 'faculty@mavenart.test', 'Suresh Iyer', 'faculty', '+91 90000 00003'),
  account('u-student', 'student@mavenart.test', 'Nithya Balan', 'student', '+91 90000 00004'),
  account('u-parent', 'parent@mavenart.test', 'Balan Muthu', 'parent', '+91 90000 00005'),
];

export function findAccount(email: string): MockAccount | undefined {
  const normalized = email.trim().toLowerCase();
  return MOCK_ACCOUNTS.find((entry) => entry.identity.user.email === normalized);
}

export function findAccountByUserId(userId: string): MockAccount | undefined {
  return MOCK_ACCOUNTS.find((entry) => entry.identity.user.id === userId);
}

export interface MockNotification {
  id: string;
  category: 'attendance' | 'fees' | 'academic' | 'admission' | 'system';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

/** Notifications (§25) are the read-oriented resource used to exercise the
 *  list/table/pagination/data-state architecture. Believable per-category copy,
 *  not placeholder text — the interface should read like a functioning ERP. */
const NOTIFICATION_TEMPLATES: Record<MockNotification['category'], readonly [string, string][]> = {
  attendance: [
    ['Attendance submitted', 'Life Drawing attendance for BFA Year 1 · A has been recorded.'],
    ['Low attendance alert', 'Three students in VCD Year 1 · A are below 75% this month.'],
    ['Attendance pending', 'Colour Theory (BFA Year 2 · A) attendance is awaiting submission.'],
  ],
  fees: [
    ['Payment received', 'A fee payment of ₹45,000 was recorded against MAA20260002.'],
    ['Installment due soon', 'An installment of ₹45,000 for Farhan Sheikh is due on 25 Aug 2026.'],
    ['Outstanding balance', 'Second-term fees for Sculpture Year 1 · A remain partly unpaid.'],
  ],
  academic: [
    ['Progress updated', 'Assessment scores for Typography have been published.'],
    ['New assessment scheduled', 'A portfolio review for BFA Year 2 · A is set for next week.'],
    ['Grades released', 'Term 1 grades for Animation Year 1 · A are now available.'],
  ],
  admission: [
    ['New enquiry received', 'Ishita Malhotra enquired about the Bachelor of Fine Arts programme.'],
    ['Application under review', "Dev Patel's application for Animation is ready for review."],
    ['Admission confirmed', 'Neha Krishnan has been admitted to the Bachelor of Fine Arts.'],
  ],
  system: [
    ['Scheduled maintenance', 'The portal will be briefly unavailable on Sunday at 02:00.'],
    ['Timetable published', 'The timetable for the new term has been published.'],
    ['Profile reminder', 'Please review your contact details in your profile.'],
  ],
};

export const MOCK_NOTIFICATIONS: readonly MockNotification[] = Array.from({ length: 47 }, (_, index) => {
  const categories: MockNotification['category'][] = ['attendance', 'fees', 'academic', 'admission', 'system'];
  const category = categories[index % categories.length] ?? 'system';
  const templates = NOTIFICATION_TEMPLATES[category];
  const [title, body] = templates[index % templates.length]!;
  const day = String((index % 28) + 1).padStart(2, '0');
  return {
    id: `ntf-${String(index + 1).padStart(3, '0')}`,
    category,
    title,
    body,
    read: index % 3 === 0,
    createdAt: `2026-07-${day}T08:${String(index % 60).padStart(2, '0')}:00.000Z`,
  };
});
