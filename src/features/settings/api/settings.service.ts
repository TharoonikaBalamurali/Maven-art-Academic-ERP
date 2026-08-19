import { apiClient } from '@/lib/api';
import type { RequestOptions } from '@/shared/types';
import type { Settings } from '../types';
import { settingsContract } from './settings.contract';

export const settingsService = {
  get(options?: RequestOptions): Promise<Settings> {
    return apiClient.call(settingsContract.get, { options });
  },
};
