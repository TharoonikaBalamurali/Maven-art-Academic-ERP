import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { ReportResult } from './types';

const useReport = vi.fn();

vi.mock('./hooks/useReports', () => ({
  useReport: () => useReport(),
  useReports: vi.fn(),
  useExportReport: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const { ReportDetailPage } = await import('./components/ReportDetailPage');

function result(overrides: Partial<ReportResult> = {}): ReportResult {
  return {
    id: 'rep-collections',
    name: 'Fee Collections Summary',
    category: 'financial',
    generatedAt: '2026-08-19',
    summary: 'Fees collected across all recorded payments.',
    metrics: [
      { label: 'Total collected', value: '₹4,28,500' },
      { label: 'Outstanding', value: '₹4,86,500' },
    ],
    table: {
      columns: ['Method', 'Amount'],
      rows: [
        ['Bank transfer', '₹1,30,000'],
        ['UPI', '₹51,000'],
      ],
    },
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/management/reports/:reportId" element={<ReportDetailPage />} />
    </Routes>,
    { route: '/management/reports/rep-collections' },
  );
}

beforeEach(() => vi.clearAllMocks());

describe('ReportDetailPage — render + export gating', () => {
  it('renders the backend metrics and table cells verbatim', () => {
    useReport.mockReturnValue({ isPending: false, isError: false, error: null, data: result(), refetch: vi.fn() });
    signIn('admin', ['reports.view', 'reports.export']);
    renderPage();

    expect(screen.getByRole('heading', { name: 'Fee Collections Summary' })).toBeInTheDocument();
    expect(screen.getByText('₹4,28,500')).toBeInTheDocument();
    expect(screen.getByText('Bank transfer')).toBeInTheDocument();
    expect(screen.getByText('₹1,30,000')).toBeInTheDocument();
  });

  it('shows Export for a user with reports.export', () => {
    useReport.mockReturnValue({ isPending: false, isError: false, error: null, data: result(), refetch: vi.fn() });
    signIn('admin', ['reports.view', 'reports.export']);
    renderPage();
    expect(screen.getByRole('button', { name: /Export/ })).toBeInTheDocument();
  });

  it('hides Export for a view-only user (faculty)', () => {
    useReport.mockReturnValue({ isPending: false, isError: false, error: null, data: result(), refetch: vi.fn() });
    signIn('faculty', ['reports.view']); // no reports.export
    renderPage();
    expect(screen.queryByRole('button', { name: /Export/ })).not.toBeInTheDocument();
  });
});
