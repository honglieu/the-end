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
  eventType: EEventType;
  eventStatus?: EEventStatus;
  id: string;
  isLinked: boolean | null;
  startTime: string;
  taskId: string;
}
export interface ICalendarEventResponse {
  date: string;
  events: ICalendarEventSelection[];
}

export interface ICalendarEventSelection extends ICalendarEvent {
  isChecked: boolean;
}

export interface ITaskLinkCalendarEventResponse {
  message: string;
  events: ITaskLinkCalendarEvent[];
}
