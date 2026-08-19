import type { BadgeTone } from '@/shared/ui';
import type { ProgressStatus } from './types';

/** Status → badge tone, fixed across the progress UI. */
export const STATUS_TONE: Record<string, BadgeTone> = {
  graded: 'success',
  pending: 'warning',
  absent: 'danger',
};

export function progressStatusTone(status: ProgressStatus): BadgeTone {
  return STATUS_TONE[status] ?? 'neutral';
}
