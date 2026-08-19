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
import { useFacultyList } from '../hooks/useFaculty';
import type { FacultyListItem } from '../types';

const columns: readonly Column<FacultyListItem>[] = [
  { id: 'name', header: 'Name', sortable: true, cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: 'email', header: 'Email', hideBelowMd: true, cell: (row) => <span className="text-[var(--text-muted)]">{row.email}</span> },
  { id: 'batches', header: 'Batches', sortable: true, align: 'right', width: '8rem', cell: (row) => row.batchCount },
  { id: 'students', header: 'Students', sortable: true, align: 'right', width: '8rem', cell: (row) => row.studentCount },
];

/** Faculty list (§3.1). List/detail pattern applied to the faculty entity. */
export function FacultyPage() {
  const list = useListQueryState({ defaultLimit: 10, defaultSortBy: 'name', defaultSortDir: 'asc' });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useFacultyList(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = list.query.search ? 1 : 0;

  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader
        title="Faculty"
        description="Teaching staff, their assigned batches and student load."
        meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>}
      />

      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input
            label="Search"
            type="search"
            placeholder="Name or email"
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
              <TableSkeleton rows={4} columns={4} />
            </div>
          }
        >
          {rows.length === 0 ? (
            activeFilters > 0 ? (
              <NoResultsState onClear={clearAll} />
            ) : (
              <EmptyState title="No faculty yet" description="Faculty members will appear here." />
            )
          ) : (
            <>
              <DataTable
                caption="Faculty"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                sort={list.query.sortBy ? { sortBy: list.query.sortBy, sortDir: list.query.sortDir ?? 'asc' } : undefined}
                onSortChange={list.setSort}
                rowActions={(row) => (
                  <Link to={`/management/faculty/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">
                    View
                  </Link>
                )}
                renderMobileCard={(row) => (
                  <Link
                    to={`/management/faculty/${row.id}`}
                    className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]"
                  >
                    <p className="font-medium">{row.name}</p>
                    <p className="text-body-sm text-[var(--text-muted)]">{row.email}</p>
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
