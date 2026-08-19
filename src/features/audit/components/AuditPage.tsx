import { Link } from 'react-router-dom';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { formatDateTime } from '@/lib/utils/format';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import { Badge, Card, DataTable, EmptyState, Input, NoResultsState, Pagination, QueryBoundary, TableSkeleton, type Column } from '@/shared/ui';
import { useAuditLog } from '../hooks/useAudit';
import type { AuditListItem } from '../types';

const columns: readonly Column<AuditListItem>[] = [
  { id: 'at', header: 'When', width: '13rem', cell: (row) => <time dateTime={row.at} className="tabular-nums text-body-sm">{formatDateTime(row.at)}</time> },
  { id: 'actor', header: 'Actor', cell: (row) => <span className="font-medium">{row.actor}</span> },
  { id: 'action', header: 'Action', hideBelowMd: true, cell: (row) => <span className="font-mono text-caption">{row.action}</span> },
  { id: 'target', header: 'Target', align: 'right', hideBelowMd: true, cell: (row) => <span className="font-mono text-caption text-[var(--text-muted)]">{row.target}</span> },
];

/** Audit log (§ administration) — recorded by the backend; read-only. */
export function AuditPage() {
  const list = useListQueryState({ defaultLimit: 20 });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useAuditLog(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = list.query.search ? 1 : 0;
  function clearAll() {
    setSearchDraft('');
    list.clear();
  }

  return (
    <>
      <PageHeader title="Audit Logs" description="Actions recorded by the backend. Read-only." meta={query.data && <Badge tone="neutral">{query.data.total} entries</Badge>} />
      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input label="Search" type="search" placeholder="Actor, action or target" containerClassName="sm:w-72" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} />
        </FilterBar>
        <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<div className="p-3"><TableSkeleton rows={6} columns={4} /></div>}>
          {rows.length === 0 ? (
            activeFilters > 0 ? <NoResultsState onClear={clearAll} /> : <EmptyState title="No audit entries" description="Recorded actions appear here." />
          ) : (
            <>
              <DataTable
                caption="Audit log"
                columns={columns}
                rows={rows}
                rowKey={(row) => row.id}
                rowActions={(row) => <Link to={`/management/audit/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">Open</Link>}
                renderMobileCard={(row) => (
                  <Link to={`/management/audit/${row.id}`} className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{row.actor}</p>
                      <span className="font-mono text-caption text-[var(--text-muted)]">{row.target}</span>
                    </div>
                    <p className="mt-1 font-mono text-caption text-[var(--text-muted)]">{row.action}</p>
                    <p className="mt-0.5 text-caption text-[var(--text-subtle)]">{formatDateTime(row.at)}</p>
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
