import type { TimetableOptions, TimetableSlot } from '@/features/timetable/types';
import {
  batchName,
  facultyName,
  SEED_BATCHES,
  SEED_FACULTY,
  SEED_ROOMS,
  SEED_TIMETABLE,
} from './seed';

/**
 * Serves the published weekly schedule (§20), filtered server-side by batch,
 * faculty or room. The mock does no scheduling — it returns the fixed seed.
 */
export interface TimetableFilters {
  batchId?: string;
  facultyId?: string;
  room?: string;
}

export function listTimetable(filters: TimetableFilters): TimetableSlot[] {
  return SEED_TIMETABLE.filter((slot) => {
    if (filters.batchId && slot.batchId !== filters.batchId) return false;
    if (filters.facultyId && slot.facultyId !== filters.facultyId) return false;
    if (filters.room && slot.room !== filters.room) return false;
    return true;
  }).map((slot) => ({
    id: slot.id,
    day: slot.day,
    batchId: slot.batchId,
    batch: batchName(slot.batchId),
    subject: slot.subject,
    room: slot.room,
    start: slot.start,
    end: slot.end,
    facultyId: slot.facultyId,
    faculty: facultyName(slot.facultyId),
  }));
}

export function timetableOptions(): TimetableOptions {
  // Only batches and faculty that actually appear in the schedule.
  const usedBatches = new Set(SEED_TIMETABLE.map((s) => s.batchId));
  const usedFaculty = new Set(SEED_TIMETABLE.map((s) => s.facultyId));
  return {
    batches: SEED_BATCHES.filter((b) => usedBatches.has(b.id)).map((b) => ({ id: b.id, name: b.name })),
    faculty: SEED_FACULTY.filter((f) => usedFaculty.has(f.id)).map((f) => ({ id: f.id, name: f.name })),
    rooms: SEED_ROOMS.filter((r) => SEED_TIMETABLE.some((s) => s.room === r)),
  };
}
