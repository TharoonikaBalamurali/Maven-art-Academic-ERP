import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { EnquiryDetail } from './types';

const useEnquiry = vi.fn();
const addFollowup = vi.fn();
const transition = vi.fn();

vi.mock('./hooks/useEnquiries', () => ({
  useEnquiry: () => useEnquiry(),
  useAddFollowup: () => ({ mutateAsync: addFollowup, isPending: false }),
  useEnquiryTransition: () => ({ mutateAsync: transition, isPending: false }),
  useEnquiries: vi.fn(),
}));

const { EnquiryDetailPage } = await import('./components/EnquiryDetailPage');

function detail(overrides: Partial<EnquiryDetail> = {}): EnquiryDetail {
  return {
    id: 'enq-038',
    name: 'Aryan Kapoor',
    email: 'aryan@example.com',
    phone: '+91 90000 00000',
    programme: 'Visual Communication & Design',
    source: 'Referral',
    stage: 'qualified',
    receivedAt: '2026-08-15',
    availableActions: ['log_followup', 'convert', 'close'],
    followups: [{ id: 'fu-2', note: 'Portfolio reviewed.', author: 'Meera Nair', at: '2026-08-16T09:30:00.000Z' }],
    applicationId: null,
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/management/enquiries/:enquiryId" element={<EnquiryDetailPage />} />
    </Routes>,
    { route: '/management/enquiries/enq-038' },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EnquiryDetailPage — state + permission actions (§16)', () => {
  it('renders only the actions the backend advertises', () => {
    useEnquiry.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('admin', ['enquiries.view', 'enquiries.update']);
    renderPage();

    expect(screen.getByRole('button', { name: 'Convert to application' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log follow-up/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    // Not advertised for this stage:
    expect(screen.queryByRole('button', { name: 'Reopen' })).not.toBeInTheDocument();
  });

  it('shows no actions when the user lacks enquiries.update, even if advertised', () => {
    useEnquiry.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('faculty', ['enquiries.view']);
    renderPage();

    expect(screen.queryByRole('button', { name: 'Convert to application' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('shows only Reopen for a closed enquiry', () => {
    useEnquiry.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ stage: 'closed', availableActions: ['reopen'] }),
      refetch: vi.fn(),
    });
    signIn('admin', ['enquiries.view', 'enquiries.update']);
    renderPage();

    expect(screen.getByRole('button', { name: 'Reopen' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Convert to application' })).not.toBeInTheDocument();
  });

  it('shows no actions and an application link for a converted enquiry', () => {
    useEnquiry.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ stage: 'converted', availableActions: [], applicationId: 'app-901' }),
      refetch: vi.fn(),
    });
    signIn('admin', ['enquiries.view', 'enquiries.update']);
    renderPage();

    expect(screen.queryByRole('button', { name: 'Convert to application' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'app-901' })).toHaveAttribute('href', '/management/applications');
  });

  it('confirms before converting and calls the transition', async () => {
    const user = userEvent.setup();
    transition.mockResolvedValue(detail({ stage: 'converted', availableActions: [] }));
    useEnquiry.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('admin', ['enquiries.view', 'enquiries.update']);
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Convert to application' }));
    // A confirmation dialog appears before the irreversible action.
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Convert' }));

    expect(transition).toHaveBeenCalledWith('convert');
  });
});
