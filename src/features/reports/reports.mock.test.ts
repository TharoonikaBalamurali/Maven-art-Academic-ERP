import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { ReportResult } from './types';

function request(partial: Partial<ApiRequest> & Pick<ApiRequest, 'method' | 'path'>): ApiRequest {
  return { auth: true, timeoutMs: 1000, ...partial };
}
function loginAs(email: string): string {
  const r = handleMockRequest(
    request({ method: 'POST', path: '/auth/login', auth: false, body: { email, password: 'password' } }),
    null,
  ) as { session: { accessToken: string } };
  return r.session.accessToken;
}
const admin = () => loginAs('admin@mavenart.test');

describe('reports mock API (§ reporting)', () => {
  it('lets any management role view reports (faculty holds reports.view)', () => {
    const result = handleMockRequest(request({ method: 'GET', path: '/reports' }), loginAs('faculty@mavenart.test')) as {
      total: number;
    };
    expect(result.total).toBeGreaterThan(0);
  });

  it('refuses a role without reports.view (student)', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/reports' }), loginAs('student@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('returns display-ready metrics and table cells from the backend', () => {
    const report = handleMockRequest(request({ method: 'GET', path: '/reports/rep-collections' }), admin()) as ReportResult;
    expect(report.metrics.find((m) => m.label === 'Total collected')?.value).toBe('₹4,28,500');
    expect(report.table?.columns[0]).toBe('Method');
    expect(report.table?.rows.length).toBeGreaterThan(0);
    // Cells are strings — pre-formatted by the backend, never computed on the client.
    expect(typeof report.table?.rows[0]?.[0]).toBe('string');
  });

  it('exports only with reports.export — faculty (view-only) is refused', () => {
    expect(() =>
      handleMockRequest(request({ method: 'POST', path: '/reports/rep-collections/export' }), loginAs('faculty@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('accepts an export request from a role with reports.export', () => {
    const result = handleMockRequest(
      request({ method: 'POST', path: '/reports/rep-collections/export' }),
      loginAs('accounts@mavenart.test'),
    ) as { status: string };
    expect(result.status).toBe('preparing');
  });

  it('404s an unknown report', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/reports/rep-none' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
