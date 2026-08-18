import { Link } from 'react-router-dom';
import { ClipboardCheck, Layers, Users, Wallet } from 'lucide-react';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { formatCurrency, formatDate, formatNumber, formatPercent, formatTimeRange } from '@/lib/utils/format';
import {
  ActivityList,
  DashboardGrid,
  EmptyWidget,
  SummaryCard,
  WidgetCard,
  type ListEntry,
} from '@/shared/dashboard';
import { Badge, DataTable, type Column } from '@/shared/ui';
import type { AdminDashboard as AdminDashboardData } from '../types';

/**
 * Admin dashboard (§13) — operational overview.
 *
 * Answers "what is happening?" and "what needs attention?": institution-wide
 * counts, the admissions pipeline backlog, today's classes, and recent
 * admissions. Table-first for the admissions list; compact summaries elsewhere.
 * Each widget is permission-gated even though the layout is role-selected.
 */
type Admission = AdminDashboardData['recentAdmissions'][number];

const admissionColumns: readonly Column<Admission>[] = [
  { id: 'name', header: 'Student', cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: 'programme', header: 'Programme', hideBelowMd: true, cell: (row) => row.programme },
  {
    id: 'admittedAt',
    header: 'Admitted',
    align: 'right',
    width: '10rem',
    cell: (row) => (
      <time dateTime={row.admittedAt} className="text-[var(--text-muted)]">
        {formatDate(row.admittedAt)}
      </time>
    ),
  },
];

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const { kpis } = data;

  const attentionItems: ListEntry[] = [
    { id: 'enq', primary: 'Pending enquiries', meta: formatNumber(kpis.pendingEnquiries), tone: 'accent' },
    { id: 'app', primary: 'Applications to review', meta: formatNumber(kpis.pendingApplications), tone: 'accent' },
    { id: 'out', primary: 'Outstanding fees', meta: formatCurrency(kpis.outstandingFees) },
  ];

  const scheduleEntries: ListEntry[] = data.upcomingClasses.map((cls) => ({
    id: cls.id,
    primary: cls.subject,
    secondary: `${cls.batch} · ${cls.room}`,
    meta: formatTimeRange(cls.start, cls.end),
  }));

  return (
    <>
      <DashboardGrid className="mb-4">
        <PermissionGuard permission="students.view">
          <SummaryCard label="Total Students" value={formatNumber(kpis.totalStudents)} icon={Users} to="/management/students" />
        </PermissionGuard>
        <PermissionGuard permission="batches.view">
          <SummaryCard label="Active Batches" value={formatNumber(kpis.activeBatches)} icon={Layers} to="/management/batches" />
        </PermissionGuard>
        <PermissionGuard permission="attendance.view">
          <SummaryCard label="Today's Attendance" value={formatPercent(kpis.todaysAttendancePct)} icon={ClipboardCheck} to="/management/attendance" />
        </PermissionGuard>
        <PermissionGuard permission="payments.view">
          <SummaryCard label="Collection (This Month)" value={formatCurrency(kpis.feeCollectionThisMonth)} icon={Wallet} to="/management/payments" />
        </PermissionGuard>
      </DashboardGrid>

      <DashboardGrid>
        <WidgetCard title="Needs attention" description="Items waiting on the operations team." span={2}>
          <ActivityList entries={attentionItems} />
          <div className="mt-3 flex flex-wrap gap-2">
            <PermissionGuard permission="enquiries.view">
              <Link to="/management/enquiries" className="text-body-sm text-[var(--accent)] underline underline-offset-2">
                Review enquiries
              </Link>
            </PermissionGuard>
            <PermissionGuard permission="applications.view">
              <Link to="/management/applications" className="text-body-sm text-[var(--accent)] underline underline-offset-2">
                Review applications
              </Link>
            </PermissionGuard>
          </div>
        </WidgetCard>

        <WidgetCard
          title="Today's classes"
          description="Scheduled sessions across the academy."
          span={2}
          actions={
            <PermissionGuard permission="timetable.view">
              <Link to="/management/timetable" className="text-body-sm text-[var(--accent)]">
                Timetable
              </Link>
            </PermissionGuard>
          }
        >
          {scheduleEntries.length > 0 ? (
            <ActivityList entries={scheduleEntries} />
          ) : (
            <EmptyWidget label="No classes scheduled today." />
          )}
        </WidgetCard>

        <PermissionGuard permission="admissions.view">
          <WidgetCard
            title="Recent admissions"
            description="Newly admitted students."
            span={4}
            actions={<Badge tone="success">{data.recentAdmissions.length}</Badge>}
          >
            {data.recentAdmissions.length > 0 ? (
              <div className="-mx-4 -mb-4">
                <DataTable
                  caption="Recent admissions"
                  columns={admissionColumns}
                  rows={data.recentAdmissions}
                  rowKey={(row) => row.id}
                  density="compact"
                />
              </div>
            ) : (
              <EmptyWidget label="No recent admissions." />
            )}
          </WidgetCard>
        </PermissionGuard>
      </DashboardGrid>
    </>
  );
}
