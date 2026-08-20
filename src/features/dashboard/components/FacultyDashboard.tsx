import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, Clock, Trophy } from 'lucide-react';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { formatNumber } from '@/lib/utils/format';
import { StatTile } from '@/shared/dashboard';
import { ContentSection } from '@/shared/layout/page';
import { Badge, Card, CardBody, type BadgeTone } from '@/shared/ui';
import type { FacultyActivityStatus, FacultyBatchProgress, FacultyDashboard as FacultyDashboardData } from '../types';

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  done: { label: 'Completed', tone: 'success' },
  now: { label: 'In progress', tone: 'warning' },
  upcoming: { label: 'Not started', tone: 'neutral' },
};
function statusOf(s: FacultyActivityStatus) {
  return STATUS[s] ?? { label: String(s), tone: 'neutral' as BadgeTone };
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m} min`;
}

/** Thin progress bar with an inline count. */
function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
      </div>
      {label !== undefined && <p className="mt-1 text-right text-caption tabular-nums text-[var(--text-muted)]">{label}</p>}
    </div>
  );
}

/** A batch's syllabus-coverage card (the reference's subject-progress cards). */
function BatchCard({ batch }: { batch: FacultyBatchProgress }) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-[var(--text)]">{batch.name}</p>
              <Badge tone="accent">{`Section ${batch.section}`}</Badge>
            </div>
            <p className="mt-0.5 text-body-sm text-[var(--text-muted)]">{batch.course}</p>
          </div>
          <PermissionGuard permission="batches.view">
            <Link to={`/management/batches/${batch.id}`} className="shrink-0 text-body-sm font-medium text-[var(--accent)] hover:underline">
              View batch
            </Link>
          </PermissionGuard>
        </div>

        <ul className="flex flex-col gap-1 text-body-sm text-[var(--text)]">
          {batch.subjects.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ProgressBar value={batch.covered} max={batch.total} />
          </div>
          <span className="inline-flex items-center gap-1 text-body-sm font-medium tabular-nums text-[var(--text)]">
            <Trophy className="size-3.5 text-[var(--warning)]" aria-hidden="true" />
            {batch.covered}/{batch.total}
          </span>
        </div>
        <p className="text-body-sm text-[var(--text-muted)]">
          Next up: <span className="text-[var(--text)]">{batch.nextUp}</span> · {formatNumber(batch.studentCount)} students
        </p>
      </CardBody>
    </Card>
  );
}

/**
 * Faculty dashboard (§13) — teaching overview in the institution's visual
 * language. Everything is scoped to the signed-in faculty member's assigned
 * batches (§6): headline teaching KPIs, per-batch syllabus coverage, today's
 * classes as activity cards, and the week's schedule as a day board. Every
 * figure is backend-provided; attendance actions start from a specific class
 * (§21), never a global "mark any batch" control.
 */
export function FacultyDashboard({ data }: { data: FacultyDashboardData }) {
  const { kpis } = data;

  return (
    <>
      {/* Headline teaching KPIs. */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PermissionGuard permission="attendance.view">
          <StatTile label="Attendance rate" value={`${kpis.attendanceRate}%`} icon={ClipboardCheck} tone="success" sub="Across recent sessions" to="/management/attendance" />
        </PermissionGuard>
        <StatTile label="Classes today" value={formatNumber(kpis.todaysClasses)} icon={CalendarDays} tone="accent" sub={`${formatNumber(kpis.assignedBatches)} batches`} />
        <StatTile label="Teaching time today" value={formatDuration(kpis.teachingMinutesToday)} icon={Clock} tone="info" sub={`${formatNumber(kpis.studentCount)} students`} />
      </div>

      {/* Batch coverage cards. */}
      {data.batches.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.batches.map((b) => (
            <BatchCard key={b.id} batch={b} />
          ))}
        </div>
      )}

      {/* Today's activity. */}
      <ContentSection
        title="Today's activity"
        actions={<span className="text-body-sm text-[var(--text-muted)]">Total time: {formatDuration(kpis.teachingMinutesToday)}</span>}
      >
        {data.todaysActivity.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.todaysActivity.map((a) => {
              const st = statusOf(a.status);
              return (
                <Card key={a.id}>
                  <CardBody className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--text)]">{a.subject}</p>
                        <p className="truncate text-body-sm text-[var(--text-muted)]">{a.batch}</p>
                      </div>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </div>
                    <p className="inline-flex items-center gap-1.5 text-body-sm text-[var(--text-muted)]">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {formatDuration(a.minutes)}
                    </p>
                    <ProgressBar value={a.done} max={a.total} label={`${a.done}/${a.total} marked`} />
                    <PermissionGuard permission="attendance.mark" fallback={<span className="text-body-sm text-[var(--text-subtle)]">View only</span>}>
                      <Link to="/management/attendance" className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                        {a.status === 'upcoming' ? 'View class' : 'Mark attendance'}
                      </Link>
                    </PermissionGuard>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardBody className="py-8 text-center text-body-sm text-[var(--text-subtle)]">No classes scheduled for you today.</CardBody>
          </Card>
        )}
      </ContentSection>

      {/* Weekly activity board. */}
      <PermissionGuard permission="timetable.view">
        <ContentSection
          title="Weekly activity"
          actions={
            <Link to="/management/timetable" className="text-body-sm text-[var(--accent)]">
              Full timetable
            </Link>
          }
        >
          {data.weeklyActivity.length > 0 ? (
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {data.weeklyActivity.map((day) => (
                <div key={day.day} className="w-56 shrink-0">
                  <Card className="h-full">
                    <CardBody className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[var(--text)]">{day.day}</p>
                        <span className="text-caption text-[var(--text-subtle)]">{formatDuration(day.totalMinutes)}</span>
                      </div>
                      <ul className="flex flex-col gap-2">
                        {day.items.map((it) => {
                          const st = statusOf(it.status);
                          return (
                            <li key={it.id} className="rounded-control border border-[var(--border)] p-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <p className="min-w-0 truncate text-body-sm font-medium text-[var(--text)]">{it.subject}</p>
                                <Badge tone={st.tone}>{st.label}</Badge>
                              </div>
                              <p className="mt-0.5 truncate text-caption text-[var(--text-muted)]">{it.batch}</p>
                            </li>
                          );
                        })}
                      </ul>
                    </CardBody>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardBody className="py-8 text-center text-body-sm text-[var(--text-subtle)]">No classes scheduled this week.</CardBody>
            </Card>
          )}
        </ContentSection>
      </PermissionGuard>
    </>
  );
}
