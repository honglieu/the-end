import {
  PreviewConversation,
  UserConversation
} from '@shared/types/conversation.interface';
import { TaskItem } from '@shared/types/task.interface';
import { EntityState } from '@ngrx/entity';
export interface TaskConversationState
  extends EntityState<PreviewConversation> {}

export interface TaskDetailState {
  data: TaskItem | null;
  conversations: Partial<UserConversation>[];
  currentTaskId: string | null;
  currentConversationId: string | null;
  workflow: TaskItem['trudiResponse'] | null;
}
