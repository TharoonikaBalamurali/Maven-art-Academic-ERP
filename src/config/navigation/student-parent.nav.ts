import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileBarChart,
  LayoutDashboard,
  User,
  UsersRound,
  Wallet,
} from 'lucide-react';
import type { NavSection } from '@/shared/types';

/**
 * Student / Parent Portal navigation (§37).
 *
 * Students and parents share this configuration. "My Children" carries the
 * `portal.children.view` permission, which the backend grants only to parents —
 * so the difference between the two experiences needs no role check (§8, §37).
 */
export const STUDENT_PARENT_NAV: readonly NavSection[] = [
  {
    id: 'overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', to: '/portal', icon: LayoutDashboard, end: true, anyOf: ['portal.dashboard.view'] },
      { id: 'children', label: 'My Children', to: '/portal/children', icon: UsersRound, anyOf: ['portal.children.view'] },
    ],
  },
  {
    id: 'academic',
    label: 'Academic',
    items: [
      { id: 'course', label: 'Course', to: '/portal/course', icon: BookOpen, anyOf: ['portal.academic.view'] },
      { id: 'timetable', label: 'Timetable', to: '/portal/timetable', icon: CalendarDays, anyOf: ['portal.timetable.view'] },
      { id: 'attendance', label: 'Attendance', to: '/portal/attendance', icon: ClipboardCheck, anyOf: ['portal.attendance.view'] },
      { id: 'progress', label: 'Progress', to: '/portal/progress', icon: FileBarChart, anyOf: ['portal.progress.view'] },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { id: 'fees', label: 'Fees', to: '/portal/fees', icon: Wallet, anyOf: ['portal.fees.view'] },
      { id: 'payments', label: 'Payments', to: '/portal/payments', icon: CreditCard, anyOf: ['portal.payments.view'] },
    ],
  },
  {
    id: 'personal',
    items: [
      { id: 'certificates', label: 'Certificates', to: '/portal/certificates', icon: Award, anyOf: ['portal.certificates.view'] },
      { id: 'notifications', label: 'Notifications', to: '/portal/notifications', icon: Bell, anyOf: ['notifications.view'] },
      { id: 'profile', label: 'Profile', to: '/portal/profile', icon: User, anyOf: ['portal.profile.view'] },
    ],
  },
];
