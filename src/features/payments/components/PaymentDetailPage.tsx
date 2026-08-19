import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { usePayment } from '../hooks/usePayments';
import { paymentStatusTone } from '../status';
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, type PaymentDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

/**
 * Payment detail (§22).
 *
 * A read view of a recorded transaction. The amount, method and receipt are the
 * backend's record; the frontend displays them verbatim.
 */
export function PaymentDetailPage() {
  const { paymentId = '' } = useParams();
  const query = usePayment(paymentId);

  return (
    <>
      <Link
        to="/management/payments"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to payments
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
        {query.data && <PaymentDetailView payment={query.data} />}
      </QueryBoundary>
    </>
  );
}

function PaymentDetailView({ payment }: { payment: PaymentDetail }) {
  return (
    <>
      <PageHeader
        title={payment.student}
        description={`Payment ${payment.id}`}
        meta={<Badge tone={paymentStatusTone(payment.status)}>{PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}</Badge>}
      />

      <Card className="mb-4">
        <CardBody className="flex flex-col gap-1">
          <span className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Amount</span>
          {/* Backend-recorded amount — displayed, never computed here. */}
          <span className="text-metric font-semibold tabular-nums text-[var(--text)]">{formatCurrency(payment.amount)}</span>
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Method">{PAYMENT_METHOD_LABEL[payment.method] ?? payment.method}</Info>
          <Info label="Reference">{payment.reference ?? '—'}</Info>
          <Info label="Paid on">{payment.paidAt ? formatDate(payment.paidAt) : '—'}</Info>
          <Info label="Fee assignment">
            {payment.feeAssignmentId ? (
              <Link to={`/management/fee-assignments/${payment.feeAssignmentId}`} className="text-[var(--accent)] hover:underline">
                {payment.feeAssignmentId}
              </Link>
            ) : (
              '—'
            )}
          </Info>
          <Info label="Receipt">{payment.receiptId ?? 'Not issued'}</Info>
        </CardBody>
      </Card>

      {payment.note && (
        <ContentSection title="Note">
          <Card>
            <CardBody className="text-body">{payment.note}</CardBody>
          </Card>
        </ContentSection>
      )}
    </>
  );
}
