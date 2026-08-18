import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * TBD — BACKEND CONTRACT: notification categories are listed in §25 but the
 * authoritative set comes from the backend, so the type stays open.
 */
export type NotificationCategory = KnownOr<
  'attendance' | 'fees' | 'academic' | 'admission' | 'system'
>;

export interface Notification {
  id: Id;
  category: NotificationCategory;
  title: string;
  body: string;
  read: boolean;
  createdAt: IsoDateString;
}
