import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { ApplicationDetail } from './types';

const useApplication = vi.fn();
const transition = vi.fn();

vi.mock('./hooks/useApplications', () => ({
  useApplication: () => useApplication(),
  useApplicationTransition: () => ({ mutateAsync: transition, isPending: false }),
  useApplications: vi.fn(),
}));

const { ApplicationDetailPage } = await import('./components/ApplicationDetailPage');

function detail(overrides: Partial<ApplicationDetail> = {}): ApplicationDetail {
  return {
    id: 'app-119',
    applicant: 'Yusuf Ali',
    email: 'yusuf@example.com',
    phone: '+91 90000 00000',
    programme: 'Sculpture & Ceramics',
    priorEducation: 'Higher Secondary (Arts)',
    portfolioUrl: 'https://portfolio.example.com/app-119',
    stage: 'under_review',
    submittedAt: '2026-08-16',
    enquiryId: null,
    availableActions: ['approve', 'reject'],
    decisionNote: null,
    admissionId: null,
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/management/applications/:applicationId" element={<ApplicationDetailPage />} />
    </Routes>,
    { route: '/management/applications/app-119' },
  );
}

beforeEach(() => vi.clearAllMocks());

describe('ApplicationDetailPage — decision actions (§16)', () => {
  it('shows Approve and Reject for an under-review application', () => {
    useApplication.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('admin', ['applications.view', 'applications.review']);
    renderPage();

    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start review' })).not.toBeInTheDocument();
  });

  it('offers only Start review for a submitted application', () => {
    useApplication.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ stage: 'submitted', availableActions: ['start_review'] }),
      refetch: vi.fn(),
    });
    signIn('admin', ['applications.view', 'applications.review']);
    renderPage();

    expect(screen.getByRole('button', { name: 'Start review' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  it('hides all decision actions without applications.review', () => {
    useApplication.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('admin', ['applications.view']); // view only
    renderPage();

    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
  });

  it('shows the admission link and no actions for an approved application', () => {
    useApplication.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ stage: 'approved', availableActions: [], admissionId: 'adm-501', decisionNote: 'Admitted.' }),
      refetch: vi.fn(),
    });
    signIn('admin', ['applications.view', 'applications.review']);
    renderPage();

    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'adm-501' })).toHaveAttribute('href', '/management/admissions/adm-501');
  });

  it('approves through the decision dialog with a note', async () => {
    const user = userEvent.setup();
    transition.mockResolvedValue(detail({ stage: 'approved', availableActions: [] }));
    useApplication.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('admin', ['applications.view', 'applications.review']);
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Decision note/), 'Strong portfolio.');
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));

    expect(transition).toHaveBeenCalledWith({ action: 'approve', note: 'Strong portfolio.' });
  });
});
