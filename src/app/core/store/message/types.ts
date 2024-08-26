import {
  EMessageType,
  IMessageQueryParams
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { TaskItem } from '@shared/types/task.interface';
import { EntityState } from '@ngrx/entity';

export interface Message extends TaskItem {
  type?: EMessageType;
  conversationId?: string;
  messageDate?: string;
}

export interface MessageReducerState extends EntityState<Message> {
  total: number;
  fetching: boolean;
  fetchingMore: boolean;
  error: unknown;
  scrollTopIndex: number | null;
  scrollBottomIndex: number | null;
  payload: Partial<IMessageQueryParams>;
}
