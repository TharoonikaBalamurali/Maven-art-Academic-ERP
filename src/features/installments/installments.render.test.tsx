import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { InstallmentDetail } from './types';

const useInstallment = vi.fn();

vi.mock('./hooks/useInstallments', () => ({
  useInstallment: () => useInstallment(),
  useInstallments: vi.fn(),
}));

const { InstallmentDetailPage } = await import('./components/InstallmentDetailPage');

function detail(overrides: Partial<InstallmentDetail> = {}): InstallmentDetail {
  return {
    id: 'inst-618',
    student: 'Sameer Joshi',
    feeAssignmentId: 'fa-506',
    feeStructureName: 'Animation — Year 1 (2026–27)',
    label: 'Installment 2 of 2',
    sequence: 2,
    totalCount: 2,
    amount: 150000,
    dueDate: '2026-08-01',
    paidDate: null,
    status: 'overdue',
    note: null,
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/management/installments/:installmentId" element={<InstallmentDetailPage />} />
    </Routes>,
    { route: '/management/installments/inst-618' },
  );
}

beforeEach(() => vi.clearAllMocks());

describe('InstallmentDetailPage (§21)', () => {
  it('renders the amount, status and a link to the fee assignment', () => {
    useInstallment.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('accounts', ['installments.view']);
    renderPage();

    expect(screen.getByRole('heading', { name: 'Sameer Joshi' })).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('₹1,50,000')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'fa-506' })).toHaveAttribute(
      'href',
      '/management/fee-assignments/fa-506',
    );
  });

  it('shows a dash for an unpaid installment paid-on date', () => {
    useInstallment.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('accounts', ['installments.view']);
    renderPage();

    // paidDate is null → the "Paid on" field renders a dash.
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
