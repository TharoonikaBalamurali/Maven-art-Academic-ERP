import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { ProgressDetail } from './types';

const useProgress = vi.fn();

vi.mock('./hooks/useProgress', () => ({
  useProgress: () => useProgress(),
  useProgressList: vi.fn(),
}));

const { ProgressDetailPage } = await import('./components/ProgressDetailPage');

function detail(overrides: Partial<ProgressDetail> = {}): ProgressDetail {
  return {
    id: 'prg-803',
    student: 'Neha Krishnan',
    course: 'Bachelor of Fine Arts',
    batch: 'BFA-2026-A',
    assessment: 'Foundation Drawing — Midterm',
    assessmentType: 'Studio',
    score: 91,
    maxScore: 100,
    grade: 'A+',
    result: 'Pass',
    status: 'graded',
    assessedOn: '2026-08-12',
    faculty: 'Suresh Iyer',
    remarks: null,
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/management/progress/:progressId" element={<ProgressDetailPage />} />
    </Routes>,
    { route: '/management/progress/prg-803' },
  );
}

beforeEach(() => vi.clearAllMocks());

describe('ProgressDetailPage (§26)', () => {
  it('renders the score, backend grade and result', () => {
    useProgress.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('faculty', ['progress.view']);
    renderPage();

    expect(screen.getByRole('heading', { name: 'Neha Krishnan' })).toBeInTheDocument();
    expect(screen.getByText('91 / 100')).toBeInTheDocument();
    expect(screen.getByText('A+')).toBeInTheDocument();
    expect(screen.getByText('Pass')).toBeInTheDocument();
  });

  it('shows the backend grade verbatim even if it disagrees with the raw percentage', () => {
    // 40/100 is 40%, which a naive client might fail — but the backend grades it
    // D / Pass (e.g. practical weighting the client cannot see). Display verbatim.
    useProgress.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ score: 40, grade: 'D', result: 'Pass' }),
      refetch: vi.fn(),
    });
    signIn('faculty', ['progress.view']);
    renderPage();

    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('Pass')).toBeInTheDocument();
  });

  it('shows dashes for an ungraded record', () => {
    useProgress.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ score: null, grade: null, result: null, status: 'pending' }),
      refetch: vi.fn(),
    });
    signIn('faculty', ['progress.view']);
    renderPage();

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
