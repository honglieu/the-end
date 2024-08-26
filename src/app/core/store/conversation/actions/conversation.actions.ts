import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  IConversationMessage,
  IConversationEntity
} from '@core/store/conversation/types';
import { IMessageQueryParams } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';

export const conversationActions = createActionGroup({
  source: 'Conversations Page',
  events: {
    'Set All Conversation Messages': props<{
      id: string;
      conversations: IConversationMessage[];
    }>(),
    'Set Current Conversation': props<{
      id: string;
      conversation: IConversationEntity['currentConversation'];
    }>(),
    'Set Group Message': props<{
      id: string;
      groupMessage: IConversationEntity['groupMessage'];
    }>(),
    'Set Action Detail': props<{
      id: string;
      actionDetail: IConversationEntity['actionDetail'];
    }>(),
    'Set Current Property': props<{
      id: string;
      property: IConversationEntity['currentProperty'];
    }>(),
    'Update Conversation State': props<{
      id: string;
      state: Partial<IConversationEntity>;
    }>(),
    'Clear Conversation': props<{ id: string }>()
  }
});

export const conversationPageActions = createActionGroup({
  source: 'Conversations Page',
  events: {
    'Enter Page': emptyProps(),
    'Exit Page': props<{ id: string }>(),
    'Next Page': emptyProps(),
    'Prev Page': emptyProps(),
    'Payload Change': props<{ payload: IMessageQueryParams }>(),
    'Load Conversation State': props<{
      id: string;
      conversation?: IConversationEntity['currentConversation'];
    }>(),
    'Set Current Conversation Id': props<{ id: string }>()
  }
});

export const conversationApiActions = createActionGroup({
  source: 'Conversations API',
  events: {
    'Get Messages Success': props<{
      conversations?: Array<IConversationMessage>;
      total?: number;
      currentPage?: number;
      payload?: IMessageQueryParams;
    }>(),
    'Get Conversation Failure': props<{ error: unknown }>()
  }
});
