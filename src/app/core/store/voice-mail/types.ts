import { EMessageType } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { IVoiceMailQueryParams } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { TaskItem } from '@shared/types/task.interface';
import { EntityState } from '@ngrx/entity';

export interface VoiceMailMessage extends TaskItem {
  type?: EMessageType;
  conversationId?: string;
}

export interface VoiceMailReducerState extends EntityState<VoiceMailMessage> {
  total: number;
  fetching: boolean;
  fetchingMore: boolean;
  error: unknown;
  scrollTopIndex: number | null;
  scrollBottomIndex: number | null;
  payload: Partial<IVoiceMailQueryParams>;
}
