import { Link } from 'react-router-dom';
import { Award, BookOpen, CalendarDays, ClipboardCheck, FileBarChart, UsersRound, Wallet } from 'lucide-react';
import { useCurrentIdentity } from '@/features/auth/hooks';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { usePortalOverview } from '@/features/portal/hooks/usePortal';
import { formatCurrency } from '@/lib/utils/format';
import {
  ActivityList,
  DashboardGrid,
  EmptyWidget,
  QuickAction,
  SummaryCard,
  WidgetCard,
} from '@/shared/dashboard';
import { PageHeader } from '@/shared/layout/page';

/**
 * Student / Parent dashboard (§7, §13, §37).
 *
 * Student and parent share one portal architecture but see different dashboards,
 * driven by permissions rather than a role check: parent-only sections are gated
 * on `portal.children.view`, which the backend grants only to parents (§8). All
 * figures are scoped to the caller by the backend and rendered verbatim.
 */
export function StudentParentDashboard() {
  const identity = useCurrentIdentity();
  const query = usePortalOverview();
  const overview = query.data;
  const cardState = query.isPending ? 'loading' : query.isError ? 'unavailable' : 'ready';

  return (
    <>
      <PageHeader
        title={`Hello, ${identity.profile.displayName}`}
        description={overview ? `${overview.student.course} · ${overview.student.batch}` : 'Your academic and fee overview.'}
      />

      {/* Parent-only. The whole portal is scoped to the selected child (§8). */}
      <PermissionGuard permission="portal.children.view">
        <div className="mb-4">
          <WidgetCard
            title="My Children"
            description="The portal shows the records of the child selected here."
            actions={
              <Link to="/portal/children" className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                Switch child
              </Link>
            }
          >
            {overview ? (
              <p className="text-body text-[var(--text)]">
                Currently viewing <span className="font-medium">{overview.student.name}</span> · {overview.student.course}
              </p>
            ) : (
              <EmptyWidget label="Select a child to view their records." />
            )}
          </WidgetCard>
        </div>
      </PermissionGuard>

      <DashboardGrid className="mb-4">
        <PermissionGuard permission="portal.attendance.view">
          <SummaryCard
            label="Attendance"
            icon={ClipboardCheck}
            state={cardState}
            value={overview?.attendance ? `${overview.attendance.percentage}%` : undefined}
            note={overview?.attendance ? `${overview.attendance.present} of ${overview.attendance.total} sessions` : undefined}
            to="/portal/attendance"
          />
        </PermissionGuard>
        <PermissionGuard permission="portal.fees.view">
          <SummaryCard
            label="Outstanding fees"
            icon={Wallet}
            state={cardState}
            value={overview?.fees ? formatCurrency(overview.fees.outstanding) : undefined}
            note={overview?.fees ? (overview.fees.outstanding > 0 ? 'Payment due' : 'All clear') : undefined}
            to="/portal/fees"
          />
        </PermissionGuard>
        <PermissionGuard permission="portal.academic.view">
          <SummaryCard
            label="Course"
            icon={BookOpen}
            state={cardState}
            value={overview?.student.course}
            to="/portal/course"
          />
        </PermissionGuard>
        <PermissionGuard permission="portal.progress.view">
          <SummaryCard
            label="Latest grade"
            icon={FileBarChart}
            state={cardState}
            value={overview?.latestGrade?.grade ?? undefined}
            note={overview?.latestGrade?.assessment}
            to="/portal/progress"
          />
        </PermissionGuard>
      </DashboardGrid>

      <DashboardGrid>
        <PermissionGuard permission="portal.timetable.view">
          <WidgetCard title="Next class" description="From the published timetable." span={2}>
            {overview?.nextClass ? (
              <ActivityList
                entries={[
                  {
                    id: 'next-class',
                    primary: overview.nextClass.subject,
                    secondary: `${overview.nextClass.day} · ${overview.nextClass.time}`,
                    meta: overview.nextClass.room,
                  },
                ]}
                emptyLabel="No classes to show yet."
              />
            ) : (
              <EmptyWidget label="No upcoming class." />
            )}
          </WidgetCard>
        </PermissionGuard>

        <WidgetCard title="Shortcuts" span={2}>
          <div className="grid gap-2 sm:grid-cols-2">
            <PermissionGuard permission="portal.timetable.view">
              <QuickAction label="Timetable" icon={CalendarDays} to="/portal/timetable" />
            </PermissionGuard>
            <PermissionGuard permission="portal.attendance.view">
              <QuickAction label="Attendance" icon={ClipboardCheck} to="/portal/attendance" />
            </PermissionGuard>
            <PermissionGuard permission="portal.fees.view">
              <QuickAction label="Fees" icon={Wallet} to="/portal/fees" />
            </PermissionGuard>
            <PermissionGuard permission="portal.certificates.view">
              <QuickAction label="Certificates" icon={Award} to="/portal/certificates" />
            </PermissionGuard>
            <PermissionGuard permission="portal.children.view">
              <QuickAction label="My Children" icon={UsersRound} to="/portal/children" />
            </PermissionGuard>
          </div>
        </WidgetCard>
      </DashboardGrid>
    </>
  );
}
