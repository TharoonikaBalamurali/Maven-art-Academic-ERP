import { Link } from 'react-router-dom';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { formatDate } from '@/lib/utils/format';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import { Badge, Card, DataTable, EmptyState, Input, NoResultsState, Pagination, QueryBoundary, Select, TableSkeleton, type Column } from '@/shared/ui';
import { useLeaveRequests } from '../hooks/useLeave';
import { leaveStatusTone } from '../status';
import { LEAVE_KIND_LABEL, LEAVE_STATUS_LABEL, type LeaveListItem } from '../types';

const FILTER_KEYS = ['status', 'kind'] as const;
const STATUS_OPTIONS = Object.entries(LEAVE_STATUS_LABEL).map(([value, label]) => ({ value, label }));
const KIND_OPTIONS = Object.entries(LEAVE_KIND_LABEL).map(([value, label]) => ({ value, label }));

const columns: readonly Column<LeaveListItem>[] = [
  { id: 'requestNo', header: 'Request', cell: (row) => <span className="font-medium tabular-nums">{row.requestNo}</span> },
  { id: 'student', header: 'Student', cell: (row) => row.student },
  { id: 'kind', header: 'Type', width: '8rem', cell: (row) => <Badge tone={row.kind === 'od' ? 'info' : 'neutral'}>{LEAVE_KIND_LABEL[row.kind] ?? row.kind}</Badge> },
  { id: 'reason', header: 'Reason', hideBelowMd: true, cell: (row) => row.reason },
  { id: 'fromDate', header: 'Dates', sortable: true, hideBelowMd: true, width: '13rem', cell: (row) => <span className="text-body-sm">{formatDate(row.fromDate)} – {formatDate(row.toDate)} <span className="text-[var(--text-subtle)]">({row.days}d)</span></span> },
  { id: 'status', header: 'Status', align: 'right', width: '9rem', cell: (row) => <Badge tone={leaveStatusTone(row.status)}>{LEAVE_STATUS_LABEL[row.status] ?? row.status}</Badge> },
];

/** Leave / OD requests (§ student affairs). */
export function LeavePage() {
  const list = useListQueryState({ defaultLimit: 10, defaultSortBy: 'fromDate', defaultSortDir: 'desc', filterKeys: FILTER_KEYS });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useLeaveRequests(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = (list.query.search ? 1 : 0) + (list.query.filters?.status ? 1 : 0) + (list.query.filters?.kind ? 1 : 0);

  function clearAll() { setSearchDraft(''); list.clear(); }

  return (
    <>
      <PageHeader title="Leave / OD" description="Student leave and on-duty requests awaiting a decision." meta={query.data && <Badge tone="neutral">{query.data.total} requests</Badge>} />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input label="Search" type="search" placeholder="Student, request no. or reason" containerClassName="sm:w-72" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} />
          <Select label="Status" placeholder="All statuses" containerClassName="sm:w-40" options={STATUS_OPTIONS} value={list.query.filters?.status?.toString() ?? ''} onChange={(e) => list.setFilter('status', e.target.value)} />
          <Select label="Type" placeholder="All types" containerClassName="sm:w-36" options={KIND_OPTIONS} value={list.query.filters?.kind?.toString() ?? ''} onChange={(e) => list.setFilter('kind', e.target.value)} />
        </FilterBar>

        <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<div className="p-3"><TableSkeleton rows={5} columns={6} /></div>}>
          {rows.length === 0 ? (
            activeFilters > 0 ? <NoResultsState onClear={clearAll} /> : <EmptyState title="No requests" description="Leave and OD requests appear here." />
          ) : (
            <>
              <DataTable
                caption="Leave and OD requests" columns={columns} rows={rows} rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'desc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => <Link to={`/management/leave/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">Review</Link>}
                renderMobileCard={(row) => (
                  <Link to={`/management/leave/${row.id}`} className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]">
                    <div className="flex items-start justify-between gap-2"><p className="font-medium">{row.student}</p><Badge tone={leaveStatusTone(row.status)}>{LEAVE_STATUS_LABEL[row.status] ?? row.status}</Badge></div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{LEAVE_KIND_LABEL[row.kind] ?? row.kind} · {row.reason}</p>
                    <p className="mt-0.5 text-caption text-[var(--text-subtle)]">{formatDate(row.fromDate)} – {formatDate(row.toDate)}</p>
                  </Link>
                )}
              />
              {query.data && <div className="border-t border-[var(--border)] p-3"><Pagination page={query.data.page} totalPages={query.data.totalPages} total={query.data.total} limit={query.data.limit} onPageChange={list.setPage} /></div>}
            </>
          )}
        </QueryBoundary>
      </Card>
    </>
  );
}
