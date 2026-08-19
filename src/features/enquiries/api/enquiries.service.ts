import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { EnquiryAction, EnquiryDetail, EnquiryListItem } from '../types';
import { enquiriesContract, type FollowupInput } from './enquiries.contract';

export const enquiriesService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<EnquiryListItem>> {
    return apiClient.call(enquiriesContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(enquiryId: Id, options?: RequestOptions): Promise<EnquiryDetail> {
    return apiClient.call(enquiriesContract.get, { params: { enquiryId }, options });
  },
  addFollowup(enquiryId: Id, input: FollowupInput, options?: RequestOptions): Promise<EnquiryDetail> {
    return apiClient.call(enquiriesContract.addFollowup, { params: { enquiryId }, body: input, options });
  },
  /** Runs a state transition the backend advertised in `availableActions`. */
  transition(enquiryId: Id, action: Exclude<EnquiryAction, 'log_followup'>, options?: RequestOptions): Promise<EnquiryDetail> {
    const endpointForAction = {
      convert: enquiriesContract.convert,
      close: enquiriesContract.close,
      reopen: enquiriesContract.reopen,
    } as const;
    const contract = endpointForAction[action as 'convert' | 'close' | 'reopen'];
    return apiClient.call(contract, { params: { enquiryId }, options });
  },
};
