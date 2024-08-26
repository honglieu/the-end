import { Injectable } from '@angular/core';
import { TaskItem } from '@shared/types/task.interface';
import {
  EMPTY,
  Observable,
  Subject,
  filter,
  firstValueFrom,
  takeUntil,
  tap
} from 'rxjs';
import { ConversationService } from '@/app/services/conversation.service';
import { TaskService } from '@/app/services/task.service';
import { TaskStatusType } from '@shared/enum/task.enum';
import { EConversationType } from '@shared/enum/conversationType.enum';

import {
  EConversationAction,
  EMessageType
} from '@shared/enum/messageType.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  IFlagUrgentMessageResponse,
  IMarkAsUnreadResponse,
  MenuOption
} from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { LoadingService } from '@/app/services/loading.service';
import { HeaderService } from '@/app/services/header.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { PreviewConversation } from '@shared/types/conversation.interface';
import { SyncMessagePropertyTreeService } from '@/app/services/sync-message-property-tree.service';

@Injectable({
  providedIn: 'root'
})
export class WhatsappMenuService {
  private destroy$ = new Subject<void>();
  private currentMailboxId: string;
  public moveToFolderId: string;
  public isDragDropMessage: boolean = false;

  get isSelectedMove() {
    return this.inboxToolbarService.hasItem;
  }

  constructor(
    private readonly taskService: TaskService,
    private readonly conversationService: ConversationService,
    private readonly loadingService: LoadingService,
    private readonly inboxService: InboxService,
    private readonly headerService: HeaderService,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly syncMessagePropertyTreeService: SyncMessagePropertyTreeService
  ) {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.destroy$),
        filter((mailBoxId) => !!mailBoxId)
      )
      .subscribe((mailBoxId) => {
        this.currentMailboxId = mailBoxId;
      });
  }

  handleMenuChange(
    event: {
      message?: TaskItem;
      messages?: TaskItem[];
      option?: MenuOption;
      messageIds?: string[];
      isFromTaskDetail?: boolean;
      targetFolderName?: string;
      conversationId?: string;
    },
    conversation?: PreviewConversation
  ) {
    const { message, option, isFromTaskDetail, conversationId } = event;
    const currentConversation =
      conversation ||
      message.conversations?.find(
        (conversation) => conversation.id === conversationId
      ) ||
      message.conversations[0];
    switch (option) {
      case MenuOption.REOPEN:
        return this.handleReOpenMessage(message, currentConversation);

      case MenuOption.RESOLVE:
        return this.handleResolveMessage(message, currentConversation);

      case MenuOption.READ:
        return this.handleMessageAction(
          message,
          EConversationAction.MARK_AS_READ,
          currentConversation
        );

      case MenuOption.UNREAD:
        return this.handleMessageAction(
          message,
          EConversationAction.MARK_AS_UNREAD,
          currentConversation
        );

      case MenuOption.UN_FLAG:
      case MenuOption.FLAG:
        return this.handleMessageAction(
          message,
          EConversationAction.UPDATE_FLAG_URGENT,
          currentConversation
        );
      case MenuOption.SAVE_TO_PROPERTY_TREE:
        return this.handleMessageAction(
          message,
          EConversationAction.SAVE_TO_PROPERTY_TREE,
          currentConversation
        );
      case MenuOption.DOWNLOAD_AS_PDF:
        return this.handleMessageAction(
          message,
          EConversationAction.DOWNLOAD_AS_PDF,
          currentConversation
        );

      default:
        return Promise.resolve();
    }
  }

  private handleReOpenMessage(
    message: TaskItem,
    currentConversation: PreviewConversation
  ) {
    const conversation = currentConversation;
    if (!conversation) {
      return null;
    }
    const tasksData = {
      id: message.id,
      conversationId: message.conversationId || conversation.id, // message.conversationId for case right click, conversation.id for case btn reopen detail
      taskType: message.taskType
    };
    const actionObservable = this.taskService.changeTaskStatusMultiple(
      [tasksData],
      TaskStatusType.inprogress
    );
    return firstValueFrom(actionObservable.pipe(takeUntil(this.destroy$)));
  }

  private handleReopenMessageTaskDetail(
    currentConversation: PreviewConversation
  ) {
    this.conversationService.activeOptionsID$.next('');
    const currentTaskStatus = this.taskService.currentTask$.value?.status;
    const currentTaskId = this.taskService.currentTaskId$.getValue();

    return firstValueFrom(
      this.taskService.changeTaskStatus(currentTaskId, currentTaskStatus).pipe(
        takeUntil(this.destroy$),
        tap((value) => {
          const conversation = currentConversation;
          const summaryMsg = '';
          this.loadingService.onLoading();

          this.conversationService
            .updateStatus(
              EConversationType.open,
              conversation?.id,
              conversation?.isSendFromEmail,
              summaryMsg
            )
            .subscribe((res) => {
              if (res) {
                this.taskService.currentTask$.next({
                  ...this.taskService.getCurrentTask(),
                  status: currentTaskStatus
                });
                this.headerService.headerState$.next({
                  ...this.headerService.headerState$.value,
                  currentTask: {
                    ...this.headerService.headerState$.value?.currentTask,
                    status: currentTaskStatus
                  },
                  currentStatus: currentTaskStatus
                });
                this.conversationService.currentUserChangeConversationStatus(
                  EMessageType.open
                );
                this.conversationService.setUpdatedConversation(
                  value.id,
                  EConversationType.open
                );
                this.conversationService.reloadConversationList.next(true);
                this.loadingService.stopLoading();
              }
            });
        })
      )
    );
  }

  private handleResolveMessage(
    message,
    currentConversation: PreviewConversation
  ) {
    const conversation = currentConversation;
    const isSendFromEmail = conversation['isSendFromEmail'] || false;
    if (!conversation) {
      return null;
    }
    const summaryMsg = '';
    const actionObservable = this.conversationService.updateStatus(
      EConversationType.resolved,
      conversation?.id,
      isSendFromEmail,
      summaryMsg
    );
    return firstValueFrom(actionObservable.pipe(takeUntil(this.destroy$)));
  }

  public handleMessageAction(
    message: TaskItem,
    actionType: EConversationAction,
    currentConversation: PreviewConversation
  ) {
    const conversation = currentConversation;
    if (!conversation) {
      return null;
    }
    let actionObservable: Observable<
      IFlagUrgentMessageResponse | IMarkAsUnreadResponse
    >;

    switch (actionType) {
      case EConversationAction.UPDATE_FLAG_URGENT:
        actionObservable = this.conversationService.updateFlagUrgent(
          conversation?.id
        );
        break;
      case EConversationAction.MARK_AS_READ:
        actionObservable = this.conversationService.markAsReadConversation(
          conversation.id,
          this.currentMailboxId
        );
        break;
      case EConversationAction.MARK_AS_UNREAD:
        actionObservable = this.conversationService.markAsUnread(
          conversation.id
        );
        break;
      case EConversationAction.SAVE_TO_PROPERTY_TREE:
        this.syncMessagePropertyTreeService.setTriggerSyncMessagePT([message]);
        actionObservable = EMPTY;
        break;
      case EConversationAction.DOWNLOAD_AS_PDF:
        this.syncMessagePropertyTreeService.setTriggerSyncMessagePT(
          [message],
          true
        );
        actionObservable = EMPTY;
        break;
      default:
        break;
    }

    return firstValueFrom(actionObservable.pipe(takeUntil(this.destroy$)));
  }
}
