import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ListQuery, SortDirection } from '@/shared/types';

export interface ListQueryStateOptions {
  defaultLimit?: number;
  defaultSortBy?: string;
  defaultSortDir?: SortDirection;
  /** Filter keys this list understands; anything else in the URL is ignored. */
  filterKeys?: readonly string[];
}

export interface ListQueryState {
  query: ListQuery;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setSort: (sort: { sortBy: string; sortDir: SortDirection }) => void;
  setFilter: (key: string, value: string) => void;
  clear: () => void;
  isFiltered: boolean;
}

/**
 * Server-driven list state, stored in the URL (§31, §32).
 *
 * Keeping page/search/sort/filters in the query string means a filtered table
 * is shareable and survives reload and back-navigation, and it gives React
 * Query a natural cache key. This hook produces the `ListQuery` that services
 * send to the backend — the browser never receives the full dataset.
 */
export function useListQueryState(options: ListQueryStateOptions = {}): ListQueryState {
  const { defaultLimit = 10, defaultSortBy, defaultSortDir = 'desc', filterKeys = [] } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo<ListQuery>(() => {
    const filters: Record<string, string> = {};
    for (const key of filterKeys) {
      const value = searchParams.get(key);
      if (value) filters[key] = value;
    }

    const parsedPage = Number(searchParams.get('page') ?? '1');
    const sortDir = searchParams.get('sortDir');

    return {
      page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
      limit: defaultLimit,
      search: searchParams.get('search') ?? '',
      sortBy: searchParams.get('sortBy') ?? defaultSortBy,
      sortDir: sortDir === 'asc' || sortDir === 'desc' ? sortDir : defaultSortDir,
      filters,
    };
  }, [searchParams, filterKeys, defaultLimit, defaultSortBy, defaultSortDir]);

  const update = useCallback(
    (mutate: (params: URLSearchParams) => void, { resetPage = true } = {}) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          mutate(next);
          // Any change to search/filter/sort invalidates the current page number.
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (page: number) =>
      update(
        (params) => {
          if (page <= 1) params.delete('page');
          else params.set('page', String(page));
        },
        { resetPage: false },
      ),
    [update],
  );

  const setSearch = useCallback(
    (search: string) =>
      update((params) => {
        if (search) params.set('search', search);
        else params.delete('search');
      }),
    [update],
  );

  const setSort = useCallback(
    (sort: { sortBy: string; sortDir: SortDirection }) =>
      update((params) => {
        params.set('sortBy', sort.sortBy);
        params.set('sortDir', sort.sortDir);
      }),
    [update],
  );

  const setFilter = useCallback(
    (key: string, value: string) =>
      update((params) => {
        if (value) params.set(key, value);
        else params.delete(key);
      }),
    [update],
  );

  const clear = useCallback(() => setSearchParams(new URLSearchParams(), { replace: true }), [
    setSearchParams,
  ]);

  const isFiltered =
    Boolean(query.search) || Object.values(query.filters ?? {}).some((value) => Boolean(value));

  return { query, setPage, setSearch, setSort, setFilter, clear, isFiltered };
}
