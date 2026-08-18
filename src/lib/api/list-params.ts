import type { ListQuery } from '@/shared/types';

/**
 * Flattens a `ListQuery` into the flat query-string shape list endpoints
 * expect: top-level `page/limit/search/sortBy/sortDir` plus each filter as its
 * own parameter. Shared by every server-driven list so search, sort, filter
 * and pagination are encoded identically across the ERP (§31, §32).
 */
export function toListParams(
  query: ListQuery,
): Record<string, string | number | boolean | undefined> {
  const { filters, ...rest } = query;
  return { ...rest, ...(filters ?? {}) };
}
