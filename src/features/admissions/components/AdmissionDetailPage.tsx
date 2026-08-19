import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { isApiError } from '@/lib/api';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import {
  Badge,
  Button,
  Card,
  CardBody,
  Modal,
  QueryBoundary,
  Skeleton,
  toast,
} from '@/shared/ui';
import { useAdmission, useAdmissionTransition } from '../hooks/useAdmissions';
import { admissionStageTone } from '../stage';
import { ADMISSION_STAGE_LABEL, type AdmissionAction, type AdmissionDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

/**
 * Admission detail (§17).
 *
 * Renders confirm/enroll/cancel ONLY from `availableActions` (the backend's
 * legal transitions) intersected with `admissions.approve`. The frontend never
 * decides whether an admission can progress — it offers the actions the backend
 * advertises and lets the backend reject a stale state (409). Enrolling is the
 * handoff to Enrollments (§18); the created enrollment is linked once it exists.
 */
export function AdmissionDetailPage() {
  const { admissionId = '' } = useParams();
  const query = useAdmission(admissionId);

  return (
    <>
      <Link
        to="/management/admissions"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to admissions
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
        {query.data && <AdmissionDetailView admission={query.data} />}
      </QueryBoundary>
    </>
  );
}

function AdmissionDetailView({ admission }: { admission: AdmissionDetail }) {
  const transition = useAdmissionTransition(admission.id);
  const [decision, setDecision] = useState<null | 'enroll' | 'cancel'>(null);
  const [note, setNote] = useState('');

  const has = (action: AdmissionAction) => admission.availableActions.includes(action);

  async function run(action: AdmissionAction, note_: string | undefined, label: string) {
    try {
      await transition.mutateAsync({ action, note: note_ });
      toast.success(label);
      setDecision(null);
      setNote('');
    } catch (error) {
      const message =
        isApiError(error) && error.kind === 'conflict'
          ? 'This admission has already moved on. Reloading its current state.'
          : 'The action could not be completed.';
      toast.error('Action not allowed', message);
      setDecision(null);
    }
  }

  return (
    <>
      <PageHeader
        title={admission.applicant}
        description={admission.programme}
        meta={<Badge tone={admissionStageTone(admission.stage)}>{ADMISSION_STAGE_LABEL[admission.stage] ?? admission.stage}</Badge>}
        actions={
          // Decision buttons = backend availableActions ∩ admissions.approve (§17).
          <PermissionGuard permission="admissions.approve">
            <div className="flex flex-wrap gap-2">
              {has('confirm') && (
                <Button onClick={() => void run('confirm', undefined, 'Admission confirmed')}>Confirm</Button>
              )}
              {has('enroll') && <Button onClick={() => setDecision('enroll')}>Enrol</Button>}
              {has('cancel') && (
                <Button variant="danger" onClick={() => setDecision('cancel')}>
                  Cancel
                </Button>
              )}
            </div>
          </PermissionGuard>
        }
      />

      {admission.enrollmentId && (
        <div className="mb-4 rounded-control border border-[var(--success)] bg-[var(--success-surface)] px-3 py-2 text-body-sm text-[var(--success)]">
          Enrolled — enrollment{' '}
          <Link to="/management/enrollments" className="font-medium underline">
            {admission.enrollmentId}
          </Link>
          .
        </div>
      )}

      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Email">{admission.email}</Info>
          <Info label="Phone">{admission.phone}</Info>
          <Info label="Programme">{admission.programme}</Info>
          <Info label="Offered">{admission.offeredAt ? formatDate(admission.offeredAt) : '—'}</Info>
          <Info label="Application">
            {admission.applicationId ? (
              <Link to={`/management/applications/${admission.applicationId}`} className="text-[var(--accent)] hover:underline">
                {admission.applicationId}
              </Link>
            ) : (
              '—'
            )}
          </Info>
        </CardBody>
      </Card>

      {admission.note && (
        <ContentSection title="Decision">
          <Card>
            <CardBody className="text-body">
              <p>
                <span className="font-medium">Note:</span> {admission.note}
              </p>
            </CardBody>
          </Card>
        </ContentSection>
      )}

      <Modal
        open={decision !== null}
        onClose={() => setDecision(null)}
        title={decision === 'enroll' ? 'Enrol applicant' : 'Cancel admission'}
        description={
          decision === 'enroll'
            ? `Enrolling admits ${admission.applicant} and creates an enrollment record.`
            : `Cancelling closes ${admission.applicant}'s admission offer.`
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDecision(null)}>
              Dismiss
            </Button>
            <Button
              variant={decision === 'cancel' ? 'danger' : 'primary'}
              loading={transition.isPending}
              onClick={() =>
                void run(
                  decision === 'enroll' ? 'enroll' : 'cancel',
                  note,
                  decision === 'enroll' ? 'Applicant enrolled' : 'Admission cancelled',
                )
              }
            >
              {decision === 'enroll' ? 'Enrol' : 'Cancel admission'}
            </Button>
          </>
        }
      >
        <label htmlFor="admission-note" className="mb-1.5 block text-body font-medium">
          Note <span className="font-normal text-[var(--text-subtle)]">(optional)</span>
        </label>
        <textarea
          id="admission-note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-control border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-body text-[var(--text)]"
        />
      </Modal>
    </>
  );
}
