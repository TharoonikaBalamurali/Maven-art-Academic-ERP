import { CalendarClock, CreditCard, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/format';
import {
  BarTrendChart,
  EmptyWidget,
  MiniCalendar,
  RingGauge,
  StatTile,
  WidgetCard,
  type BarSeries,
} from '@/shared/dashboard';
import { Badge, DataTable, type Column } from '@/shared/ui';
import type { AccountsDashboard as AccountsDashboardData } from '../types';

/**
 * Accounts / Finance dashboard (§13) — financial overview in the institution's
 * visual language: collection KPI tiles, a collected-vs-billed trend chart, the
 * installment calendar, a collection-rate gauge, and the two operational tables
 * a clerk works from (recent transactions, upcoming installments). Every balance
 * is a backend figure; the frontend never computes them.
 */
type Txn = AccountsDashboardData['recentTransactions'][number];
type Installment = AccountsDashboardData['upcomingInstallments'][number];

const COLLECTIONS_SERIES: BarSeries[] = [
  { key: 'collected', label: 'Collected', color: 'var(--chart-1)' },
  { key: 'billed', label: 'Billed', color: 'var(--chart-2)' },
];

/** Compact INR for a chart axis: ₹29L, ₹1.2Cr. */
function compactINR(v: number): string {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `₹${Math.round(v / 1e5)}L`;
  if (v >= 1e3) return `₹${Math.round(v / 1e3)}K`;
  return `₹${v}`;
}

const txnColumns: readonly Column<Txn>[] = [
  {
    id: 'student',
    header: 'Student',
    cell: (row) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.student}</p>
        <p className="truncate text-body-sm text-[var(--text-muted)]">{row.registerNo}</p>
      </div>
    ),
  },
  { id: 'method', header: 'Method', hideBelowMd: true, width: '9rem', cell: (row) => <Badge tone="neutral">{row.method}</Badge> },
  {
    id: 'at',
    header: 'Time',
    hideBelowMd: true,
    align: 'right',
    width: '11rem',
    cell: (row) => (
      <time dateTime={row.at} className="text-[var(--text-muted)]">
        {new Date(row.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </time>
    ),
  },
  { id: 'amount', header: 'Amount', align: 'right', width: '9rem', cell: (row) => <span className="font-medium tabular-nums">{formatCurrency(row.amount)}</span> },
];

const installmentColumns: readonly Column<Installment>[] = [
  {
    id: 'student',
    header: 'Student',
    cell: (row) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.student}</p>
        <p className="truncate text-body-sm text-[var(--text-muted)]">{row.registerNo}</p>
      </div>
    ),
  },
  { id: 'dueOn', header: 'Due', width: '10rem', cell: (row) => <time dateTime={row.dueOn}>{formatDate(row.dueOn)}</time> },
  { id: 'amount', header: 'Amount', align: 'right', width: '9rem', cell: (row) => <span className="font-medium tabular-nums">{formatCurrency(row.amount)}</span> },
];

export function AccountsDashboard({ data }: { data: AccountsDashboardData }) {
  const { kpis, collectionsTrend, events, collectionRate } = data;

  return (
    <>
      {/* KPI tiles. */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PermissionGuard permission="payments.view">
          <StatTile label="Today's collection" value={formatCurrency(kpis.todaysCollection)} icon={Wallet} tone="success" to="/management/payments" />
        </PermissionGuard>
        <PermissionGuard permission="payments.view">
          <StatTile label="Collection (month)" value={formatCurrency(kpis.monthlyCollection)} icon={TrendingUp} tone="accent" to="/management/payments" />
        </PermissionGuard>
        <PermissionGuard permission="outstanding.view">
          <StatTile label="Outstanding fees" value={formatCurrency(kpis.outstandingFees)} icon={PiggyBank} tone="warning" to="/management/outstanding" />
        </PermissionGuard>
        <PermissionGuard permission="payments.view">
          <StatTile label="Pending payments" value={formatNumber(kpis.pendingPayments)} icon={CreditCard} tone="info" sub="Awaiting confirmation" to="/management/payments" />
        </PermissionGuard>
      </div>

      {/* Collections chart + installment calendar. */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PermissionGuard permission="payments.view">
          <WidgetCard title="Collections" description="Collected vs billed by month." span={2}>
            <BarTrendChart series={COLLECTIONS_SERIES} data={collectionsTrend.map((m) => ({ label: m.month, values: { collected: m.collected, billed: m.billed } }))} formatValue={compactINR} caption="Collected versus billed by month" />
          </WidgetCard>
        </PermissionGuard>
        <PermissionGuard permission="installments.view">
          <WidgetCard title="Installment calendar">
            <div className="flex flex-col gap-4">
              <MiniCalendar eventDates={events.map((e) => e.date)} />
              {events.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {events.slice(0, 4).map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 text-body-sm">
                      <span className="min-w-0 truncate text-[var(--text)]">{e.title}</span>
                      <time dateTime={e.date} className="shrink-0 text-[var(--text-muted)]">{formatDate(e.date)}</time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-body-sm text-[var(--text-subtle)]">No installments due soon.</p>
              )}
            </div>
          </WidgetCard>
        </PermissionGuard>
      </div>

      {/* Recent transactions + collection-rate gauge. */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PermissionGuard permission="payments.view">
          <WidgetCard title="Recent transactions" description="Payments recorded today." span={2}>
            {data.recentTransactions.length > 0 ? (
              <div className="-mx-4 -mb-4">
                <DataTable caption="Recent transactions" columns={txnColumns} rows={data.recentTransactions} rowKey={(row) => row.id} density="compact" />
              </div>
            ) : (
              <EmptyWidget label="No transactions recorded today." />
            )}
          </WidgetCard>
        </PermissionGuard>
        <PermissionGuard permission="outstanding.view">
          <WidgetCard title="Collection rate" description="Of billed fees, this term.">
            <RingGauge
              rings={[{ label: 'Collected', percent: collectionRate, color: 'var(--chart-1)' }]}
              center={<span className="text-metric font-semibold tabular-nums text-[var(--text)]">{collectionRate}%</span>}
            />
          </WidgetCard>
        </PermissionGuard>
      </div>

      {/* Upcoming installments table. */}
      <PermissionGuard permission="installments.view">
        <WidgetCard
          title="Upcoming installments"
          description="Due in the next few days."
          actions={<CalendarClock className="size-4 text-[var(--text-subtle)]" aria-hidden="true" />}
        >
          {data.upcomingInstallments.length > 0 ? (
            <div className="-mx-4 -mb-4">
              <DataTable caption="Upcoming installments" columns={installmentColumns} rows={data.upcomingInstallments} rowKey={(row) => row.id} density="compact" />
            </div>
          ) : (
            <EmptyWidget label="No installments due soon." />
          )}
        </WidgetCard>
      </PermissionGuard>
    </>
  );
}
