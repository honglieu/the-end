import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { ComponentRef, Injectable, Injector } from '@angular/core';
import { ComponentPortal } from '@angular/cdk/portal';
import { CreateNewTaskPopUpComponent } from '@/app/share-pop-up/create-new-task-pop-up/create-new-task-pop-up.component';
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
import {
  CreateTaskByCateOpenFrom,
  InjectFrom
} from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EConversationType } from '@shared/enum/conversationType.enum';

import {
  EConversationAction,
  EMessageType
} from '@shared/enum/messageType.enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { CreateNewTaskPopUpService } from '@/app/share-pop-up/create-new-task-pop-up/services/create-new-task-pop-up.service';
import {
  IFlagUrgentMessageResponse,
  IMarkAsUnreadResponse,
  MenuOption
} from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { LoadingService } from '@services/loading.service';
import { HeaderService } from '@services/header.service';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { AddVoiceMailToTaskModalComponent } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/components/add-voice-mail-to-task-modal/add-voice-mail-to-task-modal.component';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { ToastrService } from 'ngx-toastr';
import { EPropertyStatus, SocketType } from '@shared/enum';
import {
  IListConvertMultipleTask,
  PreviewConversation
} from '@shared/types/conversation.interface';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';

@Injectable({
  providedIn: 'root'
})
export class VoiceMailMenuService {
  private overlayRef: OverlayRef;
  private componentRef: MenuComponentRef;
  private destroy$ = new Subject<void>();
  private currentMailboxId: string;
  public moveToFolderId: string;
  public isDragDropMessage: boolean = false;

  get isSelectedMove() {
    return this.inboxToolbarService.hasItem;
  }

