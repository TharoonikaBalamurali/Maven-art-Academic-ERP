import { apiClient } from '@/lib/api';
import type { RequestOptions } from '@/shared/types';
import type { TimetableOptions, TimetableSlot, TimetableSlotInput } from '../types';
import { timetableContract, type TimetableQuery } from './timetable.contract';

export const timetableService = {
  list(query: TimetableQuery, options?: RequestOptions): Promise<TimetableSlot[]> {
    return apiClient.call(timetableContract.list, { query, options });
  },

  options(options?: RequestOptions): Promise<TimetableOptions> {
    return apiClient.call(timetableContract.options, { options });
  },
  create(input: TimetableSlotInput, options?: RequestOptions): Promise<TimetableSlot> {
    return apiClient.call(timetableContract.create, { body: input, options });
  },
  update(slotId: string, input: TimetableSlotInput, options?: RequestOptions): Promise<TimetableSlot> {
    return apiClient.call(timetableContract.update, { params: { slotId }, body: input, options });
  },
  remove(slotId: string, options?: RequestOptions): Promise<{ ok: true }> {
    return apiClient.call(timetableContract.remove, { params: { slotId }, options });
  },
};
