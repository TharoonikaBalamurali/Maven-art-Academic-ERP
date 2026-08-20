import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Monitor, Moon, PanelLeft, Sun, User } from 'lucide-react';
import { useUiStore } from '@/app/state/ui.store';
import { useAuthActions, useCurrentIdentity } from '@/features/auth/hooks';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import type { NavSection, Role } from '@/shared/types';
import { Button, Dropdown, DropdownItem } from '@/shared/ui';
import { BrandMark } from './BrandMark';
import { NavSearch } from './NavSearch';

export interface AppHeaderProps {
  /** Contextual portal identity shown beside the product name. */
  portalLabel: string;
  /** Searchable navigation for this portal (§9 header search). */
  navSections: readonly NavSection[];
  notificationsPath: string;
  /** Omitted when the portal has no profile page. */
  profilePath?: string;
  showSidebarToggle?: boolean;
  onOpenMobileNav: () => void;
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  accounts: 'Accounts',
  faculty: 'Faculty',
  student: 'Student',
  parent: 'Parent',
};

/**
 * Global header (§9): Logo · Search · Notification · Profile.
 *
 * Both portals render this same header — the specification requires "a
 * consistent layout system" across the two applications — differing only by
 * the props above.
 */
export function AppHeader({
  portalLabel,
  navSections,
  notificationsPath,
  profilePath,
  showSidebarToggle = true,
  onOpenMobileNav,
}: AppHeaderProps) {
  const identity = useCurrentIdentity();
  const { logout } = useAuthActions();
  const navigate = useNavigate();
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const initials = identity.profile.fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface-raised)]">
      <div className="flex h-16 items-center gap-2 px-4 sm:px-5">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>

        {showSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="size-5" aria-hidden="true" />
          </Button>
        )}

        {/* Identity lives in the sidebar on desktop, so the header does not
            repeat it and can give its width to search instead. */}
        <BrandMark portalLabel={portalLabel} className="lg:hidden" />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <NavSearch navSections={navSections} />

          {/* §25: notifications are centralised, so both portals expose the bell. */}
          <PermissionGuard permission="notifications.view">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(notificationsPath)}
              aria-label="Notifications"
            >
              <Bell className="size-5" aria-hidden="true" />
            </Button>
          </PermissionGuard>

          <Dropdown
            triggerLabel="Account menu"
            trigger={
              <>
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-surface)] text-caption font-semibold text-[var(--accent)]"
                >
                  {initials}
                </span>
                <span className="hidden max-w-32 truncate text-body sm:inline">
                  {identity.profile.displayName}
                </span>
              </>
            }
          >
            <>
              <div className="border-b border-[var(--border)] px-3 py-2">
                <p className="truncate text-body font-medium">{identity.profile.fullName}</p>
                <p className="truncate text-body-sm text-[var(--text-muted)]">
                  {identity.user.email}
                </p>
                <p className="mt-1 text-caption text-[var(--text-subtle)]">
                  {ROLE_LABELS[identity.role]}
                </p>
              </div>

              <div role="group" aria-label="Theme" className="border-b border-[var(--border)] py-1">
                <p className="px-3 pb-1 text-caption text-[var(--text-subtle)]">Theme</p>
                {(
                  [
                    ['light', 'Light', Sun],
                    ['dark', 'Dark', Moon],
                    ['system', 'System', Monitor],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <DropdownItem key={value} keepOpen onSelect={() => setTheme(value)}>
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                    {theme === value && (
                      <span className="ml-auto text-caption text-[var(--accent)]">Selected</span>
                    )}
                  </DropdownItem>
                ))}
              </div>

              {profilePath && (
                <DropdownItem onSelect={() => navigate(profilePath)}>
                  <User className="size-4" aria-hidden="true" />
                  Profile
                </DropdownItem>
              )}
              <DropdownItem destructive onSelect={() => void handleLogout()}>
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </DropdownItem>
            </>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
