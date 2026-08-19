import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
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
import { useApplication, useApplicationTransition } from '../hooks/useApplications';
import { applicationStageTone } from '../stage';
import { APPLICATION_STAGE_LABEL, type ApplicationAction, type ApplicationDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

/**
 * Application detail (§16, §17).
 *
 * Shows the information needed to make the admission decision, and renders
 * decision actions ONLY from `availableActions` (the backend's legal
 * transitions) intersected with `applications.review`. The frontend does not
 * decide whether an application can be approved — it offers the actions the
 * backend advertises and lets the backend enforce them (a 409 on a stale state).
 */
export function ApplicationDetailPage() {
  const { applicationId = '' } = useParams();
  const query = useApplication(applicationId);

  return (
    <>
      <Link
        to="/management/applications"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to applications
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
        {query.data && <ApplicationDetailView application={query.data} />}
      </QueryBoundary>
    </>
  );
}

function ApplicationDetailView({ application }: { application: ApplicationDetail }) {
  const transition = useApplicationTransition(application.id);
  const [decision, setDecision] = useState<null | 'approve' | 'reject'>(null);
  const [note, setNote] = useState('');

  const has = (action: ApplicationAction) => application.availableActions.includes(action);

  async function run(action: ApplicationAction, note_: string | undefined, label: string) {
    try {
      await transition.mutateAsync({ action, note: note_ });
      toast.success(label);
      setDecision(null);
      setNote('');
    } catch (error) {
      const message =
        isApiError(error) && error.kind === 'conflict'
          ? 'This application has already moved on. Reloading its current state.'
          : 'The action could not be completed.';
      toast.error('Action not allowed', message);
      setDecision(null);
    }
  }

  return (
    <>
      <PageHeader
        title={application.applicant}
        description={application.programme}
        meta={<Badge tone={applicationStageTone(application.stage)}>{APPLICATION_STAGE_LABEL[application.stage] ?? application.stage}</Badge>}
        actions={
          // Decision buttons = backend availableActions ∩ applications.review (§16).
          <PermissionGuard permission="applications.review">
            <div className="flex flex-wrap gap-2">
              {has('submit') && (
                <Button variant="secondary" onClick={() => void run('submit', undefined, 'Application submitted')}>
                  Submit
                </Button>
              )}
              {has('start_review') && (
                <Button onClick={() => void run('start_review', undefined, 'Review started')}>Start review</Button>
              )}
              {has('approve') && <Button onClick={() => setDecision('approve')}>Approve</Button>}
              {has('reject') && (
                <Button variant="danger" onClick={() => setDecision('reject')}>
                  Reject
                </Button>
              )}
            </div>
          </PermissionGuard>
        }
      />

      {application.admissionId && (
        <div className="mb-4 rounded-control border border-[var(--success)] bg-[var(--success-surface)] px-3 py-2 text-body-sm text-[var(--success)]">
          Approved — admission{' '}
          <Link to={`/management/admissions/${application.admissionId}`} className="font-medium underline">
            {application.admissionId}
          </Link>
          .
        </div>
      )}

      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Email">{application.email}</Info>
          <Info label="Phone">{application.phone}</Info>
          <Info label="Programme">{application.programme}</Info>
          <Info label="Prior education">{application.priorEducation}</Info>
          <Info label="Submitted">{application.submittedAt ? formatDate(application.submittedAt) : 'Not submitted'}</Info>
          <Info label="Portfolio">
            <a
              href={application.portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
            >
              View <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </Info>
        </CardBody>
      </Card>

      {(application.decisionNote || application.enquiryId) && (
        <ContentSection title="Decision">
          <Card>
            <CardBody className="flex flex-col gap-2 text-body">
              {application.decisionNote && (
                <p>
                  <span className="font-medium">Note:</span> {application.decisionNote}
                </p>
              )}
              {application.enquiryId && (
                <p className="text-body-sm text-[var(--text-muted)]">
                  Originated from enquiry{' '}
                  <Link to={`/management/enquiries/${application.enquiryId}`} className="text-[var(--accent)] hover:underline">
                    {application.enquiryId}
                  </Link>
                  .
                </p>
              )}
            </CardBody>
          </Card>
        </ContentSection>
      )}

      <Modal
        open={decision !== null}
        onClose={() => setDecision(null)}
        title={decision === 'approve' ? 'Approve application' : 'Reject application'}
        description={
          decision === 'approve'
            ? `Approving admits ${application.applicant} and creates an admission record.`
            : `Rejecting closes ${application.applicant}'s application.`
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              variant={decision === 'reject' ? 'danger' : 'primary'}
              loading={transition.isPending}
              onClick={() =>
                void run(
                  decision === 'approve' ? 'approve' : 'reject',
                  note,
                  decision === 'approve' ? 'Application approved' : 'Application rejected',
                )
              }
            >
              {decision === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <label htmlFor="decision-note" className="mb-1.5 block text-body font-medium">
          Decision note <span className="font-normal text-[var(--text-subtle)]">(optional)</span>
        </label>
        <textarea
          id="decision-note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-control border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-body text-[var(--text)]"
        />
      </Modal>
    </>
  );
}
