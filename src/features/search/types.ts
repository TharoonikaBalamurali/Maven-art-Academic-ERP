import type { Id, KnownOr } from '@/shared/types';

/**
 * Global search (§ search).
 *
 * One endpoint returns records across the domains the caller may read; the
 * backend decides which kinds to include based on the caller's permissions and
 * scopes every result. The frontend never searches a local array — this is a
 * server-driven query (§31).
 *
 * TBD — BACKEND CONTRACT: result kinds and field names are provisional.
 */
export type SearchKind = KnownOr<'student' | 'faculty' | 'course' | 'batch'>;

export const SEARCH_KIND_LABEL: Record<string, string> = {
  student: 'Students',
  faculty: 'Faculty',
  course: 'Courses',
  batch: 'Batches',
};

/**
 * One result. `title` and `subtitle` are display-ready; the identifier fields
 * let a student row show what an administrator actually searches by.
 */
export interface SearchResult {
  id: Id;
  kind: SearchKind;
  title: string;
  subtitle: string;
  /** Route to the record. */
  to: string;
  /** Student identifiers — present on student results. */
  registerNo?: string;
  admissionNo?: string;
  rollNo?: string;
  /** Backend-provided photo URL; null/absent renders initials. */
  photoUrl?: string | null;
  /** Display status, e.g. "Active". */
  status?: string;
}

export interface SearchResponse {
  results: SearchResult[];
}
