import { ApiError, messageForKind } from '@/lib/api/api-error';
import type { ApiRequest } from '@/lib/api/types';
import type { AuthenticatedIdentity, Paginated, PermissionKey, Role } from '@/shared/types';
import {
  findAccount,
  findAccountByUserId,
  MOCK_NOTIFICATIONS,
  type MockNotification,
} from './fixtures';
import { buildDashboardSummary } from './dashboard-data';
import {
  createStudent,
  getStudentDetail,
  listStudents,
  studentFilterOptions,
  updateStudent,
} from './students-data';
import type { StudentInput } from '@/features/students/types';
import { rosterFor, submitAttendance, todaysClassesFor } from './attendance-data';
import type { AttendanceSubmission } from '@/features/attendance/types';
import { getBatchDetail, listBatches } from './batches-data';
import { listTimetable, timetableOptions } from './timetable-data';
import { getFacultyDetail, listFaculty } from './faculty-data';
import { getCourseDetail, listCourses } from './courses-data';
import {
  addFollowup,
  getEnquiry,
  listEnquiries,
  transitionEnquiry,
  type EnquiryResult,
} from './enquiries-data';
import type { EnquiryAction } from '@/features/enquiries/types';
import {
  getApplication,
  listApplications,
  transitionApplication,
  type ApplicationResult,
} from './applications-data';
import type { ApplicationAction } from '@/features/applications/types';
import {
  getAdmission,
  listAdmissions,
  transitionAdmission,
  type AdmissionResult,
} from './admissions-data';
import type { AdmissionAction } from '@/features/admissions/types';
import { getEnrollment, listEnrollments } from './enrollments-data';
import { getFeeStructure, listFeeStructures } from './fee-structures-data';
import { getFeeAssignment, listFeeAssignments } from './fee-assignments-data';

/**
 * In-memory mock backend (Day 1 step 14).
 *
 * It deliberately behaves like a real API: it authenticates, it enforces the
 * permission it claims to enforce, it paginates server-side, and it returns
 * normalized HTTP-shaped failures. That means the UI is exercised against the
 * same states it will see in production (§28), and swapping in the real backend
 * changes only `VITE_API_MODE`.
 */

interface MockContext {
  request: ApiRequest;
  /** Session credential presented by the client, if any. */
  token: string | null;
}

type Handler = (ctx: MockContext, params: Record<string, string>) => unknown;

interface Route {
  method: ApiRequest['method'];
  pattern: RegExp;
  handler: Handler;
}

function fail(kind: 'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'validation' | 'server', extra?: {
  status?: number;
  fieldErrors?: Record<string, string[]>;
  code?: string;
}): never {
  const statusByKind = { unauthorized: 401, forbidden: 403, not_found: 404, conflict: 409, validation: 422, server: 500 };
  throw new ApiError({
    kind,
    message: messageForKind(kind),
    status: extra?.status ?? statusByKind[kind],
    fieldErrors: extra?.fieldErrors ?? {},
    code: extra?.code ?? null,
  });
}

// --- Mock session handling -------------------------------------------------
// Format: mock.<userId>.<expiryEpochMs>. Signed tokens are a backend concern;
// this only needs to be forgeable-but-checkable for local development.

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function issueToken(userId: string): { token: string; expiresAt: string } {
  const expiry = Date.now() + SESSION_TTL_MS;
  return { token: `mock.${userId}.${expiry}`, expiresAt: new Date(expiry).toISOString() };
}

function identityFromToken(token: string | null): AuthenticatedIdentity {
  if (!token) fail('unauthorized');
  const [prefix, userId, expiry] = token.split('.');
  if (prefix !== 'mock' || !userId || !expiry) fail('unauthorized');
  if (Number(expiry) <= Date.now()) fail('unauthorized');
  const account = findAccountByUserId(userId);
  if (!account) fail('unauthorized');
  return account.identity;
}

