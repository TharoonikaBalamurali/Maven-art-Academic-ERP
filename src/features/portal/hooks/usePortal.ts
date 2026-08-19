import { useQuery } from '@tanstack/react-query';
import { portalService } from '../api/portal.service';

export const portalKeys = {
  all: ['portal'] as const,
  overview: () => [...portalKeys.all, 'overview'] as const,
  profile: () => [...portalKeys.all, 'profile'] as const,
  course: () => [...portalKeys.all, 'course'] as const,
  timetable: () => [...portalKeys.all, 'timetable'] as const,
  attendance: () => [...portalKeys.all, 'attendance'] as const,
  progress: () => [...portalKeys.all, 'progress'] as const,
  fees: () => [...portalKeys.all, 'fees'] as const,
  payments: () => [...portalKeys.all, 'payments'] as const,
  certificates: () => [...portalKeys.all, 'certificates'] as const,
};

export function usePortalOverview() { return useQuery({ queryKey: portalKeys.overview(), queryFn: ({ signal }) => portalService.overview({ signal }) }); }
export function usePortalProfile() { return useQuery({ queryKey: portalKeys.profile(), queryFn: ({ signal }) => portalService.profile({ signal }) }); }
export function usePortalCourse() { return useQuery({ queryKey: portalKeys.course(), queryFn: ({ signal }) => portalService.course({ signal }) }); }
export function usePortalTimetable() { return useQuery({ queryKey: portalKeys.timetable(), queryFn: ({ signal }) => portalService.timetable({ signal }) }); }
export function usePortalAttendance() { return useQuery({ queryKey: portalKeys.attendance(), queryFn: ({ signal }) => portalService.attendance({ signal }) }); }
export function usePortalProgress() { return useQuery({ queryKey: portalKeys.progress(), queryFn: ({ signal }) => portalService.progress({ signal }) }); }
export function usePortalFees() { return useQuery({ queryKey: portalKeys.fees(), queryFn: ({ signal }) => portalService.fees({ signal }) }); }
export function usePortalPayments() { return useQuery({ queryKey: portalKeys.payments(), queryFn: ({ signal }) => portalService.payments({ signal }) }); }
export function usePortalCertificates() { return useQuery({ queryKey: portalKeys.certificates(), queryFn: ({ signal }) => portalService.certificates({ signal }) }); }
