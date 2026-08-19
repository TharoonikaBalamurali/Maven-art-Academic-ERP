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
import { useBatches } from '../hooks/useBatches';
import { useStudentFilterOptions } from '@/features/students/hooks/useStudents';
import type { BatchListItem } from '../types';

const FILTER_KEYS = ['course', 'status'] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const columns: readonly Column<BatchListItem>[] = [
  {
    id: 'name',
    header: 'Batch',
    sortable: true,
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    id: 'course',
    header: 'Course',
    sortable: true,
    hideBelowMd: true,
    cell: (row) => (
      <span>
        <span className="text-[var(--text)]">{row.courseCode}</span>
        <span className="ml-1 text-body-sm text-[var(--text-muted)]">{row.course}</span>
      </span>
    ),
  },
  { id: 'faculty', header: 'Faculty', sortable: true, hideBelowMd: true, cell: (row) => row.faculty },
  { id: 'section', header: 'Section', width: '6rem', hideBelowMd: true, cell: (row) => row.section },
  {
    id: 'students',
    header: 'Students',
    sortable: true,
    align: 'right',
    width: '7rem',
    cell: (row) => row.studentCount,
  },
  {
    id: 'active',
    header: 'Status',
    width: '7rem',
    cell: (row) => (
      <Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Active' : 'Inactive'}</Badge>
    ),
  },
];

/**
 * Batches list (§19). Same server-driven table pattern as Students, applied to
 * a second entity — evidence the reference pattern generalises. Course, faculty
 * and student count are shown as links/values, kept distinct (§19).
 */
export function BatchesPage() {
  const list = useListQueryState({
    defaultLimit: 10,
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
    filterKeys: FILTER_KEYS,
  });

  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useBatches(list.query);
  const filterOptions = useStudentFilterOptions();
  const rows = query.data?.data ?? [];

  const activeFilters =
    (list.query.search ? 1 : 0) + Object.values(list.query.filters ?? {}).filter(Boolean).length;

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  const courseOptions = (filterOptions.data?.courses ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <PageHeader
        title="Batches"
        description="Studio batches across all programmes, with their course, faculty and enrolment."
        meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>}
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Batch or faculty name"
            containerClassName="sm:w-64"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
          <Select
            label="Course"
            placeholder="All courses"
            containerClassName="sm:w-52"
            options={courseOptions}
            value={list.query.filters?.course?.toString() ?? ''}
            onChange={(event) => list.setFilter('course', event.target.value)}
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
              <TableSkeleton rows={6} columns={6} />
            </div>
          }
        >
          {rows.length === 0 ? (
            activeFilters > 0 ? (
              <NoResultsState onClear={clearAll} />
            ) : (
              <EmptyState title="No batches yet" description="Batches will appear here once created." />
            )
          ) : (
            <>
              <DataTable
                caption="Batches"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={
                  list.query.sortBy
                    ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'asc' }
                    : undefined
                }
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link
                    to={`/management/batches/${row.id}`}
                    className="text-body-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    View
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link
                    to={`/management/batches/${row.id}`}
                    className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{row.name}</p>
                      <Badge tone={row.active ? 'success' : 'neutral'}>
                        {row.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">
                      {row.courseCode} · {row.faculty} · {row.studentCount} students
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
