import { EMessageType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { TaskItem } from '@shared/types/task.interface';
import { EntityState } from '@ngrx/entity';
import { IFacebookMessage } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';

export interface FacebookMessage extends TaskItem {
  type?: EMessageType;
  conversationId?: string;
}

export interface FacebookDetailReducerState
  extends EntityState<FacebookMessage> {
  fetching: boolean;
  error: unknown;
  task: TaskItem | null;
  messages: IFacebookMessage[];
  currentTaskId: string | null;
  currentConversationId: string | null;
}
