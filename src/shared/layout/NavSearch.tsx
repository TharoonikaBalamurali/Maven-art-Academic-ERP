import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search } from 'lucide-react';
import { filterNavSections } from '@/config/navigation/filter';
import { usePermissions } from '@/features/auth/hooks';
import { cn } from '@/lib/utils/cn';
import type { NavItem, NavSection } from '@/shared/types';
import { Modal } from '@/shared/ui';

/**
 * The Search element of the global header layout (§9).
 *
 * Scope decision: this searches the **navigation** the current user is
 * permitted to reach — a module jumper. It deliberately does NOT search
 * institutional records (students, payments, enquiries), because record search
 * is server-side (§31) and no search endpoint exists yet.
 *
 * TBD — BACKEND CONTRACT: when a global search endpoint is defined, add a
 * "Records" group to these results backed by a service call. The trigger, the
 * dialog and the keyboard handling below are reusable as they are.
 */
interface Match {
  item: NavItem;
  sectionLabel?: string;
}

function flatten(sections: readonly NavSection[]): Match[] {
  const out: Match[] = [];
  const walk = (items: readonly NavItem[], sectionLabel?: string) => {
    for (const item of items) {
      if (item.children?.length) walk(item.children, sectionLabel);
      else out.push({ item, sectionLabel });
    }
  };
  for (const section of sections) walk(section.items, section.label);
  return out;
}

export function NavSearch({ navSections }: { navSections: readonly NavSection[] }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { permissionSet } = usePermissions();

  // Only destinations this user may actually reach are searchable.
  const entries = useMemo(
    () => flatten(filterNavSections(navSections, permissionSet)),
    [navSections, permissionSet],
  );

  const results = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return entries.slice(0, 8);
    return entries
      .filter((entry) => entry.item.label.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [entries, term]);

  // Derived, not synchronised: results shrink as the term narrows, so the
  // highlight is clamped during render rather than corrected by an effect.
  const activeIndex = Math.min(highlight, Math.max(results.length - 1, 0));

  // Ctrl/Cmd+K is the conventional shortcut for this control.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Focus follows the dialog opening; the dialog element itself is what we are
  // synchronising with, which is exactly what an effect is for.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  function close() {
    setOpen(false);
    setTerm('');
    setHighlight(0);
  }

  function go(match: Match | undefined) {
    if (!match) return;
    close();
    navigate(match.item.to);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          // 44px keeps the collapsed icon-only form a comfortable touch target.
          'inline-flex min-h-11 items-center gap-2 rounded-control border border-[var(--border)]',
          'bg-[var(--surface-sunken)] px-2.5 text-body-sm text-[var(--text-subtle)]',
          'transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-muted)]',
          'md:w-64',
        )}
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden md:inline">Search modules…</span>
        <span className="sr-only md:hidden">Search modules</span>
        <kbd className="ml-auto hidden rounded border border-[var(--border)] px-1 font-sans text-caption md:inline">
          Ctrl K
        </kbd>
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Search"
        description="Jump to any module you have access to."
        size="md"
      >
        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="search"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setHighlight(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setHighlight(Math.min(activeIndex + 1, results.length - 1));
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setHighlight(Math.max(activeIndex - 1, 0));
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                go(results[activeIndex]);
              }
            }}
            placeholder="Search modules…"
            aria-label="Search modules"
            aria-controls="nav-search-results"
            className={cn(
              'w-full rounded-control border border-[var(--border)] bg-[var(--surface-raised)]',
              'min-h-11 px-3 text-body text-[var(--text)] placeholder:text-[var(--text-subtle)]',
            )}
          />

          {results.length === 0 ? (
            <p className="px-1 py-6 text-center text-body text-[var(--text-muted)]">
              No modules match “{term}”.
            </p>
          ) : (
            <ul id="nav-search-results" className="flex flex-col gap-0.5">
              {results.map((match, index) => {
                const Icon = match.item.icon;
                return (
                  <li key={match.item.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => go(match)}
                      className={cn(
                        'flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-left text-body',
                        index === activeIndex
                          ? 'bg-[var(--accent-surface)] text-[var(--accent)]'
                          : 'text-[var(--text)] hover:bg-[var(--surface-hover)]',
                      )}
                    >
                      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                      <span className="truncate">{match.item.label}</span>
                      {match.sectionLabel && (
                        <span className="ml-auto shrink-0 text-caption text-[var(--text-subtle)]">
                          {match.sectionLabel}
                        </span>
                      )}
                      {index === activeIndex && (
                        <CornerDownLeft className="size-3.5 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
}
