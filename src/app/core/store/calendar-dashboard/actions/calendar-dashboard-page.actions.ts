import { ICalendarEventParam } from '@/app/dashboard/modules/calendar-dashboard/interfaces/calendar-dashboard.interface';
import { EScrollStatus } from '@/app/dashboard/modules/calendar-dashboard/modules/calendar-list-view/calendar-list-view.component';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const calendarDashboardPageActions = createActionGroup({
  source: 'Calendar Dashboard Page',
  events: {
    'Enter Page': emptyProps(),
    'Exit Page': emptyProps(),
    'Page Change': props<{
      pageSize: number;
      pageIndex: number;
      scrollStatus?: EScrollStatus;
    }>(),
    'Payload Change': props<{ payload: ICalendarEventParam }>()
  }
});
