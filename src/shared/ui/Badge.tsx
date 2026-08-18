import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Tone → meaning, fixed across the whole ERP so a colour always means the
 * same thing:
 *   neutral — inert / archived        accent  — informational emphasis
 *   success — completed / paid        warning — needs attention / pending
 *   danger  — failed / overdue        info    — in progress / under review
 */
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border-[var(--border)]',
  accent: 'bg-[var(--accent-surface)] text-[var(--accent)] border-transparent',
  success: 'bg-[var(--success-surface)] text-[var(--success)] border-transparent',
  warning: 'bg-[var(--warning-surface)] text-[var(--warning)] border-transparent',
  danger: 'bg-[var(--danger-surface)] text-[var(--danger)] border-transparent',
  info: 'bg-[var(--info-surface)] text-[var(--info)] border-transparent',
};

/**
 * Status pill. The tone is reinforcement, never the sole carrier of meaning —
 * the text always says what the status is, so the badge works without colour
 * perception (accessibility foundation).
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
        'inline-flex items-center gap-1 rounded-control border px-2 py-0.5',
        'text-caption font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
