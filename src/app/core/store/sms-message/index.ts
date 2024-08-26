import { createFeature } from '@ngrx/store';
import { StoreFeatureKey } from '@core/store/feature.enum';
import { smsMessageReducer } from '@/app/core/store/sms-message/reducers/sms-message.reducers';

export { SmsMessageReducerState } from './types';
export { SmsMessageEffects } from './effects/sms-message.effects';
export { smsMessagePageActions } from './actions/sms-message-page.actions';
export { SmsMessageMemoryCacheService } from './services/sms-message-memory-cache.services';
export * from './reducers/sms-message.reducers';
export * from './selectors/sms-message.selectors';

export const smsMessageFeature = createFeature({
  name: StoreFeatureKey.SMS_MESSAGE,
  reducer: smsMessageReducer
});
