import { UserConversation } from '@shared/types/conversation.interface';
import { TaskItem } from '@shared/types/task.interface';
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { StepDetail } from '@/app/task-detail/modules/steps/utils/stepType';
export const taskDetailActions = createActionGroup({
  source: 'Task Detail',
  events: {
    'Set Current Task Id': props<{
      taskId: string;
    }>(),
    'Set Current Conversation Id': props<{
      conversationId: string;
    }>(),
    'Get Task Detail Success': props<{ taskDetail: TaskItem }>(),
    'Get Cache Task Detail Success': props<{ taskDetail: TaskItem }>(),
    'Get Task Detail Failure': props<{ error: unknown }>(),
    'Get Cache Workflow Success': props<{
      trudiResponse: TaskItem['trudiResponse'];
    }>(),
    'Get Cache Conversation Success': props<{
      conversations: Partial<UserConversation>[];
    }>(),
    'Update Task Detail': props<{ taskDetail: TaskItem }>(),
    'Update Workflow': props<{
      trudiResponse: TaskItem['trudiResponse'];
    }>(),
    'Update Conversations': props<{
      conversations: Partial<UserConversation>[];
      taskId?: string;
    }>(),
    'Exit Task Detail': emptyProps(),
    'Get List Steps Success': props<{ listSteps: StepDetail[] }>(),
    'Get List Steps': props<{ taskId: string }>()
  }
});
