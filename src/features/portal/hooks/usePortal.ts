import { useQuery } from '@tanstack/react-query';
import { portalService } from '../api/portal.service';

export const portalKeys = {
  all: ['portal'] as const,
  overview: () => [...portalKeys.all, 'overview'] as const,
  profile: () => [...portalKeys.all, 'profile'] as const,
};

export function usePortalOverview() {
  return useQuery({ queryKey: portalKeys.overview(), queryFn: ({ signal }) => portalService.overview({ signal }) });
}
export function usePortalProfile() {
  return useQuery({ queryKey: portalKeys.profile(), queryFn: ({ signal }) => portalService.profile({ signal }) });
}
