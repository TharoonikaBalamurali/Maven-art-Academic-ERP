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
  TableSkeleton,
  type Column,
} from '@/shared/ui';
import { useReceipts } from '../hooks/useReceipts';
import type { ReceiptListItem } from '../types';

const columns: readonly Column<ReceiptListItem>[] = [
  { id: 'receiptNo', header: 'Receipt No.', cell: (row) => <span className="font-medium tabular-nums">{row.receiptNo}</span> },
  { id: 'student', header: 'Student', cell: (row) => row.student },
  {
    id: 'issuedAt',
    header: 'Issued',
    sortable: true,
    hideBelowMd: true,
    width: '10rem',
    cell: (row) => (row.issuedAt ? <time dateTime={row.issuedAt}>{formatDate(row.issuedAt)}</time> : <span className="text-[var(--text-subtle)]">—</span>),
  },
  {
    id: 'amount',
    header: 'Amount',
    align: 'right',
    width: '9rem',
    // Backend-recorded amount — displayed, never computed here.
    cell: (row) => <span className="font-medium tabular-nums">{formatCurrency(row.amount)}</span>,
  },
];

/** Receipts list (§24). */
export function ReceiptsPage() {
  const list = useListQueryState({
    defaultLimit: 10,
    defaultSortBy: 'issuedAt',
    defaultSortDir: 'desc',
  });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useReceipts(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = list.query.search ? 1 : 0;

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Receipts"
        description="Receipts issued by the backend when payments are recorded."
        meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>}
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Student or receipt no."
            containerClassName="sm:w-72"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
        </FilterBar>

        <QueryBoundary
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingFallback={
            <div className="p-3">
              <TableSkeleton rows={5} columns={4} />
            </div>
          }
        >
          {rows.length === 0 ? (
            activeFilters > 0 ? (
              <NoResultsState onClear={clearAll} />
            ) : (
              <EmptyState title="No receipts" description="Receipts issued for recorded payments appear here." />
            )
          ) : (
            <>
              <DataTable
                caption="Receipts"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'desc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link to={`/management/receipts/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    Open
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link
                    to={`/management/receipts/${row.id}`}
                    className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium tabular-nums">{row.receiptNo}</p>
                      <span className="tabular-nums font-medium">{formatCurrency(row.amount)}</span>
                    </div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.student}</p>
                    {row.issuedAt && <p className="mt-0.5 text-caption text-[var(--text-subtle)]">Issued {formatDate(row.issuedAt)}</p>}
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
