import type { BadgeTone } from '@/shared/ui';
import type { LeaveStatus } from './types';

export const STATUS_TONE: Record<string, BadgeTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

export function leaveStatusTone(s: LeaveStatus): BadgeTone { return STATUS_TONE[s] ?? 'neutral'; }
