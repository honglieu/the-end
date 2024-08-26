import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { CalendarDashboardReducer } from './reducers/calendar-dashboard.reducers';

export { CalendarDashboardReducerState } from './types';
export { CalendarDashboardEffects } from './effects/calendar-dashboard.effects';
export { calendarDashboardPageActions } from './actions/calendar-dashboard-page.actions';
export { CalendarDashboardCacheService } from './services/calendar-dashboard-memory-cache.service';
export * from './reducers/calendar-dashboard.reducers';
export * from './selectors/calendar-dashboard.selectors';

export const calendarDashboardFeature = createFeature({
  name: StoreFeatureKey.CALENDAR_DASHBOARD,
  reducer: CalendarDashboardReducer
});
