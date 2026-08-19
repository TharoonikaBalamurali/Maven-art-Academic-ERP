import { Link } from 'react-router-dom';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { formatCurrency } from '@/lib/utils/format';
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
import { useOutstandingList } from '../hooks/useOutstanding';
import { outstandingSeverityTone } from '../severity';
import { OUTSTANDING_SEVERITY_LABEL, type OutstandingListItem } from '../types';

const FILTER_KEYS = ['severity'] as const;

const SEVERITY_OPTIONS = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'due', label: 'Due' },
  { value: 'upcoming', label: 'Upcoming' },
];

const columns: readonly Column<OutstandingListItem>[] = [
  { id: 'student', header: 'Student', cell: (row) => <span className="font-medium">{row.student}</span> },
  { id: 'course', header: 'Course', hideBelowMd: true, cell: (row) => row.course },
  {
    id: 'severity',
    header: 'Severity',
    width: '8rem',
    cell: (row) => <Badge tone={outstandingSeverityTone(row.severity)}>{OUTSTANDING_SEVERITY_LABEL[row.severity] ?? row.severity}</Badge>,
  },
  {
    id: 'overdueAmount',
    header: 'Overdue',
    align: 'right',
    hideBelowMd: true,
    width: '9rem',
    cell: (row) => (row.overdueAmount > 0 ? <span className="tabular-nums text-[var(--danger)]">{formatCurrency(row.overdueAmount)}</span> : <span className="text-[var(--text-subtle)]">—</span>),
  },
  {
    id: 'outstandingAmount',
    header: 'Outstanding',
    sortable: true,
    align: 'right',
    width: '10rem',
    // Backend-computed outstanding — displayed, never aggregated here.
    cell: (row) => <span className="font-medium tabular-nums">{formatCurrency(row.outstandingAmount)}</span>,
  },
];

/** Outstanding fees report (§23). */
export function OutstandingPage() {
  const list = useListQueryState({
    defaultLimit: 10,
    defaultSortBy: 'outstandingAmount',
    defaultSortDir: 'desc',
    filterKeys: FILTER_KEYS,
  });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useOutstandingList(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = (list.query.search ? 1 : 0) + (list.query.filters?.severity ? 1 : 0);

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Outstanding Fees"
        description="Balances owed, as computed and reported by the backend."
        meta={query.data && <Badge tone="neutral">{query.data.total} students</Badge>}
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Student or course"
            containerClassName="sm:w-64"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
          <Select
            label="Severity"
            placeholder="All"
            containerClassName="sm:w-40"
            options={SEVERITY_OPTIONS}
            value={list.query.filters?.severity?.toString() ?? ''}
            onChange={(event) => list.setFilter('severity', event.target.value)}
          />
        </FilterBar>

        <QueryBoundary
          isPending={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingFallback={
            <div className="p-3">
              <TableSkeleton rows={5} columns={5} />
            </div>
          }
        >
          {rows.length === 0 ? (
            activeFilters > 0 ? (
              <NoResultsState onClear={clearAll} />
            ) : (
              <EmptyState title="No outstanding fees" description="Students with an outstanding balance appear here." />
            )
          ) : (
            <>
              <DataTable
                caption="Outstanding fees"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'desc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link to={`/management/outstanding/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    Open
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link
                    to={`/management/outstanding/${row.id}`}
                    className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{row.student}</p>
                      <Badge tone={outstandingSeverityTone(row.severity)}>{OUTSTANDING_SEVERITY_LABEL[row.severity] ?? row.severity}</Badge>
                    </div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.course}</p>
                    <p className="mt-1 text-body-sm font-medium tabular-nums">Outstanding {formatCurrency(row.outstandingAmount)}</p>
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
