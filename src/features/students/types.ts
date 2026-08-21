import type { Id, KnownOr } from '@/shared/types';

/**
 * Student list row (§14.1).
 *
 * TBD — BACKEND CONTRACT: field names are provisional. The list endpoint
 * returns display-ready course/batch names so the table needs no second lookup;
 * the ids are included for links and filtering.
 */
/**
 * Student lifecycle status. `active`/`on_leave` are live records; the three
 * CLOSED statuses (`completed`, `transferred`, `withdrawn`) end the admission —
 * the record is preserved for the institutional archive but no longer edited.
 */
export type StudentStatus = KnownOr<'active' | 'on_leave' | 'completed' | 'transferred' | 'withdrawn' | 'graduated'>;

/** Statuses that mean the admission is closed and the record is archived. */
export const CLOSED_STATUSES: readonly string[] = ['completed', 'transferred', 'withdrawn', 'graduated'];

export function isClosedStatus(status: StudentStatus): boolean {
  return CLOSED_STATUSES.includes(String(status));
}

/** How an admission ended (§ admission closure). */
export type ClosureType = KnownOr<'completion' | 'transfer' | 'withdrawal'>;

export const CLOSURE_TYPE_LABEL: Record<string, string> = {
  completion: 'Course completed',
  transfer: 'Transferred out',
  withdrawal: 'Withdrawn',
};

/**
 * The closure record. Written once when the admission ends and preserved with
 * the student — the institution must be able to answer "when and why did this
 * student leave, and what document was issued?" years later.
 */
export interface StudentClosure {
  type: ClosureType;
  effectiveDate: string;
  reason: string;
  /** Transfer Certificate number issued on exit, when applicable. */
  tcNumber: string;
  tcIssuedOn: string | null;
  /** Receiving institution / branch for a transfer. */
  destination: string;
  clearance: string;
  remarks: string;
  closedBy: string;
  closedOn: string;
}

/** Payload submitted to close an admission. */
export interface StudentClosureInput {
  type: ClosureType;
  effectiveDate: string;
  reason: string;
  tcNumber?: string;
  destination?: string;
  clearance?: string;
  remarks?: string;
}

/**
 * Prior schooling captured at admission (§ admission intake). A Transfer
 * Certificate from the previous institution is a standard admission document.
 */
export interface PreviousInstitution {
  name: string;
  lastClass: string;
  tcNumber: string;
  tcDate: string;
  boardOrUniversity: string;
  yearOfLeaving: string;
  reasonForLeaving: string;
}

export function emptyPreviousInstitution(): PreviousInstitution {
  return { name: '', lastClass: '', tcNumber: '', tcDate: '', boardOrUniversity: '', yearOfLeaving: '', reasonForLeaving: '' };
}

export type Gender = KnownOr<'male' | 'female' | 'other'>;

export const GENDER_LABEL: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

/** A structured residential address (§ biodata). */
export interface StudentAddress {
  line1: string;
  line2: string;
  area: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
}

export function emptyAddress(): StudentAddress {
  return { line1: '', line2: '', area: '', city: '', district: '', state: '', country: 'India', postalCode: '' };
}

/** One line of an address, for compact display. */
export function formatAddress(a: StudentAddress): string {
  return [a.line1, a.line2, a.area, a.city, a.district, a.state, a.country, a.postalCode]
    .filter((part) => part && part.trim())
    .join(', ');
}

/** Health / accessibility / emergency notes — sensitive, authorized views only (§31). */
export interface StudentMedical {
  foodAllergies: string;
  otherAllergies: string;
  accessibility: string;
  emergencyContact: string;
  notes: string;
}

export function emptyMedical(): StudentMedical {
  return { foodAllergies: '', otherAllergies: '', accessibility: '', emergencyContact: '', notes: '' };
}

/** A sibling / family member linked to the student (§ family). */
export interface StudentSibling {
  id: Id;
  name: string;
  relation: string;
  dateOfBirth: string | null;
  institution: string;
  className: string;
}

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
  gender: Gender | '';
  dateOfBirth: string;
  bloodGroup: string;
  email: string;
  phone: string;
  alternatePhone: string;
  rollNo: string;
  admissionNo: string;
  address: StudentAddress;
  courseId: Id;
  batchId: Id;
  section: string;
  status: StudentStatus;
  medical: StudentMedical;
  previousInstitution: PreviousInstitution;
}

export const STUDENT_STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  on_leave: 'On leave',
  completed: 'Completed',
  transferred: 'Transferred',
  withdrawn: 'Withdrawn',
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
/**
 * A parent/guardian linked to a student.
 *
 * The relationship is explicit (`relation`) and — when the backend shares a
 * parent directory — deep-linkable via `parentId` (Student ↔ Parent, not
 * duplicated free text). Contact and professional details are carried so the
 * admin sees the full guardian record from the student's profile.
 */
export interface StudentParentLink {
  id: Id;
  /** Id in the parent directory, when known (§ Student ↔ Parent). */
  parentId: Id | null;
  name: string;
  relation: string;
  phone: string;
  alternatePhone: string;
  email: string;
  occupation: string;
  professionalAddress: string;
  residentialAddress: string;
  isEmergencyContact: boolean;
  guardianStatus: string;
}

export interface StudentDetail {
  id: Id;
  registerNo: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  /** Backend storage URL / data URI; null when no photo is set. */
  photoUrl: string | null;
  status: StudentStatus;
  joiningDate: string;
  courseId: Id;
  course: string;
  courseCode: string;
  batchId: Id;
  batch: string;
  section: string;

  personal: {
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string;
    /** Backend-provided age; the client does not treat it as authoritative. */
    age: number | null;
    gender: Gender | '';
    email: string;
    phone: string;
    alternatePhone: string;
    address: StudentAddress;
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
  siblings: StudentSibling[];
  medical: StudentMedical;
  previousInstitution: PreviousInstitution;
  /** Present only once the admission has been closed (§ admission closure). */
  closure: StudentClosure | null;
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
