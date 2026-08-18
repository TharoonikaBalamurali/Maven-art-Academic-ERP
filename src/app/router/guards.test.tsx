import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { PermissionGuard } from '@/features/auth/PermissionGuard';
import { renderWithProviders, signIn, signOut } from '@/test/render';
import { RequireAuth, RequirePermission, RequirePortal } from './guards';

function Protected() {
  return <p>student list</p>;
}

beforeEach(() => signOut());

describe('RequireAuth', () => {
  it('redirects an anonymous visitor to the login page', () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<p>login screen</p>} />
        <Route element={<RequireAuth />}>
          <Route path="/management/students" element={<Protected />} />
        </Route>
      </Routes>,
      { route: '/management/students' },
    );

    expect(screen.getByText('login screen')).toBeInTheDocument();
    expect(screen.queryByText('student list')).not.toBeInTheDocument();
  });

  it('renders the route once a session exists', () => {
    signIn('admin', ['students.view']);

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<p>login screen</p>} />
        <Route element={<RequireAuth />}>
          <Route path="/management/students" element={<Protected />} />
        </Route>
      </Routes>,
      { route: '/management/students' },
    );

    expect(screen.getByText('student list')).toBeInTheDocument();
  });
});

describe('RequirePermission', () => {
  it('renders a 403 experience instead of the page when the permission is missing', () => {
    signIn('faculty', ['attendance.view']);

    renderWithProviders(
      <Routes>
        <Route
          path="/management/students"
          element={
            <RequirePermission anyOf={['students.view']}>
              <Protected />
            </RequirePermission>
          }
        />
      </Routes>,
      { route: '/management/students' },
    );

    expect(screen.getByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByText('student list')).not.toBeInTheDocument();
  });

  it('renders the page when the backend granted the permission', () => {
    signIn('admin', ['students.view']);

    renderWithProviders(
      <Routes>
        <Route
          path="/management/students"
          element={
            <RequirePermission anyOf={['students.view']}>
              <Protected />
            </RequirePermission>
          }
        />
      </Routes>,
      { route: '/management/students' },
    );

    expect(screen.getByText('student list')).toBeInTheDocument();
  });

  it('distinguishes a list permission from a create permission (§12)', () => {
    signIn('faculty', ['students.view']);

    renderWithProviders(
      <Routes>
        <Route
          path="/management/students/new"
          element={
            <RequirePermission anyOf={['students.create']}>
              <p>create form</p>
            </RequirePermission>
          }
        />
      </Routes>,
      { route: '/management/students/new' },
    );

    expect(screen.getByText('Access denied')).toBeInTheDocument();
  });
});

describe('RequirePortal', () => {
  it('sends a student who reaches the management portal back to their own portal', () => {
    signIn('student', ['portal.dashboard.view']);

    renderWithProviders(
      <Routes>
        <Route path="/portal" element={<p>student portal</p>} />
        <Route path="/management" element={<RequirePortal portal="management" />}>
          <Route index element={<p>management portal</p>} />
        </Route>
      </Routes>,
      { route: '/management' },
    );

    expect(screen.getByText('student portal')).toBeInTheDocument();
  });

  it('admits a management role to the management portal', () => {
    signIn('accounts', ['payments.view']);

    renderWithProviders(
      <Routes>
        <Route path="/portal" element={<p>student portal</p>} />
        <Route path="/management" element={<RequirePortal portal="management" />}>
          <Route index element={<p>management portal</p>} />
        </Route>
      </Routes>,
      { route: '/management' },
    );

    expect(screen.getByText('management portal')).toBeInTheDocument();
  });
});

describe('PermissionGuard', () => {
  it('hides an action the user cannot perform and shows one they can', () => {
    signIn('accounts', ['payments.view']);

    renderWithProviders(
      <>
        <PermissionGuard permission="students.create">
          <button type="button">New student</button>
        </PermissionGuard>
        <PermissionGuard permission="payments.view">
          <button type="button">View payments</button>
        </PermissionGuard>
      </>,
    );

    expect(screen.queryByRole('button', { name: 'New student' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View payments' })).toBeInTheDocument();
  });

  it('renders the fallback when the requirement is not met', () => {
    signIn('student', []);

    renderWithProviders(
      <PermissionGuard permission="students.create" fallback={<p>not available</p>}>
        <button type="button">New student</button>
      </PermissionGuard>,
    );

    expect(screen.getByText('not available')).toBeInTheDocument();
  });

  it('requires all permissions when allOf is supplied', () => {
    signIn('admin', ['students.view']);

    renderWithProviders(
      <PermissionGuard allOf={['students.view', 'students.delete']}>
        <button type="button">Delete student</button>
      </PermissionGuard>,
    );

    expect(screen.queryByRole('button', { name: 'Delete student' })).not.toBeInTheDocument();
  });
});
