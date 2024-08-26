import { environment } from '@/environments/environment';
import { RouterReducerState, routerReducer } from '@ngrx/router-store';
import { ActionReducer, ActionReducerMap, MetaReducer } from '@ngrx/store';
import { TaskPreviewReducerState, taskPreviewFeature } from './task-preview';
import { StoreFeatureKey } from './feature.enum';
import { MessageReducerState, messageFeature } from './message';
import { ConversationReducerState, conversationFeature } from './conversation';
import { TaskFolderReducerState, taskFolderFeature } from './taskFolder';
import { TaskGroupReducerState, taskGroupFeature } from './task-group';
import { TenantsOwnersReducerState } from './contact-page/tenants-owners/type';
import { supplierFeature } from './contact-page/suppliers';
import { SupplierReducerState } from './contact-page/suppliers/type';
import { otherContactFeature } from './contact-page/other-contact';
import { OtherContactReducerState } from './contact-page/other-contact/type';
import { TenantProspectReducerState } from './contact-page/tenant-prospect/type';
import { tenantProspectFeature } from './contact-page/tenant-prospect';
import { OwnerProspectReducerState } from './contact-page/owner-prospect/type';
import { ownerProspectFeature } from './contact-page/owner-prospect';
import { tenantsOwnersRmFeature } from './contact-page/tenants-owners/rent-manager';
import { tenantsOwnersPtFeature } from './contact-page/tenants-owners/property-tree';
import {
  CalendarDashboardReducerState,
  calendarDashboardFeature
} from './calendar-dashboard';
import { MailFolderReducerState, mailFolderFeature } from './mail-folder';
import { AppMessageReducerState, appMessageFeature } from './app-message';
import { VoiceMailReducerState, voiceMailFeature } from './voice-mail';
import {
  VoiceMailDetailReducerState,
  voiceMailDetailFeature
} from './voice-mail-detail';
import { TaskDetailState, taskDetailFeature } from './task-detail';
import {
  messagesMailFolderFeature,
  MessagesMailFolderReducerState
} from './message-mail-folder';
import { FacebookReducerState, facebookFeature } from './facebook';
import {
  SmsMessageReducerState,
  smsMessageFeature
} from '@/app/core/store/sms-message';
import {
  FacebookDetailReducerState,
  facebookDetailFeature
} from './facebook-detail';
import { WhatsappReducerState, whatsappFeature } from './whatsapp';
import {
  WhatsappDetailReducerState,
  whatsappDetailFeature
} from './whatsapp-detail';

/**
 * As mentioned, we treat each reducer like a table in a database. This means
 * our top level state interface is just a map of keys to inner state types.
 */
export interface RootState {
  router: RouterReducerState;
  [StoreFeatureKey.MESSAGE]: MessageReducerState;
  [StoreFeatureKey.TASK_PREVIEW]: TaskPreviewReducerState;
  [StoreFeatureKey.CONVERSATION]: ConversationReducerState;
  [StoreFeatureKey.TASK_FOLDER]: TaskFolderReducerState;
  [StoreFeatureKey.TASK]: TaskGroupReducerState;
  [StoreFeatureKey.TENANTS_OWNERS_RM]: TenantsOwnersReducerState;
  [StoreFeatureKey.TENANTS_OWNERS_PT]: TenantsOwnersReducerState;
  [StoreFeatureKey.SUPPLIER]: SupplierReducerState;
  [StoreFeatureKey.OTHER_CONTACT]: OtherContactReducerState;
  [StoreFeatureKey.TENANT_PROSPECT]: TenantProspectReducerState;
  [StoreFeatureKey.OWNER_PROSPECT]: OwnerProspectReducerState;
  [StoreFeatureKey.CALENDAR_DASHBOARD]: CalendarDashboardReducerState;
  [StoreFeatureKey.MAIL_FOLDER]: MailFolderReducerState;
  [StoreFeatureKey.APP_MESSAGE]: AppMessageReducerState;
  [StoreFeatureKey.VOICE_MAIL]: VoiceMailReducerState;
  [StoreFeatureKey.VOICE_MAIL_DETAIL]: VoiceMailDetailReducerState;
  [StoreFeatureKey.TASK_DETAIL]: TaskDetailState;
  [StoreFeatureKey.MESSAGE_MAIL_FOLDER]: MessagesMailFolderReducerState;
  [StoreFeatureKey.FACEBOOK]: FacebookReducerState;
  [StoreFeatureKey.FACEBOOK_DETAIL]: FacebookDetailReducerState;
  [StoreFeatureKey.SMS_MESSAGE]: SmsMessageReducerState;
  [StoreFeatureKey.WHATSAPP]: WhatsappReducerState;
  [StoreFeatureKey.WHATSAPP_DETAIL]: WhatsappDetailReducerState;
}

