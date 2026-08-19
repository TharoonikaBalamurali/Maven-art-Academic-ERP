import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useParent } from '../hooks/useParents';
import { PARENT_RELATION_LABEL, type ParentDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p><p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p></div>;
}

/** Parent detail (§ Phase 2). */
export function ParentDetailPage() {
  const { parentId = '' } = useParams();
  const query = useParent(parentId);
  return (
    <>
      <Link to="/management/parents" className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"><ArrowLeft className="size-4" aria-hidden="true" />Back to parents</Link>
      <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<Card><CardBody className="flex flex-col gap-4"><Skeleton className="h-7 w-48" /><Skeleton className="h-24 w-full" /></CardBody></Card>}>
        {query.data && <ParentDetailView parent={query.data} />}
      </QueryBoundary>
    </>
  );
}

function ParentDetailView({ parent }: { parent: ParentDetail }) {
  return (
    <>
      <PageHeader title={parent.name} description={PARENT_RELATION_LABEL[parent.relation] ?? parent.relation} meta={<Badge tone="neutral">{parent.students.length} student{parent.students.length === 1 ? '' : 's'}</Badge>} />
      <Card className="mb-4"><CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3"><Info label="Email">{parent.email}</Info><Info label="Phone">{parent.phone}</Info><Info label="Relation">{PARENT_RELATION_LABEL[parent.relation] ?? parent.relation}</Info></CardBody></Card>
      <ContentSection title="Linked students">
        <Card>
          <ul className="divide-y divide-[var(--border)]">
            {parent.students.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <Link to={`/management/students/${s.id}`} className="font-medium text-[var(--accent)] hover:underline">{s.name}</Link>
                <span className="text-body-sm text-[var(--text-muted)]">{s.course}</span>
              </li>
            ))}
          </ul>
        </Card>
      </ContentSection>
      {parent.note && <Card className="mt-4"><CardBody className="text-body"><span className="font-medium">Note:</span> {parent.note}</CardBody></Card>}
    </>
  );
}
