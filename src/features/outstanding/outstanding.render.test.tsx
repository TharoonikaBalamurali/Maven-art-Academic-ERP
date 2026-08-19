import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { OutstandingDetail } from './types';

const useOutstanding = vi.fn();

vi.mock('./hooks/useOutstanding', () => ({
  useOutstanding: () => useOutstanding(),
  useOutstandingList: vi.fn(),
}));

const { OutstandingDetailPage } = await import('./components/OutstandingDetailPage');

function detail(overrides: Partial<OutstandingDetail> = {}): OutstandingDetail {
  return {
    id: 'out-506',
    student: 'Sameer Joshi',
    course: 'Animation & Motion Design',
    feeAssignmentId: 'fa-506',
    assignedTotal: 175000,
    paidTotal: 25000,
    outstandingAmount: 150000,
    overdueAmount: 150000,
    oldestDueDate: '2026-08-01',
    asOf: '2026-08-19',
    severity: 'overdue',
    note: null,
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/management/outstanding/:outstandingId" element={<OutstandingDetailPage />} />
    </Routes>,
    { route: '/management/outstanding/out-506' },
  );
}

beforeEach(() => vi.clearAllMocks());

describe('OutstandingDetailPage (§23)', () => {
  it('renders the backend outstanding and overdue figures and links the assignment', () => {
    useOutstanding.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('accounts', ['outstanding.view']);
    renderPage();

    expect(screen.getByRole('heading', { name: 'Sameer Joshi' })).toBeInTheDocument();
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);
    // outstanding and overdue both 1,50,000 → appears at least twice
    expect(screen.getAllByText('₹1,50,000').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('link', { name: 'fa-506' })).toHaveAttribute(
      'href',
      '/management/fee-assignments/fa-506',
    );
  });

  it('shows outstanding verbatim even when it differs from assigned − paid', () => {
    // assigned − paid = 150000, but the backend reports 140000 (e.g. a credit
    // the client cannot see). The page must display the backend figure.
    useOutstanding.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ outstandingAmount: 140000, overdueAmount: 0, severity: 'due' }),
      refetch: vi.fn(),
    });
    signIn('accounts', ['outstanding.view']);
    renderPage();

    expect(screen.getByText('₹1,40,000')).toBeInTheDocument();
  });
});
