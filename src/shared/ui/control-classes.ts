import { cn } from '@/lib/utils/cn';

/** Shared visual treatment for text-like form controls (input, select). */
export const controlClasses = cn(
  'w-full rounded-md border bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text)]',
  'border-[var(--border)] placeholder:text-[var(--text-muted)]',
  'min-h-11 transition-colors disabled:cursor-not-allowed disabled:opacity-60',
  'aria-[invalid=true]:border-[var(--danger)]',
);