  constructor(
    private readonly overlay: Overlay,
    private readonly taskService: TaskService,
    private readonly propertiesService: PropertiesService,
    private readonly conversationService: ConversationService,
    private readonly injector: Injector,
    private readonly loadingService: LoadingService,
    private readonly sharedMessageViewService: SharedMessageViewService,
    private readonly inboxService: InboxService,
    private readonly headerService: HeaderService,
    private readonly emailApiService: EmailApiService,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly toastService: ToastrService,
    private readonly toastCustomService: ToastCustomService,
    private readonly createNewTaskPopUpService: CreateNewTaskPopUpService,
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

  handleMenuChange(event: {
    message?: TaskItem;
    messages?: TaskItem[];
    option?: MenuOption;
    messageIds?: string[];
    isFromTaskDetail?: boolean;
    targetFolderName?: string;
    conversationId?: string;
  }) {
    const {
      message,
      messages,
      option,
      isFromTaskDetail,
      targetFolderName,
      conversationId
    } = event;

    const currentConversation =
      message.conversations?.find(
        (conversation) => conversation.id === conversationId
      ) || message.conversations[0];

    switch (option) {
      case MenuOption.ADD_TO_TASK:
        this.handleAddToTask(event);
        return Promise.resolve();

      case MenuOption.CREATE_NEW_TASK:
        this.handleCreateNewTask({
          message,
          messages,
          targetFolderName,
          currentConversation
        });
        return Promise.resolve();

      case MenuOption.BULK_CREATE_NEW_TASK:
        this.handleCreateNewTask({
          ...event,
          currentConversation,
          openFrom: CreateTaskByCateOpenFrom.CREATE_BULK_MULTIPLE_TASK
        });
        return Promise.resolve();

      case MenuOption.REOPEN:
        return isFromTaskDetail
          ? this.handleReopenMessageTaskDetail(message, currentConversation)
          : this.handleReOpenMessage(message, currentConversation);

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
      case MenuOption.REMOVE_FROM_TASK:
        return this.handleRemoveFromTask(currentConversation);
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

  private createDialog(componentType) {
    if (this.componentRef) this.componentRef.destroy();
    if (this.overlayRef) this.overlayRef.dispose();
    this.overlayRef = this.overlay.create();
    const componentPortal = new ComponentPortal(
      componentType,
      null,
      this.injector
    );
    this.componentRef = this.overlayRef.attach(
      componentPortal
    ) as MenuComponentRef;
    return this.componentRef as ComponentRef<typeof componentType>;
  }

  private handleAddToTask(event: {
    message?: TaskItem;
    messages?: TaskItem[];
  }) {
    const { message, messages } = event;
    const ref = this.createDialog(AddVoiceMailToTaskModalComponent);
    ref.instance.visible = true;
    ref.instance.currentVoicemailTask = message;
    ref.instance.currentVoicemailTasks = messages;

    ref.instance.visibleChange.subscribe(() => {
      ref.instance.visible = false;
      this.overlayRef.dispose();
    });
  }

  private handleCreateNewTask(event: {
    message?: TaskItem;
    messages?: TaskItem[];
    targetFolderName?: string;
    isCreateFromAddToExistingTask?: boolean;
    openFrom?: CreateTaskByCateOpenFrom;
    isTaskDetail?: boolean;
    currentConversation: PreviewConversation;
  }) {
    const {
      message,
      messages,
      targetFolderName,
      openFrom,
      isCreateFromAddToExistingTask,
      isTaskDetail,
      currentConversation
    } = event;

    const handleSubscription = (ref) => {
      const propertyId =
        message && this.checkToShowAllProperty(message)
          ? ''
          : message?.property?.id;
      const shouldShowProperty = [
        EPropertyStatus.deleted,
        EPropertyStatus.archived
      ].includes(
        message?.propertyStatus ||
          (message?.property?.status as EPropertyStatus)
      );

      ref.instance.selectedFolderId = this.moveToFolderId ?? '';
      ref.instance.showBackBtn = isCreateFromAddToExistingTask;
      ref.instance.taskNameList = this.taskService.createTaskNameList();
      ref.instance.conversationId = currentConversation.id || '';
      ref.instance.categoryID = currentConversation.categoryId;
      ref.instance.injectFrom = shouldShowProperty
        ? null
        : InjectFrom.VOICE_MAIL;
      ref.instance.conversationType = shouldShowProperty
        ? null
        : EConversationType.VOICE_MAIL;
      ref.instance.propertyId = propertyId;
      ref.instance.hiddenSelectProperty = !!propertyId;
      ref.instance.disableSelectProperty = !!propertyId;
      ref.instance.onBack.subscribe(() => {
        ref.destroy();
        this.overlayRef.dispose();
      });
      ref.instance.onSendBulkMsg.subscribe((value) => {
        if (value.length === 1) {
          const dataForToast = {
            taskId: value[0].taskId,
            isShowToast: true,
            type: SocketType.messageToTask,
            targetFolderName: targetFolderName,
            mailBoxId: this.currentMailboxId,
            taskType: TaskType.TASK,
            pushToAssignedUserIds: []
          };
          this.toastCustomService.openToastCustom(
            dataForToast,
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
        } else {
          this.toastService.success(
            `${value.length} messages moved to ${targetFolderName} folder`
          );
        }
        this.inboxToolbarService.setInboxItem([]);
        this.inboxToolbarService.setListToolbarConfig([]);
        this.inboxService.isBackToModalConvertToTask.next(false);
      });
      return ref.instance.stopProcessCreateNewTask.subscribe(() => {
        if (!isCreateFromAddToExistingTask) {
          this.sharedMessageViewService.setPrefillCreateTaskData(null);
          this.taskService.selectedTaskToMove.next(null);
        }
        ref.destroy();
        this.overlayRef.dispose();
        ref.instance.showPopup = false;
        if (isTaskDetail) {
          this.taskService.triggerToggleMoveConversationSate.next({
            singleMessage: false,
            multipleMessages: false,
            isTaskDetail
          });
          return;
        }
        this.taskService.triggerToggleMoveConversationSate.next({
          singleMessage: true,
          multipleMessages: false,
          isOpenByDragDrop: this.isDragDropMessage
        });
      });
    };

    if (this.isSelectedMove && messages.length > 1) {
      const conversationIds = messages.map((m) => m.conversations[0].id);

      this.conversationService
        .convertMultipleTask({ conversationIds })
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: IListConvertMultipleTask) => {
          if (res) {
            const ref = this.createDialog(CreateNewTaskPopUpComponent);
            ref.instance.openFrom =
              openFrom || CreateTaskByCateOpenFrom.CREATE_MULTIPLE_TASK;
            ref.instance.dataConvert = res?.listConversationMove.concat(
              res?.listConversationNotMove
            );
            handleSubscription(ref);
          }
        });
      return;
    }

    const currentMessage = message || messages[0];
    const conversation =
      currentConversation || currentMessage?.conversations[0];

    this.sharedMessageViewService.setPrefillCreateTaskData(currentMessage);
    this.createNewTaskPopUpService.setFocusedConversation(
      conversation as PreviewConversation
    );

    this.propertiesService
      .getAgencyProperty(conversation?.userId, message?.property?.id || '')
      .subscribe((activeProperty) => {
        const ref = this.createDialog(CreateNewTaskPopUpComponent);
        ref.instance.openFrom = openFrom || CreateTaskByCateOpenFrom.MESSAGE;
        ref.instance.activeProperty = activeProperty;

        handleSubscription(ref);
      });
  }

  private checkToShowAllProperty(message: TaskItem) {
    return (
      message?.property.isTemporary ||
      message?.unhappyStatus?.confirmContactType === EConfirmContactType.OTHER
    );
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
    message: TaskItem,
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

  private handleMessageAction(
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

  private handleRemoveFromTask(currentConversation: PreviewConversation) {
    return firstValueFrom(
      this.conversationService
        .deleteConversationFromTaskHandler(currentConversation?.id)
        .pipe(takeUntil(this.destroy$))
    );
  }

  private getStatusRemoveTaskToPayload(status) {
    switch (status) {
      case 'OPEN':
        return 'INPROGRESS';
      case 'RESOLVED':
        return 'COMPLETED';
      default:
        return status;
    }
  }
}

export type MenuComponentRef = ComponentRef<CreateNewTaskPopUpComponent>;
