import { Link } from 'react-router-dom';
import { PageHeader } from '@/shared/layout/page';
import { Badge, Card, DataTable, QueryBoundary, TableSkeleton, type Column } from '@/shared/ui';
import { useRoles } from '../hooks/useRoles';
import type { RoleListItem } from '../types';

const columns: readonly Column<RoleListItem>[] = [
  { id: 'name', header: 'Role', cell: (row) => <span className="font-medium">{row.name}</span> },
  { id: 'description', header: 'Description', hideBelowMd: true, cell: (row) => row.description },
  { id: 'userCount', header: 'Users', align: 'right', width: '6rem', cell: (row) => <span className="tabular-nums">{row.userCount}</span> },
  { id: 'permissionCount', header: 'Permissions', align: 'right', width: '8rem', cell: (row) => <span className="tabular-nums">{row.permissionCount}</span> },
];

/** Roles list (§ administration). */
export function RolesPage() {
  const query = useRoles({});
  const rows = query.data?.data ?? [];
  return (
    <>
      <PageHeader title="Roles & Permissions" description="Role definitions. Permissions are enforced by the backend (§12)." meta={query.data && <Badge tone="neutral">{query.data.total} roles</Badge>} />
      <Card className="overflow-hidden">
        <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<div className="p-3"><TableSkeleton rows={5} columns={4} /></div>}>
          <DataTable
            caption="Roles" columns={columns} rows={rows} rowKey={(row) => row.id}
            rowActions={(row) => <Link to={`/management/roles/${row.id}`} className="text-body-sm font-medium text-[var(--accent)] hover:underline">Open</Link>}
            renderMobileCard={(row) => (
              <Link to={`/management/roles/${row.id}`} className="block border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--surface-hover)]">
                <div className="flex items-start justify-between gap-2"><p className="font-medium">{row.name}</p><Badge tone="neutral">{row.permissionCount} perms</Badge></div>
                <p className="mt-1 text-body-sm text-[var(--text-muted)]">{row.description}</p>
              </Link>
            )}
          />
        </QueryBoundary>
      </Card>
    </>
  );
}
