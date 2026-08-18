import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  Layers,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { useCurrentIdentity, usePermissions } from '@/features/auth/hooks';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import {
  ActivityList,
  DashboardGrid,
  QuickAction,
  SummaryCard,
  WidgetCard,
} from '@/shared/dashboard';
import { PageHeader } from '@/shared/layout/PageHeader';
import { Badge } from '@/shared/ui';

/**
 * Management dashboard — FOUNDATION, not a delivered module.
 *
 * The specification's widget list (§13) is role-specific and is delivered in
 * Phase 2. What exists here is the dashboard *system*: grid, summary cards,
 * quick actions and widget states, each permission-gated.
 *
 * Every metric renders in the `unavailable` state. No number on this page is
 * invented — the cards show what the layout will look like and say plainly
 * that the value comes from the backend later.
 */
const SUMMARY_NOTE = 'Connected to the backend in Phase 2';

export function ManagementDashboard() {
  const identity = useCurrentIdentity();
  const { permissionSet } = usePermissions();
  const permissions = [...permissionSet].sort();

  return (
    <>
      <PageHeader
        title={`Welcome, ${identity.profile.displayName}`}
        description="Dashboard widgets are delivered in Phase 2. This page establishes the dashboard system and verifies your session."
      />

      <DashboardGrid className="mb-4">
        <PermissionGuard permission="students.view">
          <SummaryCard
            label="Total Students"
            icon={Users}
            state="unavailable"
            note={SUMMARY_NOTE}
            to="/management/students"
          />
        </PermissionGuard>
        <PermissionGuard permission="batches.view">
          <SummaryCard
            label="Active Batches"
            icon={Layers}
            state="unavailable"
            note={SUMMARY_NOTE}
            to="/management/batches"
          />
        </PermissionGuard>
        <PermissionGuard permission="attendance.view">
          <SummaryCard
            label="Today's Attendance"
            icon={ClipboardCheck}
            state="unavailable"
            note={SUMMARY_NOTE}
            to="/management/attendance"
          />
        </PermissionGuard>
        <PermissionGuard permission="payments.view">
          <SummaryCard
            label="Fee Collection"
            icon={Wallet}
            state="unavailable"
            note={SUMMARY_NOTE}
            to="/management/payments"
          />
        </PermissionGuard>
      </DashboardGrid>

      <DashboardGrid>
        <WidgetCard
          title="Quick actions"
          description="Only actions your permissions allow are shown."
          span={2}
        >
          <div className="grid gap-2">
            <PermissionGuard permission="students.create">
              <QuickAction
                label="Add student"
                description="Create a new student record"
                icon={UserPlus}
                to="/management/students/new"
              />
            </PermissionGuard>
            <PermissionGuard permission="attendance.mark">
              <QuickAction
                label="Mark attendance"
                description="For batches assigned to you"
                icon={ClipboardCheck}
                to="/management/attendance"
              />
            </PermissionGuard>
            <PermissionGuard permission="enquiries.create">
              <QuickAction
                label="Record enquiry"
                description="Start the admissions flow"
                icon={FileText}
                to="/management/enquiries"
              />
            </PermissionGuard>
            <PermissionGuard permission="payments.create">
              <QuickAction
                label="Record payment"
                description="Against an assigned fee"
                icon={Wallet}
                to="/management/payments"
              />
            </PermissionGuard>
            <PermissionGuard permission="timetable.view">
              <QuickAction
                label="View timetable"
                description="Day, week and batch views"
                icon={CalendarDays}
                to="/management/timetable"
              />
            </PermissionGuard>
          </div>
        </WidgetCard>

        <WidgetCard
          title="Recent activity"
          description="Supplied by the backend audit trail."
          span={2}
        >
          {/* Genuinely empty: no activity endpoint exists yet. This is the
              empty state a real feed will use, not placeholder content. */}
          <ActivityList entries={[]} emptyLabel="No activity to show yet." />
        </WidgetCard>

        <WidgetCard
          title="Your permissions"
          description="Returned by the backend and used to build navigation and route guards."
          actions={<Badge tone="accent">{permissions.length}</Badge>}
          span={4}
        >
          <ul className="flex flex-wrap gap-1.5">
            {permissions.map((permission) => (
              <li key={permission}>
                <code className="rounded-control bg-[var(--surface-sunken)] px-1.5 py-0.5 font-mono text-caption text-[var(--text-muted)]">
                  {permission}
                </code>
              </li>
            ))}
          </ul>
        </WidgetCard>
      </DashboardGrid>
    </>
  );
}
