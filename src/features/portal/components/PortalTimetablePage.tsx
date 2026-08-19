import { PageHeader } from '@/shared/layout/page';
import { Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { usePortalTimetable } from '../hooks/usePortal';
import type { PortalTimetable } from '../types';

/** Portal timetable (§7) — the caller's weekly schedule. */
export function PortalTimetablePage() {
  const query = usePortalTimetable();
  return (
    <>
      <PageHeader title="Timetable" description="Your weekly class schedule." />
      <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<Card><CardBody><Skeleton className="h-64 w-full" /></CardBody></Card>}>
        {query.data && <TimetableView timetable={query.data} />}
      </QueryBoundary>
    </>
  );
}

function TimetableView({ timetable }: { timetable: PortalTimetable }) {
  return (
    <div className="flex flex-col gap-3">
      {timetable.week.map((day) => (
        <Card key={day.day}>
          <CardBody className="flex flex-col gap-2">
            <p className="text-body font-semibold text-[var(--text)]">{day.day}</p>
            {day.sessions.length === 0 ? (
              <p className="text-body-sm text-[var(--text-subtle)]">No classes.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-[var(--border)]">
                {day.sessions.map((s, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium text-[var(--text)]">{s.subject}</p>
                      <p className="text-body-sm text-[var(--text-muted)]">{s.faculty} · {s.room}</p>
                    </div>
                    <span className="tabular-nums text-body-sm text-[var(--text-muted)]">{s.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
