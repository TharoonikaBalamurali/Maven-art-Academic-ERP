import type { Id } from '@/shared/types';

/**
 * Timetable types (§20).
 *
 * The frontend consumes the published schedule and lays it out. It does NOT
 * compute institutional scheduling rules — a slot arrives fully resolved (day,
 * time, subject, batch, faculty, room) and the UI only positions it.
 *
 * TBD — BACKEND CONTRACT: provisional field names.
 */
export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

export const WEEKDAYS: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
};

export interface TimetableSlot {
  id: Id;
  day: Weekday;
  batchId: Id;
  batch: string;
  subject: string;
  room: string;
  start: string;
  end: string;
  facultyId: Id;
  faculty: string;
}

/** Options for the timetable's batch / faculty / room filters. */
export interface TimetableOptions {
  batches: { id: Id; name: string }[];
  faculty: { id: Id; name: string }[];
  rooms: string[];
}
