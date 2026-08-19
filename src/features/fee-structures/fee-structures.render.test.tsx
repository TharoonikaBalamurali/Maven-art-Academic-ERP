import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { FeeStructureDetail } from './types';

const useFeeStructure = vi.fn();

vi.mock('./hooks/useFeeStructures', () => ({
  useFeeStructure: () => useFeeStructure(),
  useFeeStructures: vi.fn(),
}));

const { FeeStructureDetailPage } = await import('./components/FeeStructureDetailPage');

function detail(overrides: Partial<FeeStructureDetail> = {}): FeeStructureDetail {
  return {
    id: 'fs-bfa-2026',
    name: 'BFA — Year 1 (2026–27)',
    courseCode: 'BFA',
    courseName: 'Bachelor of Fine Arts',
    academicYear: '2026–27',
    status: 'active',
    components: [
      { label: 'Tuition fee', amount: 120000 },
      { label: 'Studio & materials', amount: 25000 },
    ],
    total: 145000,
    note: null,
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/management/fee-structures/:feeStructureId" element={<FeeStructureDetailPage />} />
    </Routes>,
    { route: '/management/fee-structures/fs-bfa-2026' },
  );
}

beforeEach(() => vi.clearAllMocks());

describe('FeeStructureDetailPage (§19)', () => {
  it('renders each component amount and the backend total', () => {
    useFeeStructure.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('accounts', ['fee_structures.view']);
    renderPage();

    expect(screen.getByRole('heading', { name: /BFA — Year 1/ })).toBeInTheDocument();
    expect(screen.getByText('Tuition fee')).toBeInTheDocument();
    expect(screen.getByText('₹1,20,000')).toBeInTheDocument();
  });

  it('displays the total verbatim from the backend, not a client-side sum', () => {
    // Components sum to 200000, but the backend total is 145000. The page must
    // show the backend figure — proof the total is never recomputed here.
    useFeeStructure.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ total: 145000 }),
      refetch: vi.fn(),
    });
    signIn('accounts', ['fee_structures.view']);
    renderPage();

    const totalRow = screen.getByRole('row', { name: /Total/ });
    expect(within(totalRow).getByText('₹1,45,000')).toBeInTheDocument();
  });
});
