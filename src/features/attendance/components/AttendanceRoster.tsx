import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { usePermissions } from '@/features/auth/hooks';
import { formatTimeRange } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { Badge, Button, QueryBoundary, toast } from '@/shared/ui';
import { SectionHeader } from '@/shared/layout/page';
import { useAttendanceRoster, useSubmitAttendance } from '../hooks/useAttendance';
import type { AttendanceMark, AttendanceRosterStudent } from '../types';

/**
 * The roster for one scheduled class: mark each student present or absent, then
 * submit. Defaults everyone to present (the common case), so marking is mostly
 * flipping the few absentees. The backend re-checks that this faculty member is
 * assigned to the class (§6) — the submit button is not the security boundary.
 */
export function AttendanceRosterPanel({ classId }: { classId: string }) {
  const query = useAttendanceRoster(classId);
  const submit = useSubmitAttendance(classId);
  const { can } = usePermissions();
  const canMark = can('attendance.mark');

  const [marks, setMarks] = useState<Record<string, AttendanceMark>>({});
  const [syncedFor, setSyncedFor] = useState<string | null>(null);

  // Seed the editable marks from the loaded roster, and re-seed when a
  // different class's roster arrives. Render-phase state sync (React's endorsed
  // pattern) rather than an effect, so nothing clobbers in-progress edits.
  const rosterKey = query.data
    ? `${query.data.scheduledClass.id}:${query.data.scheduledClass.marked}`
    : null;
  if (query.data && rosterKey !== syncedFor) {
    setSyncedFor(rosterKey);
    const initial: Record<string, AttendanceMark> = {};
    for (const student of query.data.students) initial[student.id] = student.mark;
    setMarks(initial);
  }

  const counts = useMemo(() => {
    const values = Object.values(marks);
    const present = values.filter((m) => m === 'present').length;
    return { present, absent: values.length - present, total: values.length };
  }, [marks]);

  function setAll(mark: AttendanceMark) {
    if (!query.data) return;
    const next: Record<string, AttendanceMark> = {};
    for (const student of query.data.students) next[student.id] = mark;
    setMarks(next);
  }

  async function handleSubmit() {
    const present = Object.entries(marks).filter(([, m]) => m === 'present').map(([id]) => id);
    const absent = Object.entries(marks).filter(([, m]) => m === 'absent').map(([id]) => id);
    try {
      await submit.mutateAsync({ present, absent });
      toast.success('Attendance saved', `${present.length} present · ${absent.length} absent`);
    } catch {
      // The API client normalises the error; the boundary below shows failures
      // that block loading. A transient submit failure surfaces as a toast.
      toast.error('Could not save attendance', 'Please try again.');
    }
  }

  return (
    <QueryBoundary
      isPending={query.isPending}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
    >
      {query.data && (
        <div className="flex flex-col gap-4">
          <SectionHeader
            title={query.data.scheduledClass.subject}
            description={`${query.data.scheduledClass.batch} · ${query.data.scheduledClass.room} · ${formatTimeRange(
              query.data.scheduledClass.start,
              query.data.scheduledClass.end,
            )}`}
            actions={
              query.data.scheduledClass.marked ? <Badge tone="success">Submitted</Badge> : undefined
            }
          />

          {canMark && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setAll('present')}>
                Mark all present
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setAll('absent')}>
                Mark all absent
              </Button>
              <span className="ml-auto text-body-sm text-[var(--text-muted)]" aria-live="polite">
                <strong className="text-[var(--success)]">{counts.present}</strong> present ·{' '}
                <strong className="text-[var(--danger)]">{counts.absent}</strong> absent
              </span>
            </div>
          )}

          <ul className="flex flex-col divide-y divide-[var(--border)]">
            {query.data.students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                mark={marks[student.id] ?? 'present'}
                readOnly={!canMark}
                onChange={(mark) => setMarks((current) => ({ ...current, [student.id]: mark }))}
              />
            ))}
          </ul>

          {canMark && (
            <div className="flex justify-end border-t border-[var(--border)] pt-4">
              <Button onClick={() => void handleSubmit()} loading={submit.isPending}>
                {query.data.scheduledClass.marked ? 'Update attendance' : 'Submit attendance'}
              </Button>
            </div>
          )}
        </div>
      )}
    </QueryBoundary>
  );
}

function StudentRow({
  student,
  mark,
  readOnly,
  onChange,
}: {
  student: AttendanceRosterStudent;
  mark: AttendanceMark;
  readOnly: boolean;
  onChange: (mark: AttendanceMark) => void;
}) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-medium text-[var(--text)]">{student.name}</span>
        <span className="block truncate font-mono text-body-sm text-[var(--text-muted)]">
          {student.registerNo}
        </span>
      </span>

      {readOnly ? (
        <Badge tone={mark === 'present' ? 'success' : 'danger'}>
          {mark === 'present' ? 'Present' : 'Absent'}
        </Badge>
      ) : (
        <div
          role="radiogroup"
          aria-label={`Attendance for ${student.name}`}
          className="flex shrink-0 overflow-hidden rounded-control border border-[var(--border)]"
        >
          <MarkButton
            active={mark === 'present'}
            tone="present"
            label="Present"
            onClick={() => onChange('present')}
          />
          <MarkButton
            active={mark === 'absent'}
            tone="absent"
            label="Absent"
            onClick={() => onChange('absent')}
          />
        </div>
      )}
    </li>
  );
}

function MarkButton({
  active,
  tone,
  label,
  onClick,
}: {
  active: boolean;
  tone: 'present' | 'absent';
  label: string;
  onClick: () => void;
}) {
  const Icon = tone === 'present' ? CheckCircle2 : XCircle;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        // 44px: marking present/absent is the primary touch interaction here.
        'inline-flex min-h-11 items-center gap-1.5 px-3 text-body-sm font-medium transition-colors',
        active && tone === 'present' && 'bg-[var(--success-surface)] text-[var(--success)]',
        active && tone === 'absent' && 'bg-[var(--danger-surface)] text-[var(--danger)]',
        !active && 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)]',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}
