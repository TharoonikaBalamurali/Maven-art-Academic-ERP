import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { EnquiryDetail, EnquiryListItem } from '../types';

export interface FollowupInput {
  note: string;
}

/**
 * Enquiries contract (§15).
 *
 * The transition endpoints (convert, close, reopen) carry no body — the backend
 * decides whether the transition is legal from the current state and rejects it
 * (409) otherwise. The client never encodes the state machine.
 *
 * TBD — BACKEND CONTRACT: provisional paths.
 */
export const enquiriesContract = {
  list: endpoint<void, Paginated<EnquiryListItem>, ListQuery>({
    method: 'GET',
    path: '/enquiries',
    auth: true,
    permission: 'enquiries.view',
  }),
  get: endpoint<void, EnquiryDetail>({
    method: 'GET',
    path: '/enquiries/:enquiryId',
    auth: true,
    permission: 'enquiries.view',
  }),
  addFollowup: endpoint<FollowupInput, EnquiryDetail>({
    method: 'POST',
    path: '/enquiries/:enquiryId/followups',
    auth: true,
    permission: 'enquiries.update',
  }),
  convert: endpoint<void, EnquiryDetail>({
    method: 'POST',
    path: '/enquiries/:enquiryId/convert',
    auth: true,
    permission: 'enquiries.update',
  }),
  close: endpoint<void, EnquiryDetail>({
    method: 'POST',
    path: '/enquiries/:enquiryId/close',
    auth: true,
    permission: 'enquiries.update',
  }),
  reopen: endpoint<void, EnquiryDetail>({
    method: 'POST',
    path: '/enquiries/:enquiryId/reopen',
    auth: true,
    permission: 'enquiries.update',
  }),
} as const;
