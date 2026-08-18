import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import type { NavSection } from '@/shared/types';

export interface SidebarNavProps {
  sections: readonly NavSection[];
  collapsed?: boolean;
  onNavigate?: () => void;
}

/**
 * Renders an already-filtered navigation tree.
 *
 * Filtering happens in `filterNavSections`, not here — this component has no
 * opinion about permissions, which keeps it usable for both portals.
 */
export function SidebarNav({ sections, collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-4 p-3">
      {sections.map((section) => (
        <div key={section.id}>
          {section.label && !collapsed && (
            <h2 className="px-3 pb-1 text-[0.6875rem] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              {section.label}
            </h2>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors',
                        collapsed && 'justify-center px-2',
                        isActive
                          ? 'bg-[var(--surface-sunken)] font-medium text-[var(--accent)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text)]',
                      )
                    }
                  >
                    {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                    <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
