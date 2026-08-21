import type { BadgeTone } from '@/shared/ui';
import type { AnnouncementStatus } from './types';

export const STATUS_TONE: Record<string, BadgeTone> = {
  published: 'success',
  scheduled: 'info',
  draft: 'warning',
  archived: 'neutral',
};

export function announcementStatusTone(s: AnnouncementStatus): BadgeTone { return STATUS_TONE[s] ?? 'neutral'; }
