import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  CalendarEvent,
  CalendarDashboardReducerState
} from '@core/store/calendar-dashboard/types';
import { calendarDashboardPageActions } from '@core/store/calendar-dashboard/actions/calendar-dashboard-page.actions';
import { calendarDashboardApiActions } from '@core/store/calendar-dashboard/actions/calendar-dashboard-api.actions';
import { calendarDashboardActions } from '@core/store/calendar-dashboard/actions/calendar-dashboard.actions';

export const CalendarDashboardEntityAdapter: EntityAdapter<CalendarEvent> =
  createEntityAdapter<CalendarEvent>({
    selectId: (event: CalendarEvent) => event.date
  });

const initialState: CalendarDashboardReducerState =
  CalendarDashboardEntityAdapter.getInitialState({
    total: 0,
    fetchingMore: false,
    fetching: true,
    error: null,
    events: [],
    rawData: [],
    payload: {
      startDate: '',
      endDate: '',
      pageIndex: '',
      pageSize: '',
      search: '',
      filter: {
        eventTypes: [],
        propertyManagerIds: [],
        agencyIds: []
      },
      date: ''
    }
  });
export const CalendarDashboardReducer = createReducer(
  initialState,
  on(calendarDashboardPageActions.payloadChange, (state, { payload }) => {
    return {
      ...state,
      payload,
      fetching: true
    };
  }),
  on(calendarDashboardActions.setAll, (state, { events }) => {
    if (!events) {
      return {
        ...state,
        events: null,
        payload: null,
        fetching: false
      };
    }
    return { ...state, events };
  }),
  on(
    calendarDashboardActions.increaseTotalLinkedTask,
    (state, { listEventId }) => {
      const data = state.events.map((event) => {
        if (listEventId.includes(event.id)) {
          return {
            ...event,
            totalLinkedTask: event.totalLinkedTask + 1
          };
        }
        return event;
      });
      return { ...state, events: data };
    }
  ),
  on(
    calendarDashboardApiActions.getCalendarDashboardSuccess,
    (state, { events, rawData }) => {
      return { ...state, events, rawData, fetching: false };
    }
  ),
  on(
    calendarDashboardApiActions.getCalendarEventsFailure,
    (state, { error }) => {
      // handle error
      return { ...state, events: [], error, fetching: false };
    }
  ),
  on(calendarDashboardPageActions.exitPage, (_state) => initialState),
  on(
    calendarDashboardApiActions.getCacheCalendarDashboardSuccess,
    (state, { events, rawData }) => {
      if (!events?.length) {
        return state;
      }
      return { ...state, events, rawData, fetching: false };
    }
  )
);
