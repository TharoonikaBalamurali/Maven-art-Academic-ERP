import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * The page layout vocabulary every ERP screen composes from.
 *
 * The specification's screens all share the same skeleton:
 *
 *   PageHeader  — what am I looking at, and the primary action
 *   FilterBar   — how do I narrow it (server-driven, §31)
 *   ContentSection / Card — the data
 *   Pagination  — backend metadata (§32)
 *
 * Fixing that vocabulary here means a future module writes structure, not
 * spacing decisions — which is what makes thirty screens look like one product.
 */

/* -------------------------------------------------------------------------- */
/* PageHeader                                                                  */
/* -------------------------------------------------------------------------- */

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Status/ownership chips shown beside the title. */
  meta?: ReactNode;
  /**
   * Primary and secondary actions. Wrap permission-gated ones in
   * `<PermissionGuard>` at the call site.
   */
  actions?: ReactNode;
}

/**
 * The page's single `h1` plus its actions.
 *
 * Title and actions sit on one line on wide screens and stack on narrow ones,
 * so the primary action is never pushed off-screen on mobile.
 */
export function PageHeader({ title, description, meta, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-page font-semibold tracking-[var(--tracking-page)] text-[var(--text)]">{title}</h1>
          {meta}
        </div>
        {description && (
          <p className="mt-1.5 max-w-2xl text-body text-[var(--text-muted)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* SectionHeader                                                               */
/* -------------------------------------------------------------------------- */

/** A heading *within* a page. Never an `h1` — that belongs to PageHeader. */
export function SectionHeader({
  title,
  description,
  actions,
  level = 2,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  level?: 2 | 3;
  className?: string;
}) {
  const Heading = `h${level}` as const;

  return (
    <div className={cn('mb-4 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <Heading className="text-title font-semibold text-[var(--text)]">{title}</Heading>
        {description && (
          <p className="mt-0.5 text-body-sm text-[var(--text-muted)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ContentSection                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A titled block of page content. Use instead of nesting cards inside cards —
 * a section with a rule reads more calmly than a card in a card.
 */
export function ContentSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('mb-8 last:mb-0', className)}>
      {title && <SectionHeader title={title} description={description} actions={actions} />}
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* ActionBar                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Actions that apply to the content below, and the bulk-action bar for tables
 * with a selection. `selectionCount` switches it into selection mode.
 */
export function ActionBar({
  selectionCount = 0,
  onClearSelection,
  children,
  className,
}: {
  selectionCount?: number;
  onClearSelection?: () => void;
  children?: ReactNode;
  className?: string;
}) {
  const inSelection = selectionCount > 0;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-control px-3 py-2',
        inSelection
          ? 'bg-[var(--accent-surface)] text-[var(--accent)]'
          : 'text-[var(--text-muted)]',
        className,
      )}
    >
      {inSelection && (
        <>
          <span aria-live="polite" className="text-body font-medium">
            {selectionCount} selected
          </span>
          {onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="rounded-control text-body underline underline-offset-2 hover:no-underline"
            >
              Clear
            </button>
          )}
          <span aria-hidden="true" className="mx-1 h-4 w-px bg-[var(--border-strong)]" />
        </>
      )}
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FilterBar                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The control strip above a data table.
 *
 * Every filter here is expected to drive a *server* query (§31), never a
 * client-side array filter. `activeCount` and `onClear` give the user a way
 * back out of a narrow filter — the most common cause of "the data is gone".
 */
export function FilterBar({
  children,
  activeCount = 0,
  onClear,
  className,
}: {
  children: ReactNode;
  activeCount?: number;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <div
      role="search"
      className={cn(
        'flex flex-col gap-3 border-b border-[var(--border)] p-4',
        'sm:flex-row sm:flex-wrap sm:items-end',
        className,
      )}
    >
      {children}
      {activeCount > 0 && onClear && (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            'min-h-11 shrink-0 rounded-control px-3 text-body font-medium',
            'text-[var(--accent)] hover:bg-[var(--surface-hover)]',
          )}
        >
          Clear filters
          <span className="sr-only"> ({activeCount} active)</span>
          <span aria-hidden="true" className="ml-1 text-caption">
            ({activeCount})
          </span>
        </button>
      )}
    </div>
  );
}
