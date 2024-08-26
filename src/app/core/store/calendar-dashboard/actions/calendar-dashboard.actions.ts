import { createActionGroup, props } from '@ngrx/store';
import { CalendarEvent } from '@core/store/calendar-dashboard/types';

export const calendarDashboardActions = createActionGroup({
  source: 'Calendar Dashboard',
  events: {
    'Set All': props<{ events: CalendarEvent[] }>(),
    'Increase Total Linked Task': props<{ listEventId: string[] }>()
  }
});
