import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../api/settings.service';

export const settingsKeys = { all: ['settings'] as const };
export function useSettings() {
  return useQuery({ queryKey: settingsKeys.all, queryFn: ({ signal }) => settingsService.get({ signal }) });
}
