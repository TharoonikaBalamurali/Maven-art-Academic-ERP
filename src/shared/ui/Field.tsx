import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface FieldProps {
  id: string;
  label: string;
  /** Visually hides the label while keeping it available to screen readers. */
  hideLabel?: boolean;
  description?: string;
  descriptionId?: string;
  error?: string;
  errorId?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Label + description + error wrapper shared by every form control (step 17).
 *
 * Centralising this is what makes accessible forms the default rather than
 * something each page has to remember: the control is always labelled, the
 * error is always announced, and required state is always conveyed in text
 * rather than by colour alone (step 20).
 */
export function Field({
  id,
  label,
  hideLabel = false,
  description,
  descriptionId,
  error,
  errorId,
  required = false,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className={cn(
          'text-sm font-medium text-[var(--text)]',
          hideLabel && 'sr-only',
        )}
      >
        {label}
        {required && (
          <span className="ml-1 text-[var(--danger)]">
            <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </span>
        )}
      </label>

      {children}

      {description && !error && (
        <p id={descriptionId} className="text-xs text-[var(--text-muted)]">
          {description}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          // role="alert" so the message is announced when it appears after submit.
          role="alert"
          className="text-xs font-medium text-[var(--danger)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
