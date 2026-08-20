import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  Layers,
  Megaphone,
  ShieldAlert,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { usePermissions } from '@/features/auth/hooks';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatTimeRange,
} from '@/lib/utils/format';
import {
  ActivityList,
  DashboardGrid,
  EmptyWidget,
  QuickAction,
  SummaryCard,
  WidgetCard,
  type ListEntry,
} from '@/shared/dashboard';
import { ContentSection } from '@/shared/layout/page';
import { Badge, Card, DataTable, type Column } from '@/shared/ui';
import type { PermissionKey } from '@/shared/types';
import type { AdminActionItem, AdminDashboard as AdminDashboardData } from '../types';

/**
 * Admin dashboard (§13) — operational overview.
 *
 * Answers "what is happening?" and "what needs attention?". It summarises the
 * whole institution (students, admissions, academics, finance, attendance,
 * student affairs, communication) and links into the detail modules — it is
 * never a module itself. Every figure is backend-computed and displayed
 * verbatim; every section is permission-gated even though the layout is
 * role-selected.
 */

/* -------------------------------------------------------------------------- */
/* Small presentational helpers (admin density; not shared to avoid touching  */
/* the other dashboards).                                                      */
/* -------------------------------------------------------------------------- */

/** A compact labelled figure inside a metric group. */
function Stat({ label, value, to, tone }: { label: string; value: string; to?: string; tone?: 'danger' }) {
  const body = (
    <>
      <dt className="text-caption font-medium tracking-wide text-[var(--text-muted)] uppercase">{label}</dt>
      <dd className={`mt-0.5 text-body-lg font-semibold tabular-nums ${tone === 'danger' ? 'text-[var(--danger)]' : 'text-[var(--text)]'}`}>
        {value}
      </dd>
    </>
  );
  return to ? (
    <Link to={to} className="block rounded-control px-1 -mx-1 py-0.5 hover:bg-[var(--surface-hover)]">
      {body}
    </Link>
  ) : (
    <div className="px-1 -mx-1 py-0.5">{body}</div>
  );
}

/** A titled group of stats with an optional "open module" footer link. */
function MetricGroup({
  title,
  icon: Icon,
  moduleLink,
  span = 2,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  moduleLink?: { to: string; label: string };
  span?: 1 | 2 | 3 | 4;
  children: ReactNode;
}) {
  return (
    <WidgetCard
      title={title}
      span={span}
      actions={Icon ? <Icon className="size-4 text-[var(--text-subtle)]" aria-hidden /> : undefined}
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">{children}</dl>
      {moduleLink && (
        <div className="mt-3 border-t border-[var(--border)] pt-2">
          <Link to={moduleLink.to} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
            {moduleLink.label} →
          </Link>
        </div>
      )}
    </WidgetCard>
  );
}

const PRIORITY_DOT: Record<AdminActionItem['priority'], string> = {
  high: 'bg-[var(--danger)]',
  medium: 'bg-[var(--warning)]',
  low: 'bg-[var(--border-strong)]',
};

