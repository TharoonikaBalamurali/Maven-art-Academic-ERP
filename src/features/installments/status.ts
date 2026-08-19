import type { BadgeTone } from '@/shared/ui';
import type { InstallmentStatus } from './types';

/** Status → badge tone, fixed across the installments UI. */
export const STATUS_TONE: Record<string, BadgeTone> = {
  paid: 'success',
  due: 'warning',
  upcoming: 'info',
  overdue: 'danger',
};

export function installmentStatusTone(status: InstallmentStatus): BadgeTone {
  return STATUS_TONE[status] ?? 'neutral';
}
