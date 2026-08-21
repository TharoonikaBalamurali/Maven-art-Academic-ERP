import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { isApiError } from '@/lib/api';
import { Button, DatePicker, Input, Modal, Select, toast } from '@/shared/ui';
import { useCloseAdmission } from '../hooks/useStudents';
import { CLOSURE_TYPE_LABEL, type ClosureType } from '../types';
import type { Id } from '@/shared/types';

const TYPE_OPTIONS = Object.entries(CLOSURE_TYPE_LABEL).map(([value, label]) => ({ value, label }));

/**
 * Close an admission (§ admission closure).
 *
 * Ends the admission — course completion, transfer out, or withdrawal — and
 * writes the closure record (effective date, reason, TC number, destination).
 * The record is preserved and archived, never deleted; the backend rejects a
 * second closure (409).
 */
export function CloseAdmissionDialog({
  studentId,
  studentName,
  onClose,
}: {
  studentId: Id;
  studentName: string;
  onClose: () => void;
}) {
  const close = useCloseAdmission(studentId);
  const [type, setType] = useState<ClosureType>('completion');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [tcNumber, setTcNumber] = useState('');
  const [destination, setDestination] = useState('');
  const [clearance, setClearance] = useState('');
  const [remarks, setRemarks] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const isTransfer = type === 'transfer';
  const valid = reason.trim().length > 0 && effectiveDate.length > 0 && confirmText.trim().toUpperCase() === 'CLOSE';

  async function submit() {
    if (!valid) return;
    try {
      await close.mutateAsync({ type, effectiveDate, reason, tcNumber, destination, clearance, remarks });
      toast.success('Admission closed', `${studentName} moved to the archive.`);
      onClose();
    } catch (error) {
      const message =
        isApiError(error) && error.kind === 'conflict'
          ? 'This admission has already been closed.'
          : 'The admission could not be closed.';
      toast.error('Could not close', message);
    }
  }

  return (
    <Modal
      open
      onClose={close.isPending ? () => undefined : onClose}
      title="Close admission"
      description={`End ${studentName}'s admission and move the record to the archive.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={close.isPending}>
            Cancel
          </Button>
          <Button variant="danger" loading={close.isPending} disabled={!valid} onClick={() => void submit()}>
            Close admission
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="inline-flex items-start gap-2 rounded-control border border-[var(--warning)] bg-[var(--warning-surface)] px-3 py-2 text-body-sm text-[var(--warning)]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          The record stays in the archive permanently and can no longer be edited. This cannot be undone here.
        </p>

        <Select label="Closure type" required options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value as ClosureType)} />
        <DatePicker label="Effective date" required value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
        <Input label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why the admission is ending" />
        <Input label="TC number" value={tcNumber} onChange={(e) => setTcNumber(e.target.value)} placeholder="Transfer Certificate number, if issued" />
        {isTransfer && (
          <Input label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Receiving institution or branch" />
        )}
        <Input label="Clearance" value={clearance} onChange={(e) => setClearance(e.target.value)} placeholder="Dues / library / hostel clearance" />
        <Input label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />

        <Input
          label="Type CLOSE to confirm"
          required
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="CLOSE"
          description="Confirms you intend to end this admission."
        />
      </div>
    </Modal>
  );
}
