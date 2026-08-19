import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { ReceiptDetail } from './types';

const useReceipt = vi.fn();

vi.mock('./hooks/useReceipts', () => ({
  useReceipt: () => useReceipt(),
  useReceipts: vi.fn(),
}));

const { ReceiptDetailPage } = await import('./components/ReceiptDetailPage');

function detail(overrides: Partial<ReceiptDetail> = {}): ReceiptDetail {
  return {
    id: 'rcpt-701',
    receiptNo: 'MA/2026/0701',
    student: 'Aisha Rahman',
    paymentId: 'pay-901',
    feeAssignmentId: 'fa-501',
    amount: 130000,
    method: 'bank_transfer',
    issuedAt: '2026-08-06',
    note: null,
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/management/receipts/:receiptId" element={<ReceiptDetailPage />} />
    </Routes>,
    { route: '/management/receipts/rcpt-701' },
  );
}

beforeEach(() => vi.clearAllMocks());

describe('ReceiptDetailPage (§24)', () => {
  it('renders the receipt number, amount and payment link', () => {
    useReceipt.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('accounts', ['receipts.view']);
    renderPage();

    expect(screen.getAllByText('MA/2026/0701').length).toBeGreaterThan(0);
    expect(screen.getByText('₹1,30,000')).toBeInTheDocument();
    expect(screen.getByText('Bank transfer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'pay-901' })).toHaveAttribute('href', '/management/payments/pay-901');
  });
});
