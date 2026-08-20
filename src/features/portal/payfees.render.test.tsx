import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, signIn } from '@/test/render';

const mutateAsync = vi.fn();

vi.mock('./hooks/usePayFees', () => ({
  usePayFees: () => ({ mutateAsync, isPending: false }),
  RAZORPAY_CONFIGURED: false,
}));

const { PayFeesButton } = await import('./components/PayFees');

beforeEach(() => {
  vi.clearAllMocks();
  signIn('parent', ['portal.fees.view']);
});

describe('PayFeesButton (Razorpay online fee payment)', () => {
  it('shows a cleared badge when nothing is outstanding', () => {
    renderWithProviders(<PayFeesButton outstanding={0} studentName="Nithya Balan" />);
    expect(screen.getByText('Fees cleared')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pay fees online/ })).not.toBeInTheDocument();
  });

  it('opens the dialog with the three channels and a sandbox notice', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PayFeesButton outstanding={98000} studentName="Nithya Balan" />);

    await user.click(screen.getByRole('button', { name: 'Pay fees online' }));

    expect(screen.getByText(/Sandbox mode/)).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
    expect(screen.getByText('UPI')).toBeInTheDocument();
    expect(screen.getByText('Netbanking')).toBeInTheDocument();
    expect(screen.getByText(/Secured by Razorpay/)).toBeInTheDocument();
  });

  it('pays the outstanding amount via the selected channel and shows the receipt', async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({ paymentId: 'pay-1', receiptNo: 'MA/2026/0981', status: 'recorded', fees: { assigned: 158000, paid: 158000, outstanding: 0, status: 'paid', installments: [] } });
    renderWithProviders(<PayFeesButton outstanding={98000} studentName="Nithya Balan" />);

    await user.click(screen.getByRole('button', { name: 'Pay fees online' }));
    // Default channel is UPI; pay the full outstanding.
    await user.click(screen.getByRole('button', { name: /Pay ₹/ }));

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ amount: 98000, method: 'upi', studentName: 'Nithya Balan' }));
    expect(await screen.findByText('Payment successful')).toBeInTheDocument();
    expect(screen.getByText(/MA\/2026\/0981/)).toBeInTheDocument();
  });

  it('records the channel the payer selects', async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue({ paymentId: 'pay-2', receiptNo: 'MA/2026/0982', status: 'recorded', fees: { assigned: 158000, paid: 108000, outstanding: 50000, status: 'partial', installments: [] } });
    renderWithProviders(<PayFeesButton outstanding={98000} studentName="Nithya Balan" />);

    await user.click(screen.getByRole('button', { name: 'Pay fees online' }));
    await user.click(screen.getByText('Netbanking'));
    await user.click(screen.getByRole('button', { name: /Pay ₹/ }));

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ method: 'netbanking' }));
  });
});
