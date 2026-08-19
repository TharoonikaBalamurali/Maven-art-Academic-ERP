import type { BadgeTone } from '@/shared/ui';
import type { EnrollmentStatus } from './types';

/** Status → badge tone, fixed across the enrollments UI. */
export const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'success',
  completed: 'info',
  withdrawn: 'neutral',
};

export function enrollmentStatusTone(status: EnrollmentStatus): BadgeTone {
  return STATUS_TONE[status] ?? 'neutral';
}
