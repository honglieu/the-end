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
} from '@/app/dashboard/modules/inbox/modules/app-message-list/interfaces/message.interface';
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
export class AppMessageMenuService {
  private overlayRef: OverlayRef;
  private componentRef: MessageMenuComponentRef;
  public agencyId: string;
  private unsubscribe = new Subject<void>();
  private currentMailboxId: string;
  public moveToFolderId: string;

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
    this.inboxService.moveToFolderId$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        this.moveToFolderId = value;
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
    isTaskDetail: boolean = false
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
        ref.instance.taskNameList = this.taskService.createTaskNameList();
        ref.instance.categoryID = selectedCategoryID;
        ref.instance.isFromTrudiApp = ref.instance.disableSelectProperty = true;
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
            multipleMessages: false
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

  handleReOpenMessage(
    message: TaskItem,
    callback: Function,
    setReopeningStatus?: Function
  ) {
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
      .subscribe({
        next: (res) => {
          const dataForToast = {
            conversationId: conversation?.id,
            taskId: currentTaskId,
            isShowToast: true,
            type: SocketType.changeStatusTask,
            mailBoxId: this.currentMailboxId,
            taskType: TaskType.MESSAGE,
            status: TaskStatusType.inprogress,
            pushToAssignedUserIds: [],
            isAppMessage: true,
            conversationType: EConversationType.APP
          };
          this.toastCustomService.openToastCustom(
            dataForToast,
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
          if (res) {
            callback();
          }
        },
        complete: () => {
          setReopeningStatus && setReopeningStatus(false);
        }
      });
  }

  handleResolveMessage(
    message,
    callback: Function,
    setResolvingStatus?: Function
  ) {
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
      .subscribe({
        next: (res) => {
          if (res) {
            const dataForToast = {
              conversationId: conversation?.id,
              taskId: message?.id,
              isShowToast: true,
              type: SocketType.changeStatusTask,
              mailBoxId: this.currentMailboxId,
              taskType: TaskType.MESSAGE,
              status: TaskStatusType.resolved,
              pushToAssignedUserIds: [],
              isAppMessage: true,
              conversationType: EConversationType.APP
            };
            this.toastCustomService.openToastCustom(
              dataForToast,
              true,
              EToastCustomType.SUCCESS_WITH_VIEW_BTN
            );
            callback();
          }
        },
        complete: () => {
          setResolvingStatus && setResolvingStatus(false);
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
}

export type MessageMenuComponentRef = ComponentRef<CreateNewTaskPopUpComponent>;
