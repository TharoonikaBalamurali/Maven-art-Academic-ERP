import { MANAGEMENT_NAV } from '@/config/navigation/management.nav';
import { AppShell } from '@/shared/layout/AppShell';

/**
 * Management Portal shell (§1, §9).
 *
 * Desktop-first: a persistent sidebar from `lg` up, a drawer below that (§33).
 */
export function ManagementLayout() {
  return (
    <AppShell
      portalLabel="Management"
      navSections={MANAGEMENT_NAV}
      collapsibleSidebar
    />
  );
}
