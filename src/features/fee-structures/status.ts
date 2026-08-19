import type { BadgeTone } from '@/shared/ui';
import type { FeeStructureStatus } from './types';

/** Status → badge tone, fixed across the fee-structures UI. */
export const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'success',
  draft: 'warning',
  archived: 'neutral',
};

export function feeStructureStatusTone(status: FeeStructureStatus): BadgeTone {
  return STATUS_TONE[status] ?? 'neutral';
}
