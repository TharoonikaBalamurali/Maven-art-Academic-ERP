import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, Lock, SearchX, ServerCrash } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '../Button';

/**
 * The reusable data states required by specification §28 (Day 1 step 18).
 *
 * Every API-driven page in the ERP renders one of these rather than inventing
 * its own copy, so "no results", "not allowed" and "it broke" read the same
 * everywhere and stay translatable from one place.
 */

interface StateShellProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /** `polite` for expected states, `assertive` for failures. */
  live?: 'polite' | 'assertive';
  className?: string;
}

function StateShell({ icon, title, description, action, live = 'polite', className }: StateShellProps) {
  return (
    <div
      role="status"
      aria-live={live}
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="text-[var(--text-muted)]" aria-hidden="true">
        {icon}
      </div>
      <div className="max-w-md">
        <p className="text-body font-semibold text-[var(--text)]">{title}</p>
        {description && <p className="mt-1 text-body text-[var(--text-muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <StateShell
      className={className}
      icon={<Loader2 className="size-6 animate-spin" />}
      title={label}
    />
  );
}

export function EmptyState({
  title = 'Nothing to show yet',
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <StateShell
      className={className}
      icon={<Inbox className="size-6" />}
      title={title}
      description={description}
      action={action}
    />
  );
}

/** Empty because a search or filter excluded everything — distinct from "no data". */
export function NoResultsState({
  onClear,
  className,
}: {
  onClear?: () => void;
  className?: string;
}) {
  return (
    <StateShell
      className={className}
      icon={<SearchX className="size-6" />}
      title="No matching results"
      description="Try a different search term or clear the filters."
      action={
        onClear && (
          <Button variant="secondary" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )
      }
    />
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <StateShell
      className={className}
      live="assertive"
      icon={<ServerCrash className="size-6 text-[var(--danger)]" />}
      title={title}
      description={description}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  );
}

export function ForbiddenState({
  description = 'You do not have permission to view this information.',
  className,
}: {
  description?: string;
  className?: string;
}) {
  return (
    <StateShell
      className={className}
      live="assertive"
      icon={<Lock className="size-6" />}
      title="Access denied"
      description={description}
    />
  );
}

export function NotFoundState({
  description = 'The requested information could not be found.',
  className,
}: {
  description?: string;
  className?: string;
}) {
  return (
    <StateShell
      className={className}
      icon={<AlertTriangle className="size-6" />}
      title="Not found"
      description={description}
    />
  );
}
