import type { Id, KnownOr } from '@/shared/types';

/**
 * Student list row (§14.1).
 *
 * TBD — BACKEND CONTRACT: field names are provisional. The list endpoint
 * returns display-ready course/batch names so the table needs no second lookup;
 * the ids are included for links and filtering.
 */
export type StudentStatus = KnownOr<'active' | 'on_leave' | 'graduated'>;

export interface StudentListItem {
  id: Id;
  registerNo: string;
  name: string;
  courseId: Id;
  course: string;
  courseCode: string;
  batchId: Id;
  batch: string;
  section: string;
  status: StudentStatus;
}

/** Options for the list's server-driven filters and the create/edit form. */
export interface StudentFilterOptions {
  courses: { id: Id; name: string }[];
  batches: { id: Id; name: string; courseId: Id }[];
  sections: string[];
  statuses: { value: string; label: string }[];
}

/**
 * Fields a client may submit when creating or updating a student (§14.1).
 *
 * The register number and computed rollups are backend-owned and are not part
 * of the input. Frontend validation of this shape is UX only; the backend
 * enforces it (§30).
 *
 * TBD — BACKEND CONTRACT: field set is provisional.
 */
export interface StudentInput {
  name: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  bloodGroup: string;
  address: string;
  courseId: Id;
  batchId: Id;
  section: string;
  status: StudentStatus;
}

export const STUDENT_STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  on_leave: 'On leave',
  graduated: 'Graduated',
};

/**
 * Full student record for the details page (§14.1).
 *
 * The students domain owns the student's own fields (personal, academic,
 * parent, enrollment). The cross-module tabs (attendance, fees, progress,
 * certificates) are backend-provided rollup *summaries* — a real student-detail
 * endpoint returns these so the record reads as a whole. The frontend never
 * computes them (fee balances especially, §22/§39); it displays what the
 * backend sends, and each summary links to its full module.
 *
 * TBD — BACKEND CONTRACT: field names and which rollups the detail endpoint
 * carries are provisional.
 */
export interface StudentParentLink {
  id: Id;
  name: string;
  relation: string;
  phone: string;
  email: string;
}

export interface StudentDetail {
  id: Id;
  registerNo: string;
  name: string;
  status: StudentStatus;
  courseId: Id;
  course: string;
  courseCode: string;
  batchId: Id;
  batch: string;
  section: string;

  personal: {
    dateOfBirth: string;
    email: string;
    phone: string;
    address: string;
    bloodGroup: string;
    admissionDate: string;
  };
  academic: {
    course: string;
    courseCode: string;
    batch: string;
    section: string;
    year: string;
    enrollmentStatus: string;
  };
  parents: StudentParentLink[];
  enrollment: {
    course: string;
    batch: string;
    status: string;
    startDate: string;
    endDate: string | null;
  };

  /** Backend rollups, shown as summaries with a link to the full module. */
  summary: {
    attendance: { percent: number; present: number; total: number };
    fees: { total: number; paid: number; pending: number; status: 'paid' | 'partial' | 'overdue' };
    progress: { lastSubject: string; grade: string } | null;
    certificates: { count: number };
  };
}
