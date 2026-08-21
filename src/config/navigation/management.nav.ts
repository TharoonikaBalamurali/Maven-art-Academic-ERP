import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileBarChart,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Megaphone,
  Receipt,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react';
import type { NavSection } from '@/shared/types';

/**
 * Management Portal navigation (§36).
 *
 * One configuration serves Admin, Accounts and Faculty. There is no per-role
 * navigation file: the sidebar is filtered by the permissions the backend
 * returned, so a role that gains a permission gains the menu entry with no code
 * change (§11, §36).
 */
export const MANAGEMENT_NAV: readonly NavSection[] = [
  {
    id: 'overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', to: '/management', icon: LayoutDashboard, end: true },
    ],
  },
  {
    id: 'academic',
    label: 'Academic',
    items: [
      { id: 'students', label: 'Students', to: '/management/students', icon: Users, anyOf: ['students.view'] },
      { id: 'parents', label: 'Parents', to: '/management/parents', icon: UsersRound, anyOf: ['parents.view'] },
      { id: 'faculty', label: 'Faculty', to: '/management/faculty', icon: GraduationCap, anyOf: ['faculty.view'] },
      { id: 'courses', label: 'Courses', to: '/management/courses', icon: BookOpen, anyOf: ['courses.view'] },
      { id: 'batches', label: 'Batches', to: '/management/batches', icon: Layers, anyOf: ['batches.view'] },
      { id: 'timetable', label: 'Timetable', to: '/management/timetable', icon: CalendarDays, anyOf: ['timetable.view'] },
      { id: 'attendance', label: 'Attendance', to: '/management/attendance', icon: ClipboardCheck, anyOf: ['attendance.view'] },
    ],
  },
  {
    id: 'admissions',
    label: 'Admissions',
    items: [
      { id: 'enquiries', label: 'Enquiries', to: '/management/enquiries', icon: FileText, anyOf: ['enquiries.view'] },
      { id: 'applications', label: 'Applications', to: '/management/applications', icon: ScrollText, anyOf: ['applications.view'] },
      { id: 'admissions', label: 'Admissions', to: '/management/admissions', icon: ClipboardCheck, anyOf: ['admissions.view'] },
      { id: 'enrollments', label: 'Enrollments', to: '/management/enrollments', icon: UserCog, anyOf: ['enrollments.view'] },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'fee-structures', label: 'Fee Structures', to: '/management/fee-structures', icon: Wallet, anyOf: ['fee_structures.view'] },
      { id: 'fee-assignments', label: 'Fee Assignments', to: '/management/fee-assignments', icon: Wallet, anyOf: ['fee_assignments.view'] },
      { id: 'installments', label: 'Installments', to: '/management/installments', icon: CalendarDays, anyOf: ['installments.view'] },
      { id: 'payments', label: 'Payments', to: '/management/payments', icon: CreditCard, anyOf: ['payments.view'] },
      { id: 'outstanding', label: 'Outstanding Fees', to: '/management/outstanding', icon: Wallet, anyOf: ['outstanding.view'] },
      { id: 'receipts', label: 'Receipts', to: '/management/receipts', icon: Receipt, anyOf: ['receipts.view'] },
    ],
  },
  {
    id: 'affairs',
    label: 'Student Affairs',
    items: [
      { id: 'discipline', label: 'Discipline', to: '/management/discipline', icon: ShieldAlert, anyOf: ['discipline.view'] },
      { id: 'leave', label: 'Leave / OD', to: '/management/leave', icon: CalendarDays, anyOf: ['leave.view', 'od.view'] },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    items: [
      { id: 'announcements', label: 'Announcements', to: '/management/announcements', icon: Megaphone, anyOf: ['announcements.view'] },
    ],
  },
  {
    id: 'records',
    label: 'Academic Records',
    items: [
      { id: 'progress', label: 'Academic Progress', to: '/management/progress', icon: FileBarChart, anyOf: ['progress.view'] },
      { id: 'certificates', label: 'Certificates', to: '/management/certificates', icon: Award, anyOf: ['certificates.view'] },
      { id: 'reports', label: 'Reports', to: '/management/reports', icon: FileBarChart, anyOf: ['reports.view'] },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    items: [
      { id: 'users', label: 'Users', to: '/management/users', icon: UserCog, anyOf: ['users.view'] },
      { id: 'roles', label: 'Roles & Permissions', to: '/management/roles', icon: ShieldCheck, anyOf: ['roles.view'] },
      { id: 'audit', label: 'Audit Logs', to: '/management/audit', icon: ScrollText, anyOf: ['audit.view'] },
      { id: 'settings', label: 'Settings', to: '/management/settings', icon: Settings, anyOf: ['settings.view'] },
    ],
  },
];
