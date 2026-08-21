import type { BadgeTone } from '@/shared/ui';
import type { DisciplineSeverity, DisciplineStatus } from './types';

export const STATUS_TONE: Record<string, BadgeTone> = {
  open: 'warning',
  under_review: 'info',
  action_required: 'danger',
  resolved: 'success',
};

export const SEVERITY_TONE: Record<string, BadgeTone> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

export function disciplineStatusTone(s: DisciplineStatus): BadgeTone { return STATUS_TONE[s] ?? 'neutral'; }
export function disciplineSeverityTone(s: DisciplineSeverity): BadgeTone { return SEVERITY_TONE[s] ?? 'neutral'; }
