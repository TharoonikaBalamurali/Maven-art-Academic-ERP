import { endpoint } from '@/lib/api';
import type { Settings } from '../types';

/** Settings contract (§ administration) — read. Editing is settings.update (TBD backend contract). */
export const settingsContract = {
  get: endpoint<void, Settings>({ method: 'GET', path: '/settings', auth: true, permission: 'settings.view' }),
} as const;
