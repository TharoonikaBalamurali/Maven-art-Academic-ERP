import type { BadgeTone } from '@/shared/ui';
import type { AdmissionStage } from './types';

/** Stage → badge tone, fixed across the admissions UI. */
export const STAGE_TONE: Record<string, BadgeTone> = {
  offered: 'info',
  confirmed: 'warning',
  enrolled: 'success',
  cancelled: 'danger',
};

export function admissionStageTone(stage: AdmissionStage): BadgeTone {
  return STAGE_TONE[stage] ?? 'neutral';
}
