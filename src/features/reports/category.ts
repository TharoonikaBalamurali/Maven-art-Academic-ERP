import type { BadgeTone } from '@/shared/ui';
import type { ReportCategory } from './types';

/** Category → badge tone, fixed across the reports UI. */
export const CATEGORY_TONE: Record<string, BadgeTone> = {
  financial: 'info',
  operational: 'accent',
};

export function reportCategoryTone(category: ReportCategory): BadgeTone {
  return CATEGORY_TONE[category] ?? 'neutral';
}
