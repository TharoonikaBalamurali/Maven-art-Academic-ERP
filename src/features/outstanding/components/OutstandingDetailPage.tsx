import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useOutstanding } from '../hooks/useOutstanding';
import { outstandingSeverityTone } from '../severity';
import { OUTSTANDING_SEVERITY_LABEL, type OutstandingDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

function Amount({ label, value, tone }: { label: string; value: number; tone?: 'danger' | 'default' }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</span>
      <span className={`text-metric font-semibold tabular-nums ${tone === 'danger' ? 'text-[var(--danger)]' : 'text-[var(--text)]'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

/**
 * Outstanding fee detail (§23).
 *
 * A read view of the backend's outstanding report for one student. Assigned,
 * paid, outstanding and overdue are all backend-computed figures shown verbatim;
 * the client never derives outstanding from assigned − paid (finance invariant).
 */
export function OutstandingDetailPage() {
  const { outstandingId = '' } = useParams();
  const query = useOutstanding(outstandingId);

  return (
    <>
      <Link
        to="/management/outstanding"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to outstanding fees
      </Link>

      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingFallback={
          <Card>
            <CardBody className="flex flex-col gap-4">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-32 w-full" />
            </CardBody>
          </Card>
        }
      >
        {query.data && <OutstandingDetailView outstanding={query.data} />}
      </QueryBoundary>
    </>
  );
}

function OutstandingDetailView({ outstanding }: { outstanding: OutstandingDetail }) {
  return (
    <>
      <PageHeader
        title={outstanding.student}
        description={outstanding.course}
        meta={<Badge tone={outstandingSeverityTone(outstanding.severity)}>{OUTSTANDING_SEVERITY_LABEL[outstanding.severity] ?? outstanding.severity}</Badge>}
      />

      <Card className="mb-4">
        {/* All figures are backend-computed and shown verbatim. */}
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Amount label="Outstanding" value={outstanding.outstandingAmount} />
          <Amount label="Overdue" value={outstanding.overdueAmount} tone={outstanding.overdueAmount > 0 ? 'danger' : 'default'} />
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Assigned total">{formatCurrency(outstanding.assignedTotal)}</Info>
          <Info label="Paid total">{formatCurrency(outstanding.paidTotal)}</Info>
          <Info label="Oldest due">{outstanding.oldestDueDate ? formatDate(outstanding.oldestDueDate) : '—'}</Info>
          <Info label="As of">{outstanding.asOf ? formatDate(outstanding.asOf) : '—'}</Info>
          <Info label="Fee assignment">
            <Link to={`/management/fee-assignments/${outstanding.feeAssignmentId}`} className="text-[var(--accent)] hover:underline">
              {outstanding.feeAssignmentId}
            </Link>
          </Info>
        </CardBody>
      </Card>

      {outstanding.note && (
        <ContentSection title="Note">
          <Card>
            <CardBody className="text-body">{outstanding.note}</CardBody>
          </Card>
        </ContentSection>
      )}
    </>
  );
}
