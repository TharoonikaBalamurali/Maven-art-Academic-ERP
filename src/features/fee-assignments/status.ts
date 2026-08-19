import type { BadgeTone } from '@/shared/ui';
import type { FeeAssignmentStatus } from './types';

/** Status → badge tone, fixed across the fee-assignments UI. */
export const STATUS_TONE: Record<string, BadgeTone> = {
  pending: 'warning',
  partial: 'info',
  paid: 'success',
  overdue: 'danger',
};

export function feeAssignmentStatusTone(status: FeeAssignmentStatus): BadgeTone {
  return STATUS_TONE[status] ?? 'neutral';
}
