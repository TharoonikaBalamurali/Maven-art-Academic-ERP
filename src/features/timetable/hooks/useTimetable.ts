import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TimetableSlotInput } from '../types';
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

/** Scheduling mutations (§ scheduling) — all gated on `timetable.manage`. */
export function useScheduleClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TimetableSlotInput) => timetableService.create(input),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: timetableKeys.all }); },
  });
}

export function useUpdateClass(slotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TimetableSlotInput) => timetableService.update(slotId, input),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: timetableKeys.all }); },
  });
}

export function useRemoveClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => timetableService.remove(slotId),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: timetableKeys.all }); },
  });
}
