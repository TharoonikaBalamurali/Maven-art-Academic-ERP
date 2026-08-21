import { describe, expect, it } from 'vitest';
import type { ApiError } from '@/lib/api';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { Paginated } from '@/shared/types';
import type {
  StudentDetail,
  StudentFilterOptions,
  StudentInput,
  StudentListItem,
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

const admin = () => loginAs('admin@mavenart.test');

function listStudents(query: Record<string, string | number>, token = admin()): Paginated<StudentListItem> {
  return handleMockRequest(request({ method: 'GET', path: '/students', query }), token) as Paginated<StudentListItem>;
}

function firstId(): string {
  return listStudents({ limit: 1 }).data[0]!.id;
}

describe('students mock API', () => {
  it('requires students.view — a student portal user is refused', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/students' }), loginAs('student@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('paginates server-side with backend metadata', () => {
    const page = listStudents({ page: 2, limit: 10 });
    expect(page.page).toBe(2);
    expect(page.limit).toBe(10);
    expect(page.data).toHaveLength(10);
    expect(page.total).toBeGreaterThan(20);
    expect(page.totalPages).toBe(Math.ceil(page.total / 10));
  });

  it('returns display-ready course and batch names, not just ids', () => {
    const row = listStudents({ limit: 1 }).data[0]!;
    expect(row.registerNo).toMatch(/^MAA/);
    expect(row.course).not.toBe(row.courseId);
    expect(row.batch).not.toBe(row.batchId);
  });

  it('searches by name and register number on the server', () => {
    const byName = listStudents({ search: 'arjun', limit: 50 });
    expect(byName.data.length).toBeGreaterThan(0);
    expect(byName.data.every((r) => r.name.toLowerCase().includes('arjun'))).toBe(true);

    const first = listStudents({ limit: 1 }).data[0]!;
    const byReg = listStudents({ search: first.registerNo, limit: 50 });
    expect(byReg.data.some((r) => r.registerNo === first.registerNo)).toBe(true);
  });

  it('filters by status on the server', () => {
    const onLeave = listStudents({ status: 'on_leave', limit: 100 });
    expect(onLeave.data.length).toBeGreaterThan(0);
    expect(onLeave.data.every((r) => r.status === 'on_leave')).toBe(true);
  });

  it('filters by course on the server', () => {
    const options = handleMockRequest(
      request({ method: 'GET', path: '/students/filter-options' }),
      admin(),
    ) as StudentFilterOptions;
    const course = options.courses[0]!;

    const filtered = listStudents({ course: course.id, limit: 100 });
    expect(filtered.data.length).toBeGreaterThan(0);
    expect(filtered.data.every((r) => r.courseId === course.id)).toBe(true);
  });

  it('sorts by name ascending and descending', () => {
    const asc = listStudents({ sortBy: 'name', sortDir: 'asc', limit: 100 }).data.map((r) => r.name);
    const desc = listStudents({ sortBy: 'name', sortDir: 'desc', limit: 100 }).data.map((r) => r.name);
    expect(asc).toEqual([...asc].sort((a, b) => a.localeCompare(b)));
    expect(desc).toEqual([...asc].reverse());
  });

  it('clamps an out-of-range page instead of returning nothing', () => {
    const page = listStudents({ page: 999, limit: 10 });
    expect(page.page).toBe(page.totalPages);
    expect(page.data.length).toBeGreaterThan(0);
  });

  it('exposes only courses that have enrolled students', () => {
    const options = handleMockRequest(
      request({ method: 'GET', path: '/students/filter-options' }),
      admin(),
    ) as StudentFilterOptions;
    expect(options.courses.length).toBeGreaterThan(0);
    expect(options.statuses.map((s) => s.value)).toContain('active');
  });

  describe('detail', () => {
    it('returns a full record for a known id, with the cross-module rollups', () => {
      const detail = handleMockRequest(
        request({ method: 'GET', path: `/students/${firstId()}` }),
        admin(),
      ) as StudentDetail;

      expect(detail.personal.email).toContain('@');
      expect(detail.parents.length).toBeGreaterThan(0);
      expect(detail.enrollment.course).toBeTruthy();
      // Biodata: structured identity + address, backend-provided age.
      expect(detail.admissionNo).toMatch(/^ADM\//);
      expect(detail.rollNo).toBeTruthy();
      expect(detail.personal.firstName).toBeTruthy();
      expect(detail.personal.gender).toBeTruthy();
      expect(typeof detail.personal.age).toBe('number');
      expect(detail.personal.address.city).toBeTruthy();
      // Parent link carries the full guardian record and an explicit relationship.
      expect(detail.parents[0]?.relation).toBeTruthy();
      expect(detail.parents.some((p) => p.isEmergencyContact)).toBe(true);
      expect(detail.medical).toBeDefined();
      // Rollups present but internally consistent (paid + pending = total).
      expect(detail.summary.fees.paid + detail.summary.fees.pending).toBe(detail.summary.fees.total);
      expect(detail.summary.attendance.percent).toBeGreaterThanOrEqual(0);
      expect(detail.summary.attendance.percent).toBeLessThanOrEqual(100);
    });

    it('does not resolve the detail route to the filter-options endpoint', () => {
      // Route ordering: /students/filter-options must win over /students/:id.
      const options = handleMockRequest(
        request({ method: 'GET', path: '/students/filter-options' }),
        admin(),
      ) as StudentFilterOptions;
      expect(options.courses).toBeDefined();
      expect((options as unknown as StudentDetail).personal).toBeUndefined();
    });

    it('returns 404 for an unknown id', () => {
      expect(() =>
        handleMockRequest(request({ method: 'GET', path: '/students/stu-999' }), admin()),
      ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
    });

    it('requires students.view', () => {
      expect(() =>
        handleMockRequest(
          request({ method: 'GET', path: `/students/${firstId()}` }),
          loginAs('student@mavenart.test'),
        ),
      ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
    });
  });

  describe('create / update', () => {
    const validInput: StudentInput = {
      name: 'Test Candidate',
      gender: 'female',
      dateOfBirth: '2005-06-15',
      bloodGroup: 'O+',
      email: `unique.${Date.now()}@student.mavenart.test`,
      phone: '+91 90000 00000',
      alternatePhone: '',
      rollNo: '',
      admissionNo: '',
      address: { line1: '1, Studio Lane', line2: '', area: 'Besant Nagar', city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', country: 'India', postalCode: '600090' },
      courseId: 'crs-bfa',
      batchId: 'bat-bfa-1a',
      section: 'A',
      status: 'active',
      medical: { foodAllergies: '', otherAllergies: '', accessibility: '', emergencyContact: '', notes: '' },
      previousInstitution: { name: '', lastClass: '', tcNumber: '', tcDate: '', boardOrUniversity: '', yearOfLeaving: '', reasonForLeaving: '' },
    };

    function create(body: unknown, token = admin()) {
      return handleMockRequest(request({ method: 'POST', path: '/students', body }), token);
    }

    it('requires students.create', () => {
      expect(() => create(validInput, admin())).not.toThrow();
      expect(() => create(validInput, loginAs('faculty@mavenart.test'))).toThrowError(
        expect.objectContaining({ kind: 'forbidden' }),
      );
    });

    it('creates a student and makes it visible in the list and detail', () => {
      const email = `new.${Math.random().toString(36).slice(2)}@student.mavenart.test`;
      const created = create({ ...validInput, name: 'Freshly Enrolled', email }) as StudentDetail;

      expect(created.registerNo).toMatch(/^MAA/);
      expect(created.name).toBe('Freshly Enrolled');

      // Now retrievable by id and present in a search.
      const fetched = handleMockRequest(
        request({ method: 'GET', path: `/students/${created.id}` }),
        admin(),
      ) as StudentDetail;
      expect(fetched.personal.email).toBe(email);

      const found = listStudents({ search: 'Freshly Enrolled', limit: 50 });
      expect(found.data.some((r) => r.id === created.id)).toBe(true);
    });

    it('rejects an incomplete body with 422 field errors', () => {
      try {
        create({ ...validInput, name: '', email: '' });
        throw new Error('expected a rejection');
      } catch (error) {
        expect((error as ApiError).kind).toBe('validation');
        expect((error as ApiError).fieldErrors.name).toBeDefined();
        expect((error as ApiError).fieldErrors.email).toBeDefined();
      }
    });

    it('rejects a duplicate email with a field error (uniqueness is backend-only)', () => {
      const existing = handleMockRequest(
        request({ method: 'GET', path: `/students/${firstId()}` }),
        admin(),
      ) as StudentDetail;

      try {
        create({ ...validInput, email: existing.personal.email });
        throw new Error('expected a rejection');
      } catch (error) {
        expect((error as ApiError).kind).toBe('validation');
        expect((error as ApiError).fieldErrors.email?.[0]).toMatch(/already exists/i);
      }
    });

    it('updates an existing student', () => {
      const id = firstId();
      const updated = handleMockRequest(
        request({ method: 'PUT', path: `/students/${id}`, body: { ...validInput, name: 'Renamed Student', email: `renamed.${Date.now()}@student.mavenart.test` } }),
        admin(),
      ) as StudentDetail;
      expect(updated.name).toBe('Renamed Student');

      const refetched = handleMockRequest(
        request({ method: 'GET', path: `/students/${id}` }),
        admin(),
      ) as StudentDetail;
      expect(refetched.name).toBe('Renamed Student');
    });

    it('returns 404 when updating an unknown student', () => {
      expect(() =>
        handleMockRequest(
          request({ method: 'PUT', path: '/students/stu-does-not-exist', body: validInput }),
          admin(),
        ),
      ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
    });

    it('requires students.update to update', () => {
      expect(() =>
        handleMockRequest(
          request({ method: 'PUT', path: `/students/${firstId()}`, body: validInput }),
          loginAs('faculty@mavenart.test'),
        ),
      ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
    });
  });

  describe('profile photo', () => {
    it('sets and clears the profile photo (students.update)', () => {
      const id = firstId();
      const dataUri = 'data:image/png;base64,AAAA';

      const set = handleMockRequest(
        request({ method: 'POST', path: `/students/${id}/photo`, body: { photo: dataUri } }),
        admin(),
      ) as StudentDetail;
      expect(set.photoUrl).toBe(dataUri);

      const cleared = handleMockRequest(
        request({ method: 'POST', path: `/students/${id}/photo`, body: { photo: null } }),
        admin(),
      ) as StudentDetail;
      expect(cleared.photoUrl).toBeNull();
    });

    it('requires students.update to change the photo', () => {
      expect(() =>
        handleMockRequest(
          request({ method: 'POST', path: `/students/${firstId()}/photo`, body: { photo: null } }),
          loginAs('faculty@mavenart.test'),
        ),
      ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
    });
  });
});

describe('admission closure + archive (§ admission closure, § archive)', () => {
  function req(partial: Partial<ApiRequest> & Pick<ApiRequest, 'method' | 'path'>): ApiRequest {
    return { auth: true, timeoutMs: 1000, ...partial };
  }
  const token = () => admin();

  it('closes an admission, preserves the record and archives it', () => {
    // Create a throwaway student so the shared store stays predictable.
    const email = `closing.${Math.random().toString(36).slice(2)}@student.mavenart.test`;
    const created = handleMockRequest(
      req({
        method: 'POST',
        path: '/students',
        body: {
          name: 'Closing Candidate', gender: 'male', dateOfBirth: '2004-01-01', bloodGroup: 'O+',
          email, phone: '+91 90000 00000', alternatePhone: '', rollNo: '', admissionNo: '',
          address: { line1: '', line2: '', area: '', city: '', district: '', state: '', country: 'India', postalCode: '' },
          courseId: 'crs-bfa', batchId: 'bat-bfa-1a', section: 'A', status: 'active',
          medical: { foodAllergies: '', otherAllergies: '', accessibility: '', emergencyContact: '', notes: '' },
          previousInstitution: { name: '', lastClass: '', tcNumber: '', tcDate: '', boardOrUniversity: '', yearOfLeaving: '', reasonForLeaving: '' },
        },
      }),
      token(),
    ) as StudentDetail;

    const closed = handleMockRequest(
      req({
        method: 'POST',
        path: `/students/${created.id}/close`,
        body: { type: 'transfer', effectiveDate: '2026-08-31', reason: 'Family relocating', tcNumber: 'TC/2026/900', destination: 'Maven Art — Bengaluru' },
      }),
      token(),
    ) as StudentDetail;

    expect(closed.status).toBe('transferred');
    expect(closed.closure?.type).toBe('transfer');
    expect(closed.closure?.tcNumber).toBe('TC/2026/900');
    expect(closed.closure?.destination).toBe('Maven Art — Bengaluru');
    // Stamped from the identity, not the client.
    expect(closed.closure?.closedBy).toBeTruthy();

    // The record is preserved and still retrievable — never deleted.
    const refetched = handleMockRequest(req({ method: 'GET', path: `/students/${created.id}` }), token()) as StudentDetail;
    expect(refetched.name).toBe('Closing Candidate');
    expect(refetched.closure).not.toBeNull();

    // And it now appears in the archive's closed-student register — findable
    // even though its batch is still active.
    const archived = handleMockRequest(req({ method: 'GET', path: '/archive/students', query: { limit: 100 } }), token()) as {
      data: { id: string; outcome: string; tcNumber: string }[];
    };
    expect(archived.data.some((s) => s.id === created.id && s.outcome === 'transferred')).toBe(true);
  });

  it('rejects closing an already-closed admission with 409', () => {
    const email = `twice.${Math.random().toString(36).slice(2)}@student.mavenart.test`;
    const created = handleMockRequest(
      req({
        method: 'POST',
        path: '/students',
        body: {
          name: 'Twice Closed', gender: 'female', dateOfBirth: '2004-02-02', bloodGroup: 'A+',
          email, phone: '+91 90000 00001', alternatePhone: '', rollNo: '', admissionNo: '',
          address: { line1: '', line2: '', area: '', city: '', district: '', state: '', country: 'India', postalCode: '' },
          courseId: 'crs-bfa', batchId: 'bat-bfa-1a', section: 'A', status: 'active',
          medical: { foodAllergies: '', otherAllergies: '', accessibility: '', emergencyContact: '', notes: '' },
          previousInstitution: { name: '', lastClass: '', tcNumber: '', tcDate: '', boardOrUniversity: '', yearOfLeaving: '', reasonForLeaving: '' },
        },
      }),
      token(),
    ) as StudentDetail;

    const body = { type: 'withdrawal', effectiveDate: '2026-08-31', reason: 'Withdrew' };
    handleMockRequest(req({ method: 'POST', path: `/students/${created.id}/close`, body }), token());

    expect(() =>
      handleMockRequest(req({ method: 'POST', path: `/students/${created.id}/close`, body }), token()),
    ).toThrowError(expect.objectContaining({ kind: 'conflict', status: 409 }));
  });

  it('rejects a closure without a reason (422)', () => {
    expect(() =>
      handleMockRequest(
        req({ method: 'POST', path: `/students/${firstId()}/close`, body: { type: 'withdrawal', effectiveDate: '2026-08-31', reason: '' } }),
        token(),
      ),
    ).toThrowError(expect.objectContaining({ kind: 'validation' }));
  });

  it('requires students.update to close an admission', () => {
    expect(() =>
      handleMockRequest(
        req({ method: 'POST', path: `/students/${firstId()}/close`, body: { type: 'withdrawal', effectiveDate: '2026-08-31', reason: 'x' } }),
        loginAs('faculty@mavenart.test'),
      ),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('lists passed-out batches in the archive with outcome counts', () => {
    const archive = handleMockRequest(req({ method: 'GET', path: '/archive/batches' }), token()) as {
      total: number;
      data: { name: string; academicYear: string; totalStudents: number; completed: number }[];
    };
    expect(archive.total).toBeGreaterThan(0);
    expect(archive.data[0]?.academicYear).toBeTruthy();
    expect(archive.data[0]?.totalStudents).toBeGreaterThan(0);
  });

  it('captures the previous institution / TC at admission', () => {
    // A seeded student untouched by the create/update tests above.
    const detail = handleMockRequest(req({ method: 'GET', path: '/students/stu-005' }), token()) as StudentDetail;
    expect(detail.previousInstitution.name).toBeTruthy();
    expect(detail.previousInstitution.tcNumber).toMatch(/^TC\//);
  });
});
