import type { TimetableOptions, TimetableSlot, TimetableSlotInput, Weekday } from '@/features/timetable/types';
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
 * faculty or room, and accepts scheduling changes from an authorized admin
 * (§ scheduling). Clash detection lives here because it is a backend rule: the
 * frontend submits intent and the backend accepts or rejects it.
 */

/** Mutable store, seeded from the fixed timetable. */
const slotStore: TimetableSlot[] = SEED_TIMETABLE.map((slot) => ({
  id: slot.id,
  day: slot.day as Weekday,
  batchId: slot.batchId,
  batch: batchName(slot.batchId),
  subject: slot.subject,
  room: slot.room,
  start: slot.start,
  end: slot.end,
  facultyId: slot.facultyId,
  faculty: facultyName(slot.facultyId),
}));

let slotSeq = slotStore.length + 1;
export interface TimetableFilters {
  batchId?: string;
  facultyId?: string;
  room?: string;
}

export function listTimetable(filters: TimetableFilters): TimetableSlot[] {
  return slotStore.filter((slot) => {
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
  // Every batch, faculty member and room — an admin scheduling a new class must
  // be able to pick one that is not already in the timetable.
  return {
    batches: SEED_BATCHES.map((b) => ({ id: b.id, name: b.name })),
    faculty: SEED_FACULTY.map((f) => ({ id: f.id, name: f.name })),
    rooms: [...SEED_ROOMS],
  };
}

// --- Scheduling (§ scheduling) ----------------------------------------------

export type SlotResult =
  | { kind: 'ok'; slot: TimetableSlot }
  | { kind: 'not_found' }
  | { kind: 'conflict'; message: string };

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Clash detection — a backend rule. The same faculty member, room or batch
 * cannot be double-booked in overlapping time on the same day.
 */
function findClash(input: TimetableSlotInput, ignoreId?: string): string | null {
  for (const slot of slotStore) {
    if (slot.id === ignoreId) continue;
    if (slot.day !== input.day) continue;
    if (!overlaps(input.start, input.end, slot.start, slot.end)) continue;
    if (slot.facultyId === input.facultyId) return `${facultyName(input.facultyId)} already teaches ${slot.subject} at that time.`;
    if (slot.room === input.room) return `${input.room} is already booked for ${slot.subject} at that time.`;
    if (slot.batchId === input.batchId) return `${batchName(input.batchId)} already has ${slot.subject} at that time.`;
  }
  return null;
}

function validateSlot(input: TimetableSlotInput): string | null {
  if (!input.subject?.trim()) return 'A subject is required.';
  if (!input.start || !input.end) return 'Start and end times are required.';
  if (input.start >= input.end) return 'The end time must be after the start time.';
  return null;
}

function materialise(input: TimetableSlotInput, id: string): TimetableSlot {
  return {
    id,
    day: input.day,
    batchId: input.batchId,
    batch: batchName(input.batchId),
    subject: input.subject.trim(),
    room: input.room,
    start: input.start,
    end: input.end,
    facultyId: input.facultyId,
    faculty: facultyName(input.facultyId),
  };
}

export function createSlot(input: TimetableSlotInput): SlotResult {
  const invalid = validateSlot(input);
  if (invalid) return { kind: 'conflict', message: invalid };
  const clash = findClash(input);
  if (clash) return { kind: 'conflict', message: clash };

  const slot = materialise(input, `tt-${slotSeq}`);
  slotSeq += 1;
  slotStore.push(slot);
  return { kind: 'ok', slot };
}

export function updateSlot(slotId: string, input: TimetableSlotInput): SlotResult {
  const index = slotStore.findIndex((s) => s.id === slotId);
  if (index === -1) return { kind: 'not_found' };
  const invalid = validateSlot(input);
  if (invalid) return { kind: 'conflict', message: invalid };
  const clash = findClash(input, slotId);
  if (clash) return { kind: 'conflict', message: clash };

  const slot = materialise(input, slotId);
  slotStore[index] = slot;
  return { kind: 'ok', slot };
}

export function removeSlot(slotId: string): boolean {
  const index = slotStore.findIndex((s) => s.id === slotId);
  if (index === -1) return false;
  slotStore.splice(index, 1);
  return true;
}
