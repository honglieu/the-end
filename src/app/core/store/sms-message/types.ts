import { IMessageQueryParams } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { EntityState } from '@ngrx/entity';
import { Message } from '@core/store/message/types';

export interface SmsMessageReducerState extends EntityState<Message> {
  total: number;
  fetching: boolean;
  fetchingMore: boolean;
  error: unknown;
  scrollTopIndex: number | null;
  scrollBottomIndex: number | null;
  payload: Partial<IMessageQueryParams>;
  tempMessage: Message;
}
