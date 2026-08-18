import { Award, BookOpen, CalendarDays, ClipboardCheck, UsersRound, Wallet } from 'lucide-react';
import { useCurrentIdentity } from '@/features/auth/hooks';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import {
  ActivityList,
  DashboardGrid,
  EmptyWidget,
  QuickAction,
  SummaryCard,
  WidgetCard,
} from '@/shared/dashboard';
import { PageHeader } from '@/shared/layout/PageHeader';

/**
 * Student / Parent dashboard — FOUNDATION, not a delivered module.
 *
 * Student and parent share one portal architecture but see different
 * dashboards (§13). The difference is driven entirely by permissions, not by a
 * role check: the parent-only sections below are gated on
 * `portal.children.view`, which the backend grants only to parents (§8).
 *
 * No child, course, fee or attendance data is fabricated. The parent student
 * switcher renders its empty state until the backend supplies the
 * parent→student links.
 */
const SUMMARY_NOTE = 'Connected to the backend in Phase 6';

export function StudentParentDashboard() {
  const identity = useCurrentIdentity();

  return (
    <>
      <PageHeader
        title={`Hello, ${identity.profile.displayName}`}
        description="Your dashboard is delivered in Phase 6. Navigation, permissions and layout are already active."
      />

      {/* Parent-only. Selecting a student will change the contextual data shown
          across the whole portal; the client-side seam for that selection
          already exists in the UI store (`selectedStudentId`).
          TBD — BACKEND CONTRACT: linked students come from `parent_students`. */}
      <PermissionGuard permission="portal.children.view">
        <div className="mb-4">
          <WidgetCard
            title="My Children"
            description="Students linked to your account, as determined by the backend."
          >
            <EmptyWidget label="Linked students will appear here once the backend provides them." />
          </WidgetCard>
        </div>
      </PermissionGuard>

      <DashboardGrid className="mb-4">
        <PermissionGuard permission="portal.attendance.view">
          <SummaryCard
            label="Attendance"
            icon={ClipboardCheck}
            state="unavailable"
            note={SUMMARY_NOTE}
            to="/portal/attendance"
          />
        </PermissionGuard>
        <PermissionGuard permission="portal.fees.view">
          <SummaryCard
            label="Fee Status"
            icon={Wallet}
            state="unavailable"
            note={SUMMARY_NOTE}
            to="/portal/fees"
          />
        </PermissionGuard>
        <PermissionGuard permission="portal.academic.view">
          <SummaryCard
            label="Course"
            icon={BookOpen}
            state="unavailable"
            note={SUMMARY_NOTE}
            to="/portal/course"
          />
        </PermissionGuard>
        <PermissionGuard permission="portal.certificates.view">
          <SummaryCard
            label="Certificates"
            icon={Award}
            state="unavailable"
            note={SUMMARY_NOTE}
            to="/portal/certificates"
          />
        </PermissionGuard>
      </DashboardGrid>

      <DashboardGrid>
        <PermissionGuard permission="portal.timetable.view">
          <WidgetCard title="Today's schedule" description="From the published timetable." span={2}>
            <ActivityList entries={[]} emptyLabel="No classes to show yet." />
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
            <PermissionGuard permission="portal.children.view">
              <QuickAction label="My Children" icon={UsersRound} to="/portal/children" />
            </PermissionGuard>
          </div>
        </WidgetCard>
      </DashboardGrid>
    </>
  );
}
