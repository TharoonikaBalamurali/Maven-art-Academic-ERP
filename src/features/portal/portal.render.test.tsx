import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { PortalProfile } from './types';

const usePortalProfile = vi.fn();

vi.mock('./hooks/usePortal', () => ({
  usePortalProfile: () => usePortalProfile(),
  usePortalOverview: vi.fn(),
}));

const { PortalProfilePage } = await import('./components/PortalProfilePage');

function profile(overrides: Partial<PortalProfile> = {}): PortalProfile {
  return {
    name: 'Nithya Balan',
    registerNo: 'MAA20260001',
    email: 'nithya.balan@example.com',
    phone: '+91 90000 20001',
    dateOfBirth: '2007-03-14',
    address: '48 Besant Nagar, Chennai 600090',
    course: 'Bachelor of Fine Arts',
    batch: 'BFA Year 1 · A',
    admittedOn: '2026-06-15',
    guardianName: 'Balan Muthu',
    guardianPhone: '+91 90000 10001',
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/portal/profile" element={<PortalProfilePage />} />
    </Routes>,
    { route: '/portal/profile' },
  );
}

beforeEach(() => vi.clearAllMocks());

describe('PortalProfilePage (§7)', () => {
  it('renders the student personal, academic and guardian details', () => {
    usePortalProfile.mockReturnValue({ isPending: false, isError: false, error: null, data: profile(), refetch: vi.fn() });
    signIn('student', ['portal.profile.view']);
    renderPage();

    expect(screen.getByRole('heading', { name: 'Nithya Balan' })).toBeInTheDocument();
    expect(screen.getByText('nithya.balan@example.com')).toBeInTheDocument();
    expect(screen.getByText('Balan Muthu')).toBeInTheDocument();
    expect(screen.getAllByText('MAA20260001').length).toBeGreaterThan(0);
  });
});
