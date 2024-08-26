import { EMessageType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { TaskItem } from '@shared/types/task.interface';
import { EntityState } from '@ngrx/entity';
import { IFacebookQueryParams } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';

export interface FacebookMessage extends TaskItem {
  type?: EMessageType;
  conversationId?: string;
}

export interface FacebookReducerState extends EntityState<FacebookMessage> {
  total: number;
  fetching: boolean;
  fetchingMore: boolean;
  error: unknown;
  scrollTopIndex: number | null;
  scrollBottomIndex: number | null;
  payload: Partial<IFacebookQueryParams>;
}
