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
  TableSkeleton,
  type Column,
} from '@/shared/ui';
import { useCourses } from '../hooks/useCourses';
import type { CourseListItem } from '../types';

const columns: readonly Column<CourseListItem>[] = [
  { id: 'code', header: 'Code', sortable: true, width: '8rem', cell: (row) => <span className="font-mono text-body-sm">{row.code}</span> },
  { id: 'name', header: 'Course', sortable: true, cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: 'batches', header: 'Batches', sortable: true, align: 'right', width: '8rem', cell: (row) => row.batchCount },
  { id: 'students', header: 'Students', sortable: true, align: 'right', width: '8rem', cell: (row) => row.studentCount },
];

/** Courses list (§19). */
export function CoursesPage() {
  const list = useListQueryState({ defaultLimit: 10, defaultSortBy: 'name', defaultSortDir: 'asc' });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useCourses(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = list.query.search ? 1 : 0;

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Courses"
        description="Programmes offered, with their batches and enrolment."
        meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>}
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Course name or code"
            containerClassName="sm:w-64"
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
              <EmptyState title="No courses yet" description="Courses will appear here." />
            )
          ) : (
            <>
              <DataTable
                caption="Courses"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'asc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link to={`/management/courses/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    View
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link
                    to={`/management/courses/${row.id}`}
                    className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-body-sm text-[var(--text-muted)]">{row.code}</span>
                      <span className="font-medium">{row.name}</span>
                    </div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">
                      {row.batchCount} batches · {row.studentCount} students
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
