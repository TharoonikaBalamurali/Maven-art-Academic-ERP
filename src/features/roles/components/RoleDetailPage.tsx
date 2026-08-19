import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useRole } from '../hooks/useRoles';
import type { RoleDetail } from '../types';

/** Role detail (§ administration) — the backend-enforced permission set. */
export function RoleDetailPage() {
  const { roleId = '' } = useParams();
  const query = useRole(roleId);
  return (
    <>
      <Link to="/management/roles" className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"><ArrowLeft className="size-4" aria-hidden="true" />Back to roles</Link>
      <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<Card><CardBody className="flex flex-col gap-4"><Skeleton className="h-7 w-48" /><Skeleton className="h-40 w-full" /></CardBody></Card>}>
        {query.data && <RoleDetailView role={query.data} />}
      </QueryBoundary>
    </>
  );
}

function RoleDetailView({ role }: { role: RoleDetail }) {
  return (
    <>
      <PageHeader title={role.name} description={role.description} meta={<Badge tone="neutral">{role.userCount} user{role.userCount === 1 ? '' : 's'}</Badge>} />
      <ContentSection title="Permissions">
        <div className="grid gap-3 sm:grid-cols-2">
          {role.groups.map((group) => (
            <Card key={group.domain}>
              <CardBody className="flex flex-col gap-2">
                <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{group.domain}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {group.permissions.map((permission) => (
                    <li key={permission}><Badge tone="neutral"><span className="font-mono text-caption">{permission}</span></Badge></li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      </ContentSection>
      <p className="mt-4 text-body-sm text-[var(--text-subtle)]">This mapping is enforced by the backend; the frontend uses it only to shape the UI (§12). Editing requires the roles.update permission.</p>
    </>
  );
}