/* -------------------------------------------------------------------------- */
/* Recent admissions table (kept from the original dashboard).                 */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const { kpis, students, academics, faculty, admissions, finance, attendance, studentAffairs, communication, documents } = data;
  const { can } = usePermissions();

  const scheduleEntries: ListEntry[] = data.upcomingClasses.map((cls) => ({
    id: cls.id,
    primary: cls.subject,
    secondary: `${cls.batch} · ${cls.room}`,
    meta: formatTimeRange(cls.start, cls.end),
  }));

  const activityEntries: ListEntry[] = data.recentActivity.map((entry) => ({
    id: entry.id,
    primary: entry.action,
    secondary: `${entry.entity} · ${entry.actor}`,
    meta: formatDateTime(entry.at),
  }));

  // Action-centre items the caller is permitted to see.
  const actionItems = data.actionCentre.filter((item) => can(item.permission as PermissionKey));

  return (
    <>
      {/* Headline KPIs — unchanged from the original contract. */}
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

      {/* Action centre — what needs attention now, prioritised. */}
      {actionItems.length > 0 && (
        <ContentSection title="Action centre" description="Items across the institution waiting on the operations team.">
          <Card>
            <ul className="divide-y divide-[var(--border)]">
              {actionItems.map((item) => {
                const row = (
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className={`size-2 shrink-0 rounded-full ${PRIORITY_DOT[item.priority]}`} aria-hidden />
                      <span className="truncate text-body text-[var(--text)]">{item.label}</span>
                      {!item.to && (
                        <span className="shrink-0 text-caption text-[var(--text-subtle)]">(module pending)</span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge tone={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'neutral'}>
                        {formatNumber(item.count)}
                      </Badge>
                    </span>
                  </div>
                );
                return (
                  <li key={item.id}>
                    {item.to ? (
                      <Link to={item.to} className="block hover:bg-[var(--surface-hover)]">
                        {row}
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </ContentSection>
      )}

      {/* Institutional overview — grouped metrics, each linking to its module. */}
      <PermissionGuard
        anyOf={[
          'students.view', 'enquiries.view', 'applications.view', 'admissions.view',
          'payments.view', 'outstanding.view', 'installments.view', 'attendance.view',
          'courses.view', 'batches.view', 'faculty.view', 'discipline.view', 'leave.view',
          'od.view', 'certificates.view', 'announcements.view',
        ]}
      >
      <ContentSection title="Institution overview">
        <DashboardGrid>
          <PermissionGuard permission="students.view">
            <MetricGroup title="Students" icon={Users} moduleLink={{ to: '/management/students', label: 'Manage students' }}>
              <Stat label="Total" value={formatNumber(students.total)} to="/management/students" />
              <Stat label="Active" value={formatNumber(students.active)} />
              <Stat label="New this month" value={formatNumber(students.newThisMonth)} />
              <Stat label="On leave" value={formatNumber(students.onLeave)} />
              <Stat label="Transferred" value={formatNumber(students.transferred)} />
              <Stat label="Withdrawn / done" value={formatNumber(students.withdrawn + students.completed)} />
            </MetricGroup>
          </PermissionGuard>

          <PermissionGuard anyOf={['enquiries.view', 'applications.view', 'admissions.view']}>
            <MetricGroup title="Admissions" icon={GraduationCap} moduleLink={{ to: '/management/admissions', label: 'Open admissions' }}>
              <Stat label="New enquiries" value={formatNumber(admissions.newEnquiries)} to="/management/enquiries" />
              <Stat label="Follow-ups due" value={formatNumber(admissions.followUpsDue)} to="/management/enquiries" />
              <Stat label="Pending apps" value={formatNumber(admissions.pendingApplications)} to="/management/applications" />
              <Stat label="Under review" value={formatNumber(admissions.underReview)} to="/management/applications" />
              <Stat label="Approved" value={formatNumber(admissions.approved)} to="/management/applications" />
              <Stat label="Pending enrollment" value={formatNumber(admissions.pendingEnrollment)} to="/management/enrollments" />
            </MetricGroup>
          </PermissionGuard>

          <PermissionGuard anyOf={['payments.view', 'outstanding.view', 'installments.view']}>
            <MetricGroup title="Finance" icon={Wallet} moduleLink={{ to: '/management/payments', label: 'View payments' }}>
              <Stat label="Today" value={formatCurrency(finance.todaysCollection)} />
              <Stat label="This month" value={formatCurrency(finance.monthlyCollection)} to="/management/payments" />
              <Stat label="Outstanding" value={formatCurrency(finance.outstandingTotal)} to="/management/outstanding" tone="danger" />
              <Stat label="With dues" value={formatNumber(finance.studentsWithOutstanding)} to="/management/outstanding" />
              <Stat label="Installments due" value={formatNumber(finance.installmentsDue)} to="/management/installments" />
              <Stat label="Overdue" value={formatNumber(finance.overdueInstallments)} to="/management/installments" tone="danger" />
            </MetricGroup>
          </PermissionGuard>

          <PermissionGuard permission="attendance.view">
            <MetricGroup title="Attendance today" icon={ClipboardCheck} moduleLink={{ to: '/management/attendance', label: 'Open attendance' }}>
              <Stat label="Rate" value={formatPercent(attendance.todaysPct)} />
              <Stat label="Present" value={formatNumber(attendance.present)} />
              <Stat label="Absent" value={formatNumber(attendance.absent)} />
              <Stat label="On leave" value={formatNumber(attendance.onLeave)} />
              <Stat label="Conducted" value={formatNumber(attendance.classesConducted)} />
              <Stat label="Not submitted" value={formatNumber(attendance.pendingSubmission)} tone={attendance.pendingSubmission > 0 ? 'danger' : undefined} />
            </MetricGroup>
          </PermissionGuard>

          <PermissionGuard anyOf={['courses.view', 'batches.view']}>
            <MetricGroup title="Academic structure" icon={BookOpen} moduleLink={{ to: '/management/courses', label: 'View courses' }}>
              <Stat label="Courses" value={formatNumber(academics.totalCourses)} to="/management/courses" />
              <Stat label="Active courses" value={formatNumber(academics.activeCourses)} />
              <Stat label="Batches" value={formatNumber(academics.totalBatches)} to="/management/batches" />
              <Stat label="Active batches" value={formatNumber(academics.activeBatches)} />
              <Stat label="Classes today" value={formatNumber(academics.classesToday)} to="/management/timetable" />
            </MetricGroup>
          </PermissionGuard>

          <PermissionGuard permission="faculty.view">
            <MetricGroup title="Faculty & staff" icon={Users} moduleLink={{ to: '/management/faculty', label: 'View faculty' }}>
              <Stat label="Total" value={formatNumber(faculty.total)} to="/management/faculty" />
              <Stat label="Active" value={formatNumber(faculty.active)} />
              <Stat label="Teaching today" value={formatNumber(faculty.teachingToday)} />
              <Stat label="Attendance pending" value={formatNumber(faculty.attendancePending)} tone={faculty.attendancePending > 0 ? 'danger' : undefined} />
            </MetricGroup>
          </PermissionGuard>

          <PermissionGuard anyOf={['discipline.view', 'leave.view', 'od.view']}>
            <MetricGroup title="Student affairs" icon={ShieldAlert}>
              <PermissionGuardStat show={can('discipline.view')} label="Discipline open" value={formatNumber(studentAffairs.disciplineOpen)} />
              <PermissionGuardStat show={can('discipline.view')} label="Under review" value={formatNumber(studentAffairs.disciplineUnderReview)} />
              <PermissionGuardStat show={can('discipline.view')} label="Action required" value={formatNumber(studentAffairs.disciplineActionRequired)} tone={studentAffairs.disciplineActionRequired > 0 ? 'danger' : undefined} />
              <PermissionGuardStat show={can('leave.view')} label="Leave pending" value={formatNumber(studentAffairs.leavePending)} />
              <PermissionGuardStat show={can('od.view')} label="OD pending" value={formatNumber(studentAffairs.odPending)} />
            </MetricGroup>
          </PermissionGuard>

          <PermissionGuard anyOf={['certificates.view', 'announcements.view']}>
            <MetricGroup title="Documents & communication" icon={Megaphone}>
              <PermissionGuardStat show={can('certificates.view')} label="Certificates issued" value={formatNumber(documents.certificatesIssued)} to="/management/certificates" />
              <PermissionGuardStat show={can('certificates.view')} label="Cert. requests" value={formatNumber(documents.certificateRequests)} to="/management/certificates" />
              <PermissionGuardStat show={can('announcements.view')} label="Announcements" value={formatNumber(communication.activeAnnouncements)} />
              <PermissionGuardStat show={can('announcements.view')} label="Scheduled" value={formatNumber(communication.scheduledAnnouncements)} />
              <PermissionGuardStat show={can('announcements.view')} label="Drafts" value={formatNumber(communication.draftAnnouncements)} />
            </MetricGroup>
          </PermissionGuard>
        </DashboardGrid>
      </ContentSection>
      </PermissionGuard>

      {/* Operational feeds. */}
      <PermissionGuard anyOf={['timetable.view', 'audit.view', 'admissions.view']}>
      <ContentSection title="Today & recent activity">
        <DashboardGrid>
          <PermissionGuard permission="timetable.view">
            <WidgetCard
              title="Today's classes"
              description="Scheduled sessions across the academy."
              span={2}
              actions={
                <Link to="/management/timetable" className="text-body-sm text-[var(--accent)]">
                  Timetable
                </Link>
              }
            >
              {scheduleEntries.length > 0 ? <ActivityList entries={scheduleEntries} /> : <EmptyWidget label="No classes scheduled today." />}
            </WidgetCard>
          </PermissionGuard>

          <PermissionGuard permission="audit.view">
            <WidgetCard
              title="Recent activity"
              description="Administrative actions recorded by the backend."
              span={2}
              actions={
                <Link to="/management/audit" className="text-body-sm text-[var(--accent)]">
                  Audit log
                </Link>
              }
            >
              {activityEntries.length > 0 ? <ActivityList entries={activityEntries} /> : <EmptyWidget label="No recent activity." />}
            </WidgetCard>
          </PermissionGuard>

          <PermissionGuard permission="admissions.view">
            <WidgetCard
              title="Recent admissions"
              description="Newly admitted students."
              span={4}
              actions={<Badge tone="success">{data.recentAdmissions.length}</Badge>}
            >
              {data.recentAdmissions.length > 0 ? (
                <div className="-mx-4 -mb-4">
                  <DataTable caption="Recent admissions" columns={admissionColumns} rows={data.recentAdmissions} rowKey={(row) => row.id} density="compact" />
                </div>
              ) : (
                <EmptyWidget label="No recent admissions." />
              )}
            </WidgetCard>
          </PermissionGuard>
        </DashboardGrid>
      </ContentSection>
      </PermissionGuard>

      {/* Quick actions & reports. */}
      <PermissionGuard
        anyOf={['students.create', 'enquiries.create', 'applications.review', 'payments.create', 'certificates.issue', 'timetable.view', 'reports.view']}
      >
      <ContentSection title="Quick actions">
        <DashboardGrid>
          <PermissionGuard anyOf={['students.create', 'enquiries.create', 'applications.review', 'payments.create', 'certificates.issue', 'timetable.view']}>
          <WidgetCard title="Create & review" span={3}>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <PermissionGuard permission="students.create">
                <QuickAction label="Add student" icon={UserPlus} to="/management/students/new" />
              </PermissionGuard>
              <PermissionGuard permission="enquiries.create">
                <QuickAction label="Add enquiry" icon={GraduationCap} to="/management/enquiries" />
              </PermissionGuard>
              <PermissionGuard permission="applications.review">
                <QuickAction label="Review applications" icon={ClipboardCheck} to="/management/applications" />
              </PermissionGuard>
              <PermissionGuard permission="payments.create">
                <QuickAction label="Record payment" icon={Wallet} to="/management/payments" />
              </PermissionGuard>
              <PermissionGuard permission="certificates.issue">
                <QuickAction label="Issue certificate" icon={Award} to="/management/certificates" />
              </PermissionGuard>
              <PermissionGuard permission="timetable.view">
                <QuickAction label="View timetable" icon={CalendarDays} to="/management/timetable" />
              </PermissionGuard>
            </div>
          </WidgetCard>
          </PermissionGuard>

          <PermissionGuard permission="reports.view">
            <WidgetCard title="Reports" description="Management analytics." span={1} actions={<FileBarChart className="size-4 text-[var(--text-subtle)]" aria-hidden />}>
              <div className="flex flex-col gap-2">
                <Link to="/management/reports" className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                  All reports →
                </Link>
                <p className="text-body-sm text-[var(--text-muted)]">Students, admissions, attendance, finance and academic reports.</p>
              </div>
            </WidgetCard>
          </PermissionGuard>
        </DashboardGrid>
      </ContentSection>
      </PermissionGuard>
    </>
  );
}

/** A `Stat` that only renders when the caller holds the relevant permission. */
function PermissionGuardStat({ show, ...props }: { show: boolean } & Parameters<typeof Stat>[0]) {
  return show ? <Stat {...props} /> : null;
}
