import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';

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
const faculty = () => loginAs('faculty@mavenart.test');
const get = (path: string, token: string) => handleMockRequest(request({ method: 'GET', path }), token);

describe('discipline mock API (§ student affairs)', () => {
  it('requires discipline.view', () => {
    expect(() => get('/discipline', faculty())).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('lists cases and reads a confidential detail', () => {
    expect((get('/discipline', admin()) as { total: number }).total).toBeGreaterThan(0);
    const detail = get('/discipline/dis-303', admin()) as { status: string; severity: string; description: string };
    expect(detail.status).toBe('action_required');
    expect(detail.severity).toBe('high');
    expect(detail.description).toBeTruthy();
  });

  it('filters by status', () => {
    const open = handleMockRequest(
      request({ method: 'GET', path: '/discipline', query: { status: 'open' } }),
      admin(),
    ) as { data: { status: string }[] };
    expect(open.data.every((c) => c.status === 'open')).toBe(true);
  });

  it('404s an unknown case', () => {
    expect(() => get('/discipline/dis-none', admin())).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});

describe('leave / OD mock API (§ student affairs)', () => {
  it('requires leave.view to read', () => {
    expect(() => get('/leave', faculty())).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('advertises actions only for a pending request', () => {
    const pending = get('/leave/lv-402', admin()) as { availableActions: string[]; status: string };
    expect(pending.status).toBe('pending');
    expect(pending.availableActions).toEqual(['approve', 'reject']);

    const decided = get('/leave/lv-403', admin()) as { availableActions: string[] };
    expect(decided.availableActions).toEqual([]); // already approved — terminal
  });

  it('approves a pending request and records the decider', () => {
    const result = handleMockRequest(
      request({ method: 'POST', path: '/leave/lv-401/approve', body: { note: 'Get well soon.' } }),
      admin(),
    ) as { status: string; decidedBy: string | null; decisionNote: string | null; availableActions: string[] };

    expect(result.status).toBe('approved');
    expect(result.decidedBy).toBeTruthy(); // stamped from the identity, not the client
    expect(result.decisionNote).toBe('Get well soon.');
    expect(result.availableActions).toEqual([]);
  });

  it('rejects an illegal transition with 409 — the backend owns the machine', () => {
    // lv-403 is already approved; approving again is not legal.
    expect(() =>
      handleMockRequest(request({ method: 'POST', path: '/leave/lv-403/approve' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'conflict', status: 409 }));
  });

  it('requires leave.approve to decide', () => {
    expect(() =>
      handleMockRequest(request({ method: 'POST', path: '/leave/lv-405/approve' }), faculty()),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('filters by kind', () => {
    const od = handleMockRequest(
      request({ method: 'GET', path: '/leave', query: { kind: 'od' } }),
      admin(),
    ) as { data: { kind: string }[] };
    expect(od.data.every((r) => r.kind === 'od')).toBe(true);
  });
});

describe('announcements mock API (§ communication)', () => {
  it('requires announcements.view', () => {
    expect(() => get('/announcements', faculty())).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('publishes immediately when no schedule date is given', () => {
    const created = handleMockRequest(
      request({ method: 'POST', path: '/announcements', body: { title: 'Library closed', body: 'Closed on Friday.', audience: 'students' } }),
      admin(),
    ) as { id: string; status: string; publishedAt: string | null; recipients: number | null; author: string };

    expect(created.status).toBe('published');
    expect(created.publishedAt).toBeTruthy();
    // The backend reports reach; the client never computes it.
    expect(created.recipients).toBeGreaterThan(0);
    expect(created.author).toBeTruthy();
  });

  it('schedules when a future date is given', () => {
    const created = handleMockRequest(
      request({ method: 'POST', path: '/announcements', body: { title: 'Exam timetable', body: 'Out soon.', audience: 'all', scheduledFor: '2026-09-10' } }),
      admin(),
    ) as { status: string; scheduledFor: string | null; recipients: number | null };

    expect(created.status).toBe('scheduled');
    expect(created.scheduledFor).toBe('2026-09-10');
    expect(created.recipients).toBeNull(); // not delivered yet
  });

  it('requires announcements.create to publish', () => {
    expect(() =>
      handleMockRequest(
        request({ method: 'POST', path: '/announcements', body: { title: 'x', body: 'y', audience: 'all' } }),
        faculty(),
      ),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('rejects an incomplete payload (422)', () => {
    expect(() =>
      handleMockRequest(request({ method: 'POST', path: '/announcements', body: { title: '', body: '', audience: 'all' } }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'validation' }));
  });
});
