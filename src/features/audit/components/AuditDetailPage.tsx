import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/format';
import { PageHeader } from '@/shared/layout/page';
import { Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useAuditEntry } from '../hooks/useAudit';
import type { AuditDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

/** Audit entry detail (§ administration). */
export function AuditDetailPage() {
  const { auditId = '' } = useParams();
  const query = useAuditEntry(auditId);
  return (
    <>
      <Link to="/management/audit" className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to audit logs
      </Link>
      <QueryBoundary isPending={query.isPending} isError={query.isError} error={query.error} onRetry={() => void query.refetch()} loadingFallback={<Card><CardBody className="flex flex-col gap-4"><Skeleton className="h-7 w-48" /><Skeleton className="h-24 w-full" /></CardBody></Card>}>
        {query.data && <AuditDetailView entry={query.data} />}
      </QueryBoundary>
    </>
  );
}

function AuditDetailView({ entry }: { entry: AuditDetail }) {
  return (
    <>
      <PageHeader title={entry.action} description={`${entry.actor} · ${entry.actorRole}`} />
      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Actor">{entry.actor}</Info>
          <Info label="Role">{entry.actorRole}</Info>
          <Info label="Target"><span className="font-mono text-body-sm">{entry.target}</span></Info>
          <Info label="When">{formatDateTime(entry.at)}</Info>
          <Info label="IP address"><span className="font-mono text-body-sm">{entry.ip}</span></Info>
        </CardBody>
      </Card>
      {entry.details && <Card><CardBody className="text-body">{entry.details}</CardBody></Card>}
    </>
  );
}
