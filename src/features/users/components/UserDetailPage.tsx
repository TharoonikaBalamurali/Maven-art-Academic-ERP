import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton, type BadgeTone } from '@/shared/ui';
import { useUser } from '../hooks/useUsers';
import { ROLE_LABEL, USER_STATUS_LABEL, type UserDetail } from '../types';

const STATUS_TONE: Record<string, BadgeTone> = { active: 'success', invited: 'info', suspended: 'danger' };
function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p><p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p></div>;
}

/** User detail (§ administration). */
export function UserDetailPage() {
  const { userId = '' } = useParams();
  const query = useUser(userId);
  return (
    <>
      <Link to="/management/users" className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"><ArrowLeft className="size-4" aria-hidden="true" />Back to users</Link>
      <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<Card><CardBody className="flex flex-col gap-4"><Skeleton className="h-7 w-48" /><Skeleton className="h-24 w-full" /></CardBody></Card>}>
        {query.data && <UserDetailView user={query.data} />}
      </QueryBoundary>
    </>
  );
}

function UserDetailView({ user }: { user: UserDetail }) {
  return (
    <>
      <PageHeader title={user.name} description={user.email} meta={<Badge tone={STATUS_TONE[user.status] ?? 'neutral'}>{USER_STATUS_LABEL[user.status] ?? user.status}</Badge>} />
      <Card className="mb-4"><CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Info label="Role"><Link to={`/management/roles/${user.role}`} className="text-[var(--accent)] hover:underline">{ROLE_LABEL[user.role] ?? user.role}</Link></Info>
        <Info label="Phone">{user.phone ?? '—'}</Info>
        <Info label="Created">{user.createdAt ? formatDate(user.createdAt) : '—'}</Info>
        <Info label="Last active">{user.lastActiveAt ? formatDate(user.lastActiveAt) : 'Never'}</Info>
      </CardBody></Card>
      <p className="text-body-sm text-[var(--text-subtle)]">Role permissions are enforced by the backend; editing users requires the users.update permission.</p>
    </>
  );
}
