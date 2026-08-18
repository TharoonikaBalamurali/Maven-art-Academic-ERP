import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border-[var(--border)]',
  accent: 'bg-[var(--surface-sunken)] text-[var(--accent)] border-[var(--border)]',
  success: 'bg-[var(--success-surface)] text-[var(--success)] border-transparent',
  warning: 'bg-[var(--warning-surface)] text-[var(--warning)] border-transparent',
  danger: 'bg-[var(--danger-surface)] text-[var(--danger)] border-transparent',
};

/**
 * Status pill. The tone is decoration — the text always carries the meaning,
 * so status is never communicated by colour alone (step 20).
 */
export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
