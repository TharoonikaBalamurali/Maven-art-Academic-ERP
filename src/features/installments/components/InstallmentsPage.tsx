import { Link } from 'react-router-dom';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import {
  Badge,
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
import { useInstallments } from '../hooks/useInstallments';
import { installmentStatusTone } from '../status';
import { INSTALLMENT_STATUS_LABEL, type InstallmentListItem } from '../types';

const FILTER_KEYS = ['status'] as const;

const STATUS_OPTIONS = [
  { value: 'due', label: 'Due' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

const columns: readonly Column<InstallmentListItem>[] = [
  { id: 'student', header: 'Student', cell: (row) => <span className="font-medium">{row.student}</span> },
  { id: 'label', header: 'Installment', hideBelowMd: true, cell: (row) => row.label },
  {
    id: 'dueDate',
    header: 'Due',
    sortable: true,
    hideBelowMd: true,
    width: '10rem',
    cell: (row) => (row.dueDate ? <time dateTime={row.dueDate}>{formatDate(row.dueDate)}</time> : <span className="text-[var(--text-subtle)]">—</span>),
  },
  {
    id: 'status',
    header: 'Status',
    width: '8rem',
    cell: (row) => <Badge tone={installmentStatusTone(row.status)}>{INSTALLMENT_STATUS_LABEL[row.status] ?? row.status}</Badge>,
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'right',
    width: '9rem',
    // Backend-provided amount — displayed, never computed here.
    cell: (row) => <span className="font-medium tabular-nums">{formatCurrency(row.amount)}</span>,
  },
];

/** Installments list (§21). */
export function InstallmentsPage() {
  const list = useListQueryState({
    defaultLimit: 10,
    defaultSortBy: 'dueDate',
    defaultSortDir: 'asc',
    filterKeys: FILTER_KEYS,
  });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useInstallments(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = (list.query.search ? 1 : 0) + (list.query.filters?.status ? 1 : 0);

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Installments"
        description="Scheduled part-payments. Amounts and due dates are set by the backend."
        meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>}
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
            containerClassName="sm:w-44"
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
              <EmptyState title="No installments" description="Installment schedules appear here." />
            )
          ) : (
            <>
              <DataTable
                caption="Installments"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'asc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link to={`/management/installments/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    Open
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link
                    to={`/management/installments/${row.id}`}
                    className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{row.student}</p>
                      <Badge tone={installmentStatusTone(row.status)}>{INSTALLMENT_STATUS_LABEL[row.status] ?? row.status}</Badge>
                    </div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.label}</p>
                    <p className="mt-1 flex items-center justify-between text-body-sm">
                      <span className="tabular-nums font-medium">{formatCurrency(row.amount)}</span>
                      {row.dueDate && <span className="text-caption text-[var(--text-subtle)]">Due {formatDate(row.dueDate)}</span>}
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
    </>
  );
}
