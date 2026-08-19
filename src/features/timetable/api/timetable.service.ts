import { apiClient } from '@/lib/api';
import type { RequestOptions } from '@/shared/types';
import type { TimetableOptions, TimetableSlot } from '../types';
import { timetableContract, type TimetableQuery } from './timetable.contract';

export const timetableService = {
  list(query: TimetableQuery, options?: RequestOptions): Promise<TimetableSlot[]> {
    return apiClient.call(timetableContract.list, { query, options });
  },

  options(options?: RequestOptions): Promise<TimetableOptions> {
    return apiClient.call(timetableContract.options, { options });
  },
};
