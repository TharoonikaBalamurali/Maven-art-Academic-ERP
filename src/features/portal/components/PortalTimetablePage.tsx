import { PageHeader } from '@/shared/layout/page';
import { Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { usePortalTimetable } from '../hooks/usePortal';
import type { PortalTimetable } from '../types';

const HEAD_CELL = 'px-4 py-2.5 text-left text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase';
const CELL = 'px-4 py-3 align-top';

/**
 * Portal timetable (§7) — the caller's weekly schedule as one table.
 *
 * Days are `tbody` groups under a single set of columns so the whole week
 * reads down one time axis, matching the tabular schedule on the dashboard.
 * The backend supplies each session already placed on its day; the frontend
 * only lays the rows out.
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
        loadingFallback={<Card><CardBody><Skeleton className="h-64 w-full" /></CardBody></Card>}
      >
        {query.data && <TimetableView timetable={query.data} />}
      </QueryBoundary>
    </>
  );
}

function TimetableView({ timetable }: { timetable: PortalTimetable }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-body">
          <caption className="sr-only">Weekly class schedule</caption>
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-sunken)]">
              <th scope="col" className={`${HEAD_CELL} w-40`}>Time</th>
              <th scope="col" className={HEAD_CELL}>Subject</th>
              <th scope="col" className={`${HEAD_CELL} w-52`}>Faculty</th>
              <th scope="col" className={`${HEAD_CELL} w-40`}>Room</th>
            </tr>
          </thead>

          {timetable.week.map((day) => (
            <tbody key={day.day} className="border-b border-[var(--border)] last:border-0">
              <tr className="bg-[var(--surface-hover)]">
                {/* The day heads its own group of rows. */}
                <th scope="colgroup" colSpan={4} className="px-4 py-2 text-left text-body-sm font-semibold text-[var(--text)]">
                  <span className="flex items-center justify-between gap-3">
                    {day.day}
                    <span className="font-normal text-caption text-[var(--text-muted)]">
                      {day.sessions.length === 0
                        ? 'No classes'
                        : `${day.sessions.length} ${day.sessions.length === 1 ? 'class' : 'classes'}`}
                    </span>
                  </span>
                </th>
              </tr>

              {day.sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`${CELL} text-body-sm text-[var(--text-subtle)]`}>
                    No classes scheduled.
                  </td>
                </tr>
              ) : (
                day.sessions.map((session, index) => (
                  <tr key={index} className="border-t border-[var(--border)] first:border-t-0">
                    <td className={`${CELL} tabular-nums text-[var(--text-muted)]`}>{session.time}</td>
                    <td className={`${CELL} font-medium text-[var(--text)]`}>{session.subject}</td>
                    <td className={`${CELL} text-[var(--text-muted)]`}>{session.faculty}</td>
                    <td className={`${CELL} text-[var(--text-muted)]`}>{session.room}</td>
                  </tr>
                ))
              )}
            </tbody>
          ))}
        </table>
      </div>
    </Card>
  );
}
