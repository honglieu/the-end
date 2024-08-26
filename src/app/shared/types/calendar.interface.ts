import { EHistoricalEventStatus } from '@shared/enum/calendar.enum';
import { EPropertyStatus } from '@shared/enum/user.enum';

export interface PublicHoliday {
  date: string;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  name: string;
  regionId: string;
  typeRepeat: string;
}

export interface LinkedTask {
  id: string;
  eventName: string;
  evenDate: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAd: string;
  decision: string;
}

export interface LinkedTaskListDataType {
  completedTasks: LinkedTask[];
  eventDate: string;
  eventName: string;
  eventStatus: string;
  status?: string;
  id: string;
  inprogressTasks: LinkedTask[];
  streetline?: string;
  eventType?: string;
  startTime?: string;
  endTime?: string;
  propertyStatus?: EPropertyStatus;
  defaultTime?: string;
  propertyId?: string;
  createdAt?: string;
  updatedAd?: string;
  ptStatus?: string;
  inspectionStatus?: string;
}

export interface IEventChangeHistoryResponse {
  eventChangeHistory: IHistoricalEvent[];
}

export interface IHistoricalEvent {
  eventDate: string;
  createdAt: string;
  status: EHistoricalEventStatus;
  startTime: string | null;
  endTime: string | null;
}

export interface ICalendarEventFilterTask {
  eventType: string;
  title: string;
}

export interface ISelectedCalendarEventId {
  eventType: string[];
  startDate: string;
  endDate: string;
}
