import { Bell, CalendarDays, LayoutDashboard, User, Wallet } from 'lucide-react';
import { STUDENT_PARENT_NAV } from '@/config/navigation/student-parent.nav';
import { AppShell } from '@/shared/layout/AppShell';
import type { NavItem } from '@/shared/types';

/**
 * Mobile tab bar for the Student/Parent portal.
 *
 * Mobile is a first-class experience here (§33), so the most-used destinations
 * are reachable with one thumb instead of through the drawer.
 */
const BOTTOM_NAV: readonly NavItem[] = [
  { id: 'dashboard', label: 'Home', to: '/portal', icon: LayoutDashboard, end: true, anyOf: ['portal.dashboard.view'] },
  { id: 'timetable', label: 'Timetable', to: '/portal/timetable', icon: CalendarDays, anyOf: ['portal.timetable.view'] },
  { id: 'fees', label: 'Fees', to: '/portal/fees', icon: Wallet, anyOf: ['portal.fees.view'] },
  { id: 'notifications', label: 'Alerts', to: '/portal/notifications', icon: Bell, anyOf: ['portal.notifications.view'] },
  { id: 'profile', label: 'Profile', to: '/portal/profile', icon: User, anyOf: ['portal.profile.view'] },
];

/** Student / Parent Portal shell (§1, §9, §37). */
export function StudentParentLayout() {
  return (
    <AppShell
      portalLabel="Student & Parent"
      navSections={STUDENT_PARENT_NAV}
      notificationsPath="/portal/notifications"
      profilePath="/portal/profile"
      bottomNavItems={BOTTOM_NAV}
      collapsibleSidebar={false}
    />
  );
}
