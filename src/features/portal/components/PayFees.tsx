import { useState } from 'react';
import { CheckCircle2, CreditCard, Landmark, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { Badge, Button, Input, Modal, toast } from '@/shared/ui';
import { RAZORPAY_CONFIGURED, usePayFees } from '../hooks/usePayFees';
import type { PortalPaymentChannel } from '../types';

const CHANNELS: { value: PortalPaymentChannel; label: string; hint: string; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }> }[] = [
  { value: 'card', label: 'Card', hint: 'Credit / debit card', icon: CreditCard },
  { value: 'upi', label: 'UPI', hint: 'Any UPI app', icon: Smartphone },
  { value: 'netbanking', label: 'Netbanking', hint: 'All major banks', icon: Landmark },
];

/**
 * Online fee payment (§ online fee payment).
 *
 * A button that opens the Razorpay pay dialog. The shopper picks a channel
 * (Card / UPI / Netbanking) and an amount; the hook creates a backend order,
 * runs Checkout (or the sandbox), and the backend verifies + records the payment,
 * returning the new balance. The frontend never marks a payment paid itself.
 */
export function PayFeesButton({
  outstanding,
  studentName,
  variant = 'primary',
  size,
}: {
  outstanding: number;
  studentName: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm';
}) {
  const [open, setOpen] = useState(false);
  if (outstanding <= 0) {
    return <Badge tone="success">Fees cleared</Badge>;
  }
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        Pay fees online
      </Button>
      {open && <PayFeesDialog outstanding={outstanding} studentName={studentName} onClose={() => setOpen(false)} />}
    </>
  );
}

function PayFeesDialog({ outstanding, studentName, onClose }: { outstanding: number; studentName: string; onClose: () => void }) {
  const pay = usePayFees();
  const [amount, setAmount] = useState(String(outstanding));
  const [method, setMethod] = useState<PortalPaymentChannel>('upi');
  const [done, setDone] = useState<{ receiptNo: string; amount: number } | null>(null);

  const amountValue = Number(amount);
  const valid = Number.isFinite(amountValue) && amountValue > 0 && amountValue <= outstanding;

  async function submit() {
    if (!valid) return;
    try {
      const result = await pay.mutateAsync({ amount: amountValue, method, studentName });
      setDone({ receiptNo: result.receiptNo, amount: amountValue });
      toast.success('Payment successful', `Receipt ${result.receiptNo}`);
    } catch (error) {
      toast.error('Payment not completed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  if (done) {
    return (
      <Modal open onClose={onClose} title="Payment successful" footer={<Button onClick={onClose}>Done</Button>}>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircle2 className="size-10 text-[var(--success)]" aria-hidden="true" />
          <p className="text-body text-[var(--text)]">Paid {formatCurrency(done.amount)} for {studentName}.</p>
          <p className="text-body-sm text-[var(--text-muted)]">Receipt {done.receiptNo}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={pay.isPending ? () => undefined : onClose}
      title="Pay fees online"
      description={`Outstanding ${formatCurrency(outstanding)} for ${studentName}.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pay.isPending}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!valid || pay.isPending} loading={pay.isPending}>
            {pay.isPending ? 'Processing…' : `Pay ${valid ? formatCurrency(amountValue) : ''}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!RAZORPAY_CONFIGURED && (
          <div className="rounded-control border border-[var(--warning)] bg-[var(--warning-surface)] px-3 py-2 text-body-sm text-[var(--warning)]">
            Sandbox mode — this is a demonstration and no real payment is charged.
          </div>
        )}

        <Input
          label="Amount to pay (INR)"
          type="number"
          min={1}
          max={outstanding}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={amount && !valid ? `Enter an amount up to ${formatCurrency(outstanding)}.` : undefined}
        />

        <fieldset>
          <legend className="mb-1.5 text-body font-medium text-[var(--text)]">Payment method</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {CHANNELS.map((c) => {
              const Icon = c.icon;
              const active = method === c.value;
              return (
                <label
                  key={c.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-control border p-3 ${active ? 'border-[var(--accent)] bg-[var(--accent-surface)]' : 'border-[var(--border)] hover:bg-[var(--surface-hover)]'}`}
                >
                  <input type="radio" name="pay-method" value={c.value} checked={active} onChange={() => setMethod(c.value)} className="sr-only" />
                  <Icon className={`size-5 shrink-0 ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-body font-medium text-[var(--text)]">{c.label}</span>
                    <span className="block truncate text-caption text-[var(--text-subtle)]">{c.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {pay.isPending && (
          <p className="inline-flex items-center gap-1.5 text-body-sm text-[var(--text-muted)]">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Contacting the payment gateway…
          </p>
        )}

        <p className="inline-flex items-center gap-1.5 text-caption text-[var(--text-subtle)]">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Secured by Razorpay. Card, UPI and netbanking supported.
        </p>
      </div>
    </Modal>
  );
}
