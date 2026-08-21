import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { announcementsService } from '../api/announcements.service';
import type { AnnouncementInput } from '../types';

export const announcementKeys = {
  all: ['announcements'] as const,
  list: (query: ListQuery) => [...announcementKeys.all, 'list', query] as const,
  detail: (id: Id) => [...announcementKeys.all, 'detail', id] as const,
};

export function useAnnouncements(query: ListQuery) {
  return useQuery({ queryKey: announcementKeys.list(query), queryFn: ({ signal }) => announcementsService.list(query, { signal }), placeholderData: keepPreviousData });
}
export function useAnnouncement(id: Id) {
  return useQuery({ queryKey: announcementKeys.detail(id), queryFn: ({ signal }) => announcementsService.get(id, { signal }), enabled: id.length > 0 });
}
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnnouncementInput) => announcementsService.create(input),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: announcementKeys.all }); },
  });
}
