import { IMessageQueryParams } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { UserConversation } from '@shared/types/conversation.interface';
import { IMessage } from '@shared/types/message.interface';
import { Property } from '@shared/types/property.interface';
import { EntityState } from '@ngrx/entity';

export interface IConversationMessage extends IMessage {}

export interface IConversationGroupMessage {
  timestamp: 'string';
  messages: IConversationMessage[];
}

export interface IConversationEntity extends EntityState<IConversationMessage> {
  id: string;
  currentConversation: UserConversation;
  totalPage: number;
  total: number;
  fetching: boolean;
  fetchingMore: boolean;
  error: unknown;
  groupMessage: IConversationGroupMessage[];
  actionDetail?: any; // any fix later
  currentProperty: Property;
  payload: Partial<IMessageQueryParams>;
}

export interface ConversationReducerState
  extends EntityState<IConversationEntity> {
  currentConversationId: string;
}
