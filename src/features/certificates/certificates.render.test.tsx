import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { Paginated } from '@/shared/types';
import type { CertificateListItem } from './types';

const useCertificates = vi.fn();

vi.mock('./hooks/useCertificates', () => ({
  useCertificates: () => useCertificates(),
  useCertificate: vi.fn(),
  useIssueCertificate: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const { CertificatesPage } = await import('./components/CertificatesPage');

function page(): Paginated<CertificateListItem> {
  return {
    data: [
      { id: 'cert-403', certificateNo: 'MA/CERT/2026/0403', student: 'Neha Krishnan', type: 'merit', issuedAt: '2026-08-13', status: 'issued' },
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
      <Route path="/management/certificates" element={<CertificatesPage />} />
    </Routes>,
    { route: '/management/certificates' },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useCertificates.mockReturnValue({ isPending: false, isError: false, error: null, data: page(), refetch: vi.fn() });
});

describe('CertificatesPage — issue gating (§27)', () => {
  it('shows "Issue certificate" for a user with certificates.issue (admin)', () => {
    signIn('admin', ['certificates.view', 'certificates.issue']);
    renderPage();
    expect(screen.getByRole('button', { name: /Issue certificate/ })).toBeInTheDocument();
  });

  it('hides "Issue certificate" for a view-only user', () => {
    signIn('admin', ['certificates.view']); // no certificates.issue
    renderPage();
    expect(screen.queryByRole('button', { name: /Issue certificate/ })).not.toBeInTheDocument();
    expect(screen.getAllByText('Neha Krishnan').length).toBeGreaterThan(0);
  });
});
