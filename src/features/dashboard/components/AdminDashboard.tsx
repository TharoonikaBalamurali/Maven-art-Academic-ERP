import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Layers,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { usePermissions } from '@/features/auth/hooks';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import {
  BarTrendChart,
  MiniCalendar,
  QuickAction,
  RingGauge,
  StatTile,
  WidgetCard,
  type BarSeries,
} from '@/shared/dashboard';
import { ContentSection } from '@/shared/layout/page';
import { Badge, Card } from '@/shared/ui';
import type { PermissionKey } from '@/shared/types';
import type { AdminActionItem, AdminDashboard as AdminDashboardData, TopPerformer } from '../types';

const ADMISSIONS_SERIES: BarSeries[] = [
  { key: 'enquiries', label: 'Enquiries', color: 'var(--chart-2)' },
  { key: 'admissions', label: 'Admissions', color: 'var(--chart-1)' },
];

const PRIORITY_DOT: Record<AdminActionItem['priority'], string> = {
  high: 'bg-[var(--danger)]',
  medium: 'bg-[var(--warning)]',
  low: 'bg-[var(--border-strong)]',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

/** Upcoming events list with a date chip. */
function EventsList({ events }: { events: AdminDashboardData['events'] }) {
  if (events.length === 0) return <p className="py-4 text-center text-body-sm text-[var(--text-subtle)]">No upcoming events.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {events.map((e) => {
        const d = new Date(e.date);
        return (
          <li key={e.id} className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-control bg-[var(--surface-sunken)] leading-none">
              <span className="text-caption font-semibold text-[var(--text-muted)]">{d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</span>
              <span className="text-body-sm font-semibold tabular-nums text-[var(--text)]">{d.getDate()}</span>
            </div>
            <p className="min-w-0 flex-1 truncate text-body text-[var(--text)]">{e.title}</p>
          </li>
        );
      })}
    </ul>
  );
}

/** Top performers board with Week / Month / Year tabs. */
function TopPerformers({ data }: { data: AdminDashboardData['topPerformers'] }) {
  const [range, setRange] = useState<'week' | 'month' | 'year'>('week');
  const rows: TopPerformer[] = data[range];
  return (
    <div>
      <div className="mb-3 flex gap-1 border-b border-[var(--border)]">
        {(['week', 'month', 'year'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-body-sm font-medium capitalize ${
              range === r ? 'border-[var(--accent)] text-[var(--text)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <ul className="flex flex-col divide-y divide-[var(--border)]">
        {rows.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="w-4 shrink-0 text-body-sm font-semibold tabular-nums text-[var(--text-subtle)]">{i + 1}</span>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-surface)] text-caption font-semibold text-[var(--accent)]" aria-hidden="true">
              {initials(p.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-medium text-[var(--text)]">{p.name}</p>
              <p className="truncate text-caption text-[var(--text-subtle)]">{p.registerNo} · {p.className}</p>
            </div>
            <div className="w-24 shrink-0 text-right">
              <p className="text-body-sm font-semibold tabular-nums text-[var(--text)]">{p.score}%</p>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${p.score}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Admin dashboard (§13) — operational overview in the institution's visual
 * language: headline KPI tiles, an admissions trend chart, an events calendar,
 * a top-performers board, attendance rings, and the prioritised action centre.
 * Every figure is backend-provided and shown verbatim; every section is
 * permission-gated even though the layout is role-selected.
 */
export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const { kpis, academics, faculty, admissionsTrend, events, topPerformers, attendanceRings } = data;
  const { can } = usePermissions();
  const actionItems = data.actionCentre.filter((item) => can(item.permission as PermissionKey));

  return (
    <>
      {/* Headline KPI tiles. */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PermissionGuard permission="students.view">
          <StatTile label="Students" value={formatNumber(kpis.totalStudents)} icon={GraduationCap} tone="accent" to="/management/students" />
        </PermissionGuard>
        <PermissionGuard permission="faculty.view">
          <StatTile label="Faculty" value={formatNumber(faculty.total)} icon={Users} tone="info" to="/management/faculty" />
        </PermissionGuard>
        <PermissionGuard permission="batches.view">
          <StatTile label="Active batches" value={formatNumber(academics.activeBatches)} icon={Layers} tone="warning" to="/management/batches" />
        </PermissionGuard>
        <PermissionGuard permission="payments.view">
          <StatTile label="Collection (month)" value={formatCurrency(kpis.feeCollectionThisMonth)} icon={Wallet} tone="success" to="/management/payments" />
        </PermissionGuard>
      </div>

      {/* Trend chart + events calendar. */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PermissionGuard anyOf={['admissions.view', 'applications.view', 'enquiries.view']}>
          <WidgetCard title="Admissions trend" description="Enquiries and admissions by month." span={2}>
            <BarTrendChart series={ADMISSIONS_SERIES} data={admissionsTrend.map((m) => ({ label: m.month, values: { enquiries: m.enquiries, admissions: m.admissions } }))} caption="Enquiries and admissions by month" />
          </WidgetCard>
        </PermissionGuard>
        <WidgetCard title="Events calendar">
          <div className="flex flex-col gap-4">
            <MiniCalendar eventDates={events.map((e) => e.date)} />
            <EventsList events={events} />
          </div>
        </WidgetCard>
      </div>

      {/* Top performers + attendance rings. */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PermissionGuard permission="progress.view">
          <WidgetCard title="Top performers" span={2}>
            <TopPerformers data={topPerformers} />
          </WidgetCard>
        </PermissionGuard>
        <PermissionGuard permission="attendance.view">
          <WidgetCard title="Attendance" description="Today across the academy.">
            <RingGauge
              rings={[
                { label: 'Students', percent: attendanceRings.students, color: 'var(--chart-1)' },
                { label: 'Faculty', percent: attendanceRings.faculty, color: 'var(--chart-2)' },
              ]}
            />
          </WidgetCard>
        </PermissionGuard>
      </div>

      {/* Action centre. */}
      {actionItems.length > 0 && (
        <ContentSection title="Action centre" description="Items across the institution waiting on the operations team.">
          <Card>
            <ul className="divide-y divide-[var(--border)]">
              {actionItems.map((item) => {
                const row = (
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className={`size-2 shrink-0 rounded-full ${PRIORITY_DOT[item.priority]}`} aria-hidden="true" />
                      <span className="truncate text-body text-[var(--text)]">{item.label}</span>
                      {!item.to && <span className="shrink-0 text-caption text-[var(--text-subtle)]">(module pending)</span>}
                    </span>
                    <Badge tone={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'neutral'}>{formatNumber(item.count)}</Badge>
                  </div>
                );
                return (
                  <li key={item.id}>
                    {item.to ? <Link to={item.to} className="block hover:bg-[var(--surface-hover)]">{row}</Link> : row}
                  </li>
                );
              })}
            </ul>
          </Card>
        </ContentSection>
      )}

      {/* Quick actions. */}
      <PermissionGuard anyOf={['students.create', 'enquiries.create', 'applications.review', 'payments.create', 'certificates.issue', 'timetable.view']}>
        <ContentSection title="Quick actions">
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
        </ContentSection>
      </PermissionGuard>
    </>
  );
}
