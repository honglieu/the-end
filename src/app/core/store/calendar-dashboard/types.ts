import {
  ICalendarEvent,
  ICalendarEventParam,
  ICalendarResponse
} from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { GroupType } from '@shared/enum';
import { EntityState } from '@ngrx/entity';

export interface CalendarEventRawData extends ICalendarResponse {}

export interface CalendarEvent extends ICalendarEvent {
  date: string;
  type: GroupType;
}
export interface CalendarDashboardReducerState
  extends EntityState<CalendarEvent> {
  total: number;
  fetching: boolean;
  error: unknown;
  events: Array<CalendarEvent>;
  rawData: Array<CalendarEventRawData>;
  payload: Partial<ICalendarEventParam>;
}
