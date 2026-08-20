import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Loader2, Search } from 'lucide-react';
import { filterNavSections } from '@/config/navigation/filter';
import { usePermissions } from '@/features/auth/hooks';
import { useSearch } from '@/features/search/hooks/useSearch';
import { SEARCH_KIND_LABEL, type SearchResult } from '@/features/search/types';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { cn } from '@/lib/utils/cn';
import type { NavItem, NavSection } from '@/shared/types';
import { Badge, Modal } from '@/shared/ui';

/**
 * Global search (§9, § search).
 *
 * A command palette over two groups: **records** the caller may read (students,
 * faculty, courses, batches — matched server-side, §31) and the **modules** they
 * can reach. Student rows carry the identifiers an administrator actually
 * searches by — admission number, roll number, register number — so a record is
 * found without walking through modules.
 */
interface ModuleMatch {
  item: NavItem;
  sectionLabel?: string;
}

function flatten(sections: readonly NavSection[]): ModuleMatch[] {
  const out: ModuleMatch[] = [];
  const walk = (items: readonly NavItem[], sectionLabel?: string) => {
    for (const item of items) {
      if (item.children?.length) walk(item.children, sectionLabel);
      else out.push({ item, sectionLabel });
    }
  };
  for (const section of sections) walk(section.items, section.label);
  return out;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

/** A flattened, navigable entry — either a record or a module. */
type Entry =
  | { type: 'record'; key: string; to: string; result: SearchResult }
  | { type: 'module'; key: string; to: string; match: ModuleMatch };

export function NavSearch({ navSections }: { navSections: readonly NavSection[] }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { permissionSet } = usePermissions();

  // Records are searched server-side; debounced so typing does not flood it.
  const debounced = useDebouncedValue(term, 200);
  const recordQuery = useSearch(open ? debounced : '');

  // Only destinations this user may actually reach are searchable.
  const modules = useMemo(
    () => flatten(filterNavSections(navSections, permissionSet)),
    [navSections, permissionSet],
  );

  const moduleMatches = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return modules.slice(0, 6);
    return modules.filter((m) => m.item.label.toLowerCase().includes(needle)).slice(0, 5);
  }, [modules, term]);

  const records = useMemo(() => recordQuery.data?.results ?? [], [recordQuery.data]);

  // One flat list drives keyboard navigation across both groups.
  const entries: Entry[] = useMemo(
    () => [
      ...records.map<Entry>((r) => ({ type: 'record', key: `${r.kind}-${r.id}`, to: r.to, result: r })),
      ...moduleMatches.map<Entry>((m) => ({ type: 'module', key: `mod-${m.item.id}`, to: m.item.to, match: m })),
    ],
    [records, moduleMatches],
  );

  // Derived, not synchronised: clamped during render as results shrink.
  const activeIndex = Math.min(highlight, Math.max(entries.length - 1, 0));

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

  function go(entry: Entry | undefined) {
    if (!entry) return;
    close();
    navigate(entry.to);
  }

  const searching = term.trim().length >= 2;
  const loading = searching && recordQuery.isFetching;
  const nothing = entries.length === 0 && !loading;

  // Group boundaries, so a heading renders above the first row of each group.
  const firstModuleIndex = records.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex min-h-11 items-center gap-2 rounded-control border border-[var(--border)]',
          'bg-[var(--surface-sunken)] px-3 text-body-sm text-[var(--text-subtle)]',
          'transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-muted)]',
          'md:w-72',
        )}
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden md:inline">Search students, modules…</span>
        <span className="sr-only md:hidden">Search</span>
        <kbd className="ml-auto hidden rounded border border-[var(--border)] px-1.5 py-0.5 font-sans text-caption md:inline">
          Ctrl K
        </kbd>
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Search"
        description="Find a student by name, admission number or roll number — or jump to a module."
        size="md"
      >
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-subtle)]" aria-hidden="true" />
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
                  setHighlight(Math.min(activeIndex + 1, entries.length - 1));
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setHighlight(Math.max(activeIndex - 1, 0));
                }
                if (event.key === 'Enter') {
                  event.preventDefault();
                  go(entries[activeIndex]);
                }
              }}
              placeholder="Search students, faculty, courses, modules…"
              aria-label="Search records and modules"
              aria-controls="nav-search-results"
              className={cn(
                'w-full rounded-control border border-[var(--border)] bg-[var(--surface-raised)]',
                'min-h-11 pr-10 pl-9 text-body text-[var(--text)] placeholder:text-[var(--text-subtle)]',
              )}
            />
            {loading && (
              <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-[var(--text-subtle)]" aria-hidden="true" />
            )}
          </div>

          {recordQuery.isError && (
            <p className="rounded-control bg-[var(--danger-surface)] px-3 py-2 text-body-sm text-[var(--danger)]">
              Record search is unavailable right now. Module results still work.
            </p>
          )}

          {nothing ? (
            <p className="px-1 py-8 text-center text-body text-[var(--text-muted)]">
              {searching ? `No results for “${term}”.` : 'Start typing to search.'}
            </p>
          ) : (
            <ul id="nav-search-results" className="flex max-h-[22rem] flex-col gap-0.5 overflow-y-auto">
              {entries.map((entry, index) => {
                const active = index === activeIndex;
                const heading =
                  index === 0 && entry.type === 'record'
                    ? SEARCH_KIND_LABEL[entry.result.kind] ?? 'Records'
                    : entry.type === 'record' && entries[index - 1]?.type === 'record' &&
                        (entries[index - 1] as { result: SearchResult }).result.kind !== entry.result.kind
                      ? SEARCH_KIND_LABEL[entry.result.kind] ?? 'Records'
                      : index === firstModuleIndex && entry.type === 'module'
                        ? 'Modules'
                        : null;

                return (
                  <li key={entry.key}>
                    {heading && (
                      <p className="px-2 pt-3 pb-1 text-caption font-semibold tracking-wide text-[var(--text-subtle)] uppercase">
                        {heading}
                      </p>
                    )}
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => go(entry)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-control px-2.5 py-2 text-left text-body',
                        active ? 'bg-[var(--accent-surface)]' : 'hover:bg-[var(--surface-hover)]',
                      )}
                    >
                      {entry.type === 'record' ? (
                        <RecordRow result={entry.result} />
                      ) : (
                        <ModuleRow match={entry.match} />
                      )}
                      {active && <CornerDownLeft className="size-3.5 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />}
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

function RecordRow({ result }: { result: SearchResult }) {
  const isStudent = result.kind === 'student';
  return (
    <>
      {isStudent ? (
        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-sunken)]">
          {result.photoUrl ? (
            <img src={result.photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-caption font-semibold text-[var(--text-subtle)]" aria-hidden="true">
              {initials(result.title)}
            </span>
          )}
        </span>
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-[var(--surface-sunken)] text-caption font-semibold text-[var(--text-subtle)]" aria-hidden="true">
          {(SEARCH_KIND_LABEL[result.kind] ?? '?').slice(0, 1)}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium text-[var(--text)]">{result.title}</span>
          {result.status && <Badge tone={result.status === 'Active' ? 'success' : 'neutral'}>{result.status}</Badge>}
        </span>
        <span className="block truncate text-body-sm text-[var(--text-muted)]">{result.subtitle}</span>
        {isStudent && (
          <span className="block truncate text-caption text-[var(--text-subtle)]">
            {[result.admissionNo && `Adm ${result.admissionNo}`, result.rollNo && `Roll ${result.rollNo}`, result.registerNo]
              .filter(Boolean)
              .join(' · ')}
          </span>
        )}
      </span>
    </>
  );
}

function ModuleRow({ match }: { match: ModuleMatch }) {
  const Icon = match.item.icon;
  return (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-[var(--surface-sunken)]">
        {Icon && <Icon className="size-4 text-[var(--text-muted)]" aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[var(--text)]">{match.item.label}</span>
        {match.sectionLabel && (
          <span className="block truncate text-caption text-[var(--text-subtle)]">{match.sectionLabel}</span>
        )}
      </span>
    </>
  );
}
