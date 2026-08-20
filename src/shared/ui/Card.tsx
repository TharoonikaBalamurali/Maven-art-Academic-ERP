import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * The standard content panel. Border, radius and elevation come from the
 * `surface-card` utility so every panel in the ERP is identical.
 */
export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={cn('surface-card', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  actions,
  headingLevel = 2,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Configurable so the document outline stays correct on every page. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
}) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <Heading className="truncate text-title font-semibold text-[var(--text)]">{title}</Heading>
        {description && (
          <p className="mt-0.5 text-body-sm text-[var(--text-muted)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
