import { EMessageType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { TaskItem } from '@shared/types/task.interface';
import { EntityState } from '@ngrx/entity';
import { IWhatsappMessage } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';

export interface WhatsappMessage extends TaskItem {
  type?: EMessageType;
  conversationId?: string;
}

export interface WhatsappDetailReducerState
  extends EntityState<WhatsappMessage> {
  fetching: boolean;
  error: unknown;
  task: TaskItem | null;
  messages: IWhatsappMessage[];
  currentTaskId: string | null;
  currentConversationId: string | null;
}
