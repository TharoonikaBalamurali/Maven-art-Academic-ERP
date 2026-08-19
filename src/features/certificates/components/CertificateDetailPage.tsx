import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useCertificate } from '../hooks/useCertificates';
import { certificateStatusTone } from '../status';
import { CERTIFICATE_STATUS_LABEL, CERTIFICATE_TYPE_LABEL, type CertificateDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

/**
 * Certificate detail (§27).
 *
 * A read view of a backend-issued certificate. The certificate number, issue
 * date and issuer are the backend's record, displayed verbatim; the frontend
 * never generates a certificate. A document download would come from a backend
 * endpoint (TBD — BACKEND CONTRACT).
 */
export function CertificateDetailPage() {
  const { certificateId = '' } = useParams();
  const query = useCertificate(certificateId);

  return (
    <>
      <Link
        to="/management/certificates"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to certificates
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
        {query.data && <CertificateDetailView certificate={query.data} />}
      </QueryBoundary>
    </>
  );
}

function CertificateDetailView({ certificate }: { certificate: CertificateDetail }) {
  return (
    <>
      <PageHeader
        title={certificate.certificateNo}
        description={certificate.student}
        meta={<Badge tone={certificateStatusTone(certificate.status)}>{CERTIFICATE_STATUS_LABEL[certificate.status] ?? certificate.status}</Badge>}
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Type">{CERTIFICATE_TYPE_LABEL[certificate.type] ?? certificate.type}</Info>
          <Info label="Course">{certificate.course ?? '—'}</Info>
          <Info label="Issued">{certificate.issuedAt ? formatDate(certificate.issuedAt) : 'Not issued'}</Info>
          <Info label="Issued by">{certificate.issuedBy ?? '—'}</Info>
        </CardBody>
      </Card>

      {certificate.note && (
        <Card className="mb-4">
          <CardBody className="text-body">
            <span className="font-medium">Note:</span> {certificate.note}
          </CardBody>
        </Card>
      )}

      <p className="text-body-sm text-[var(--text-subtle)]">
        The certificate document is issued and stored by the backend.
      </p>
    </>
  );
}
