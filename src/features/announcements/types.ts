import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Announcement types (§ communication).
 *
 * The backend owns publication and delivery — which audiences receive an
 * announcement, and when a scheduled one goes out. The frontend composes and
 * requests publication; it never delivers anything itself.
 *
 * TBD — BACKEND CONTRACT: status/audience names and the delivery model are provisional.
 */
export type AnnouncementStatus = KnownOr<'published' | 'scheduled' | 'draft' | 'archived'>;
export type AnnouncementAudience = KnownOr<'all' | 'students' | 'parents' | 'faculty' | 'staff'>;

export const ANNOUNCEMENT_STATUS_LABEL: Record<string, string> = {
  published: 'Published',
  scheduled: 'Scheduled',
  draft: 'Draft',
  archived: 'Archived',
};

export const ANNOUNCEMENT_AUDIENCE_LABEL: Record<string, string> = {
  all: 'Everyone',
  students: 'Students',
  parents: 'Parents',
  faculty: 'Faculty',
  staff: 'Staff',
};

export interface AnnouncementListItem {
  id: Id;
  title: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  /** Publication date, or the scheduled date when not yet published. */
  date: IsoDateString | null;
  author: string;
}

export interface AnnouncementDetail {
  id: Id;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  publishedAt: IsoDateString | null;
  scheduledFor: IsoDateString | null;
  author: string;
  /** Backend-reported delivery count; the client never computes reach. */
  recipients: number | null;
}

/** What an author submits to create an announcement. */
export interface AnnouncementInput {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  /** ISO date; when present the backend schedules rather than publishes. */
  scheduledFor?: string;
}
