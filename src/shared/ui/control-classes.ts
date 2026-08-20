import { cn } from '@/lib/utils/cn';

/**
 * Shared visual treatment for text-like form controls (input, select,
 * textarea). Centralised so every field in the ERP has identical height,
 * padding, border and invalid state.
 */
export const controlClasses = cn(
  'w-full rounded-control border border-[var(--border)] bg-[var(--surface-raised)]',
  'px-3.5 py-2 text-body text-[var(--text)] placeholder:text-[var(--text-subtle)]',
  'min-h-11 transition-colors duration-150',
  'hover:border-[var(--border-strong)]',
  'disabled:cursor-not-allowed disabled:bg-[var(--surface-sunken)] disabled:opacity-70',
  'aria-[invalid=true]:border-[var(--danger)]',
);
