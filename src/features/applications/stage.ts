import type { BadgeTone } from '@/shared/ui';
import type { ApplicationStage } from './types';

/** Stage → badge tone, fixed across the applications UI. */
export const STAGE_TONE: Record<string, BadgeTone> = {
  draft: 'neutral',
  submitted: 'info',
  under_review: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export function applicationStageTone(stage: ApplicationStage): BadgeTone {
  return STAGE_TONE[stage] ?? 'neutral';
}
