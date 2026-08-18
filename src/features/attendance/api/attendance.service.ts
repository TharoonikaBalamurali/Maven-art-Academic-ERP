import { apiClient } from '@/lib/api';
import type { Id, RequestOptions } from '@/shared/types';
import type { AttendanceClass, AttendanceRoster, AttendanceSubmission } from '../types';
import { attendanceContract } from './attendance.contract';

export const attendanceService = {
  todaysClasses(options?: RequestOptions): Promise<AttendanceClass[]> {
    return apiClient.call(attendanceContract.todaysClasses, { options });
  },

  roster(classId: Id, options?: RequestOptions): Promise<AttendanceRoster> {
    return apiClient.call(attendanceContract.roster, { params: { classId }, options });
  },

  submit(classId: Id, submission: AttendanceSubmission, options?: RequestOptions): Promise<AttendanceRoster> {
    return apiClient.call(attendanceContract.submit, {
      params: { classId },
      body: submission,
      options,
    });
  },
};
