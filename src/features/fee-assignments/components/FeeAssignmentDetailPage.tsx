import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useFeeAssignment } from '../hooks/useFeeAssignments';
import { feeAssignmentStatusTone } from '../status';
import { FEE_ASSIGNMENT_STATUS_LABEL, type FeeAssignmentDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

/**
 * Fee assignment detail (§20).
 *
 * Shows the assigned amount, paid amount and balance — each rendered verbatim
 * from the backend. The client never derives the balance from assigned − paid;
 * it displays the backend's authoritative figures (finance invariant).
 */
export function FeeAssignmentDetailPage() {
  const { feeAssignmentId = '' } = useParams();
  const query = useFeeAssignment(feeAssignmentId);

  return (
    <>
      <Link
        to="/management/fee-assignments"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to fee assignments
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
        {query.data && <FeeAssignmentDetailView assignment={query.data} />}
      </QueryBoundary>
    </>
  );
}

function Amount({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</span>
      <span className={`tabular-nums ${emphasis ? 'text-metric font-semibold text-[var(--text)]' : 'text-body-lg text-[var(--text)]'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function FeeAssignmentDetailView({ assignment }: { assignment: FeeAssignmentDetail }) {
  return (
    <>
      <PageHeader
        title={assignment.student}
        description={assignment.feeStructureName}
        meta={<Badge tone={feeAssignmentStatusTone(assignment.status)}>{FEE_ASSIGNMENT_STATUS_LABEL[assignment.status] ?? assignment.status}</Badge>}
      />

      <Card className="mb-4">
        {/* Assigned / paid / balance — each shown verbatim from the backend. */}
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Amount label="Assigned" value={assignment.assignedAmount} />
          <Amount label="Paid" value={assignment.paidAmount} />
          <Amount label="Balance" value={assignment.balance} emphasis />
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Course">{assignment.courseName}</Info>
          <Info label="Fee structure">
            <Link to={`/management/fee-structures/${assignment.feeStructureId}`} className="text-[var(--accent)] hover:underline">
              {assignment.feeStructureName}
            </Link>
          </Info>
          <Info label="Assigned on">{assignment.assignedAt ? formatDate(assignment.assignedAt) : '—'}</Info>
          <Info label="Due">{assignment.dueDate ? formatDate(assignment.dueDate) : '—'}</Info>
        </CardBody>
      </Card>

      {assignment.note && (
        <ContentSection title="Note">
          <Card>
            <CardBody className="text-body">{assignment.note}</CardBody>
          </Card>
        </ContentSection>
      )}
    </>
  );
}
