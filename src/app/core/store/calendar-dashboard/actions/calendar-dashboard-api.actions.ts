import { createActionGroup, props } from '@ngrx/store';
import {
  CalendarEvent,
  CalendarEventRawData
} from '@core/store/calendar-dashboard/types';
import { ICalendarEventParam } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
export const calendarDashboardApiActions = createActionGroup({
  source: 'Calendar Dashboard API',
  events: {
    'Get Calendar Dashboard Success': props<{
      events?: Array<CalendarEvent>;
      rawData?: CalendarEventRawData[];
      payload?: ICalendarEventParam;
    }>(),
    'Get Cache Calendar Dashboard Success': props<{
      events?: Array<CalendarEvent>;
      rawData?: CalendarEventRawData[];
      payload?: ICalendarEventParam;
    }>(),
    'Get New Page Success': props<{
      events?: Array<CalendarEvent>;
      total?: number;
      currentPage?: number;
      payload?: ICalendarEventParam;
    }>(),
    'Get Calendar Events Failure': props<{ error: unknown }>()
  }
});
