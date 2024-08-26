import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { ComponentRef, Injectable, Injector } from '@angular/core';
import { ComponentPortal } from '@angular/cdk/portal';
import { CreateNewTaskPopUpComponent } from '@/app/share-pop-up/create-new-task-pop-up/create-new-task-pop-up.component';
import {
  ListTaskOptions,
  SearchTask,
  TaskItem,
  TaskList
} from '@shared/types/task.interface';
import { Observable, Subject, map, of, takeUntil } from 'rxjs';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { ToastrService } from 'ngx-toastr';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { handleFormatDataListTaskMove } from '@shared/feature/function.feature';
import { EUserPropertyType, GroupType } from '@shared/enum/user.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  IFlagUrgentMessageResponse,
  IMarkAsUnreadResponse
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { EConversationAction } from '@shared/enum/messageType.enum';
import { isSupplierOrOtherOrExternal } from '@/app/user/utils/user.type';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { SocketType } from '@shared/enum/socket.enum';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { CreateNewTaskPopUpService } from '@/app/share-pop-up/create-new-task-pop-up/services/create-new-task-pop-up.service';

@Injectable({
  providedIn: 'root'
})
export class MessageMenuService {
  private overlayRef: OverlayRef;
  private componentRef: MessageMenuComponentRef;
  public agencyId: string;
  private unsubscribe = new Subject<void>();
  private currentMailboxId: string;
  public moveToFolderId: string;
  public isDragDropMessage: boolean = false;
  constructor(
    private overlay: Overlay,
    private taskService: TaskService,
    private propertiesService: PropertiesService,
    private conversationService: ConversationService,
    private toastService: ToastrService,
    private agencyService: AgencyService,
    private injector: Injector,
    private sharedMessageViewService: SharedMessageViewService,
    private toastCustomService: ToastCustomService,
    public inboxService: InboxService,
    private createNewTaskPopUpService: CreateNewTaskPopUpService
  ) {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailBoxId) => {
        if (!mailBoxId) return;
        this.currentMailboxId = mailBoxId;
      });
    this.subscribeMoveToFolderId();
  }

  subscribeMoveToFolderId() {
    this.inboxService.createTaskByMoveToTaskDragDrop
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        this.moveToFolderId = value.folderId;
        this.isDragDropMessage = value.isDragDrop;
      });
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
    ) as MessageMenuComponentRef;
    return this.componentRef as ComponentRef<typeof componentType>;
  }

  public handleCreateNewTask(
    message: TaskItem,
    isCreateFromAddToExistingTask: boolean = false,
    isTaskDetail: boolean = false,
    isFromTrudiApp: boolean = false,
    isFromVoiceMail: boolean = false
  ) {
    this.sharedMessageViewService.setPrefillCreateTaskData(message);
    const conversation = message.conversations[0];
    this.createNewTaskPopUpService.setFocusedConversation(conversation);
    let selectedCategoryID = conversation?.categoryId;
    if (conversation?.trudiResponse) {
      this.conversationService.superHappyPathTrudiResponse.next(
        conversation?.trudiResponse
      );
    }
    const propertyId = this.checkToShowAllProperty(message)
      ? ''
      : message.property?.id;

    this.propertiesService
      .getAgencyProperty(conversation.userId, propertyId)
      .subscribe((activeProperty) => {
        const ref = this.createDialog(CreateNewTaskPopUpComponent);
        ref.instance.openFrom = CreateTaskByCateOpenFrom.MESSAGE;
        ref.instance.activeProperty = activeProperty;
        ref.instance.propertyId = propertyId;
        ref.instance.selectedFolderId = this.moveToFolderId ?? '';
        ref.instance.showBackBtn = isCreateFromAddToExistingTask;
        ref.instance.isFromTrudiApp = isFromTrudiApp;
        ref.instance.isFromVoiceMail = isFromVoiceMail;
        ref.instance.disableSelectProperty = isFromTrudiApp || isFromVoiceMail;
        ref.instance.taskNameList = this.taskService.createTaskNameList();
        ref.instance.categoryID = selectedCategoryID;
        ref.instance.stopProcessCreateNewTask.subscribe((res) => {
          if (!isCreateFromAddToExistingTask) {
            this.sharedMessageViewService.setPrefillCreateTaskData(null);
            this.taskService.selectedTaskToMove.next(null);
          }
          ref.destroy();
          this.overlayRef.dispose();
        });
        ref.instance.onBack.subscribe(() => {
          ref.instance.showPopup = false;
          if (!isCreateFromAddToExistingTask) {
            this.sharedMessageViewService.setPrefillCreateTaskData(null);
          }
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
      });
  }

  checkToShowAllProperty(message: TaskItem) {
    return (
      (message?.taskType === TaskType.MESSAGE &&
        message?.isUnindentifiedProperty) ||
      message.property.isTemporary ||
      message?.unhappyStatus?.confirmContactType === EConfirmContactType.OTHER
    );
  }

  handleReOpenMessage(message: TaskItem, callback: Function) {
    const conversation = message.conversations[0];
    if (!conversation) {
      return of();
    }

    const currentTaskId = message.id;
    const tasksData = {
      id: message.id,
      conversationId: message.conversationId || message.conversations?.[0]?.id,
      taskType: message.taskType
    };
    return this.taskService
      .changeTaskStatusMultiple([tasksData], TaskStatusType.inprogress)
      .subscribe((res) => {
        const dataForToast = {
          conversationId: conversation?.id,
          taskId: currentTaskId,
          isShowToast: true,
          type: SocketType.changeStatusTask,
          mailBoxId: this.currentMailboxId,
          taskType: TaskType.MESSAGE,
          status: TaskStatusType.inprogress,
          pushToAssignedUserIds: []
        };
        this.toastCustomService.openToastCustom(
          dataForToast,
          true,
          EToastCustomType.SUCCESS_WITH_VIEW_BTN
        );
        if (res) {
          callback();
        }
      });
  }

  handleDeleteMessage(message: TaskItem) {
    const tasksData = {
      id: message.id,
      conversationId: message.conversationId || message.conversations?.[0]?.id,
      taskType: message.taskType
    };

    return this.taskService.changeTaskStatusMultiple(
      [tasksData],
      TaskStatusType.deleted
    );
  }

  handleResolveMessage(message, callback: Function) {
    const conversation = message.conversations[0];
    const isSendFromEmail = conversation['isSendFromEmail'] || false;
    if (!conversation) {
      return;
    }
    const summaryMsg = '';
    this.conversationService
      .updateStatus(
        EConversationType.resolved,
        conversation?.id,
        isSendFromEmail,
        summaryMsg
      )
      .subscribe((res) => {
        if (res) {
          const dataForToast = {
            conversationId: conversation?.id,
            taskId: message?.id,
            isShowToast: true,
            type: SocketType.changeStatusTask,
            mailBoxId: this.currentMailboxId,
            taskType: TaskType.MESSAGE,
            status: TaskStatusType.resolved,
            pushToAssignedUserIds: []
          };
          this.toastCustomService.openToastCustom(
            dataForToast,
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
          callback();
        }
      });
  }

  handleMessageAction(
    message: TaskItem,
    actionType: EConversationAction,
    callback: Function
  ) {
    const conversation = message.conversations[0];
    if (!conversation) {
      return;
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
      default:
        break;
    }

    actionObservable.pipe(takeUntil(this.unsubscribe)).subscribe((res) => {
      if (res) {
        callback(res);
      }
    });
  }

  prepareMoveToTaskData(
    message: TaskItem,
    currentPage = 0,
    searchTask: SearchTask = {
      term: '',
      onlyMyTasks: false,
      onlyInprogress: false
    },
    mailBoxId: string
  ) {
    const conversation = message.conversations[0];
    const isTaskType =
      this.taskService.currentTask$.value?.taskType === TaskType.TASK;
    const propertyType = conversation.propertyType;
    let isSupplierOrOther = isSupplierOrOtherOrExternal(
      propertyType as EUserPropertyType
    );
    let isUnIdentifiedProperty =
      propertyType === EUserPropertyType.UNIDENTIFIED;
    let isEmailExternal = propertyType === EUserPropertyType.EXTERNAL;
    let isUnHappyPath = message.isUnHappyPath;
    const propertyId =
      isSupplierOrOther ||
      isUnIdentifiedProperty ||
      (!isTaskType && isEmailExternal) ||
      (!message.property.streetline && !message.property.propertyName)
        ? ''
        : message.property.id;

    const paramGetTask: ListTaskOptions = {
      search: searchTask.term,
      type: searchTask.onlyMyTasks
        ? GroupType.MY_TASK
        : GroupType.MY_TASK_AND_TEAM_TASK,
      propertyId: isUnHappyPath ? '' : propertyId,
      excludeUnHappyPath: !isUnHappyPath,
      limit: 50,
      page: currentPage,
      includeCompletedTask: searchTask.onlyInprogress ? false : true,
      mailBoxId
    };

    return this.taskService
      .getListTaskToMove(
        paramGetTask,
        this.taskService.currentTask$.getValue().agencyId
      )
      .pipe(
        map((data) => {
          if (data) {
            const dataFormat: TaskList = handleFormatDataListTaskMove(
              data.data
            );
            return dataFormat;
          }
          return null;
        })
      );
  }
}

export type MessageMenuComponentRef = ComponentRef<CreateNewTaskPopUpComponent>;
