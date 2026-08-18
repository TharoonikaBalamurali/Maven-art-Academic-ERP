import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Monitor, Moon, PanelLeft, Sun, User } from 'lucide-react';
import { env } from '@/config/env';
import { useUiStore } from '@/app/state/ui.store';
import { useAuthActions, useCurrentIdentity } from '@/features/auth/hooks';
import { Button, Dropdown, DropdownItem } from '@/shared/ui';

export interface AppHeaderProps {
  /** Shown next to the product name, e.g. "Management". */
  portalLabel: string;
  notificationsPath?: string;
  /** Omitted when the portal has no profile page yet. */
  profilePath?: string;
  showSidebarToggle?: boolean;
  onOpenMobileNav: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  accounts: 'Accounts',
  faculty: 'Faculty',
  student: 'Student',
  parent: 'Parent',
};

/** Global header (§9): logo, portal label, notifications and profile menu. */
export function AppHeader({
  portalLabel,
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

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-raised)] px-3">
      <Button
        variant="ghost"
        className="px-2 lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>

      {showSidebarToggle && (
        <Button
          variant="ghost"
          className="hidden px-2 lg:inline-flex"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="size-5" aria-hidden="true" />
        </Button>
      )}

      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-semibold">{env.appName}</span>
        <span className="hidden rounded bg-[var(--surface-sunken)] px-1.5 py-0.5 text-xs text-[var(--text-muted)] sm:inline">
          {portalLabel}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {notificationsPath && (
          <Button
            variant="ghost"
            className="px-2"
            onClick={() => navigate(notificationsPath)}
            aria-label="Notifications"
          >
            <Bell className="size-5" aria-hidden="true" />
          </Button>
        )}

        <Dropdown
          triggerLabel="Account menu"
          trigger={
            <>
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-full bg-[var(--surface-sunken)] text-xs font-semibold"
              >
                {identity.profile.displayName.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-sm sm:inline">{identity.profile.displayName}</span>
            </>
          }
        >
          <>
            <div className="border-b border-[var(--border)] px-3 py-2">
              <p className="truncate text-sm font-medium">{identity.profile.fullName}</p>
              <p className="truncate text-xs text-[var(--text-muted)]">{identity.user.email}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {ROLE_LABELS[identity.role] ?? identity.role}
              </p>
            </div>

            <div className="border-b border-[var(--border)] py-1">
              <p className="px-3 pb-1 text-xs text-[var(--text-muted)]">Theme</p>
              <DropdownItem onSelect={() => setTheme('light')}>
                <Sun className="size-4" aria-hidden="true" />
                Light {theme === 'light' && <span className="ml-auto text-xs">Selected</span>}
              </DropdownItem>
              <DropdownItem onSelect={() => setTheme('dark')}>
                <Moon className="size-4" aria-hidden="true" />
                Dark {theme === 'dark' && <span className="ml-auto text-xs">Selected</span>}
              </DropdownItem>
              <DropdownItem onSelect={() => setTheme('system')}>
                <Monitor className="size-4" aria-hidden="true" />
                System {theme === 'system' && <span className="ml-auto text-xs">Selected</span>}
              </DropdownItem>
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
    </header>
  );
}
