import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, Layers, Users } from 'lucide-react';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { formatDate, formatNumber, formatPercent, formatTimeRange } from '@/lib/utils/format';
import {
  ActivityList,
  DashboardGrid,
  EmptyWidget,
  SummaryCard,
  WidgetCard,
  type ListEntry,
} from '@/shared/dashboard';
import { Badge, DataTable, type Column } from '@/shared/ui';
import type { FacultyDashboard as FacultyDashboardData } from '../types';

/**
 * Faculty dashboard (§13) — teaching overview.
 *
 * Answers "what classes do I have?" and "what attendance is pending?". Every
 * figure is scoped to the signed-in faculty member's assigned batches (§6) —
 * there is no global view. The attendance actions start from a specific
 * scheduled class, honouring the Faculty → Assigned Batch → Scheduled Class →
 * Attendance flow (§21); there is no "mark attendance for any batch" control.
 */
type Recent = FacultyDashboardData['recentAttendance'][number];

const recentColumns: readonly Column<Recent>[] = [
  { id: 'subject', header: 'Class', cell: (row) => (
    <div className="min-w-0">
      <p className="truncate font-medium">{row.subject}</p>
      <p className="truncate text-body-sm text-[var(--text-muted)]">{row.batch}</p>
    </div>
  ) },
  { id: 'date', header: 'Date', hideBelowMd: true, width: '10rem', cell: (row) => <time dateTime={row.date}>{formatDate(row.date)}</time> },
  {
    id: 'present',
    header: 'Present',
    align: 'right',
    width: '9rem',
    cell: (row) => (
      <span>
        <span className="font-medium">{row.present}</span>
        <span className="text-[var(--text-muted)]">/{row.total}</span>
        <span className="ml-2 text-body-sm text-[var(--text-muted)]">
          {formatPercent((row.present / row.total) * 100)}
        </span>
      </span>
    ),
  },
];

export function FacultyDashboard({ data }: { data: FacultyDashboardData }) {
  const { kpis } = data;

  const scheduleEntries: ListEntry[] = data.todaysSchedule.map((cls) => ({
    id: cls.id,
    primary: cls.subject,
    secondary: `${cls.batch} · ${cls.room}`,
    meta: formatTimeRange(cls.start, cls.end),
  }));

  const pendingEntries: ListEntry[] = data.pendingAttendance.map((item) => ({
    id: item.id,
    primary: item.subject,
    secondary: item.batch,
    meta: formatDate(item.date),
    tone: 'accent',
  }));

  return (
    <>
      <DashboardGrid className="mb-4">
        <SummaryCard label="Today's Classes" value={formatNumber(kpis.todaysClasses)} icon={CalendarDays} to="/management/timetable" />
        <PermissionGuard permission="batches.view">
          <SummaryCard label="Assigned Batches" value={formatNumber(kpis.assignedBatches)} icon={Layers} to="/management/batches" />
        </PermissionGuard>
        <PermissionGuard permission="attendance.view">
          <SummaryCard
            label="Pending Attendance"
            value={formatNumber(kpis.pendingAttendance)}
            icon={ClipboardCheck}
            note={kpis.pendingAttendance > 0 ? 'Needs marking today' : 'All up to date'}
            to="/management/attendance"
          />
        </PermissionGuard>
        <PermissionGuard permission="students.view">
          <SummaryCard label="Students" value={formatNumber(kpis.studentCount)} icon={Users} to="/management/students" />
        </PermissionGuard>
      </DashboardGrid>

      <DashboardGrid>
        <WidgetCard
          title="Today's schedule"
          description="Your assigned classes for today."
          span={2}
          actions={
            <PermissionGuard permission="timetable.view">
              <Link to="/management/timetable" className="text-body-sm text-[var(--accent)]">
                My schedule
              </Link>
            </PermissionGuard>
          }
        >
          {scheduleEntries.length > 0 ? (
            <ActivityList entries={scheduleEntries} />
          ) : (
            <EmptyWidget label="No classes scheduled for you today." />
          )}
        </WidgetCard>

        <PermissionGuard permission="attendance.mark">
          <WidgetCard
            title="Attendance to mark"
            description="Classes awaiting your attendance."
            span={2}
            actions={<Badge tone={data.pendingAttendance.length > 0 ? 'warning' : 'success'}>{data.pendingAttendance.length}</Badge>}
          >
            {pendingEntries.length > 0 ? (
              <>
                <ActivityList entries={pendingEntries} />
                <Link
                  to="/management/attendance"
                  className="mt-3 inline-block text-body-sm text-[var(--accent)] underline underline-offset-2"
                >
                  Go to attendance
                </Link>
              </>
            ) : (
              <EmptyWidget label="Attendance is up to date." />
            )}
          </WidgetCard>
        </PermissionGuard>

        <PermissionGuard permission="attendance.view">
          <WidgetCard title="Recent attendance" description="Recently recorded sessions." span={4}>
            {data.recentAttendance.length > 0 ? (
              <div className="-mx-4 -mb-4">
                <DataTable
                  caption="Recent attendance"
                  columns={recentColumns}
                  rows={data.recentAttendance}
                  rowKey={(row) => row.id}
                  density="compact"
                />
              </div>
            ) : (
              <EmptyWidget label="No attendance recorded yet." />
            )}
          </WidgetCard>
        </PermissionGuard>
      </DashboardGrid>
    </>
  );
}
