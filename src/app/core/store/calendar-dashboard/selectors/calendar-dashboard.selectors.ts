import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CalendarDashboardReducerState } from '@core/store/calendar-dashboard/types';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { CalendarDashboardEntityAdapter } from '@core/store/calendar-dashboard/reducers/calendar-dashboard.reducers';

export const selectCalendarEventState =
  createFeatureSelector<CalendarDashboardReducerState>(
    StoreFeatureKey.CALENDAR_DASHBOARD
  );

export const {
  selectIds: selectCalendarEventIds,
  selectAll: selectAllCalendarEvent,
  selectEntities: selectCalendarEventEntities
} = CalendarDashboardEntityAdapter.getSelectors(selectCalendarEventState);

export const selectCalendarEvents = createSelector(
  selectCalendarEventState,
  (state) => state.events
);

export const selectCalendarEventPayload = createSelector(
  selectCalendarEventState,
  (state) => state.payload
);
export const selectCalendarEventRawData = createSelector(
  selectCalendarEventState,
  (state) => state.rawData
);

export const selectFetchingCalendarEvent = createSelector(
  selectCalendarEventState,
  (state) => state.fetching
);
