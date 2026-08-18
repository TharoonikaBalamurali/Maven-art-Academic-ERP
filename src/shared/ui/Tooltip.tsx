import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TooltipProps {
  /** Plain text only — a tooltip must never contain interactive content. */
  label: string;
  side?: 'top' | 'bottom';
  children: ReactNode;
  className?: string;
}

/**
 * Supplementary hint for an already-labelled control.
 *
 * Deliberately limited: it shows on hover **and** on keyboard focus, dismisses
 * on Escape, and is wired with `aria-describedby` so it *supplements* an
 * accessible name rather than supplying one. An icon-only button must still
 * carry its own `aria-label` — a tooltip is not a substitute for a label,
 * because it is unavailable to touch users.
 */
export function Tooltip({ label, side = 'top', children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>

      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap',
            'rounded-control bg-[var(--text)] px-2 py-1 text-caption text-[var(--surface-raised)]',
            'shadow-overlay',
            side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
