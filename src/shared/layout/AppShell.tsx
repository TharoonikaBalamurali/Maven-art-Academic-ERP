import { useEffect, useMemo, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useUiStore } from '@/app/state/ui.store';
import { filterNavSections } from '@/config/navigation/filter';
import { usePermissions } from '@/features/auth/hooks';
import { cn } from '@/lib/utils/cn';
import type { NavItem, NavSection } from '@/shared/types';
import { Drawer } from '@/shared/ui';
import { AppHeader } from './AppHeader';
import { Breadcrumbs } from './Breadcrumbs';
import { SidebarNav } from './SidebarNav';
import { useBreadcrumbs } from './useBreadcrumbs';

export interface AppShellProps {
  portalLabel: string;
  navSections: readonly NavSection[];
  /** Root path of this portal; also the breadcrumb home. */
  portalRoot: string;
  notificationsPath: string;
  profilePath?: string;
  /**
   * Items pinned to a bottom tab bar on small screens. Used by the
   * Student/Parent portal, where mobile is a first-class experience (§33).
   */
  bottomNavItems?: readonly NavItem[];
  /** Management is desktop-first: its sidebar is persistent from `lg` up (§33). */
  collapsibleSidebar?: boolean;
  children?: ReactNode;
}

/**
 * The shared application shell (§9).
 *
 * Both portals render the same structure — header, sidebar, main region — and
 * differ only by configuration. The navigation tree is filtered here against
 * the permission set the backend returned, so the layout contains no role
 * branching at all (§36, §37).
 */
export function AppShell({
  portalLabel,
  navSections,
  portalRoot,
  notificationsPath,
  profilePath,
  bottomNavItems,
  collapsibleSidebar = true,
  children,
}: AppShellProps) {
  const { permissionSet } = usePermissions();
  const location = useLocation();
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);

  const sections = useMemo(
    () => filterNavSections(navSections, permissionSet),
    [navSections, permissionSet],
  );

  const crumbs = useBreadcrumbs(sections, portalRoot);

  const bottomItems = useMemo(() => {
    if (!bottomNavItems) return [];
    return bottomNavItems.filter((item) =>
      (item.anyOf ?? []).length === 0 ? true : (item.anyOf ?? []).some((p) => permissionSet.has(p)),
    );
  }, [bottomNavItems, permissionSet]);

  // Close the mobile drawer whenever navigation happens.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, setMobileNavOpen]);

  const collapsed = collapsibleSidebar && sidebarCollapsed;

  return (
    <div className="min-h-dvh bg-[var(--surface)]">
      {/* Keyboard users can jump past the navigation. */}
      <a
        href="#main-content"
        className="sr-only rounded-control bg-[var(--accent)] px-3 py-2 text-body font-medium text-[var(--accent-contrast)] focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        Skip to main content
      </a>

      <AppHeader
        portalLabel={portalLabel}
        navSections={sections}
        notificationsPath={notificationsPath}
        profilePath={profilePath}
        showSidebarToggle={collapsibleSidebar}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />

      <div className="flex">
        <aside
          className={cn(
            'sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 overflow-y-auto',
            'border-r border-[var(--border)] bg-[var(--surface-raised)] lg:block',
            'transition-[width] duration-200',
            collapsed ? 'w-16' : 'w-60',
          )}
        >
          <SidebarNav sections={sections} collapsed={collapsed} />
        </aside>

        <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title={portalLabel}>
          <SidebarNav
            sections={sections}
            label="Mobile"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </Drawer>

        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'page-gutter min-w-0 flex-1 py-5',
            // Leave room for the bottom tab bar on mobile.
            bottomItems.length > 0 && 'pb-24 sm:pb-6',
          )}
        >
          <div className="mx-auto w-full max-w-(--container-content)">
            <Breadcrumbs crumbs={crumbs} />
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      {bottomItems.length > 0 && (
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface-raised)] pb-[env(safe-area-inset-bottom)] sm:hidden"
        >
          <ul className="flex">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="flex-1">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-14 flex-col items-center justify-center gap-0.5 text-caption',
                        isActive
                          ? 'font-medium text-[var(--accent)]'
                          : 'text-[var(--text-muted)]',
                      )
                    }
                  >
                    {Icon && <Icon className="size-5" aria-hidden="true" />}
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
