import { Injectable } from '@angular/core';
import { TaskItem } from '@shared/types/task.interface';
import { BehaviorSubject, Subject, filter } from 'rxjs';
import { TaskStatusType, TaskStatusTypeLC } from '@shared/enum/task.enum';
import { TaskService } from './task.service';
import { EConversationAction } from '@shared/enum/messageType.enum';
import { UserConversation } from '@shared/types/conversation.interface';

interface HeaderState {
  title: string;
  currentTask?: TaskItem;
  currentStatus?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HeaderService {
  public headerState$ = new BehaviorSubject<HeaderState>({
    title: ''
  });
  isOpenNotificationList = new BehaviorSubject<boolean>(false);
  isSendBulkMessage = new BehaviorSubject<boolean>(false);
  private conversationAction = new BehaviorSubject<{
    option: EConversationAction | string;
    taskId?: string;
    isTriggeredFromRightPanel?: boolean;
    isTriggeredFromToolbar?: boolean;
    messageIds?: string[];
    conversationId?: string;
    conversationIds?: string[];
  }>(null);
  public triggerDisallowReassignProperty$ = new Subject<{
    isDisallowReassignProperty: boolean;
    matchesConversationType: Partial<UserConversation>;
  }>();

  constructor(private taskService: TaskService) {}

  get conversationAction$() {
    return this.conversationAction
      .asObservable()
      .pipe(filter((conversationAction) => !!conversationAction));
  }

  get conversationActionValue() {
    return this.conversationAction.getValue();
  }

  setConversationAction(action: {
    option: EConversationAction | string;
    taskId?: string;
    isTriggeredFromRightPanel?: boolean;
    isTriggeredFromToolbar?: boolean;
    messageIds?: string[];
    conversationId?: string;
    conversationIds?: string[];
  }) {
    this.conversationAction.next(action);
  }

  setHeaderState(state: HeaderState) {
    this.headerState$.next(state);
  }

  resetHeaderState() {
    this.headerState$.next({
      ...this.headerState$.getValue(),
      currentTask: null
    });
  }

  moveCurrentTaskToInprogress() {
    const currentTask = this.taskService.currentTask$.getValue();
    this.headerState$.next({
      ...this.headerState$.value,
      currentStatus: TaskStatusTypeLC.inprogress,
      currentTask: {
        ...this.headerState$.value.currentTask,
        status: TaskStatusType.inprogress
      }
    });
    if (currentTask && currentTask.status !== TaskStatusType.inprogress) {
      this.taskService.currentTask$.next({
        ...this.taskService.currentTask$.getValue(),
        status: TaskStatusType.inprogress
      });
    }
  }
  setIsSendBulkMessage(state: boolean) {
    this.isSendBulkMessage.next(state);
  }

  getIsSendBulkMessage() {
    return this.isSendBulkMessage.getValue();
  }
}
