import type {
  AdmissionAction,
  AdmissionDetail,
  AdmissionListItem,
  AdmissionStage,
} from '@/features/admissions/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Admissions mock with the offer state machine (§17).
 *
 * An admission is created when an application is approved (§16) — see
 * `createAdmissionFromApplication`, the in-session handoff. From `offered` the
 * institution confirms the seat and then enrols the applicant, creating an
 * enrollment (§18). The state machine lives here; the UI only reflects the
 * advertised `availableActions`, and an illegal transition is rejected with 409.
 * In-memory for the session.
 */

interface AdmissionRecord {
  id: string;
  applicant: string;
  email: string;
  phone: string;
  programme: string;
  stage: AdmissionStage;
  offeredAt: string | null;
  applicationId: string | null;
  note: string | null;
  enrollmentId: string | null;
}

function make(
  id: string,
  applicant: string,
  programme: string,
  stage: AdmissionStage,
  offeredAt: string | null,
  applicationId: string | null,
  enrollmentId: string | null = null,
): AdmissionRecord {
  return {
    id,
    applicant,
    email: `${applicant.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    phone: '+91 90000 00000',
    programme,
    stage,
    offeredAt,
    applicationId,
    note: null,
    enrollmentId,
  };
}

function buildStore(): AdmissionRecord[] {
  return [
    make('adm-500', 'Neha Krishnan', 'Bachelor of Fine Arts', 'offered', '2026-08-14', 'app-118'),
    make('adm-499', 'Meera Pillai', 'Sculpture & Ceramics', 'offered', '2026-08-12', 'app-108'),
    make('adm-497', 'Kabir Menon', 'Visual Communication & Design', 'confirmed', '2026-08-10', 'app-105'),
    make('adm-496', 'Arjun Reddy', 'Bachelor of Fine Arts', 'confirmed', '2026-08-08', 'app-103'),
    make('adm-495', 'Aisha Rahman', 'Photography', 'enrolled', '2026-08-06', 'app-101', 'enr-330'),
    make('adm-493', 'Vikram Nair', 'Animation & Motion Design', 'cancelled', '2026-08-03', 'app-098'),
  ];
}

let store = buildStore();
let admissionSeq = 601;
let enrollmentSeq = 331;

export function resetAdmissions(): void {
  store = buildStore();
  admissionSeq = 601;
  enrollmentSeq = 331;
}

/** The state machine — the sole source of which actions a stage permits. */
function availableActions(stage: AdmissionStage): AdmissionAction[] {
  switch (stage) {
    case 'offered':
      return ['confirm', 'cancel'];
    case 'confirmed':
      return ['enroll', 'cancel'];
    case 'enrolled':
    case 'cancelled':
    default:
      return [];
  }
}

function toListItem(record: AdmissionRecord): AdmissionListItem {
  return {
    id: record.id,
    applicant: record.applicant,
    programme: record.programme,
    stage: record.stage,
    offeredAt: record.offeredAt,
  };
}

function toDetail(record: AdmissionRecord): AdmissionDetail {
  return {
    id: record.id,
    applicant: record.applicant,
    email: record.email,
    phone: record.phone,
    programme: record.programme,
    stage: record.stage,
    offeredAt: record.offeredAt,
    applicationId: record.applicationId,
    availableActions: availableActions(record.stage),
    note: record.note,
    enrollmentId: record.enrollmentId,
  };
}

export function listAdmissions(query: ListQuery): Paginated<AdmissionListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const stage = String(query.filters?.stage ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store
    .map(toListItem)
    .filter((row) => {
      if (search && !row.applicant.toLowerCase().includes(search) && !row.programme.toLowerCase().includes(search)) {
        return false;
      }
      if (stage && row.stage !== stage) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a.offeredAt ?? '';
      const bv = b.offeredAt ?? '';
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export type AdmissionResult =
  | { kind: 'ok'; detail: AdmissionDetail }
  | { kind: 'not_found' }
  | { kind: 'conflict' };

export function getAdmission(id: string): AdmissionDetail | null {
  const record = store.find((a) => a.id === id);
  return record ? toDetail(record) : null;
}

export function transitionAdmission(id: string, action: AdmissionAction, note?: string): AdmissionResult {
  const record = store.find((a) => a.id === id);
  if (!record) return { kind: 'not_found' };
  if (!availableActions(record.stage).includes(action)) return { kind: 'conflict' };

  switch (action) {
    case 'confirm':
      record.stage = 'confirmed';
      record.note = note?.trim() || record.note;
      break;
    case 'enroll':
      record.stage = 'enrolled';
      record.note = note?.trim() || record.note;
      record.enrollmentId = `enr-${enrollmentSeq}`;
      enrollmentSeq += 1;
      break;
    case 'cancel':
      record.stage = 'cancelled';
      record.note = note?.trim() || null;
      break;
    default:
      return { kind: 'conflict' };
  }
  return { kind: 'ok', detail: toDetail(record) };
}

/**
 * The §16 → §17 handoff: approving an application creates an admission in the
 * `offered` stage and returns its id. Called by the applications mock so the
 * approved application's `adm-…` link resolves to a real admission this session.
 */
export function createAdmissionFromApplication(input: {
  applicant: string;
  email: string;
  phone: string;
  programme: string;
  applicationId: string;
}): string {
  const id = `adm-${admissionSeq}`;
  admissionSeq += 1;
  store.unshift({
    id,
    applicant: input.applicant,
    email: input.email,
    phone: input.phone,
    programme: input.programme,
    stage: 'offered',
    offeredAt: new Date().toISOString().slice(0, 10),
    applicationId: input.applicationId,
    note: null,
    enrollmentId: null,
  });
  return id;
}
