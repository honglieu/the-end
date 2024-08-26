import { EEventStatus, EEventType } from '@shared/enum/calendar.enum';

export interface ICalendarEvent {
  endTime: string;
  eventDate: string;
  eventName: string;
  eventType: string;
  id: string;
  isLinked: boolean | null;
  startTime: string;
}
export interface ITaskLinkCalendarEvent {
  endTime: string;
  eventDate: string;
  expired?: number;
  eventName: string;
  eventNameDisplay?: string;
  eventType: EEventType;
  eventStatus?: EEventStatus;
  id: string;
  isLinked: boolean | null;
  startTime: string;
  taskId: string;
  defaultTime?: string;
  isShowDropdown?: boolean;
}
export interface ICalendarEventResponse {
  date: string;
  events: ICalendarEvent[];
}
export interface ITaskLinkCalendarEventResponse {
  message: string;
  events: ITaskLinkCalendarEvent[];
}
