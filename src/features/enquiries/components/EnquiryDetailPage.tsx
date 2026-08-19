import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquarePlus } from 'lucide-react';
import { isApiError } from '@/lib/api';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { formatDate } from '@/lib/utils/format';
import { ContentSection, PageHeader } from '@/shared/layout/page';
import {
  Badge,
  Button,
  Card,
  CardBody,
  ConfirmDialog,
  EmptyState,
  Modal,
  QueryBoundary,
  Skeleton,
  toast,
} from '@/shared/ui';
import { useAddFollowup, useEnquiry, useEnquiryTransition } from '../hooks/useEnquiries';
import { stageTone } from '../stage';
import { ENQUIRY_STAGE_LABEL, type EnquiryAction, type EnquiryDetail } from '../types';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <p className="mt-0.5 text-body break-words text-[var(--text)]">{children}</p>
    </div>
  );
}

/**
 * Enquiry detail (§15–§18).
 *
 * The action buttons are the point: they are rendered from
 * `detail.availableActions` — the transitions the BACKEND says are valid for
 * the current stage — intersected with the user's permission. The frontend
 * never decides whether a transition is legal; if the state changed underneath
 * it, the backend rejects the request with a 409 and the UI surfaces that.
 */
export function EnquiryDetailPage() {
  const { enquiryId = '' } = useParams();
  const query = useEnquiry(enquiryId);

  return (
    <>
      <Link
        to="/management/enquiries"
        className="mb-3 inline-flex items-center gap-1 text-body-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to enquiries
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
        {query.data && <EnquiryDetailView enquiry={query.data} />}
      </QueryBoundary>
    </>
  );
}

function EnquiryDetailView({ enquiry }: { enquiry: EnquiryDetail }) {
  const addFollowup = useAddFollowup(enquiry.id);
  const transition = useEnquiryTransition(enquiry.id);

  const [dialog, setDialog] = useState<null | 'followup' | 'convert' | 'close'>(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  // The action set the backend advertises for the current stage (§16).
  const has = (action: EnquiryAction) => enquiry.availableActions.includes(action);

  async function runTransition(action: Exclude<EnquiryAction, 'log_followup'>, label: string) {
    try {
      await transition.mutateAsync(action);
      toast.success(label);
      setDialog(null);
    } catch (error) {
      // A 409 means the stage changed (someone else acted) — the backend is the
      // authority, so we report it rather than force the transition.
      const message =
        isApiError(error) && error.kind === 'conflict'
          ? 'This enquiry has already moved on. Reloading its current state.'
          : 'The action could not be completed.';
      toast.error('Action not allowed', message);
      setDialog(null);
    }
  }

  async function submitFollowup() {
    if (!note.trim()) {
      setNoteError('Enter a follow-up note.');
      return;
    }
    try {
      await addFollowup.mutateAsync(note.trim());
      toast.success('Follow-up logged');
      setNote('');
      setNoteError(null);
      setDialog(null);
    } catch {
      setNoteError('Could not save the follow-up. Please try again.');
    }
  }

  return (
    <>
      <PageHeader
        title={enquiry.name}
        description={enquiry.programme}
        meta={<Badge tone={stageTone(enquiry.stage)}>{ENQUIRY_STAGE_LABEL[enquiry.stage] ?? enquiry.stage}</Badge>}
        actions={
          // Buttons = backend availableActions ∩ permission (§16).
          <PermissionGuard permission="enquiries.update">
            <div className="flex flex-wrap gap-2">
              {has('convert') && (
                <Button onClick={() => setDialog('convert')}>Convert to application</Button>
              )}
              {has('log_followup') && (
                <Button
                  variant="secondary"
                  leadingIcon={<MessageSquarePlus className="size-4" aria-hidden="true" />}
                  onClick={() => setDialog('followup')}
                >
                  Log follow-up
                </Button>
              )}
              {has('close') && (
                <Button variant="secondary" onClick={() => setDialog('close')}>
                  Close
                </Button>
              )}
              {has('reopen') && (
                <Button variant="secondary" onClick={() => void runTransition('reopen', 'Enquiry reopened')}>
                  Reopen
                </Button>
              )}
            </div>
          </PermissionGuard>
        }
      />

      {enquiry.applicationId && (
        <div className="mb-4 rounded-control border border-[var(--success)] bg-[var(--success-surface)] px-3 py-2 text-body-sm text-[var(--success)]">
          Converted to application{' '}
          <Link to="/management/applications" className="font-medium underline">
            {enquiry.applicationId}
          </Link>
          .
        </div>
      )}

      <Card className="mb-4">
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Email">{enquiry.email}</Info>
          <Info label="Phone">{enquiry.phone}</Info>
          <Info label="Source">{enquiry.source}</Info>
          <Info label="Programme">{enquiry.programme}</Info>
          <Info label="Received">{formatDate(enquiry.receivedAt)}</Info>
        </CardBody>
      </Card>

      <ContentSection title="Follow-up history">
        <Card>
          <CardBody>
            {enquiry.followups.length === 0 ? (
              <EmptyState title="No follow-ups yet" description="Logged follow-ups will appear here." />
            ) : (
              <ol className="flex flex-col gap-4">
                {enquiry.followups.map((followup) => (
                  <li key={followup.id} className="flex gap-3">
                    <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--accent)]" />
                    <div className="min-w-0">
                      <p className="text-body text-[var(--text)]">{followup.note}</p>
                      <p className="mt-0.5 text-caption text-[var(--text-subtle)]">
                        {followup.author} · {formatDate(followup.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      </ContentSection>

      {/* Log follow-up */}
      <Modal
        open={dialog === 'followup'}
        onClose={() => setDialog(null)}
        title="Log a follow-up"
        description={`Record a note for your conversation with ${enquiry.name}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitFollowup()} loading={addFollowup.isPending}>
              Save note
            </Button>
          </>
        }
      >
        <label htmlFor="followup-note" className="mb-1.5 block text-body font-medium">
          Note
        </label>
        <textarea
          id="followup-note"
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-invalid={noteError ? true : undefined}
          className="w-full rounded-control border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-body text-[var(--text)] aria-[invalid=true]:border-[var(--danger)]"
        />
        {noteError && (
          <p role="alert" className="mt-1 text-body-sm text-[var(--danger)]">
            {noteError}
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={dialog === 'convert'}
        title="Convert to application?"
        description={`This moves ${enquiry.name}'s enquiry into the applications pipeline. This cannot be undone.`}
        confirmLabel="Convert"
        loading={transition.isPending}
        onConfirm={() => void runTransition('convert', 'Converted to application')}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === 'close'}
        title="Close this enquiry?"
        description={`${enquiry.name}'s enquiry will be marked closed. You can reopen it later.`}
        confirmLabel="Close enquiry"
        loading={transition.isPending}
        onConfirm={() => void runTransition('close', 'Enquiry closed')}
        onCancel={() => setDialog(null)}
      />
    </>
  );
}
