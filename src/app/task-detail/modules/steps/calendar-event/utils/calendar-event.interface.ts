import { EEventType } from '@shared/enum/calendar.enum';

export interface ICalendarEvent {
  reason: string;
  date: string;
  taskId: string;
  eventId?: string;
  stepType: string;
  eventType: string | EEventType;
  detailReason?: string;
}
export interface IInputToUpdateStatusCalendarEvent {
  taskId: string;
  eventId: string;
}
