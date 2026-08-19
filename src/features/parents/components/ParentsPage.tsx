import { Link } from 'react-router-dom';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import { Badge, Card, DataTable, EmptyState, Input, NoResultsState, Pagination, QueryBoundary, TableSkeleton, type Column } from '@/shared/ui';
import { useParents } from '../hooks/useParents';
import { PARENT_RELATION_LABEL, type ParentListItem } from '../types';

const columns: readonly Column<ParentListItem>[] = [
  { id: 'name', header: 'Parent', cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: 'relation', header: 'Relation', hideBelowMd: true, cell: (row) => PARENT_RELATION_LABEL[row.relation] ?? row.relation },
  { id: 'email', header: 'Email', hideBelowMd: true, cell: (row) => row.email },
  { id: 'studentCount', header: 'Students', align: 'right', width: '7rem', cell: (row) => <span className="tabular-nums">{row.studentCount}</span> },
];

/** Parents list (§ Phase 2). */
export function ParentsPage() {
  const list = useListQueryState({ defaultLimit: 10 });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useParents(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = list.query.search ? 1 : 0;
  function clearAll() { setSearchDraft(''); list.clear(); }

  return (
    <>
      <PageHeader title="Parents" description="Parent records and their linked students." meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>} />
      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input label="Search" type="search" placeholder="Name or email" containerClassName="sm:w-72" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} />
        </FilterBar>
        <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<div className="p-3"><TableSkeleton rows={5} columns={4} /></div>}>
          {rows.length === 0 ? (
            activeFilters > 0 ? <NoResultsState onClear={clearAll} /> : <EmptyState title="No parents" description="Parent records appear here." />
          ) : (
            <>
              <DataTable
                caption="Parents" columns={columns} rows={rows} rowKey={(row) => row.id}
                rowActions={(row) => <Link to={`/management/parents/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">Open</Link>}
                renderMobileCard={(row) => (
                  <Link to={`/management/parents/${row.id}`} className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]">
                    <div className="flex items-start justify-between gap-2"><p className="font-medium">{row.name}</p><Badge tone="neutral">{row.studentCount} student{row.studentCount === 1 ? '' : 's'}</Badge></div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.email}</p>
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
