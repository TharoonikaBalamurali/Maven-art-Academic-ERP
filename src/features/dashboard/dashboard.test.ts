import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type {
  AccountsDashboard,
  AdminDashboard,
  DashboardSummary,
  FacultyDashboard,
} from './types';

function request(partial: Partial<ApiRequest> & Pick<ApiRequest, 'method' | 'path'>): ApiRequest {
  return { auth: true, timeoutMs: 1000, ...partial };
}

function loginAs(email: string): string {
  const result = handleMockRequest(
    request({ method: 'POST', path: '/auth/login', auth: false, body: { email, password: 'password' } }),
    null,
  ) as { session: { accessToken: string } };
  return result.session.accessToken;
}

function summaryFor(email: string): DashboardSummary {
  return handleMockRequest(request({ method: 'GET', path: '/dashboard' }), loginAs(email)) as DashboardSummary;
}

describe('dashboard mock API', () => {
  it('requires a session', () => {
    expect(() => handleMockRequest(request({ method: 'GET', path: '/dashboard' }), null)).toThrowError(
      expect.objectContaining({ kind: 'unauthorized' }),
    );
  });

  it('returns an admin-shaped, operational summary for Admin', () => {
    const summary = summaryFor('admin@mavenart.test');
    expect(summary.authority).toBe('admin');
    const admin = summary as AdminDashboard;
    expect(admin.kpis.totalStudents).toBeGreaterThan(0);
    expect(admin.kpis.activeBatches).toBeGreaterThan(0);
    expect(admin.recentAdmissions.length).toBeGreaterThan(0);
    // Internally consistent: figures are believable institutional numbers.
    expect(admin.kpis.todaysAttendancePct).toBeLessThanOrEqual(100);
  });

  it('returns a finance-shaped summary for Accounts', () => {
    const summary = summaryFor('accounts@mavenart.test');
    expect(summary.authority).toBe('accounts');
    const accounts = summary as AccountsDashboard;
    expect(accounts.kpis.monthlyCollection).toBeGreaterThan(0);
    expect(accounts.recentTransactions.length).toBeGreaterThan(0);
    expect(accounts.recentTransactions[0]?.amount).toBeGreaterThan(0);
  });

  it('scopes the Faculty summary to assigned batches only (§6)', () => {
    const summary = summaryFor('faculty@mavenart.test');
    expect(summary.authority).toBe('faculty');
    const faculty = summary as FacultyDashboard;
    expect(faculty.kpis.assignedBatches).toBeGreaterThan(0);
    // Faculty never receives an academy-wide roster — only their own students.
    const admin = summaryFor('admin@mavenart.test') as AdminDashboard;
    expect(faculty.kpis.studentCount).toBeLessThan(admin.kpis.totalStudents);
    // Every class shown belongs to a batch the faculty member is assigned to.
    expect(faculty.todaysSchedule.length).toBe(faculty.kpis.todaysClasses);
  });

  it('does not serve a management dashboard to Student or Parent', () => {
    for (const email of ['student@mavenart.test', 'parent@mavenart.test']) {
      expect(() =>
        handleMockRequest(request({ method: 'GET', path: '/dashboard' }), loginAs(email)),
      ).toThrowError(ApiError);
    }
  });
});
