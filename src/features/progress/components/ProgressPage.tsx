import { Link } from 'react-router-dom';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
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
import { useProgressList } from '../hooks/useProgress';
import { progressStatusTone } from '../status';
import { PROGRESS_STATUS_LABEL, type ProgressListItem } from '../types';

const FILTER_KEYS = ['status'] as const;

const STATUS_OPTIONS = [
  { value: 'graded', label: 'Graded' },
  { value: 'pending', label: 'Pending' },
  { value: 'absent', label: 'Absent' },
];

/** Score column: the raw score over max, or a dash when not graded. */
function scoreText(row: ProgressListItem): string {
  return row.score === null ? '—' : `${row.score} / ${row.maxScore}`;
}

const columns: readonly Column<ProgressListItem>[] = [
  { id: 'student', header: 'Student', cell: (row) => <span className="font-medium">{row.student}</span> },
  { id: 'assessment', header: 'Assessment', hideBelowMd: true, cell: (row) => row.assessment },
  {
    id: 'status',
    header: 'Status',
    width: '8rem',
    cell: (row) => <Badge tone={progressStatusTone(row.status)}>{PROGRESS_STATUS_LABEL[row.status] ?? row.status}</Badge>,
  },
  {
    id: 'score',
    header: 'Score',
    align: 'right',
    width: '7rem',
    cell: (row) => <span className="tabular-nums">{scoreText(row)}</span>,
  },
  {
    id: 'grade',
    header: 'Grade',
    align: 'right',
    width: '6rem',
    // Backend-computed grade — displayed, never derived here.
    cell: (row) => (row.grade ? <span className="font-semibold">{row.grade}</span> : <span className="text-[var(--text-subtle)]">—</span>),
  },
];

/** Academic progress list (§26). */
export function ProgressPage() {
  const list = useListQueryState({
    defaultLimit: 10,
    defaultSortBy: 'student',
    defaultSortDir: 'asc',
    filterKeys: FILTER_KEYS,
  });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useProgressList(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = (list.query.search ? 1 : 0) + (list.query.filters?.status ? 1 : 0);

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Academic Progress"
        description="Assessment results. Grades and results are computed by the backend."
        meta={query.data && <Badge tone="neutral">{query.data.total} records</Badge>}
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Student, assessment or course"
            containerClassName="sm:w-72"
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
              <EmptyState title="No progress records" description="Assessment results appear here." />
            )
          ) : (
            <>
              <DataTable
                caption="Academic progress"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'asc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link to={`/management/progress/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    Open
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link
                    to={`/management/progress/${row.id}`}
                    className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{row.student}</p>
                      <Badge tone={progressStatusTone(row.status)}>{PROGRESS_STATUS_LABEL[row.status] ?? row.status}</Badge>
                    </div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.assessment}</p>
                    <p className="mt-1 flex items-center justify-between text-body-sm">
                      <span className="tabular-nums">{scoreText(row)}</span>
                      {row.grade && <span className="font-semibold">{row.grade}</span>}
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
