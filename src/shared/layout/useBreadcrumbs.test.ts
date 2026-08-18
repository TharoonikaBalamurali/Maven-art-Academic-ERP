import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createElement, type ReactNode } from 'react';
import type { NavSection } from '@/shared/types';
import { useBreadcrumbs } from './useBreadcrumbs';

const NAV: readonly NavSection[] = [
  { id: 'overview', items: [{ id: 'dashboard', label: 'Dashboard', to: '/management', end: true }] },
  {
    id: 'academic',
    label: 'Academic',
    items: [
      { id: 'students', label: 'Students', to: '/management/students' },
      { id: 'batches', label: 'Batches', to: '/management/batches' },
    ],
  },
];

function crumbsAt(pathname: string) {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(MemoryRouter, { initialEntries: [pathname] }, children);

  return renderHook(() => useBreadcrumbs(NAV, '/management'), { wrapper }).result.current;
}

describe('useBreadcrumbs', () => {
  it('renders nothing on the portal root — there is nowhere to go back to', () => {
    expect(crumbsAt('/management')).toEqual([]);
  });

  it('includes the section label from the navigation config', () => {
    expect(crumbsAt('/management/students')).toEqual([
      { label: 'Dashboard', to: '/management' },
      { label: 'Academic' },
      { label: 'Students' },
    ]);
  });

  it('makes the module a link when the current page is deeper', () => {
    expect(crumbsAt('/management/students/new')).toEqual([
      { label: 'Dashboard', to: '/management' },
      { label: 'Academic' },
      { label: 'Students', to: '/management/students' },
      { label: 'New' },
    ]);
  });

  it('prefers the longest matching nav entry', () => {
    // `/management/batches` must not be resolved against `/management`.
    const crumbs = crumbsAt('/management/batches');
    expect(crumbs.at(-1)).toEqual({ label: 'Batches' });
  });

  it('humanises routes that are not in the navigation', () => {
    expect(crumbsAt('/management/fee-structures')).toEqual([
      { label: 'Dashboard', to: '/management' },
      { label: 'Fee Structures' },
    ]);
  });
});
