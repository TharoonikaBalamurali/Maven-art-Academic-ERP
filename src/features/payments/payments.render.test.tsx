import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { Paginated } from '@/shared/types';
import type { PaymentListItem } from './types';

const usePayments = vi.fn();

vi.mock('./hooks/usePayments', () => ({
  usePayments: () => usePayments(),
  usePayment: vi.fn(),
  useRecordPayment: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const { PaymentsPage } = await import('./components/PaymentsPage');

function page(): Paginated<PaymentListItem> {
  return {
    data: [
      { id: 'pay-901', student: 'Aisha Rahman', amount: 130000, method: 'bank_transfer', paidAt: '2026-08-06', status: 'recorded' },
    ],
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/management/payments" element={<PaymentsPage />} />
    </Routes>,
    { route: '/management/payments' },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  usePayments.mockReturnValue({ isPending: false, isError: false, error: null, data: page(), refetch: vi.fn() });
});

describe('PaymentsPage — record gating (§22)', () => {
  it('shows "Record payment" for a user with payments.create (accounts)', () => {
    signIn('accounts', ['payments.view', 'payments.create']);
    renderPage();
    expect(screen.getByRole('button', { name: /Record payment/ })).toBeInTheDocument();
  });

  it('hides "Record payment" for a view-only user (admin)', () => {
    signIn('admin', ['payments.view']); // no payments.create
    renderPage();
    expect(screen.queryByRole('button', { name: /Record payment/ })).not.toBeInTheDocument();
    // The recorded transactions are still visible.
    expect(screen.getAllByText('Aisha Rahman').length).toBeGreaterThan(0);
  });
});