function requirePermission(identity: AuthenticatedIdentity, permission: PermissionKey): void {
  if (!identity.permissions.includes(permission)) fail('forbidden');
}

/** Builds a `ListQuery` from a raw request query for simple search/sort lists. */
function listQueryFrom(query: ApiRequest['query']): {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
} {
  return {
    page: Number(query?.page) || undefined,
    limit: Number(query?.limit) || undefined,
    search: typeof query?.search === 'string' ? query.search : undefined,
    sortBy: typeof query?.sortBy === 'string' ? query.sortBy : undefined,
    sortDir: query?.sortDir === 'desc' ? 'desc' : 'asc',
  };
}

// --- Notification list: server-side search/filter/sort/pagination (§31, §32) --

function paginate<T>(rows: T[], page: number, limit: number): Paginated<T> {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

function listNotifications(ctx: MockContext): Paginated<MockNotification> {
  const identity = identityFromToken(ctx.token);
  requirePermission(identity, 'notifications.view');

  const query = ctx.request.query ?? {};

  // `demoState` lets the running application demonstrate every data state from
  // specification §28 without editing code. Mock-only; ignored by a real backend.
  const demoState = typeof query.demoState === 'string' ? query.demoState : '';
  if (demoState === 'error') fail('server');
  if (demoState === 'forbidden') fail('forbidden');
  if (demoState === 'not_found') fail('not_found');
  if (demoState === 'unauthorized') fail('unauthorized');

  const search = String(query.search ?? '').trim().toLowerCase();
  const category = String(query.category ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  let rows = [...MOCK_NOTIFICATIONS];
  if (demoState === 'empty') rows = [];
  if (search) {
    rows = rows.filter(
      (row) => row.title.toLowerCase().includes(search) || row.body.toLowerCase().includes(search),
    );
  }
  if (category) rows = rows.filter((row) => row.category === category);
  rows.sort((a, b) =>
    sortDir === 'asc' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt),
  );

  return paginate(rows, page, limit);
}

// --- Routes ----------------------------------------------------------------

const routes: Route[] = [
  {
    method: 'POST',
    pattern: /^\/auth\/login$/,
    handler: (ctx) => {
      const body = (ctx.request.body ?? {}) as { email?: string; password?: string };
      const email = typeof body.email === 'string' ? body.email : '';
      const password = typeof body.password === 'string' ? body.password : '';

      const fieldErrors: Record<string, string[]> = {};
      if (!email) fieldErrors.email = ['Email is required.'];
      if (!password) fieldErrors.password = ['Password is required.'];
      if (Object.keys(fieldErrors).length > 0) fail('validation', { fieldErrors });

      const account = findAccount(email);
      if (!account || account.password !== password) {
        // Deliberately does not reveal whether the address exists.
        throw new ApiError({
          kind: 'unauthorized',
          message: 'The email address or password is incorrect.',
          status: 401,
          code: 'invalid_credentials',
        });
      }

      const session = issueToken(account.identity.user.id);
      return { session: { accessToken: session.token, expiresAt: session.expiresAt } };
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/logout$/,
    handler: () => null,
  },
  {
    method: 'GET',
    pattern: /^\/auth\/me$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      return {
        user: identity.user,
        profile: identity.profile,
        role: identity.role,
        permissions: identity.permissions,
      };
    },
  },
  {
    method: 'GET',
    pattern: /^\/notifications$/,
    handler: listNotifications,
  },
  {
    method: 'GET',
    pattern: /^\/dashboard$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      // The Student/Parent dashboard is a separate portal experience (Phase 6);
      // this endpoint serves the three management authorities (§13).
      const summary = buildDashboardSummary(identity.role as Role);
      if (!summary) fail('forbidden');
      return summary;
    },
  },
  {
    method: 'GET',
    pattern: /^\/students$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'students.view');

      // Same demo-state control as notifications, so every §28 state is
      // reachable from the running list without editing code. Mock-only.
      const demoState = String(ctx.request.query?.demoState ?? '');
      if (demoState === 'error') fail('server');
      if (demoState === 'forbidden') fail('forbidden');

      const result = listStudents({
        page: Number(ctx.request.query?.page) || undefined,
        limit: Number(ctx.request.query?.limit) || undefined,
        search: typeof ctx.request.query?.search === 'string' ? ctx.request.query.search : undefined,
        sortBy: typeof ctx.request.query?.sortBy === 'string' ? ctx.request.query.sortBy : undefined,
        sortDir: ctx.request.query?.sortDir === 'desc' ? 'desc' : 'asc',
        filters: {
          course: typeof ctx.request.query?.course === 'string' ? ctx.request.query.course : undefined,
          status: typeof ctx.request.query?.status === 'string' ? ctx.request.query.status : undefined,
        },
      });
      if (demoState === 'empty') return { ...result, data: [], total: 0, totalPages: 1, page: 1 };
      return result;
    },
  },
  {
    method: 'GET',
    pattern: /^\/students\/filter-options$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'students.view');
      return studentFilterOptions();
    },
  },
  {
    // Registered AFTER /students/filter-options: both patterns could match that
    // path, and `routes.find` returns the first, so the specific route wins.
    method: 'GET',
    pattern: /^\/students\/(?<studentId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'students.view');
      const detail = getStudentDetail(params.studentId ?? '');
      if (!detail) fail('not_found');
      return detail;
    },
  },
  {
    method: 'POST',
    pattern: /^\/students$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'students.create');
      const result = createStudent((ctx.request.body ?? {}) as StudentInput);
      if (!result.ok) fail('validation', { fieldErrors: result.fieldErrors });
      return result.detail;
    },
  },
  {
    method: 'PUT',
    pattern: /^\/students\/(?<studentId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'students.update');
      const result = updateStudent(params.studentId ?? '', (ctx.request.body ?? {}) as StudentInput);
      if (!result) fail('not_found');
      if (!result.ok) fail('validation', { fieldErrors: result.fieldErrors });
      return result.detail;
    },
  },
  {
    method: 'GET',
    pattern: /^\/attendance\/classes$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'attendance.view');
      // The backend scopes to the caller; the UI cannot request another's classes.
      return todaysClassesFor(identity.user.id);
    },
  },
  {
    method: 'GET',
    pattern: /^\/attendance\/classes\/(?<classId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'attendance.view');
      const result = rosterFor(params.classId ?? '', identity.user.id);
      if (result.kind === 'not_found') fail('not_found');
      if (result.kind === 'forbidden') fail('forbidden');
      return result.roster;
    },
  },
  {
    method: 'POST',
    pattern: /^\/attendance\/classes\/(?<classId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      // §6: marking requires the mark permission AND assignment to the class.
      requirePermission(identity, 'attendance.mark');
      const result = submitAttendance(
        params.classId ?? '',
        identity.user.id,
        (ctx.request.body ?? {}) as AttendanceSubmission,
      );
      if (result.kind === 'not_found') fail('not_found');
      if (result.kind === 'forbidden') fail('forbidden');
      return result.roster;
    },
  },
  {
    method: 'GET',
    pattern: /^\/batches$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'batches.view');
      return listBatches({
        page: Number(ctx.request.query?.page) || undefined,
        limit: Number(ctx.request.query?.limit) || undefined,
        search: typeof ctx.request.query?.search === 'string' ? ctx.request.query.search : undefined,
        sortBy: typeof ctx.request.query?.sortBy === 'string' ? ctx.request.query.sortBy : undefined,
        sortDir: ctx.request.query?.sortDir === 'desc' ? 'desc' : 'asc',
        filters: {
          course: typeof ctx.request.query?.course === 'string' ? ctx.request.query.course : undefined,
          status: typeof ctx.request.query?.status === 'string' ? ctx.request.query.status : undefined,
        },
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/batches\/(?<batchId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'batches.view');
      const detail = getBatchDetail(params.batchId ?? '');
      if (!detail) fail('not_found');
      return detail;
    },
  },
  {
    method: 'GET',
    pattern: /^\/timetable\/options$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'timetable.view');
      return timetableOptions();
    },
  },
  {
    // Registered after /timetable/options so the specific route wins.
    method: 'GET',
    pattern: /^\/timetable$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'timetable.view');
      return listTimetable({
        batchId: typeof ctx.request.query?.batchId === 'string' ? ctx.request.query.batchId : undefined,
        facultyId: typeof ctx.request.query?.facultyId === 'string' ? ctx.request.query.facultyId : undefined,
        room: typeof ctx.request.query?.room === 'string' ? ctx.request.query.room : undefined,
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/faculty$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'faculty.view');
      return listFaculty(listQueryFrom(ctx.request.query));
    },
  },
  {
    method: 'GET',
    pattern: /^\/faculty\/(?<facultyId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'faculty.view');
      const detail = getFacultyDetail(params.facultyId ?? '');
      if (!detail) fail('not_found');
      return detail;
    },
  },
  {
    method: 'GET',
    pattern: /^\/courses$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'courses.view');
      return listCourses(listQueryFrom(ctx.request.query));
    },
  },
  {
    method: 'GET',
    pattern: /^\/courses\/(?<courseId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'courses.view');
      const detail = getCourseDetail(params.courseId ?? '');
      if (!detail) fail('not_found');
      return detail;
    },
  },
  {
    method: 'GET',
    pattern: /^\/enquiries$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'enquiries.view');
      return listEnquiries({
        ...listQueryFrom(ctx.request.query),
        filters: { stage: typeof ctx.request.query?.stage === 'string' ? ctx.request.query.stage : undefined },
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/enquiries\/(?<enquiryId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'enquiries.view');
      const detail = getEnquiry(params.enquiryId ?? '');
      if (!detail) fail('not_found');
      return detail;
    },
  },
  {
    method: 'POST',
    pattern: /^\/enquiries\/(?<enquiryId>[^/]+)\/followups$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'enquiries.update');
      const note = String((ctx.request.body as { note?: string })?.note ?? '').trim();
      if (!note) fail('validation', { fieldErrors: { note: ['A note is required.'] } });
      return unwrap(addFollowup(params.enquiryId ?? '', note, identity.profile.fullName));
    },
  },
  {
    // One route for the three transitions; the mock enforces legality per stage.
    method: 'POST',
    pattern: /^\/enquiries\/(?<enquiryId>[^/]+)\/(?<action>convert|close|reopen)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'enquiries.update');
      return unwrap(transitionEnquiry(params.enquiryId ?? '', (params.action ?? '') as EnquiryAction));
    },
  },
  {
    method: 'GET',
    pattern: /^\/applications$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'applications.view');
      return listApplications({
        ...listQueryFrom(ctx.request.query),
        filters: { stage: typeof ctx.request.query?.stage === 'string' ? ctx.request.query.stage : undefined },
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/applications\/(?<applicationId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'applications.view');
      const detail = getApplication(params.applicationId ?? '');
      if (!detail) fail('not_found');
      return detail;
    },
  },
  {
    method: 'POST',
    pattern: /^\/applications\/(?<applicationId>[^/]+)\/(?<action>submit|start-review|approve|reject)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      // The review/decision actions require the review permission (§16).
      requirePermission(identity, 'applications.review');
      const action = (params.action === 'start-review' ? 'start_review' : params.action) as ApplicationAction;
      const note = (ctx.request.body as { note?: string })?.note;
      return unwrapApplication(transitionApplication(params.applicationId ?? '', action, note));
    },
  },
  {
    method: 'GET',
    pattern: /^\/admissions$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'admissions.view');
      return listAdmissions({
        ...listQueryFrom(ctx.request.query),
        filters: { stage: typeof ctx.request.query?.stage === 'string' ? ctx.request.query.stage : undefined },
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/admissions\/(?<admissionId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'admissions.view');
      const detail = getAdmission(params.admissionId ?? '');
      if (!detail) fail('not_found');
      return detail;
    },
  },
  {
    method: 'POST',
    pattern: /^\/admissions\/(?<admissionId>[^/]+)\/(?<action>confirm|enroll|cancel)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      // The confirm/enroll/cancel decisions require the approve permission (§17).
      requirePermission(identity, 'admissions.approve');
      const action = (params.action ?? '') as AdmissionAction;
      const note = (ctx.request.body as { note?: string })?.note;
      return unwrapAdmission(transitionAdmission(params.admissionId ?? '', action, note));
    },
  },
  {
    method: 'GET',
    pattern: /^\/enrollments$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'enrollments.view');
      return listEnrollments({
        ...listQueryFrom(ctx.request.query),
        filters: { status: typeof ctx.request.query?.status === 'string' ? ctx.request.query.status : undefined },
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/enrollments\/(?<enrollmentId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'enrollments.view');
      const detail = getEnrollment(params.enrollmentId ?? '');
      if (!detail) fail('not_found');
      return detail;
    },
  },
  {
    method: 'GET',
    pattern: /^\/fee-structures$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'fee_structures.view');
      return listFeeStructures({
        ...listQueryFrom(ctx.request.query),
        filters: { status: typeof ctx.request.query?.status === 'string' ? ctx.request.query.status : undefined },
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/fee-structures\/(?<feeStructureId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'fee_structures.view');
      const detail = getFeeStructure(params.feeStructureId ?? '');
      if (!detail) fail('not_found');
      return detail;
    },
  },
  {
    method: 'GET',
    pattern: /^\/fee-assignments$/,
    handler: (ctx) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'fee_assignments.view');
      return listFeeAssignments({
        ...listQueryFrom(ctx.request.query),
        filters: { status: typeof ctx.request.query?.status === 'string' ? ctx.request.query.status : undefined },
      });
    },
  },
  {
    method: 'GET',
    pattern: /^\/fee-assignments\/(?<feeAssignmentId>[^/]+)$/,
    handler: (ctx, params) => {
      const identity = identityFromToken(ctx.token);
      requirePermission(identity, 'fee_assignments.view');
      const detail = getFeeAssignment(params.feeAssignmentId ?? '');
      if (!detail) fail('not_found');
      return detail;
    },
  },
];

function unwrapApplication(result: ApplicationResult): unknown {
  if (result.kind === 'not_found') fail('not_found');
  if (result.kind === 'conflict') fail('conflict', { status: 409 });
  return result.detail;
}

function unwrapAdmission(result: AdmissionResult): unknown {
  if (result.kind === 'not_found') fail('not_found');
  if (result.kind === 'conflict') fail('conflict', { status: 409 });
  return result.detail;
}

/** Translates an enquiry state-machine result into an HTTP-shaped response. */
function unwrap(result: EnquiryResult): unknown {
  if (result.kind === 'not_found') fail('not_found');
  // An illegal transition from the current stage is a conflict (§15).
  if (result.kind === 'conflict') fail('conflict', { status: 409 });
  return result.detail;
}

export function handleMockRequest(request: ApiRequest, token: string | null): unknown {
  const route = routes.find(
    (candidate) => candidate.method === request.method && candidate.pattern.test(request.path),
  );

  if (!route) {
    throw new ApiError({
      kind: 'not_found',
      message: messageForKind('not_found'),
      status: 404,
      cause: `No mock handler for ${request.method} ${request.path}`,
    });
  }

  const match = route.pattern.exec(request.path);
  return route.handler({ request, token }, match?.groups ?? {});
}
