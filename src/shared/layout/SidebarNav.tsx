import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import type { NavSection } from '@/shared/types';

export interface SidebarNavProps {
  sections: readonly NavSection[];
  collapsed?: boolean;
  onNavigate?: () => void;
  /**
   * Accessible name for this navigation landmark. The sidebar and the mobile
   * drawer render the same tree, so they must not both be called "Main" —
   * duplicated landmark names make landmark navigation ambiguous.
   */
  label?: string;
}

/**
 * Renders an already-filtered navigation tree.
 *
 * Filtering happens in `filterNavSections`, not here — this component has no
 * opinion about permissions, which is what makes it usable by both portals.
 *
 * Active state is conveyed three ways (colour, weight and a left rule) so it
 * does not depend on colour perception alone.
 */
export function SidebarNav({
  sections,
  collapsed = false,
  onNavigate,
  label = 'Main',
}: SidebarNavProps) {
  return (
    <nav aria-label={label} className="flex flex-col gap-5 px-2 py-3">
      {sections.map((section) => (
        <div key={section.id}>
          {section.label && (
            <h2
              className={cn(
                'px-3 pb-1.5 text-caption font-semibold tracking-wider text-[var(--text-subtle)] uppercase',
                // When collapsed the label would not fit; a rule keeps the
                // grouping visible without text.
                collapsed && 'sr-only',
              )}
            >
              {section.label}
            </h2>
          )}
          {section.label && collapsed && (
            <div aria-hidden="true" className="mx-3 mb-1.5 border-t border-[var(--border)]" />
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
                        'group relative flex min-h-10 items-center gap-3 rounded-control px-3',
                        'text-body transition-colors duration-150',
                        collapsed && 'justify-center px-0',
                        isActive
                          ? 'bg-[var(--accent-surface)] font-medium text-[var(--accent)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-[var(--accent)]"
                          />
                        )}
                        {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                        <span className={cn('truncate', collapsed && 'sr-only')}>{item.label}</span>
                      </>
                    )}
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
