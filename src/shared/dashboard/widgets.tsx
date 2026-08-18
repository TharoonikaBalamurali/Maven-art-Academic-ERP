import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card, CardBody, CardHeader } from '@/shared/ui';

/**
 * Dashboard foundation (Part 10 of the review brief).
 *
 * These are layout and state patterns only. They deliberately contain no
 * institutional metrics: dashboards are role-specific and are delivered in
 * later phases (§13). What is fixed here is how every future widget looks,
 * how it reports loading/empty/error, and how it lays out on each breakpoint —
 * so Phase 2 adds data, not design decisions.
 */

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Responsive dashboard grid. Widget widths are expressed in grid columns so a
 * dashboard reflows predictably instead of each page inventing breakpoints.
 */
export function DashboardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {children}
    </div>
  );
}

export function WidgetCard({
  title,
  description,
  actions,
  span = 1,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Grid columns to occupy at `xl` and above. */
  span?: 1 | 2 | 3 | 4;
  children: ReactNode;
}) {
  const SPANS = {
    1: '',
    2: 'sm:col-span-2',
    3: 'sm:col-span-2 xl:col-span-3',
    4: 'sm:col-span-2 xl:col-span-4',
  } as const;

  return (
    <Card className={cn('flex flex-col', SPANS[span])}>
      <CardHeader title={title} description={description} actions={actions} headingLevel={2} />
      <CardBody className="flex-1">{children}</CardBody>
    </Card>
  );
}

/**
 * A single headline figure.
 *
 * `state` is explicit rather than inferred so a dashboard can never present an
 * absent value as a real one. `unavailable` renders an em-dash plus a reason —
 * which is what every card shows until the backend supplies the metric.
 */
export function SummaryCard({
  label,
  value,
  icon: IconComponent,
  state = 'ready',
  note,
  to,
}: {
  label: string;
  value?: string | number;
  icon?: Icon;
  state?: 'ready' | 'loading' | 'unavailable';
  note?: string;
  /** Makes the whole card a link to the underlying module. */
  to?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">
          {label}
        </p>
        {IconComponent && (
          <IconComponent className="size-4 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />
        )}
      </div>

      {state === 'loading' ? (
        <div
          aria-hidden="true"
          className="mt-2 h-8 w-20 animate-pulse rounded-control bg-[var(--surface-sunken)]"
        />
      ) : (
        <p
          className={cn(
            'mt-2 text-metric font-semibold tabular-nums',
            state === 'unavailable' ? 'text-[var(--text-subtle)]' : 'text-[var(--text)]',
          )}
        >
          {state === 'unavailable' ? '—' : value}
        </p>
      )}

      {note && <p className="mt-1 text-body-sm text-[var(--text-muted)]">{note}</p>}
    </>
  );

  const shell = 'surface-card p-4 transition-colors';

  if (to) {
    return (
      <Link to={to} className={cn(shell, 'block hover:border-[var(--border-strong)]')}>
        {body}
      </Link>
    );
  }
  return <div className={shell}>{body}</div>;
}

/** A permission-gated shortcut. Wrap in PermissionGuard at the call site. */
export function QuickAction({
  label,
  description,
  icon: IconComponent,
  to,
}: {
  label: string;
  description?: string;
  icon?: Icon;
  to: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex min-h-14 items-center gap-3 rounded-control border border-[var(--border)] px-3 py-2',
        'transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]',
      )}
    >
      {IconComponent && (
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-control bg-[var(--accent-surface)] text-[var(--accent)]"
        >
          <IconComponent className="size-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-body font-medium text-[var(--text)]">{label}</span>
        {description && (
          <span className="block truncate text-body-sm text-[var(--text-muted)]">{description}</span>
        )}
      </span>
    </Link>
  );
}

export interface ListEntry {
  id: string;
  primary: string;
  secondary?: string;
  meta?: string;
  tone?: 'default' | 'accent';
}

/**
 * Vertical list used by activity feeds, upcoming classes and recent
 * transactions. Generic on purpose — those three differ only in their data.
 */
export function ActivityList({ entries, emptyLabel = 'Nothing to show yet.' }: {
  entries: readonly ListEntry[];
  emptyLabel?: string;
}) {
  if (entries.length === 0) return <EmptyWidget label={emptyLabel} />;

  return (
    <ul className="flex flex-col divide-y divide-[var(--border)]">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
          <span
            aria-hidden="true"
            className={cn(
              'mt-1.5 size-1.5 shrink-0 rounded-full',
              entry.tone === 'accent' ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]',
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body text-[var(--text)]">{entry.primary}</span>
            {entry.secondary && (
              <span className="block truncate text-body-sm text-[var(--text-muted)]">
                {entry.secondary}
              </span>
            )}
          </span>
          {entry.meta && (
            <span className="shrink-0 text-body-sm whitespace-nowrap text-[var(--text-subtle)]">
              {entry.meta}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/* --- Widget-scale data states ---------------------------------------------
 * Smaller siblings of the page-level states in `shared/ui/states`. A dashboard
 * of ten widgets cannot show ten full-page spinners.
 */

export function LoadingWidget({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 py-6 text-[var(--text-muted)]">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span className="text-body">{label}</span>
    </div>
  );
}

export function EmptyWidget({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-[var(--text-muted)]">
      <Inbox className="size-4 shrink-0" aria-hidden="true" />
      <span className="text-body">{label}</span>
    </div>
  );
}

export function ErrorWidget({
  label = 'This widget could not be loaded.',
  onRetry,
}: {
  label?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="status" aria-live="assertive" className="flex items-start gap-2 py-6">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" aria-hidden="true" />
      <div>
        <p className="text-body text-[var(--text)]">{label}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 text-body-sm text-[var(--accent)] underline underline-offset-2"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
