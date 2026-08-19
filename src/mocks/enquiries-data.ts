import type {
  EnquiryAction,
  EnquiryDetail,
  EnquiryFollowup,
  EnquiryListItem,
  EnquiryStage,
} from '@/features/enquiries/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Enquiries mock with the admissions state machine (§15–§18).
 *
 * The state machine lives HERE, in the backend mock — not in the UI. Each
 * enquiry advertises the actions currently valid for its stage
 * (`availableActions`), and a transition is rejected with 409 if it is not
 * legal from the current stage. The frontend only ever offers the actions the
 * backend advertises, so it can never drive an illegal transition.
 *
 * In-memory for the session (demonstration data).
 */

interface EnquiryRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  programme: string;
  source: string;
  stage: EnquiryStage;
  receivedAt: string;
  followups: EnquiryFollowup[];
  applicationId: string | null;
}

const seed = (
  id: string,
  name: string,
  programme: string,
  stage: EnquiryStage,
  receivedAt: string,
  source: string,
  followups: EnquiryFollowup[] = [],
): EnquiryRecord => ({
  id,
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
  phone: '+91 90000 00000',
  programme,
  source,
  stage,
  receivedAt,
  followups,
  applicationId: stage === 'converted' ? 'app-900' : null,
});

function buildStore(): EnquiryRecord[] {
  return [
    seed('enq-041', 'Ishita Malhotra', 'Bachelor of Fine Arts', 'new', '2026-08-18', 'Website'),
    seed('enq-040', 'Dev Patel', 'Animation & Motion Design', 'contacted', '2026-08-17', 'Instagram', [
      { id: 'fu-1', note: 'Called; interested in the portfolio requirements.', author: 'Aarthi Ramesh', at: '2026-08-17T11:00:00.000Z' },
    ]),
    seed('enq-039', 'Sara Thomas', 'Photography', 'new', '2026-08-17', 'Walk-in'),
    seed('enq-038', 'Aryan Kapoor', 'Visual Communication & Design', 'qualified', '2026-08-15', 'Referral', [
      { id: 'fu-2', note: 'Portfolio reviewed, strong candidate.', author: 'Meera Nair', at: '2026-08-16T09:30:00.000Z' },
    ]),
    seed('enq-037', 'Kabir Nanda', 'Sculpture & Ceramics', 'contacted', '2026-08-14', 'Website'),
    seed('enq-036', 'Nisha Rao', 'Bachelor of Fine Arts', 'converted', '2026-08-12', 'Website', [
      { id: 'fu-3', note: 'Converted to application after counselling.', author: 'Aarthi Ramesh', at: '2026-08-13T14:00:00.000Z' },
    ]),
    seed('enq-035', 'Tom Varghese', 'Photography', 'closed', '2026-08-10', 'Instagram', [
      { id: 'fu-4', note: 'Decided to defer to next intake.', author: 'Aarthi Ramesh', at: '2026-08-11T10:00:00.000Z' },
    ]),
  ];
}

let store = buildStore();
let applicationSeq = 901;

/** Test hook: restore the enquiries store to its seeded state. */
export function resetEnquiries(): void {
  store = buildStore();
  applicationSeq = 901;
}

/** The state machine — the single source of which actions a stage permits. */
function availableActions(stage: EnquiryStage): EnquiryAction[] {
  switch (stage) {
    case 'new':
    case 'contacted':
    case 'qualified':
      return ['log_followup', 'convert', 'close'];
    case 'closed':
      return ['reopen'];
    case 'converted':
    default:
      return [];
  }
}

function lastActivity(record: EnquiryRecord): string {
  return record.followups.at(-1)?.at ?? record.receivedAt;
}

function toListItem(record: EnquiryRecord): EnquiryListItem {
  return {
    id: record.id,
    name: record.name,
    programme: record.programme,
    stage: record.stage,
    receivedAt: record.receivedAt,
    lastActivityAt: lastActivity(record),
  };
}

function toDetail(record: EnquiryRecord): EnquiryDetail {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    programme: record.programme,
    source: record.source,
    stage: record.stage,
    receivedAt: record.receivedAt,
    availableActions: availableActions(record.stage),
    followups: [...record.followups].sort((a, b) => b.at.localeCompare(a.at)),
    applicationId: record.applicationId,
  };
}

export function listEnquiries(query: ListQuery): Paginated<EnquiryListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const stage = String(query.filters?.stage ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store
    .map(toListItem)
    .filter((row) => {
      if (search && !row.name.toLowerCase().includes(search) && !row.programme.toLowerCase().includes(search)) {
        return false;
      }
      if (stage && row.stage !== stage) return false;
      return true;
    })
    .sort((a, b) => (sortDir === 'asc' ? a.receivedAt.localeCompare(b.receivedAt) : b.receivedAt.localeCompare(a.receivedAt)));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export type EnquiryResult =
  | { kind: 'ok'; detail: EnquiryDetail }
  | { kind: 'not_found' }
  | { kind: 'conflict' };

export function getEnquiry(id: string): EnquiryDetail | null {
  const record = store.find((e) => e.id === id);
  return record ? toDetail(record) : null;
}

export function addFollowup(id: string, note: string, author: string): EnquiryResult {
  const record = store.find((e) => e.id === id);
  if (!record) return { kind: 'not_found' };
  record.followups.push({ id: `fu-${Date.now()}`, note, author, at: new Date().toISOString() });
  // A follow-up on a brand-new enquiry advances it to "contacted".
  if (record.stage === 'new') record.stage = 'contacted';
  return { kind: 'ok', detail: toDetail(record) };
}

export function transitionEnquiry(id: string, action: EnquiryAction): EnquiryResult {
  const record = store.find((e) => e.id === id);
  if (!record) return { kind: 'not_found' };

  // The transition must be one the current stage actually permits (§15).
  if (!availableActions(record.stage).includes(action)) return { kind: 'conflict' };

  switch (action) {
    case 'convert':
      record.stage = 'converted';
      record.applicationId = `app-${applicationSeq}`;
      applicationSeq += 1;
      break;
    case 'close':
      record.stage = 'closed';
      break;
    case 'reopen':
      record.stage = 'new';
      break;
    default:
      return { kind: 'conflict' };
  }
  return { kind: 'ok', detail: toDetail(record) };
}
