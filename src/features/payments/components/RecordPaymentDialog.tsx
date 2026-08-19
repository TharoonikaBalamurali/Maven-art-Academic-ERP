import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Select, Input, toast } from '@/shared/ui';
import { useRecordPayment } from '../hooks/usePayments';
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from '../types';

const METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => ({ value, label }));

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Record-payment dialog (§22).
 *
 * A minimal capture form. The frontend collects the transaction the accounts
 * user is recording; the backend stores it, marks it recorded and issues a
 * receipt. The client never computes the resulting balance.
 */
export function RecordPaymentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const record = useRecordPayment();
  const [student, setStudent] = useState('');
  const [feeAssignmentId, setFeeAssignmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [reference, setReference] = useState('');
  const [paidAt, setPaidAt] = useState(today());

  const amountValue = Number(amount);
  const valid = student.trim().length > 0 && Number.isFinite(amountValue) && amountValue > 0 && paidAt.length > 0;

  function reset() {
    setStudent('');
    setFeeAssignmentId('');
    setAmount('');
    setMethod('upi');
    setReference('');
    setPaidAt(today());
  }

  async function submit() {
    if (!valid) return;
    try {
      const payment = await record.mutateAsync({
        student,
        feeAssignmentId: feeAssignmentId || undefined,
        amount: amountValue,
        method,
        reference: reference || undefined,
        paidAt,
      });
      toast.success('Payment recorded', `Receipt ${payment.receiptId ?? ''} issued.`);
      reset();
      onClose();
      navigate(`/management/payments/${payment.id}`);
    } catch {
      toast.error('Could not record payment', 'Check the details and try again.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      description="The backend stores the transaction and issues a receipt."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={record.isPending} disabled={!valid} onClick={() => void submit()}>
            Record payment
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input label="Student" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Full name" />
        <Input label="Fee assignment" value={feeAssignmentId} onChange={(e) => setFeeAssignmentId(e.target.value)} placeholder="fa-… (optional)" />
        <Input label="Amount (INR)" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        <Select label="Method" options={METHOD_OPTIONS} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} />
        <Input label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction reference (optional)" />
        <Input label="Paid on" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
      </div>
    </Modal>
  );
}
