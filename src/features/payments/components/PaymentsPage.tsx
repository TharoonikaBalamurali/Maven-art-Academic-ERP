import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  NoResultsState,
  Pagination,
  QueryBoundary,
  Select,
  TableSkeleton,
  type Column,
} from '@/shared/ui';
import { usePayments } from '../hooks/usePayments';
import { paymentStatusTone } from '../status';
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, type PaymentListItem } from '../types';
import { RecordPaymentDialog } from './RecordPaymentDialog';

const FILTER_KEYS = ['status', 'method'] as const;

const STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => ({ value, label }));

const columns: readonly Column<PaymentListItem>[] = [
  { id: 'student', header: 'Student', cell: (row) => <span className="font-medium">{row.student}</span> },
  { id: 'method', header: 'Method', hideBelowMd: true, cell: (row) => PAYMENT_METHOD_LABEL[row.method] ?? row.method },
  {
    id: 'paidAt',
    header: 'Paid on',
    sortable: true,
    hideBelowMd: true,
    width: '10rem',
    cell: (row) => (row.paidAt ? <time dateTime={row.paidAt}>{formatDate(row.paidAt)}</time> : <span className="text-[var(--text-subtle)]">—</span>),
  },
  {
    id: 'status',
    header: 'Status',
    width: '8rem',
    cell: (row) => <Badge tone={paymentStatusTone(row.status)}>{PAYMENT_STATUS_LABEL[row.status] ?? row.status}</Badge>,
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'right',
    width: '9rem',
    cell: (row) => <span className="font-medium tabular-nums">{formatCurrency(row.amount)}</span>,
  },
];

/** Payments list (§22). */
export function PaymentsPage() {
  const [recording, setRecording] = useState(false);
  const list = useListQueryState({
    defaultLimit: 10,
    defaultSortBy: 'paidAt',
    defaultSortDir: 'desc',
    filterKeys: FILTER_KEYS,
  });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = usePayments(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = (list.query.search ? 1 : 0) + (list.query.filters?.status ? 1 : 0) + (list.query.filters?.method ? 1 : 0);

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Payments"
        description="Recorded fee transactions. Amounts and receipts are issued by the backend."
        meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>}
        actions={
          <PermissionGuard permission="payments.create">
            <Button onClick={() => setRecording(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Record payment
            </Button>
          </PermissionGuard>
        }
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Student"
            containerClassName="sm:w-64"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
          <Select
            label="Status"
            placeholder="All statuses"
            containerClassName="sm:w-40"
            options={STATUS_OPTIONS}
            value={list.query.filters?.status?.toString() ?? ''}
            onChange={(event) => list.setFilter('status', event.target.value)}
          />
        </FilterBar>

        <QueryBoundary
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingFallback={
            <div className="p-3">
              <TableSkeleton rows={6} columns={5} />
            </div>
          }
        >
          {rows.length === 0 ? (
            activeFilters > 0 ? (
              <NoResultsState onClear={clearAll} />
            ) : (
              <EmptyState title="No payments" description="Recorded payments appear here." />
            )
          ) : (
            <>
              <DataTable
                caption="Payments"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'desc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link to={`/management/payments/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    Open
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link
                    to={`/management/payments/${row.id}`}
                    className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{row.student}</p>
                      <Badge tone={paymentStatusTone(row.status)}>{PAYMENT_STATUS_LABEL[row.status] ?? row.status}</Badge>
                    </div>
                    <p className="mt-1 flex items-center justify-between text-body-sm">
                      <span className="text-[var(--text-muted)]">{PAYMENT_METHOD_LABEL[row.method] ?? row.method}</span>
                      <span className="tabular-nums font-medium">{formatCurrency(row.amount)}</span>
                    </p>
                  </Link>
                )}
              />
              {query.data && (
                <div className="border-t border-[var(--border)] p-3">
                  <Pagination
                    page={query.data.page}
                    totalPages={query.data.totalPages}
                    total={query.data.total}
                    limit={query.data.limit}
                    onPageChange={list.setPage}
                  />
                </div>
              )}
            </>
          )}
        </QueryBoundary>
      </Card>

      <RecordPaymentDialog open={recording} onClose={() => setRecording(false)} />
    </>
  );
}
