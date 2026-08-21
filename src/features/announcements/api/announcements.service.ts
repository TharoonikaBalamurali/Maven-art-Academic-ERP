import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { AnnouncementDetail, AnnouncementInput, AnnouncementListItem } from '../types';
import { announcementsContract } from './announcements.contract';

export const announcementsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<AnnouncementListItem>> {
    return apiClient.call(announcementsContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(announcementId: Id, options?: RequestOptions): Promise<AnnouncementDetail> {
    return apiClient.call(announcementsContract.get, { params: { announcementId }, options });
  },
  create(input: AnnouncementInput, options?: RequestOptions): Promise<AnnouncementDetail> {
    return apiClient.call(announcementsContract.create, { body: input, options });
  },
};
