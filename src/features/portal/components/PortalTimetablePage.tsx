import { PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { usePortalTimetable } from '../hooks/usePortal';
import type { PortalTimetable, PortalTimetableDay, PortalTimetableSession } from '../types';

/**
 * Portal timetable (§7) — the caller's weekly schedule as a day board.
 *
 * Laid out as one column per teaching day with a card for each class, matching
 * the management and faculty timetables so every schedule in the product reads
 * the same way. The backend supplies each session already placed on its day;
 * the frontend only lays the columns out — it never computes the schedule.
 */
export function PortalTimetablePage() {
  const query = usePortalTimetable();
  return (
    <>
      <PageHeader title="Timetable" description="Your weekly class schedule." />
      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingFallback={<BoardSkeleton />}
      >
        {query.data && <TimetableBoard timetable={query.data} />}
      </QueryBoundary>
    </>
  );
}

function TimetableBoard({ timetable }: { timetable: PortalTimetable }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {timetable.week.map((day) => (
        <DayColumn key={day.day} day={day} />
      ))}
    </div>
  );
}

function DayColumn({ day }: { day: PortalTimetableDay }) {
  return (
    <section className="flex flex-col gap-2" aria-label={day.day}>
      <h2 className="rounded-control bg-[var(--surface-sunken)] px-3 py-1.5 text-body-sm font-semibold text-[var(--text)]">
        {day.day}
        <span className="ml-1 font-normal text-[var(--text-subtle)]">({day.sessions.length})</span>
      </h2>
      {day.sessions.length === 0 ? (
        <p className="px-3 py-4 text-body-sm text-[var(--text-subtle)]">No classes</p>
      ) : (
        day.sessions.map((session, index) => <SessionCard key={index} session={session} />)
      )}
    </section>
  );
}

function SessionCard({ session }: { session: PortalTimetableSession }) {
  return (
    <article className="surface-card flex flex-col gap-1 border-l-2 border-l-[var(--accent)] p-3">
      <p className="text-body font-medium text-[var(--text)]">{session.subject}</p>
      <p className="text-body-sm text-[var(--text-muted)]">{session.time}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral">{session.room}</Badge>
      </div>
      <p className="mt-0.5 text-caption text-[var(--text-subtle)]">{session.faculty}</p>
    </article>
  );
}

function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-8 w-full" />
          <Card><CardBody><Skeleton className="h-20 w-full" /></CardBody></Card>
          <Card><CardBody><Skeleton className="h-20 w-full" /></CardBody></Card>
        </div>
      ))}
    </div>
  );
}