/**
 * Our state is composed of a map of action reducer functions.
 * These reducer functions are called with each dispatched action
 * and the current or initial state and return a new immutable state.
 */
export const rootReducers: ActionReducerMap<RootState> = {
  router: routerReducer,
  [StoreFeatureKey.MESSAGE]: messageFeature.reducer,
  [StoreFeatureKey.TASK_PREVIEW]: taskPreviewFeature.reducer,
  [StoreFeatureKey.CONVERSATION]: conversationFeature.reducer,
  [StoreFeatureKey.TASK_FOLDER]: taskFolderFeature.reducer,
  [StoreFeatureKey.TASK]: taskGroupFeature.reducer,
  [StoreFeatureKey.CALENDAR_DASHBOARD]: calendarDashboardFeature.reducer,
  [StoreFeatureKey.TENANTS_OWNERS_RM]: tenantsOwnersRmFeature.reducer,
  [StoreFeatureKey.TENANTS_OWNERS_PT]: tenantsOwnersPtFeature.reducer,
  [StoreFeatureKey.SUPPLIER]: supplierFeature.reducer,
  [StoreFeatureKey.OTHER_CONTACT]: otherContactFeature.reducer,
  [StoreFeatureKey.TENANT_PROSPECT]: tenantProspectFeature.reducer,
  [StoreFeatureKey.OWNER_PROSPECT]: ownerProspectFeature.reducer,
  [StoreFeatureKey.MAIL_FOLDER]: mailFolderFeature.reducer,
  [StoreFeatureKey.APP_MESSAGE]: appMessageFeature.reducer,
  [StoreFeatureKey.VOICE_MAIL]: voiceMailFeature.reducer,
  [StoreFeatureKey.VOICE_MAIL_DETAIL]: voiceMailDetailFeature.reducer,
  [StoreFeatureKey.TASK_DETAIL]: taskDetailFeature.reducer,
  [StoreFeatureKey.MESSAGE_MAIL_FOLDER]: messagesMailFolderFeature.reducer,
  [StoreFeatureKey.FACEBOOK]: facebookFeature.reducer,
  [StoreFeatureKey.FACEBOOK_DETAIL]: facebookDetailFeature.reducer,
  [StoreFeatureKey.SMS_MESSAGE]: smsMessageFeature.reducer,
  [StoreFeatureKey.WHATSAPP]: whatsappFeature.reducer,
  [StoreFeatureKey.WHATSAPP_DETAIL]: whatsappDetailFeature.reducer
};

// console.log all actions
// export for AOT build
export const loggerMetaReducer = (
  reducer: ActionReducer<RootState>
): ActionReducer<RootState> => {
  return (state, action) => {
    const result = reducer(state, action);
    // console.groupCollapsed(action.type);
    // console.log('prev state', state);
    // console.log('action', action);
    // console.log('next state', result);
    // console.groupEnd();
    return result;
  };
};

/**
 * By default, @ngrx/store uses combineReducers with the reducer map to compose
 * the root meta-reducer. To add more meta-reducers, provide an array of meta-reducers
 * that will be composed to form the root meta-reducer.
 */
export const metaReducers: MetaReducer<RootState>[] = environment.production
  ? []
  : [loggerMetaReducer];
