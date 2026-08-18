import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Form layout vocabulary for future ERP forms (admission, fee assignment,
 * student record…).
 *
 * The field primitives (`Input`, `Select`, `DatePicker`) already handle labels,
 * required marking, help text and error wiring. What was missing was the
 * *page-level* structure around them: grouping, column behaviour and a
 * consistent action row. Those are here, so a future form declares its fields
 * and inherits its layout.
 */

/**
 * A titled group of related fields. Long ERP forms are far easier to complete
 * — and to validate against a backend — when they are chunked.
 */
export function FormSection({
  title,
  description,
  columns = 2,
  children,
  className,
}: {
  title?: string;
  description?: string;
  /** Fields stack on mobile regardless; this is the wide-screen column count. */
  columns?: 1 | 2 | 3;
  children: ReactNode;
  className?: string;
}) {
  const COLUMNS = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
  } as const;

  return (
    <section className={cn('mb-6 last:mb-0', className)}>
      {title && (
        <div className="mb-3 border-b border-[var(--border)] pb-2">
          <h3 className="text-title font-semibold text-[var(--text)]">{title}</h3>
          {description && (
            <p className="mt-0.5 text-body-sm text-[var(--text-muted)]">{description}</p>
          )}
        </div>
      )}
      <div className={cn('grid grid-cols-1 gap-x-4 gap-y-4', COLUMNS[columns])}>{children}</div>
    </section>
  );
}

/** Makes a field span the full width of its `FormSection` grid. */
export function FormFieldWide({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-full">{children}</div>;
}

/**
 * The action row.
 *
 * The primary action sits last on wide screens (natural reading order towards
 * confirmation) and first when stacked on mobile, where the thumb reaches the
 * top of the stack more easily than the bottom of a scrolled page.
 */
export function FormActions({
  primary,
  secondary,
  /** Destructive action, kept visually separated from the confirming ones. */
  destructive,
  className,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  destructive?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 mt-6 flex flex-col gap-2 border-t border-[var(--border)]',
        'bg-[var(--surface-raised)] pt-4 sm:flex-row sm:items-center',
        className,
      )}
    >
      {destructive && <div className="sm:mr-auto">{destructive}</div>}
      <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row sm:items-center">
        {secondary}
        {primary}
      </div>
    </div>
  );
}
