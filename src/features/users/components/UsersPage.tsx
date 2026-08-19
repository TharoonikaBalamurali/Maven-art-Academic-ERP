import { Link } from 'react-router-dom';
import { useDebouncedSearch } from '@/shared/hooks/useDebouncedSearch';
import { useListQueryState } from '@/shared/hooks/useListQueryState';
import { FilterBar, PageHeader } from '@/shared/layout/page';
import { Badge, Card, DataTable, EmptyState, Input, NoResultsState, Pagination, QueryBoundary, Select, TableSkeleton, type Column, type BadgeTone } from '@/shared/ui';
import { useUsers } from '../hooks/useUsers';
import { ROLE_LABEL, USER_STATUS_LABEL, type UserListItem } from '../types';

const STATUS_OPTIONS = Object.entries(USER_STATUS_LABEL).map(([value, label]) => ({ value, label }));
const ROLE_OPTIONS = Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }));
const STATUS_TONE: Record<string, BadgeTone> = { active: 'success', invited: 'info', suspended: 'danger' };

const columns: readonly Column<UserListItem>[] = [
  { id: 'name', header: 'User', cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: 'email', header: 'Email', hideBelowMd: true, cell: (row) => row.email },
  { id: 'role', header: 'Role', width: '9rem', cell: (row) => <Badge tone="neutral">{ROLE_LABEL[row.role] ?? row.role}</Badge> },
  { id: 'status', header: 'Status', width: '8rem', cell: (row) => <Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>{USER_STATUS_LABEL[row.status] ?? row.status}</Badge> },
];

/** Users list (§ administration). */
export function UsersPage() {
  const list = useListQueryState({ defaultLimit: 10, filterKeys: ['role', 'status'] as const });
  const [searchDraft, setSearchDraft] = useDebouncedSearch(list.query.search ?? '', list.setSearch);
  const query = useUsers(list.query);
  const rows = query.data?.data ?? [];
  const activeFilters = (list.query.search ? 1 : 0) + (list.query.filters?.role ? 1 : 0) + (list.query.filters?.status ? 1 : 0);
  function clearAll() { setSearchDraft(''); list.clear(); }

  return (
    <>
      <PageHeader title="Users" description="User accounts and their roles. Role permissions are enforced by the backend." meta={query.data && <Badge tone="neutral">{query.data.total} total</Badge>} />
      <Card className="overflow-hidden">
        <FilterBar activeCount={activeFilters} onClear={clearAll}>
          <Input label="Search" type="search" placeholder="Name or email" containerClassName="sm:w-64" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} />
          <Select label="Role" placeholder="All roles" containerClassName="sm:w-40" options={ROLE_OPTIONS} value={list.query.filters?.role?.toString() ?? ''} onChange={(e) => list.setFilter('role', e.target.value)} />
          <Select label="Status" placeholder="All statuses" containerClassName="sm:w-40" options={STATUS_OPTIONS} value={list.query.filters?.status?.toString() ?? ''} onChange={(e) => list.setFilter('status', e.target.value)} />
        </FilterBar>
        <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<div className="p-3"><TableSkeleton rows={5} columns={4} /></div>}>
          {rows.length === 0 ? (
            activeFilters > 0 ? <NoResultsState onClear={clearAll} /> : <EmptyState title="No users" description="User accounts appear here." />
          ) : (
            <>
              <DataTable
                caption="Users" columns={columns} rows={rows} rowKey={(row) => row.id}
                rowActions={(row) => <Link to={`/management/users/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">Open</Link>}
                renderMobileCard={(row) => (
                  <Link to={`/management/users/${row.id}`} className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]">
                    <div className="flex items-start justify-between gap-2"><p className="font-medium">{row.name}</p><Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>{USER_STATUS_LABEL[row.status] ?? row.status}</Badge></div>
                    <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.email}</p>
                    <p className="mt-0.5 text-caption text-[var(--text-subtle)]">{ROLE_LABEL[row.role] ?? row.role}</p>
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
