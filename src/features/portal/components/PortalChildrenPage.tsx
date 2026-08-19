import { useNavigate } from 'react-router-dom';
import { Check, UsersRound } from 'lucide-react';
import { useUiStore } from '@/app/state/ui.store';
import { PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton, toast } from '@/shared/ui';
import { usePortalChildren } from '../hooks/usePortal';
import type { PortalChild, PortalChildren } from '../types';

/**
 * My Children (§8) — the parent's linked children. Selecting one sets the
 * portal's view scope (`selectedStudentId`), which every portal query keys on,
 * so the whole portal re-scopes to that child. The backend still authorises
 * access — this is only a view preference.
 */
export function PortalChildrenPage() {
  const query = usePortalChildren();
  return (
    <>
      <PageHeader title="My Children" description="Select a child to view their records across the portal." />
      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingFallback={<Card><CardBody className="flex flex-col gap-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></CardBody></Card>}
      >
        {query.data && <ChildrenList data={query.data} />}
      </QueryBoundary>
    </>
  );
}

function ChildrenList({ data }: { data: PortalChildren }) {
  const navigate = useNavigate();
  const selectedStudentId = useUiStore((s) => s.selectedStudentId);
  const selectStudent = useUiStore((s) => s.selectStudent);
  // Default scope is the first child when nothing is selected yet.
  const activeId = selectedStudentId ?? data.children[0]?.id ?? null;

  function choose(child: PortalChild) {
    selectStudent(child.id);
    toast.success('Viewing ' + child.name, 'The portal now shows their records.');
    navigate('/portal');
  }

  if (data.children.length === 0) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-2 py-10 text-center">
          <UsersRound className="size-6 text-[var(--text-subtle)]" aria-hidden="true" />
          <p className="text-body text-[var(--text-muted)]">No children are linked to your account.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.children.map((child) => {
        const active = child.id === activeId;
        return (
          <button
            key={child.id}
            type="button"
            onClick={() => choose(child)}
            aria-pressed={active}
            className={`surface-card flex items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-[var(--surface-hover)] ${active ? 'ring-2 ring-[var(--accent)]' : ''}`}
          >
            <div>
              <p className="font-medium text-[var(--text)]">{child.name}</p>
              <p className="mt-0.5 text-body-sm text-[var(--text-muted)]">{child.course} · {child.batch}</p>
            </div>
            {active ? (
              <Badge tone="success"><span className="inline-flex items-center gap-1"><Check className="size-3.5" aria-hidden="true" />Viewing</span></Badge>
            ) : (
              <Badge tone="neutral">Select</Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
