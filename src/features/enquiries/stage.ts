import type { BadgeTone } from '@/shared/ui';
import type { EnquiryStage } from './types';

/** Stage → badge tone, fixed across the enquiries UI. */
export const STAGE_TONE: Record<string, BadgeTone> = {
  new: 'info',
  contacted: 'accent',
  qualified: 'warning',
  converted: 'success',
  closed: 'neutral',
};

export function stageTone(stage: EnquiryStage): BadgeTone {
  return STAGE_TONE[stage] ?? 'neutral';
}
