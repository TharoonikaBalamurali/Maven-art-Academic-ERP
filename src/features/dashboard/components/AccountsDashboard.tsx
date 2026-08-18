import { CalendarClock, CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/format';
import { DashboardGrid, EmptyWidget, SummaryCard, WidgetCard } from '@/shared/dashboard';
import { Badge, DataTable, type Column } from '@/shared/ui';
import type { AccountsDashboard as AccountsDashboardData } from '../types';

/**
 * Accounts dashboard (§13) — financial overview.
 *
 * Answers "what was collected?" and "what is outstanding?": collection totals,
 * outstanding balance, and the two operational tables an accounts clerk works
 * from daily — recent transactions and upcoming installments. Finance-dense,
 * table-first. Balances are backend figures; the frontend never computes them.
 */
type Txn = AccountsDashboardData['recentTransactions'][number];
type Installment = AccountsDashboardData['upcomingInstallments'][number];

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
  { id: 'amount', header: 'Amount', align: 'right', width: '9rem', cell: (row) => <span className="font-medium">{formatCurrency(row.amount)}</span> },
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
  { id: 'amount', header: 'Amount', align: 'right', width: '9rem', cell: (row) => <span className="font-medium">{formatCurrency(row.amount)}</span> },
];

export function AccountsDashboard({ data }: { data: AccountsDashboardData }) {
  const { kpis } = data;

  return (
    <>
      <DashboardGrid className="mb-4">
        <PermissionGuard permission="payments.view">
          <SummaryCard label="Today's Collection" value={formatCurrency(kpis.todaysCollection)} icon={Wallet} to="/management/payments" />
        </PermissionGuard>
        <PermissionGuard permission="payments.view">
          <SummaryCard label="Collection (This Month)" value={formatCurrency(kpis.monthlyCollection)} icon={TrendingUp} to="/management/payments" />
        </PermissionGuard>
        <PermissionGuard permission="outstanding.view">
          <SummaryCard label="Outstanding Fees" value={formatCurrency(kpis.outstandingFees)} icon={Wallet} to="/management/outstanding" />
        </PermissionGuard>
        <PermissionGuard permission="payments.view">
          <SummaryCard label="Pending Payments" value={formatNumber(kpis.pendingPayments)} icon={CreditCard} note="Awaiting confirmation" to="/management/payments" />
        </PermissionGuard>
      </DashboardGrid>

      <DashboardGrid>
        <PermissionGuard permission="payments.view">
          <WidgetCard title="Recent transactions" description="Payments recorded today." span={2}>
            {data.recentTransactions.length > 0 ? (
              <div className="-mx-4 -mb-4">
                <DataTable
                  caption="Recent transactions"
                  columns={txnColumns}
                  rows={data.recentTransactions}
                  rowKey={(row) => row.id}
                  density="compact"
                />
              </div>
            ) : (
              <EmptyWidget label="No transactions recorded today." />
            )}
          </WidgetCard>
        </PermissionGuard>

        <PermissionGuard permission="installments.view">
          <WidgetCard
            title="Upcoming installments"
            description="Due in the next few days."
            span={2}
            actions={<CalendarClock className="size-4 text-[var(--text-subtle)]" aria-hidden="true" />}
          >
            {data.upcomingInstallments.length > 0 ? (
              <div className="-mx-4 -mb-4">
                <DataTable
                  caption="Upcoming installments"
                  columns={installmentColumns}
                  rows={data.upcomingInstallments}
                  rowKey={(row) => row.id}
                  density="compact"
                />
              </div>
            ) : (
              <EmptyWidget label="No installments due soon." />
            )}
          </WidgetCard>
        </PermissionGuard>
      </DashboardGrid>
    </>
  );
}
