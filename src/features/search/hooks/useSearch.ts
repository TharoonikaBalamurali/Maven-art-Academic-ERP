import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchService } from '../api/search.service';

export const searchKeys = {
  all: ['search'] as const,
  query: (q: string) => [...searchKeys.all, q] as const,
};

/**
 * Global record search. Disabled below two characters so the backend is not
 * queried on every keystroke; `keepPreviousData` avoids a flash between terms.
 */
export function useSearch(term: string) {
  const q = term.trim();
  return useQuery({
    queryKey: searchKeys.query(q),
    queryFn: ({ signal }) => searchService.query(q, { signal }),
    enabled: q.length >= 2,
    placeholderData: keepPreviousData,
  });
}
