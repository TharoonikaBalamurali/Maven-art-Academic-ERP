import { useSearchParams } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { formatTimeRange } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, EmptyState, QueryBoundary } from '@/shared/ui';
import { useTodaysClasses } from '../hooks/useAttendance';
import type { AttendanceClass } from '../types';
import { AttendanceRosterPanel } from './AttendanceRoster';

/**
 * Attendance (§21).
 *
 * The class list contains ONLY the classes the signed-in faculty member is
 * scheduled to teach — there is no batch picker, so there is no way to mark
 * attendance for a class you are not assigned to. Choosing a class loads its
 * roster; the backend re-authorises on submit (§6).
 *
 * A user with `attendance.view` but no assigned classes (e.g. an administrator)
 * simply sees the empty state — reporting views are a separate concern.
 */
export function AttendancePage() {
  const query = useTodaysClasses();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('class') ?? '';

  function selectClass(id: string) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('class', id);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Mark attendance for your scheduled classes today."
      />

      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {query.data && query.data.length === 0 ? (
          <Card>
            <EmptyState
              title="No classes to mark today"
              description="Attendance can be marked by the faculty assigned to a class. You have no scheduled classes today."
            />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
            <Card className="h-max">
              <CardBody className="p-2">
                <ul className="flex flex-col gap-1">
                  {(query.data ?? []).map((cls) => (
                    <li key={cls.id}>
                      <ClassButton
                        cls={cls}
                        active={cls.id === selectedId}
                        onSelect={() => selectClass(cls.id)}
                      />
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                {selectedId ? (
                  <AttendanceRosterPanel classId={selectedId} />
                ) : (
                  <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
                    <CalendarCheck className="size-6 text-[var(--text-subtle)]" aria-hidden="true" />
                    <p className="text-body text-[var(--text-muted)]">
                      Select a class to view and mark its attendance.
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </QueryBoundary>
    </>
  );
}

function ClassButton({
  cls,
  active,
  onSelect,
}: {
  cls: AttendanceClass;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex w-full flex-col gap-0.5 rounded-control px-3 py-2 text-left transition-colors',
        active
          ? 'bg-[var(--accent-surface)] text-[var(--accent)]'
          : 'hover:bg-[var(--surface-hover)]',
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-body font-medium">{cls.subject}</span>
        {cls.marked && <Badge tone="success">Done</Badge>}
      </span>
      <span className="truncate text-body-sm text-[var(--text-muted)]">{cls.batch}</span>
      <span className="text-caption text-[var(--text-subtle)]">
        {formatTimeRange(cls.start, cls.end)} · {cls.studentCount} students
      </span>
    </button>
  );
}
