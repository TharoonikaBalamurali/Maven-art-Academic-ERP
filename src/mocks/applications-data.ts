import type {
  ApplicationAction,
  ApplicationDetail,
  ApplicationListItem,
  ApplicationStage,
} from '@/features/applications/types';
import type { ListQuery, Paginated } from '@/shared/types';
import { createAdmissionFromApplication } from './admissions-data';

/**
 * Applications mock with the review state machine (§16).
 *
 * As with enquiries, the state machine lives here. Each application advertises
 * the actions valid for its stage, and an illegal transition is rejected with
 * 409. Approving an application records an admission reference (the handoff to
 * the Admissions module, §17). In-memory for the session.
 */

interface ApplicationRecord {
  id: string;
  applicant: string;
  email: string;
  phone: string;
  programme: string;
  priorEducation: string;
  portfolioUrl: string;
  stage: ApplicationStage;
  submittedAt: string | null;
  enquiryId: string | null;
  decisionNote: string | null;
  admissionId: string | null;
}

function make(
  id: string,
  applicant: string,
  programme: string,
  stage: ApplicationStage,
  submittedAt: string | null,
  enquiryId: string | null = null,
): ApplicationRecord {
  return {
    id,
    applicant,
    email: `${applicant.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    phone: '+91 90000 00000',
    programme,
    priorEducation: 'Higher Secondary (Arts)',
    portfolioUrl: 'https://portfolio.example.com/' + id,
    stage,
    submittedAt,
    enquiryId,
    decisionNote: null,
    admissionId: stage === 'approved' ? 'adm-500' : null,
  };
}

function buildStore(): ApplicationRecord[] {
  return [
    make('app-120', 'Ritika Sharma', 'Visual Communication & Design', 'submitted', '2026-08-17'),
    make('app-119', 'Yusuf Ali', 'Sculpture & Ceramics', 'under_review', '2026-08-16'),
    make('app-118', 'Neha Krishnan', 'Bachelor of Fine Arts', 'approved', '2026-08-14'),
    make('app-117', 'Sameer Joshi', 'Animation & Motion Design', 'rejected', '2026-08-13'),
    make('app-116', 'Anjali Deshmukh', 'Photography', 'draft', null),
    make('app-115', 'Rohan Gupta', 'Visual Communication & Design', 'under_review', '2026-08-12'),
    make('app-114', 'Fatima Sheikh', 'Bachelor of Fine Arts', 'submitted', '2026-08-11'),
  ];
}

let store = buildStore();

export function resetApplications(): void {
  store = buildStore();
}

/** The state machine — the sole source of which actions a stage permits. */
function availableActions(stage: ApplicationStage): ApplicationAction[] {
  switch (stage) {
    case 'draft':
      return ['submit'];
    case 'submitted':
      return ['start_review'];
    case 'under_review':
      return ['approve', 'reject'];
    case 'approved':
    case 'rejected':
    default:
      return [];
  }
}

function toListItem(record: ApplicationRecord): ApplicationListItem {
  return {
    id: record.id,
    applicant: record.applicant,
    programme: record.programme,
    stage: record.stage,
    submittedAt: record.submittedAt,
  };
}

function toDetail(record: ApplicationRecord): ApplicationDetail {
  return {
    id: record.id,
    applicant: record.applicant,
    email: record.email,
    phone: record.phone,
    programme: record.programme,
    priorEducation: record.priorEducation,
    portfolioUrl: record.portfolioUrl,
    stage: record.stage,
    submittedAt: record.submittedAt,
    enquiryId: record.enquiryId,
    availableActions: availableActions(record.stage),
    decisionNote: record.decisionNote,
    admissionId: record.admissionId,
  };
}

export function listApplications(query: ListQuery): Paginated<ApplicationListItem> {
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
      const av = a.submittedAt ?? '';
      const bv = b.submittedAt ?? '';
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export type ApplicationResult =
  | { kind: 'ok'; detail: ApplicationDetail }
  | { kind: 'not_found' }
  | { kind: 'conflict' };

export function getApplication(id: string): ApplicationDetail | null {
  const record = store.find((a) => a.id === id);
  return record ? toDetail(record) : null;
}

export function transitionApplication(id: string, action: ApplicationAction, note?: string): ApplicationResult {
  const record = store.find((a) => a.id === id);
  if (!record) return { kind: 'not_found' };
  if (!availableActions(record.stage).includes(action)) return { kind: 'conflict' };

  switch (action) {
    case 'submit':
      record.stage = 'submitted';
      record.submittedAt = new Date().toISOString().slice(0, 10);
      break;
    case 'start_review':
      record.stage = 'under_review';
      break;
    case 'approve':
      record.stage = 'approved';
      record.decisionNote = note?.trim() || null;
      // §16 → §17 handoff: approval creates the admission record and links it.
      record.admissionId = createAdmissionFromApplication({
        applicant: record.applicant,
        email: record.email,
        phone: record.phone,
        programme: record.programme,
        applicationId: record.id,
      });
      break;
    case 'reject':
      record.stage = 'rejected';
      record.decisionNote = note?.trim() || null;
      break;
    default:
      return { kind: 'conflict' };
  }
  return { kind: 'ok', detail: toDetail(record) };
}
