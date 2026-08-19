import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { timetableService } from '../api/timetable.service';
import type { TimetableQuery } from '../api/timetable.contract';

export const timetableKeys = {
  all: ['timetable'] as const,
  list: (query: TimetableQuery) => [...timetableKeys.all, 'list', query] as const,
  options: () => [...timetableKeys.all, 'options'] as const,
};

export function useTimetable(query: TimetableQuery) {
  return useQuery({
    queryKey: timetableKeys.list(query),
    queryFn: ({ signal }) => timetableService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useTimetableOptions() {
  return useQuery({
    queryKey: timetableKeys.options(),
    queryFn: ({ signal }) => timetableService.options({ signal }),
    staleTime: 5 * 60_000,
  });
}
