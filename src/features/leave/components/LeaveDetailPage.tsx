import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { isApiError } from '@/lib/api';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import { Badge, Button, Card, CardBody, Modal, QueryBoundary, Skeleton, toast } from '@/shared/ui';
import { useLeaveDecision, useLeaveRequest } from '../hooks/useLeave';
import { leaveStatusTone } from '../status';
import { LEAVE_KIND_LABEL, LEAVE_STATUS_LABEL, type LeaveAction, type LeaveDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children || '—'}</p>
    </div>
  );
}

/**
 * Leave / OD request detail (§ student affairs).
 *
 * Decision buttons come from the backend's `availableActions` intersected with
 * the caller's approve permission — the frontend never decides whether a request
 * may be approved, and a stale state returns 409.
 */
export function LeaveDetailPage() {
  const { requestId = '' } = useParams();
  const query = useLeaveRequest(requestId);

  return (
    <>
      <Link to="/management/leave" className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to leave / OD
      </Link>

      <QueryBoundary
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingFallback={<Card><CardBody className="flex flex-col gap-4"><Skeleton className="h-7 w-48" /><Skeleton className="h-32 w-full" /></CardBody></Card>}
      >
        {query.data && <RequestView request={query.data} />}
      </QueryBoundary>
    </>
  );
}

function RequestView({ request }: { request: LeaveDetail }) {
  const decision = useLeaveDecision(request.id);
  const [pending, setPending] = useState<null | LeaveAction>(null);
  const [note, setNote] = useState('');

  const has = (action: LeaveAction) => request.availableActions.includes(action);

  async function run(action: LeaveAction) {
    try {
      await decision.mutateAsync({ action, note });
      toast.success(action === 'approve' ? 'Request approved' : 'Request rejected');
      setPending(null);
      setNote('');
    } catch (error) {
      const message =
        isApiError(error) && error.kind === 'conflict'
          ? 'This request has already been decided.'
          : 'The decision could not be recorded.';
      toast.error('Action not allowed', message);
      setPending(null);
    }
  }

  return (
    <>
      <PageHeader
        title={request.requestNo}
        description={`${request.student} · ${LEAVE_KIND_LABEL[request.kind] ?? request.kind}`}
        meta={<Badge tone={leaveStatusTone(request.status)}>{LEAVE_STATUS_LABEL[request.status] ?? request.status}</Badge>}
        actions={
          // Decision buttons = backend availableActions ∩ approve permission.
          <PermissionGuard anyOf={['leave.approve', 'od.approve']}>
            <div className="flex flex-wrap gap-2">
              {has('approve') && <Button onClick={() => setPending('approve')}>Approve</Button>}
              {has('reject') && (
                <Button variant="danger" onClick={() => setPending('reject')}>
                  Reject
                </Button>
              )}
            </div>
          </PermissionGuard>
        }
      />

      <ContentSection title="Request">
        <Card>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Info label="Student">
              <PermissionGuard permission="students.view" fallback={<span>{request.student}</span>}>
                <Link to={`/management/students/${request.studentId}`} className="text-[var(--accent)] hover:underline">
                  {request.student}
                </Link>
              </PermissionGuard>
            </Info>
            <Info label="Register no.">{request.registerNo}</Info>
            <Info label="Batch">{request.batch}</Info>
            <Info label="Type">{LEAVE_KIND_LABEL[request.kind] ?? request.kind}</Info>
            <Info label="Reason">{request.reason}</Info>
            <Info label="Applied on">{formatDate(request.appliedOn)}</Info>
            <Info label="From">{formatDate(request.fromDate)}</Info>
            <Info label="To">{formatDate(request.toDate)}</Info>
            <Info label="Days">{`${request.days}`}</Info>
          </CardBody>
        </Card>
      </ContentSection>

      <ContentSection title="Details">
        <Card><CardBody className="text-body text-[var(--text)]">{request.description}</CardBody></Card>
      </ContentSection>

      {(request.decidedBy || request.decisionNote) && (
        <ContentSection title="Decision">
          <Card>
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Info label="Decided by">{request.decidedBy}</Info>
              <Info label="Note">{request.decisionNote}</Info>
            </CardBody>
          </Card>
        </ContentSection>
      )}

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending === 'approve' ? 'Approve request' : 'Reject request'}
        description={
          pending === 'approve'
            ? `Approving grants ${request.student} ${request.days} day(s).`
            : `Rejecting declines ${request.student}'s request.`
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              variant={pending === 'reject' ? 'danger' : 'primary'}
              loading={decision.isPending}
              onClick={() => void run(pending === 'approve' ? 'approve' : 'reject')}
            >
              {pending === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <label htmlFor="leave-note" className="mb-1.5 block text-body font-medium">
          Decision note <span className="font-normal text-[var(--text-subtle)]">(optional)</span>
        </label>
        <textarea
          id="leave-note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-control border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-body text-[var(--text)]"
        />
      </Modal>
    </>
  );
}
