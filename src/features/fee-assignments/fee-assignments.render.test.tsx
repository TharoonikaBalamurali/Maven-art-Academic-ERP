import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { FeeAssignmentDetail } from './types';

const useFeeAssignment = vi.fn();

vi.mock('./hooks/useFeeAssignments', () => ({
  useFeeAssignment: () => useFeeAssignment(),
  useFeeAssignments: vi.fn(),
}));

const { FeeAssignmentDetailPage } = await import('./components/FeeAssignmentDetailPage');

function detail(overrides: Partial<FeeAssignmentDetail> = {}): FeeAssignmentDetail {
  return {
    id: 'fa-502',
    student: 'Rahul Verma',
    feeStructureId: 'fs-vcd-2026',
    feeStructureName: 'VCD — Year 1 (2026–27)',
    courseName: 'Visual Communication & Design',
    assignedAmount: 153000,
    paidAmount: 51000,
    balance: 102000,
    status: 'partial',
    assignedAt: '2026-07-20',
    dueDate: '2026-09-30',
    note: null,
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/management/fee-assignments/:feeAssignmentId" element={<FeeAssignmentDetailPage />} />
    </Routes>,
    { route: '/management/fee-assignments/fa-502' },
  );
}

beforeEach(() => vi.clearAllMocks());

describe('FeeAssignmentDetailPage (§20)', () => {
  it('renders assigned, paid and balance and links the fee structure', () => {
    useFeeAssignment.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('accounts', ['fee_assignments.view']);
    renderPage();

    expect(screen.getByRole('heading', { name: 'Rahul Verma' })).toBeInTheDocument();
    expect(screen.getByText('₹1,53,000')).toBeInTheDocument();
    expect(screen.getByText('₹51,000')).toBeInTheDocument();
    expect(screen.getByText('₹1,02,000')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /VCD — Year 1/ })).toHaveAttribute(
      'href',
      '/management/fee-structures/fs-vcd-2026',
    );
  });

  it('displays the balance verbatim from the backend, not assigned − paid', () => {
    // assigned − paid would be 102000, but the backend reports 99000 (e.g. a
    // waiver the client cannot see). The page must show the backend figure.
    useFeeAssignment.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ balance: 99000 }),
      refetch: vi.fn(),
    });
    signIn('accounts', ['fee_assignments.view']);
    renderPage();

    expect(screen.getByText('₹99,000')).toBeInTheDocument();
  });
});
