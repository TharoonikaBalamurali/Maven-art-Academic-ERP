import { useQuery } from '@tanstack/react-query';
import { useUiStore } from '@/app/state/ui.store';
import { portalService } from '../api/portal.service';

/**
 * Portal hooks (§7, §8).
 *
 * Every scoped query keys on the parent's selected child so switching child
 * re-scopes the whole portal (the selection is view state in the UI store; the
 * backend still authorises access). A student has no selection — the backend
 * returns their own record.
 */
export const portalKeys = {
  all: ['portal'] as const,
  children: () => [...portalKeys.all, 'children'] as const,
  overview: (child: string | null) => [...portalKeys.all, 'overview', child] as const,
  profile: (child: string | null) => [...portalKeys.all, 'profile', child] as const,
  course: (child: string | null) => [...portalKeys.all, 'course', child] as const,
  timetable: (child: string | null) => [...portalKeys.all, 'timetable', child] as const,
  attendance: (child: string | null) => [...portalKeys.all, 'attendance', child] as const,
  progress: (child: string | null) => [...portalKeys.all, 'progress', child] as const,
  fees: (child: string | null) => [...portalKeys.all, 'fees', child] as const,
  payments: (child: string | null) => [...portalKeys.all, 'payments', child] as const,
  certificates: (child: string | null) => [...portalKeys.all, 'certificates', child] as const,
};

function useSelectedChild(): string | null {
  return useUiStore((s) => s.selectedStudentId);
}

export function usePortalChildren() {
  return useQuery({ queryKey: portalKeys.children(), queryFn: ({ signal }) => portalService.children({ signal }) });
}
export function usePortalOverview() {
  const child = useSelectedChild();
  return useQuery({ queryKey: portalKeys.overview(child), queryFn: ({ signal }) => portalService.overview(child, { signal }) });
}
export function usePortalProfile() {
  const child = useSelectedChild();
  return useQuery({ queryKey: portalKeys.profile(child), queryFn: ({ signal }) => portalService.profile(child, { signal }) });
}
export function usePortalCourse() {
  const child = useSelectedChild();
  return useQuery({ queryKey: portalKeys.course(child), queryFn: ({ signal }) => portalService.course(child, { signal }) });
}
export function usePortalTimetable() {
  const child = useSelectedChild();
  return useQuery({ queryKey: portalKeys.timetable(child), queryFn: ({ signal }) => portalService.timetable(child, { signal }) });
}
export function usePortalAttendance() {
  const child = useSelectedChild();
  return useQuery({ queryKey: portalKeys.attendance(child), queryFn: ({ signal }) => portalService.attendance(child, { signal }) });
}
export function usePortalProgress() {
  const child = useSelectedChild();
  return useQuery({ queryKey: portalKeys.progress(child), queryFn: ({ signal }) => portalService.progress(child, { signal }) });
}
export function usePortalFees() {
  const child = useSelectedChild();
  return useQuery({ queryKey: portalKeys.fees(child), queryFn: ({ signal }) => portalService.fees(child, { signal }) });
}
export function usePortalPayments() {
  const child = useSelectedChild();
  return useQuery({ queryKey: portalKeys.payments(child), queryFn: ({ signal }) => portalService.payments(child, { signal }) });
}
export function usePortalCertificates() {
  const child = useSelectedChild();
  return useQuery({ queryKey: portalKeys.certificates(child), queryFn: ({ signal }) => portalService.certificates(child, { signal }) });
}
