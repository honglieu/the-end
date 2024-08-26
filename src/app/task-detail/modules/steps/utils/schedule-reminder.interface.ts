import { EEventStatus } from '@shared/enum/calendar.enum';

export interface ICalendarEvent {
  endTime: string;
  eventDate: string;
  eventName: string;
  eventType: string;
  id: string;
  isLinked: boolean | null;
  startTime: string;
  eventStatus?: EEventStatus;
}

export interface ITaskLinkCalendarEvent extends ICalendarEvent {
  title?: string;
  eventStatus?: EEventStatus;
  eventTime?: string;
  taskId?: string;
  expired?: number;
  checked?: boolean;
}
