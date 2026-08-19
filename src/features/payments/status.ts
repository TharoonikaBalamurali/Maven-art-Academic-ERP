import type { BadgeTone } from '@/shared/ui';
import type { PaymentStatus } from './types';

/** Status → badge tone, fixed across the payments UI. */
export const STATUS_TONE: Record<string, BadgeTone> = {
  recorded: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'neutral',
};

export function paymentStatusTone(status: PaymentStatus): BadgeTone {
  return STATUS_TONE[status] ?? 'neutral';
}
