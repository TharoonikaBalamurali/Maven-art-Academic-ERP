import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../api/dashboard.service';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
};

/**
 * The signed-in user's role-scoped dashboard summary (§13).
 *
 * The backend decides which shape to return from the session, so the hook takes
 * no role argument — the component narrows on the discriminant it receives.
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: ({ signal }) => dashboardService.summary({ signal }),
    // Operational figures should feel current without hammering the backend.
    staleTime: 60_000,
  });
}
