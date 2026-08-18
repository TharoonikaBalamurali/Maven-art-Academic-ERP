import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Id } from '@/shared/types';
import { attendanceService } from '../api/attendance.service';
import type { AttendanceSubmission } from '../types';

export const attendanceKeys = {
  all: ['attendance'] as const,
  classes: () => [...attendanceKeys.all, 'classes'] as const,
  roster: (classId: Id) => [...attendanceKeys.all, 'roster', classId] as const,
};

export function useTodaysClasses() {
  return useQuery({
    queryKey: attendanceKeys.classes(),
    queryFn: ({ signal }) => attendanceService.todaysClasses({ signal }),
    staleTime: 30_000,
  });
}

export function useAttendanceRoster(classId: Id) {
  return useQuery({
    queryKey: attendanceKeys.roster(classId),
    queryFn: ({ signal }) => attendanceService.roster(classId, { signal }),
    enabled: classId.length > 0,
  });
}

export function useSubmitAttendance(classId: Id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (submission: AttendanceSubmission) => attendanceService.submit(classId, submission),
    onSuccess: (roster) => {
      queryClient.setQueryData(attendanceKeys.roster(classId), roster);
      // The class list carries a "marked" flag that just changed.
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.classes() });
    },
  });
}
