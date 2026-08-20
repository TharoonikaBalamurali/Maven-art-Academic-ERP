import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileBarChart,
  ChevronRight,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { useCurrentIdentity } from '@/features/auth/hooks';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { usePortalOverview } from '@/features/portal/hooks/usePortal';
import { PortalCalendar } from '@/features/portal/components/PortalCalendar';
import { PayFeesButton } from '@/features/portal/components/PayFees';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { QuickAction, SummaryCard, WidgetCard } from '@/shared/dashboard';
import { Badge, Card, CardBody, ErrorState } from '@/shared/ui';
import type { PortalOverview } from '@/features/portal/types';

/**
 * Student / Parent dashboard (§7, §8, §13, §37).
 *
 * The consumer-facing home of the portal: a warm greeting, the figures a
 * student or parent checks daily (attendance, fees, grades, today's classes),
 * quick links, upcoming activities, notifications and reminders. Student and
 * parent share this layout; parent-only affordances (the child switcher) are
 * gated on `portal.children.view`, and every figure is backend-scoped to the
 * caller / selected child and rendered verbatim (§8).
 */

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function firstName(full: string): string {
  return full.split(' ')[0] ?? full;
}

export function StudentParentDashboard() {
  const identity = useCurrentIdentity();
  const query = usePortalOverview();
  const overview = query.data;

  if (query.isError) {
    return <ErrorState title="Unable to load your dashboard" onRetry={() => void query.refetch()} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Main column */}
      <div className="flex flex-col gap-4 lg:col-span-2">
        <HeroBanner name={firstName(identity.profile.displayName)} overview={overview} loading={query.isPending} />

        {/* Headline figures */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <PermissionGuard permission="portal.attendance.view">
            <SummaryCard
              label="Attendance"
              icon={ClipboardCheck}
              state={query.isPending ? 'loading' : 'ready'}
              value={overview?.attendance ? `${overview.attendance.percentage}%` : '—'}
              note={overview?.attendance ? `${overview.attendance.present}/${overview.attendance.total} sessions` : undefined}
              to="/portal/attendance"
            />
          </PermissionGuard>
          <PermissionGuard permission="portal.fees.view">
            <SummaryCard
              label="Fees due"
              icon={Wallet}
              state={query.isPending ? 'loading' : 'ready'}
              value={overview?.fees ? formatCurrency(overview.fees.outstanding) : '—'}
              note={overview?.fees ? (overview.fees.outstanding > 0 ? 'Payment pending' : 'All cleared') : undefined}
              to="/portal/fees"
            />
          </PermissionGuard>
          <PermissionGuard permission="portal.progress.view">
            <SummaryCard
              label="Latest grade"
              icon={FileBarChart}
              state={query.isPending ? 'loading' : 'ready'}
              value={overview?.latestGrade?.grade ?? '—'}
              note={overview?.latestGrade?.assessment}
              to="/portal/progress"
            />
          </PermissionGuard>
          <SummaryCard
            label="Pending tasks"
            icon={CalendarDays}
            state={query.isPending ? 'loading' : 'ready'}
            value={overview ? String(overview.pendingTasks) : '—'}
            note={overview && overview.pendingTasks > 0 ? 'Need your attention' : 'You are all caught up'}
          />
        </div>

        {/* Quick links */}
        <WidgetCard title="Quick links">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <PermissionGuard permission="portal.timetable.view">
              <QuickAction label="Timetable" icon={CalendarDays} to="/portal/timetable" />
            </PermissionGuard>
            <PermissionGuard permission="portal.attendance.view">
              <QuickAction label="Attendance" icon={ClipboardCheck} to="/portal/attendance" />
            </PermissionGuard>
            <PermissionGuard permission="portal.progress.view">
              <QuickAction label="Progress" icon={FileBarChart} to="/portal/progress" />
            </PermissionGuard>
            <PermissionGuard permission="portal.academic.view">
              <QuickAction label="Course" icon={BookOpen} to="/portal/course" />
            </PermissionGuard>
            <PermissionGuard permission="portal.fees.view">
              <QuickAction label="Fees" icon={Wallet} to="/portal/fees" />
            </PermissionGuard>
            <PermissionGuard permission="portal.payments.view">
              <QuickAction label="Payments" icon={CreditCard} to="/portal/payments" />
            </PermissionGuard>
            <PermissionGuard permission="portal.certificates.view">
              <QuickAction label="Certificates" icon={Award} to="/portal/certificates" />
            </PermissionGuard>
            <PermissionGuard permission="portal.children.view">
              <QuickAction label="My children" icon={UsersRound} to="/portal/children" />
            </PermissionGuard>
          </div>
        </WidgetCard>

        {/* Activities + performance */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <WidgetCard
            title="Upcoming activities"
            actions={
              <Link to="/portal/timetable" className="text-body-sm text-[var(--accent)]">
                View all
              </Link>
            }
          >
            {overview && overview.upcomingActivities.length > 0 ? (
              <ul className="flex flex-col divide-y divide-[var(--border)]">
                {overview.upcomingActivities.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                    <DateChip iso={a.date} />
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-[var(--text)]">{a.title}</p>
                      <p className="truncate text-body-sm text-[var(--text-muted)]">{a.meta}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-body-sm text-[var(--text-subtle)]">Nothing scheduled.</p>
            )}
          </WidgetCard>

          <PermissionGuard permission="portal.fees.view">
            <WidgetCard
              title="Fee summary"
              actions={
                <Link to="/portal/fees" className="text-body-sm text-[var(--accent)]">
                  Details
                </Link>
              }
            >
              {overview?.fees ? <FeeSummary fees={overview.fees} studentName={overview.student.name} /> : <p className="py-6 text-center text-body-sm text-[var(--text-subtle)]">No fee data.</p>}
            </WidgetCard>
          </PermissionGuard>

          <PermissionGuard permission="portal.progress.view">
            <WidgetCard
              title="Recent grades"
              actions={
                <Link to="/portal/progress" className="text-body-sm text-[var(--accent)]">
                  All results
                </Link>
              }
            >
              {overview && overview.recentGrades.length > 0 ? (
                <ul className="flex flex-col divide-y divide-[var(--border)]">
                  {overview.recentGrades.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                      <p className="min-w-0 truncate text-body text-[var(--text)]">{g.assessment}</p>
                      <Badge tone="accent">{g.grade}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-body-sm text-[var(--text-subtle)]">No results yet.</p>
              )}
            </WidgetCard>
          </PermissionGuard>

          <PermissionGuard permission="notifications.view">
            <NotificationsWidget />
          </PermissionGuard>
        </div>
      </div>

      {/* Right rail */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardBody>
            <PortalCalendar activityDates={overview?.upcomingActivities.map((a) => a.date) ?? []} />
          </CardBody>
        </Card>

        <PermissionGuard permission="portal.timetable.view">
          <WidgetCard
            title="Today's schedule"
            actions={
              <Link to="/portal/timetable" className="text-body-sm text-[var(--accent)]">
                Timetable
              </Link>
            }
          >
            {overview && overview.todaySchedule.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {overview.todaySchedule.map((s) => (
                  <li key={s.id} className="flex items-start gap-3 rounded-control px-2 -mx-2 py-1.5">
                    <span
                      className={`mt-1 block h-9 w-1 shrink-0 rounded-full ${
                        s.status === 'now' ? 'bg-[var(--accent)]' : s.status === 'done' ? 'bg-[var(--border-strong)]' : 'bg-[var(--warning)]'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-body font-medium text-[var(--text)]">{s.subject}</p>
                        {s.status === 'now' && <Badge tone="accent">Now</Badge>}
                      </div>
                      <p className="truncate text-body-sm text-[var(--text-muted)]">
                        {s.time} · {s.room}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-body-sm text-[var(--text-subtle)]">No classes today.</p>
            )}
          </WidgetCard>
        </PermissionGuard>

        <WidgetCard title="Reminders">
          {overview && overview.reminders.length > 0 ? (
            <ul className="flex flex-col divide-y divide-[var(--border)]">
              {overview.reminders.map((r) => {
                const inner = (
                  <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-[var(--text)]">{r.label}</p>
                      <p className="truncate text-body-sm text-[var(--text-muted)]">{r.detail}</p>
                    </div>
                    {r.to && <ChevronRight className="size-4 shrink-0 text-[var(--text-subtle)]" aria-hidden="true" />}
                  </div>
                );
                return (
                  <li key={r.id}>
                    {r.to ? (
                      <Link to={r.to} className="block rounded-control px-2 -mx-2 hover:bg-[var(--surface-hover)]">
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-body-sm text-[var(--text-subtle)]">No reminders.</p>
          )}
        </WidgetCard>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function HeroBanner({ name, overview, loading }: { name: string; overview?: PortalOverview; loading: boolean }) {
  const identity = useCurrentIdentity();
  const isParent = identityHasChildren(identity);
  const classesToday = overview?.todaySchedule.length ?? 0;
  const pending = overview?.pendingTasks ?? 0;

  return (
    <section className="overflow-hidden rounded-surface border border-[var(--border)] bg-[var(--accent-surface)]">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-page font-semibold tracking-tight text-[var(--text)]">
            {greeting()}, {name}! <span aria-hidden="true">👋</span>
          </h1>
          {overview ? (
            <>
              <p className="mt-1 text-body text-[var(--text-muted)]">
                {overview.student.course} · {overview.student.batch}
              </p>
              {!loading && (
                <p className="mt-2 text-body text-[var(--text)]">
                  You have <span className="font-semibold">{classesToday}</span> {classesToday === 1 ? 'class' : 'classes'} today
                  {pending > 0 && (
                    <>
                      {' '}and <span className="font-semibold">{pending}</span> pending {pending === 1 ? 'task' : 'tasks'}
                    </>
                  )}
                  .
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-body text-[var(--text-muted)]">Your academic and fee overview.</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <Link
            to="/portal/timetable"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-control bg-[var(--accent)] px-4 text-body font-medium text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)]"
          >
            View timetable
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
          {isParent && overview && (
            <span className="text-body-sm text-[var(--text-muted)]">
              Viewing <span className="font-medium text-[var(--text)]">{overview.student.name}</span> ·{' '}
              <Link to="/portal/children" className="text-[var(--accent)] hover:underline">
                Switch
              </Link>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function identityHasChildren(identity: ReturnType<typeof useCurrentIdentity>): boolean {
  return identity.permissions.includes('portal.children.view');
}

function DateChip({ iso }: { iso: string }) {
  const d = new Date(iso);
  const month = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  return (
    <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-control bg-[var(--surface-sunken)] leading-none">
      <span className="text-caption font-semibold text-[var(--text-muted)]">{month}</span>
      <span className="text-body font-semibold tabular-nums text-[var(--text)]">{day}</span>
    </div>
  );
}

function FeeSummary({ fees, studentName }: { fees: NonNullable<PortalOverview['fees']>; studentName: string }) {
  // Backend-authoritative figures; the bar visualises paid/assigned, it is not a
  // recomputation of the balance.
  const pct = fees.assigned > 0 ? Math.min(100, Math.round((fees.paid / fees.assigned) * 100)) : 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Outstanding</p>
          <p className="text-metric font-semibold tabular-nums text-[var(--text)]">{formatCurrency(fees.outstanding)}</p>
        </div>
        <Badge tone={fees.outstanding > 0 ? 'warning' : 'success'}>{fees.outstanding > 0 ? 'Due' : 'Paid'}</Badge>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]" role="presentation">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-body-sm text-[var(--text-muted)]">
        <span>Paid {formatCurrency(fees.paid)}</span>
        <span>of {formatCurrency(fees.assigned)}</span>
      </div>
      {fees.outstanding > 0 && (
        <div className="pt-1">
          <PayFeesButton outstanding={fees.outstanding} studentName={studentName} variant="secondary" size="sm" />
        </div>
      )}
    </div>
  );
}

function NotificationsWidget() {
  const query = useNotifications({ page: 1, limit: 4 });
  const items = query.data?.data ?? [];
  return (
    <WidgetCard
      title="Notifications"
      actions={
        <Link to="/portal/notifications" className="text-body-sm text-[var(--accent)]">
          View all
        </Link>
      }
    >
      {items.length > 0 ? (
        <ul className="flex flex-col divide-y divide-[var(--border)]">
          {items.map((n) => (
            <li key={n.id} className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
              <span
                className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-[var(--accent)]'}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="truncate text-body text-[var(--text)]">{n.title}</p>
                <p className="truncate text-body-sm text-[var(--text-muted)]">
                  {n.category} · {formatDate(n.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-body-sm text-[var(--text-subtle)]">No notifications.</p>
      )}
    </WidgetCard>
  );
}
