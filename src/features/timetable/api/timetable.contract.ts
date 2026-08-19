import { endpoint } from '@/lib/api';
import type { KnownOr } from '@/shared/types';
import type { TimetableOptions, TimetableSlot } from '../types';

export interface TimetableQuery {
  batchId?: string;
  facultyId?: string;
  room?: KnownOr<string>;
}

/**
 * Timetable contract (§20). The list is filtered server-side by batch, faculty
 * or room — the Batch / Faculty / Room "views" the specification describes.
 *
 * TBD — BACKEND CONTRACT: provisional paths.
 */
export const timetableContract = {
  list: endpoint<void, TimetableSlot[], TimetableQuery>({
    method: 'GET',
    path: '/timetable',
    auth: true,
    permission: 'timetable.view',
  }),
  options: endpoint<void, TimetableOptions>({
    method: 'GET',
    path: '/timetable/options',
    auth: true,
    permission: 'timetable.view',
  }),
} as const;
