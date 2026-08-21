import type { AnnouncementAudience, AnnouncementDetail, AnnouncementInput, AnnouncementListItem, AnnouncementStatus } from '@/features/announcements/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Announcements mock (§ communication).
 *
 * The backend decides delivery: creating with a `scheduledFor` date yields a
 * scheduled announcement, otherwise it publishes immediately and reports the
 * recipient count. In-memory for the session.
 */
interface AnnouncementRecord {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  publishedAt: string | null;
  scheduledFor: string | null;
  author: string;
  recipients: number | null;
}

const AUDIENCE_REACH: Record<string, number> = { all: 268, students: 134, parents: 96, faculty: 4, staff: 12 };

function buildStore(): AnnouncementRecord[] {
  return [
    { id: 'ann-501', title: 'Annual Day — 28 August', body: 'The academy’s annual function will be held on 28 August in the main studio. Students participating in the exhibition should submit their pieces by 25 August.', audience: 'all', status: 'published', publishedAt: '2026-08-18', scheduledFor: null, author: 'Aarthi Ramesh', recipients: 268 },
    { id: 'ann-502', title: 'Fee installment 2 due 15 September', body: 'The second fee installment for the 2026–27 academic year is due on 15 September. Payment can be made online through the parent portal.', audience: 'parents', status: 'published', publishedAt: '2026-08-15', scheduledFor: null, author: 'Devi Krishnan', recipients: 96 },
    { id: 'ann-503', title: 'Studio maintenance — 30 August', body: 'Studio 2 will be closed for maintenance on 30 August. Affected sessions move to Studio 1.', audience: 'students', status: 'scheduled', publishedAt: null, scheduledFor: '2026-08-27', author: 'Aarthi Ramesh', recipients: null },
    { id: 'ann-504', title: 'Faculty development workshop', body: 'A two-day pedagogy workshop is planned for the first week of September. Details to follow.', audience: 'faculty', status: 'draft', publishedAt: null, scheduledFor: null, author: 'Aarthi Ramesh', recipients: null },
  ];
}

const store = buildStore();
let seq = 505;

function toListItem(r: AnnouncementRecord): AnnouncementListItem {
  return { id: r.id, title: r.title, audience: r.audience, status: r.status, date: r.publishedAt ?? r.scheduledFor, author: r.author };
}

export function listAnnouncements(query: ListQuery): Paginated<AnnouncementListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const status = String(query.filters?.status ?? '');
  const audience = String(query.filters?.audience ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store.map(toListItem).filter((r) => {
    if (search && !r.title.toLowerCase().includes(search)) return false;
    if (status && r.status !== status) return false;
    if (audience && r.audience !== audience) return false;
    return true;
  }).sort((a, b) => {
    const av = a.date ?? '';
    const bv = b.date ?? '';
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getAnnouncement(id: string): AnnouncementDetail | null {
  const r = store.find((a) => a.id === id);
  return r ? { ...r } : null;
}

/** Creates an announcement. The backend publishes now, or schedules if dated. */
export function createAnnouncement(input: AnnouncementInput, author: string): AnnouncementDetail {
  const id = `ann-${seq}`;
  seq += 1;
  const scheduled = Boolean(input.scheduledFor);
  const record: AnnouncementRecord = {
    id,
    title: input.title.trim(),
    body: input.body.trim(),
    audience: input.audience,
    status: scheduled ? 'scheduled' : 'published',
    publishedAt: scheduled ? null : new Date().toISOString().slice(0, 10),
    scheduledFor: scheduled ? (input.scheduledFor ?? null) : null,
    author,
    recipients: scheduled ? null : (AUDIENCE_REACH[input.audience] ?? 0),
  };
  store.unshift(record);
  return { ...record };
}

/** Dashboard rollup. */
export function announcementCounts() {
  return {
    active: store.filter((a) => a.status === 'published').length,
    scheduled: store.filter((a) => a.status === 'scheduled').length,
    drafts: store.filter((a) => a.status === 'draft').length,
  };
}
