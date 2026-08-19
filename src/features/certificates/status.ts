import type { BadgeTone } from '@/shared/ui';
import type { CertificateStatus } from './types';

/** Status → badge tone, fixed across the certificates UI. */
export const STATUS_TONE: Record<string, BadgeTone> = {
  issued: 'success',
  requested: 'warning',
  revoked: 'danger',
};

export function certificateStatusTone(status: CertificateStatus): BadgeTone {
  return STATUS_TONE[status] ?? 'neutral';
}
