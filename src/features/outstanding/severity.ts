import type { BadgeTone } from '@/shared/ui';
import type { OutstandingSeverity } from './types';

/** Severity → badge tone, fixed across the outstanding UI. */
export const SEVERITY_TONE: Record<string, BadgeTone> = {
  overdue: 'danger',
  due: 'warning',
  upcoming: 'info',
};

export function outstandingSeverityTone(severity: OutstandingSeverity): BadgeTone {
  return SEVERITY_TONE[severity] ?? 'neutral';
}
