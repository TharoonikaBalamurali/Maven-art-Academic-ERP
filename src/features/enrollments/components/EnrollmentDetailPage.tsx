import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Card, CardBody, QueryBoundary, Skeleton } from '@/shared/ui';
import { useEnrollment } from '../hooks/useEnrollments';
import { enrollmentStatusTone } from '../status';
import { ENROLLMENT_STATUS_LABEL, type EnrollmentDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

/**
 * Enrollment detail (§18).
 *
 * A read view of the enrollment record and its provenance (the admission it was
 * created from, §17). The backend owns the enrollment status; the frontend only
 * displays it. Any status transition or manual create is gated by the backend.
 */
export function EnrollmentDetailPage() {
  const { enrollmentId = '' } = useParams();
  const query = useEnrollment(enrollmentId);

  return (
    <>
      <Link
        to="/management/enrollments"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to enrollments
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
              <Skeleton className="h-24 w-full" />
            </CardBody>
          </Card>
        }
      >
        {query.data && <EnrollmentDetailView enrollment={query.data} />}
      </QueryBoundary>
    </>
  );
}

function EnrollmentDetailView({ enrollment }: { enrollment: EnrollmentDetail }) {
  return (
    <>
      <PageHeader
        title={enrollment.student}
        description={enrollment.course}
        meta={<Badge tone={enrollmentStatusTone(enrollment.status)}>{ENROLLMENT_STATUS_LABEL[enrollment.status] ?? enrollment.status}</Badge>}
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Course">{enrollment.course}</Info>
          <Info label="Batch">{enrollment.batch}</Info>
          <Info label="Enrolled">{enrollment.enrolledAt ? formatDate(enrollment.enrolledAt) : '—'}</Info>
          <Info label="Admission">
            {enrollment.admissionId ? (
              <Link to={`/management/admissions/${enrollment.admissionId}`} className="text-[var(--accent)] hover:underline">
                {enrollment.admissionId}
              </Link>
            ) : (
              '—'
            )}
          </Info>
        </CardBody>
      </Card>

      {enrollment.note && (
        <ContentSection title="Note">
          <Card>
            <CardBody className="text-body">{enrollment.note}</CardBody>
          </Card>
        </ContentSection>
      )}
    </>
  );
}
