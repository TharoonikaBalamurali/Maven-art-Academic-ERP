import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { PAYMENT_METHOD_LABEL } from '@/features/payments/types';
import { PageHeader } from '@/shared/layout/page';
import { Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useReceipt } from '../hooks/useReceipts';
import type { ReceiptDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

/**
 * Receipt detail (§24).
 *
 * A read view of a backend-issued receipt. The receipt number, amount and dates
 * are the backend's record, displayed verbatim; the frontend never generates a
 * receipt. A downloadable document would come from a backend endpoint
 * (TBD — BACKEND CONTRACT) rather than being produced here.
 */
export function ReceiptDetailPage() {
  const { receiptId = '' } = useParams();
  const query = useReceipt(receiptId);

  return (
    <>
      <Link
        to="/management/receipts"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to receipts
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
        {query.data && <ReceiptDetailView receipt={query.data} />}
      </QueryBoundary>
    </>
  );
}

function ReceiptDetailView({ receipt }: { receipt: ReceiptDetail }) {
  return (
    <>
      <PageHeader title={receipt.receiptNo} description={receipt.student} />

      <Card className="mb-4">
        <CardBody className="flex flex-col gap-1">
          <span className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">Amount received</span>
          {/* Backend-recorded amount — displayed, never computed here. */}
          <span className="text-metric font-semibold tabular-nums text-[var(--text)]">{formatCurrency(receipt.amount)}</span>
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Method">{PAYMENT_METHOD_LABEL[receipt.method] ?? receipt.method}</Info>
          <Info label="Issued">{receipt.issuedAt ? formatDate(receipt.issuedAt) : '—'}</Info>
          <Info label="Payment">
            <Link to={`/management/payments/${receipt.paymentId}`} className="text-[var(--accent)] hover:underline">
              {receipt.paymentId}
            </Link>
          </Info>
          <Info label="Fee assignment">
            {receipt.feeAssignmentId ? (
              <Link to={`/management/fee-assignments/${receipt.feeAssignmentId}`} className="text-[var(--accent)] hover:underline">
                {receipt.feeAssignmentId}
              </Link>
            ) : (
              '—'
            )}
          </Info>
        </CardBody>
      </Card>

      <p className="text-body-sm text-[var(--text-subtle)]">
        The receipt document is issued and stored by the backend.
      </p>
    </>
  );
}
