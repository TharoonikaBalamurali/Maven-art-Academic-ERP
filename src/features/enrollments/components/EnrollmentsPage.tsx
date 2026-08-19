import { Link } from 'react-router-dom';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { formatDate } from '@/lib/utils/format';
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
import { useEnrollments } from '../hooks/useEnrollments';
import { enrollmentStatusTone } from '../status';
import { ENROLLMENT_STATUS_LABEL, type EnrollmentListItem } from '../types';

const FILTER_KEYS = ['status'] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const columns: readonly Column<EnrollmentListItem>[] = [
  { id: 'student', header: 'Student', cell: (row) => <span className="font-medium">{row.student}</span> },
  { id: 'course', header: 'Course', hideBelowMd: true, cell: (row) => row.course },
  { id: 'batch', header: 'Batch', hideBelowMd: true, cell: (row) => row.batch },
  {
    id: 'status',
    header: 'Status',
    width: '9rem',
    cell: (row) => <Badge tone={enrollmentStatusTone(row.status)}>{ENROLLMENT_STATUS_LABEL[row.status] ?? row.status}</Badge>,
  },
  {
    id: 'enrolledAt',
    header: 'Enrolled',
    sortable: true,
    align: 'right',
    width: '10rem',
    cell: (row) => (row.enrolledAt ? <time dateTime={row.enrolledAt}>{formatDate(row.enrolledAt)}</time> : <span className="text-[var(--text-subtle)]">—</span>),
  },
];

/** Enrollments list (§18). */
export function EnrollmentsPage() {
  const list = useListQueryState({
    defaultLimit: 10,
    defaultSortBy: 'enrolledAt',
    defaultSortDir: 'desc',
    filterKeys: FILTER_KEYS,
  });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useEnrollments(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = (list.query.search ? 1 : 0) + (list.query.filters?.status ? 1 : 0);

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Enrollments"
        description="Students enrolled into courses and batches."
        meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>}
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Student, course or batch"
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
              <EmptyState title="No enrollments" description="Enrolled admissions appear here." />
            )
          ) : (
            <>
              <DataTable
                caption="Enrollments"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'desc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link to={`/management/enrollments/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    Open
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link
                    to={`/management/enrollments/${row.id}`}
                    className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{row.student}</p>
                      <Badge tone={enrollmentStatusTone(row.status)}>{ENROLLMENT_STATUS_LABEL[row.status] ?? row.status}</Badge>
                    </div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.course}</p>
                    <p className="mt-0.5 text-caption text-[var(--text-subtle)]">Batch {row.batch}</p>
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
