import { formatCurrency, formatDate } from '@/lib/utils/format';
import { PageHeader } from '@/shared/layout/page';
import { Badge, Card, DataTable, EmptyState, QueryBoundary, TableSkeleton, type BadgeTone, type Column } from '@/shared/ui';
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from '@/features/payments/types';
import { usePortalPayments } from '../hooks/usePortal';
import type { PortalPaymentRecord, PortalPaymentStatus } from '../types';

const STATUS_TONE: Record<string, BadgeTone> = { recorded: 'success', pending: 'warning', failed: 'danger', refunded: 'neutral' };
function statusTone(status: PortalPaymentStatus): BadgeTone { return STATUS_TONE[status] ?? 'neutral'; }

const columns: readonly Column<PortalPaymentRecord>[] = [
  { id: 'date', header: 'Date', width: '10rem', cell: (row) => (row.date ? <time dateTime={row.date}>{formatDate(row.date)}</time> : '—') },
  { id: 'method', header: 'Method', hideBelowMd: true, cell: (row) => PAYMENT_METHOD_LABEL[row.method] ?? row.method },
  { id: 'receiptNo', header: 'Receipt', hideBelowMd: true, cell: (row) => <span className="tabular-nums text-body-sm">{row.receiptNo ?? '—'}</span> },
  { id: 'status', header: 'Status', width: '8rem', cell: (row) => <Badge tone={statusTone(row.status)}>{PAYMENT_STATUS_LABEL[row.status] ?? row.status}</Badge> },
  { id: 'amount', header: 'Amount', align: 'right', width: '9rem', cell: (row) => <span className="tabular-nums font-medium">{formatCurrency(row.amount)}</span> },
];

/** Portal payments (§7) — the caller's own payment history. */
export function PortalPaymentsPage() {
  const query = usePortalPayments();
  const rows = query.data?.records ?? [];
  return (
    <>
      <PageHeader title="Payments" description="Your payment history, as recorded by the backend." />
      <Card className="overflow-hidden">
        <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<div className="p-3"><TableSkeleton rows={3} columns={5} /></div>}>
          {rows.length === 0 ? (
            <EmptyState title="No payments yet" description="Your recorded payments will appear here." />
          ) : (
            <DataTable
              caption="Payments" columns={columns} rows={rows} rowKey={(row) => row.id}
              renderMobileCard={(row) => (
                <div className="border-b border-[var(--border)] px-3 py-3 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium tabular-nums">{formatCurrency(row.amount)}</p>
                    <Badge tone={statusTone(row.status)}>{PAYMENT_STATUS_LABEL[row.status] ?? row.status}</Badge>
                  </div>
                  <p className="mt-1 text-body-sm text-[var(--text-muted)]">{PAYMENT_METHOD_LABEL[row.method] ?? row.method}{row.date ? ` · ${formatDate(row.date)}` : ''}</p>
                  {row.receiptNo && <p className="mt-0.5 text-caption text-[var(--text-subtle)]">Receipt {row.receiptNo}</p>}
                </div>
              )}
            />
          )}
        </QueryBoundary>
      </Card>
    </>
  );
}
