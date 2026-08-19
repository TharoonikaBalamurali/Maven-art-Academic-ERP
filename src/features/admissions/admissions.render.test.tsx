import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { AdmissionDetail } from './types';

const useAdmission = vi.fn();
const transition = vi.fn();

vi.mock('./hooks/useAdmissions', () => ({
  useAdmission: () => useAdmission(),
  useAdmissionTransition: () => ({ mutateAsync: transition, isPending: false }),
  useAdmissions: vi.fn(),
}));

const { AdmissionDetailPage } = await import('./components/AdmissionDetailPage');

function detail(overrides: Partial<AdmissionDetail> = {}): AdmissionDetail {
  return {
    id: 'adm-500',
    applicant: 'Neha Krishnan',
    email: 'neha@example.com',
    phone: '+91 90000 00000',
    programme: 'Bachelor of Fine Arts',
    stage: 'offered',
    offeredAt: '2026-08-14',
    applicationId: 'app-118',
    availableActions: ['confirm', 'cancel'],
    note: null,
    enrollmentId: null,
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/management/admissions/:admissionId" element={<AdmissionDetailPage />} />
    </Routes>,
    { route: '/management/admissions/adm-500' },
  );
}

beforeEach(() => vi.clearAllMocks());

describe('AdmissionDetailPage — decision actions (§17)', () => {
  it('shows Confirm and Cancel for an offered admission', () => {
    useAdmission.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('admin', ['admissions.view', 'admissions.approve']);
    renderPage();

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enrol' })).not.toBeInTheDocument();
  });

  it('offers Enrol for a confirmed admission', () => {
    useAdmission.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ stage: 'confirmed', availableActions: ['enroll', 'cancel'] }),
      refetch: vi.fn(),
    });
    signIn('admin', ['admissions.view', 'admissions.approve']);
    renderPage();

    expect(screen.getByRole('button', { name: 'Enrol' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
  });

  it('hides all decision actions without admissions.approve', () => {
    useAdmission.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('admin', ['admissions.view']); // view only
    renderPage();

    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('shows the enrollment link and no actions for an enrolled admission', () => {
    useAdmission.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ stage: 'enrolled', availableActions: [], enrollmentId: 'enr-330', note: 'Enrolled.' }),
      refetch: vi.fn(),
    });
    signIn('admin', ['admissions.view', 'admissions.approve']);
    renderPage();

    expect(screen.queryByRole('button', { name: 'Enrol' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'enr-330' })).toHaveAttribute('href', '/management/enrollments');
  });

  it('links back to the source application', () => {
    useAdmission.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('admin', ['admissions.view', 'admissions.approve']);
    renderPage();

    expect(screen.getByRole('link', { name: 'app-118' })).toHaveAttribute(
      'href',
      '/management/applications/app-118',
    );
  });

  it('enrols through the decision dialog with a note', async () => {
    const user = userEvent.setup();
    transition.mockResolvedValue(detail({ stage: 'enrolled', availableActions: [] }));
    useAdmission.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ stage: 'confirmed', availableActions: ['enroll', 'cancel'] }),
      refetch: vi.fn(),
    });
    signIn('admin', ['admissions.view', 'admissions.approve']);
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Enrol' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Note/), 'Seat accepted.');
    await user.click(within(dialog).getByRole('button', { name: 'Enrol' }));

    expect(transition).toHaveBeenCalledWith({ action: 'enroll', note: 'Seat accepted.' });
  });
});
