import { EMessageType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { UserConversation } from '@shared/types/conversation.interface';
import { IMessage } from '@shared/types/message.interface';
import { TaskItem } from '@shared/types/task.interface';
import { EntityState } from '@ngrx/entity';

export interface VoiceMailMessage extends TaskItem {
  type?: EMessageType;
  conversationId?: string;
}

export interface VoiceMailDetailReducerState
  extends EntityState<VoiceMailMessage> {
  fetching: boolean;
  error: unknown;
  task: TaskItem | null;
  messages: IMessage[];
  currentTaskId: string | null;
  currentConversationId: string | null;
}
