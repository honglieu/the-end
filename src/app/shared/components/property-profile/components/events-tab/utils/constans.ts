import { PayloadCalendarEventType } from '@shared/components/property-profile/interface/property-profile.interface';

export const EVENTS_PAGE_SIZE = 20;
export const DEFAULT_PAGE_INDEX = 0;

export const defaultPayloadCalendarEvent: PayloadCalendarEventType = {
  pageIndex: DEFAULT_PAGE_INDEX,
  pageSize: EVENTS_PAGE_SIZE,
  isPreviousEvent: false,
  propertyId: null,
  isIncludeCancelledAndCloseEvent: false
};
