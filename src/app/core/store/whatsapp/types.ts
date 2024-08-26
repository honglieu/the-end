import { EMessageType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { TaskItem } from '@shared/types/task.interface';
import { EntityState } from '@ngrx/entity';
import { IWhatsappQueryParams } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';

export interface WhatsappMessage extends TaskItem {
  type?: EMessageType;
  conversationId?: string;
}

export interface WhatsappReducerState extends EntityState<WhatsappMessage> {
  total: number;
  fetching: boolean;
  fetchingMore: boolean;
  error: unknown;
  scrollTopIndex: number | null;
  scrollBottomIndex: number | null;
  payload: Partial<IWhatsappQueryParams>;
}
