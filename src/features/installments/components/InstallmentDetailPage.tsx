import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useInstallment } from '../hooks/useInstallments';
import { installmentStatusTone } from '../status';
import { INSTALLMENT_STATUS_LABEL, type InstallmentDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

/**
 * Installment detail (§21).
 *
 * A read view of one scheduled part-payment. The amount, dates and status are
 * displayed exactly as the backend reports them; the client never computes a
 * schedule or a status (finance invariant).
 */
export function InstallmentDetailPage() {
  const { installmentId = '' } = useParams();
  const query = useInstallment(installmentId);

  return (
    <>
      <Link
        to="/management/installments"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to installments
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
              <Skeleton className="h-28 w-full" />
            </CardBody>
          </Card>
        }
      >
        {query.data && <InstallmentDetailView installment={query.data} />}
      </QueryBoundary>
    </>
  );
}

function InstallmentDetailView({ installment }: { installment: InstallmentDetail }) {
  return (
    <>
      <PageHeader
        title={installment.student}
        description={`${installment.label} · ${installment.feeStructureName}`}
        meta={<Badge tone={installmentStatusTone(installment.status)}>{INSTALLMENT_STATUS_LABEL[installment.status] ?? installment.status}</Badge>}
      />

      <Card className="mb-4">
        <CardBody className="flex flex-col gap-1">
          <span className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Amount</span>
          {/* Backend-provided amount — displayed, never computed here. */}
          <span className="text-metric font-semibold tabular-nums text-[var(--text)]">{formatCurrency(installment.amount)}</span>
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Due">{installment.dueDate ? formatDate(installment.dueDate) : '—'}</Info>
          <Info label="Paid on">{installment.paidDate ? formatDate(installment.paidDate) : '—'}</Info>
          <Info label="Fee assignment">
            <Link to={`/management/fee-assignments/${installment.feeAssignmentId}`} className="text-[var(--accent)] hover:underline">
              {installment.feeAssignmentId}
            </Link>
          </Info>
        </CardBody>
      </Card>

      {installment.note && (
        <ContentSection title="Note">
          <Card>
            <CardBody className="text-body">{installment.note}</CardBody>
          </Card>
        </ContentSection>
      )}
    </>
  );
}
