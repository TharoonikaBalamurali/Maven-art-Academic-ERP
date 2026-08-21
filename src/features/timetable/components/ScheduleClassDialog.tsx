import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { isApiError } from '@/lib/api';
import { Button, Input, Modal, Select, toast } from '@/shared/ui';
import { useRemoveClass, useScheduleClass, useTimetableOptions, useUpdateClass } from '../hooks/useTimetable';
import { WEEKDAYS, WEEKDAY_LABEL, type TimetableSlot, type Weekday } from '../types';

const DAY_OPTIONS = WEEKDAYS.map((d) => ({ value: d, label: WEEKDAY_LABEL[d] }));

/**
 * Schedule or reschedule a class (§ scheduling).
 *
 * Assigns the batch, subject, faculty member, room and time. The BACKEND
 * validates the slot and rejects a clash (409) — the frontend applies no
 * scheduling rules of its own; it submits the intent and surfaces the reason
 * the backend gives.
 */
export function ScheduleClassDialog({ slot, onClose }: { slot?: TimetableSlot; onClose: () => void }) {
  const editing = Boolean(slot);
  const options = useTimetableOptions();
  const create = useScheduleClass();
  const update = useUpdateClass(slot?.id ?? '');
  const remove = useRemoveClass();

  const [day, setDay] = useState<Weekday>(slot?.day ?? 'Mon');
  const [batchId, setBatchId] = useState(slot?.batchId ?? '');
  const [subject, setSubject] = useState(slot?.subject ?? '');
  const [facultyId, setFacultyId] = useState(slot?.facultyId ?? '');
  const [room, setRoom] = useState(slot?.room ?? '');
  const [start, setStart] = useState(slot?.start ?? '09:00');
  const [end, setEnd] = useState(slot?.end ?? '10:30');

  const batchOptions = (options.data?.batches ?? []).map((b) => ({ value: b.id, label: b.name }));
  const facultyOptions = (options.data?.faculty ?? []).map((f) => ({ value: f.id, label: f.name }));
  const roomOptions = (options.data?.rooms ?? []).map((r) => ({ value: r, label: r }));

  const valid = Boolean(batchId && subject.trim() && facultyId && room && start && end && start < end);
  const busy = create.isPending || update.isPending || remove.isPending;

  async function submit() {
    if (!valid) return;
    const input = { day, batchId, subject, room, start, end, facultyId };
    try {
      if (editing && slot) {
        await update.mutateAsync(input);
        toast.success('Class rescheduled', `${subject} · ${WEEKDAY_LABEL[day]}`);
      } else {
        await create.mutateAsync(input);
        toast.success('Class scheduled', `${subject} · ${WEEKDAY_LABEL[day]} ${start}`);
      }
      onClose();
    } catch (error) {
      // The backend explains the clash; show its reason rather than guessing.
      const reason = isApiError(error) ? (error.code ?? error.message) : 'The class could not be scheduled.';
      toast.error('Scheduling conflict', reason);
    }
  }

  async function onRemove() {
    if (!slot) return;
    try {
      await remove.mutateAsync(slot.id);
      toast.success('Class removed', slot.subject);
      onClose();
    } catch {
      toast.error('Could not remove the class');
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={editing ? 'Reschedule class' : 'Schedule a class'}
      description="Assign the batch, subject, faculty member, room and time. The backend checks for clashes."
      footer={
        <>
          {editing && (
            <Button variant="danger" onClick={() => void onRemove()} disabled={busy}>
              Remove
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!valid || busy} loading={create.isPending || update.isPending}>
            {editing ? 'Save changes' : 'Schedule class'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select label="Day" required options={DAY_OPTIONS} value={day} onChange={(e) => setDay(e.target.value as Weekday)} />
        <Select label="Batch" required placeholder="Select a batch" options={batchOptions} value={batchId} onChange={(e) => setBatchId(e.target.value)} />
        <div className="sm:col-span-2">
          <Input label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Life Drawing" />
        </div>
        <Select label="Faculty" required placeholder="Assign a faculty member" options={facultyOptions} value={facultyId} onChange={(e) => setFacultyId(e.target.value)} />
        <Select label="Room" required placeholder="Select a room" options={roomOptions} value={room} onChange={(e) => setRoom(e.target.value)} />
        <Input label="Start time" type="time" required value={start} onChange={(e) => setStart(e.target.value)} />
        <Input
          label="End time"
          type="time"
          required
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          error={start && end && start >= end ? 'The end time must be after the start time.' : undefined}
        />
      </div>

      <p className="mt-3 inline-flex items-center gap-1.5 text-caption text-[var(--text-subtle)]">
        <CalendarClock className="size-3.5" aria-hidden="true" />
        The institution&rsquo;s scheduling rules are enforced by the backend.
      </p>
    </Modal>
  );
}
