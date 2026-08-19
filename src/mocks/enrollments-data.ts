import type {
  EnrollmentDetail,
  EnrollmentListItem,
  EnrollmentStatus,
} from '@/features/enrollments/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Enrollments mock (§18).
 *
 * An enrollment is created when an admission is enrolled (§17) — see
 * `createEnrollmentFromAdmission`, the in-session handoff. The backend owns the
 * enrollment status; this mock only stores and reports it. In-memory for the
 * session.
 */

interface EnrollmentRecord {
  id: string;
  student: string;
  course: string;
  batch: string;
  status: EnrollmentStatus;
  enrolledAt: string | null;
  admissionId: string | null;
  note: string | null;
}

function make(
  id: string,
  student: string,
  course: string,
  batch: string,
  status: EnrollmentStatus,
  enrolledAt: string | null,
  admissionId: string | null,
): EnrollmentRecord {
  return { id, student, course, batch, status, enrolledAt, admissionId, note: null };
}

function buildStore(): EnrollmentRecord[] {
  return [
    make('enr-330', 'Aisha Rahman', 'Photography', 'PH-2026-A', 'active', '2026-08-06', 'adm-495'),
    make('enr-329', 'Rahul Verma', 'Visual Communication & Design', 'VCD-2026-B', 'active', '2026-07-20', 'adm-490'),
    make('enr-320', 'Priya Iyer', 'Bachelor of Fine Arts', 'BFA-2025-A', 'completed', '2025-06-15', 'adm-455'),
    make('enr-315', 'Tanvi Shah', 'Animation & Motion Design', 'AMD-2025-A', 'withdrawn', '2025-08-10', 'adm-441'),
  ];
}

let store = buildStore();

export function resetEnrollments(): void {
  store = buildStore();
}

function toListItem(record: EnrollmentRecord): EnrollmentListItem {
  return {
    id: record.id,
    student: record.student,
    course: record.course,
    batch: record.batch,
    status: record.status,
    enrolledAt: record.enrolledAt,
  };
}

function toDetail(record: EnrollmentRecord): EnrollmentDetail {
  return {
    id: record.id,
    student: record.student,
    course: record.course,
    batch: record.batch,
    status: record.status,
    enrolledAt: record.enrolledAt,
    admissionId: record.admissionId,
    note: record.note,
  };
}

export function listEnrollments(query: ListQuery): Paginated<EnrollmentListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const status = String(query.filters?.status ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store
    .map(toListItem)
    .filter((row) => {
      if (
        search &&
        !row.student.toLowerCase().includes(search) &&
        !row.course.toLowerCase().includes(search) &&
        !row.batch.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (status && row.status !== status) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a.enrolledAt ?? '';
      const bv = b.enrolledAt ?? '';
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getEnrollment(id: string): EnrollmentDetail | null {
  const record = store.find((e) => e.id === id);
  return record ? toDetail(record) : null;
}

let enrollmentSeq = 331;

/**
 * The §17 → §18 handoff: enrolling an admission creates an enrollment in the
 * `active` status and returns its id. Called by the admissions mock so the
 * enrolled admission's `enr-…` link resolves to a real enrollment this session.
 * The batch is left unassigned (TBD — BACKEND CONTRACT: placement happens here).
 */
export function createEnrollmentFromAdmission(input: {
  student: string;
  course: string;
  admissionId: string;
}): string {
  const id = `enr-${enrollmentSeq}`;
  enrollmentSeq += 1;
  store.unshift({
    id,
    student: input.student,
    course: input.course,
    batch: 'Unassigned',
    status: 'active',
    enrolledAt: new Date().toISOString().slice(0, 10),
    admissionId: input.admissionId,
    note: null,
  });
  return id;
}
