import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Id, ListQuery } from '@/shared/types';
import { enquiriesService } from '../api/enquiries.service';
import type { EnquiryAction, EnquiryDetail } from '../types';

export const enquiryKeys = {
  all: ['enquiries'] as const,
  list: (query: ListQuery) => [...enquiryKeys.all, 'list', query] as const,
  detail: (id: Id) => [...enquiryKeys.all, 'detail', id] as const,
};

export function useEnquiries(query: ListQuery) {
  return useQuery({
    queryKey: enquiryKeys.list(query),
    queryFn: ({ signal }) => enquiriesService.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useEnquiry(id: Id) {
  return useQuery({
    queryKey: enquiryKeys.detail(id),
    queryFn: ({ signal }) => enquiriesService.get(id, { signal }),
    enabled: id.length > 0,
  });
}

/** Writes the updated enquiry back into the cache so the actions/timeline refresh. */
function onUpdated(queryClient: ReturnType<typeof useQueryClient>, id: Id, detail: EnquiryDetail) {
  queryClient.setQueryData(enquiryKeys.detail(id), detail);
  void queryClient.invalidateQueries({ queryKey: enquiryKeys.all });
}

export function useAddFollowup(id: Id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => enquiriesService.addFollowup(id, { note }),
    onSuccess: (detail) => onUpdated(queryClient, id, detail),
  });
}

export function useEnquiryTransition(id: Id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: Exclude<EnquiryAction, 'log_followup'>) => enquiriesService.transition(id, action),
    onSuccess: (detail) => onUpdated(queryClient, id, detail),
  });
}
