import {
  Component,
  Input,
  OnInit,
  OnChanges,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import {
  ITaskPreview,
  TaskItem,
  TaskItemDropdown
} from '@shared/types/task.interface';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  filter,
  map,
  switchMap,
  takeUntil
} from 'rxjs';
import { TaskDragDropService } from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';
import { EFolderType } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import {
  TaskStatusType,
  TaskStatusTypeLC,
  TaskType
} from '@shared/enum/task.enum';
import { ToastrService } from 'ngx-toastr';
import {
  CAN_NOT_MOVE,
  MESSAGE_MOVING_TO_TASK,
  MESSAGE_REOPENED,
  MOVE_MESSAGE_FAIL
} from '@services/messages.constants';
import { TaskService } from '@services/task.service';
import {
  IConversationParticipant,
  PreviewConversation
} from '@shared/types/conversation.interface';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import {
  EMessageComeFromType,
  EMessageProperty,
  EMessageType
} from '@shared/enum/messageType.enum';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { PropertiesService } from '@services/properties.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { ConversationService } from '@services/conversation.service';
import {
  CurrentUser,
  UserPropInSelectPeople
} from '@shared/types/user.interface';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { UserService } from '@/app/dashboard/services/user.service';
import {
  EToastCustomType,
  EToastSocketTitle
} from '@/app/toast-custom/toastCustomType';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { stringFormat } from '@core';
import { AppRoute } from '@/app/app.route';
import { isNoProperty } from '@/app/user/utils/user.type';
import { EPropertyStatus, EUserPropertyType } from '@shared/enum/user.enum';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { ErrorMessages } from '@services/constants';
import { PopupService } from '@services/popup.service';
import { CompanyService } from '@services/company.service';
import { SharedService } from '@services/shared.service';
import { LoadingService } from '@services/loading.service';
import { EConversationType, SocketType } from '@shared/enum';
import { EPopupMoveMessToTaskState } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { cloneDeep } from 'lodash-es';
import { InboxExpandService } from '@/app/dashboard/modules/inbox/services/inbox-expand.service';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { EConversationStatus } from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import { EPopupConversionTask } from '@/app/dashboard/modules/inbox/modules/message-list-view/enum/message.enum';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { MessageMenuService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-menu.service';
import {
  EMessageMenuOption,
  IFlagUrgentMessageResponse,
  IMarkAsUnreadResponse
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import {
  EMailFolderMoveType,
  IMailFolderQueryParams
} from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';

@Component({
  selector: 'conversations-preview',
  templateUrl: './conversations-preview.component.html',
  styleUrls: ['./conversations-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationsPreviewComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() taskPreview: ITaskPreview;
  @Input() taskId: string;
  @Input() task: TaskItem;
  public queryParam: Params;
  private readonly _conversations$ = new BehaviorSubject<PreviewConversation[]>(
    []
  );

  public readonly unReadConversationCount$ = this._conversations$
    .asObservable()
    .pipe(
      map(
        (conversations) =>
          conversations?.filter((conversation) => !conversation?.isSeen)
            ?.length ?? 0
      )
    );
  private readonly destroy$ = new Subject<void>();

  public readonly conversations$ = combineLatest({
    conversations: this._conversations$.asObservable()
  }).pipe(
    takeUntil(this.destroy$),
    filter(Boolean),
    map(({ conversations }) => {
      const conversationsWithMappedDate = conversations.map((item) => {
        if (item.lastMessage && item.lastMessage?.messageDate)
          item.lastMessageDate = item.lastMessage?.messageDate;
        else item.lastMessageDate = item.updatedAt;

        return item;
      });
      return conversationsWithMappedDate;
    })
  );

  readonly EViewDetailMode = EViewDetailMode;
  private currentMailboxId: string;
  private isRmEnvironment: boolean = false;
  public isArchiveMailbox: boolean = false;

  public isMoving: boolean = false;
  public folderUid: string;
  public targetConvId: string;
  public currentPropertyId: string;
  public isUnHappyPath = false;

  public openFrom: CreateTaskByCateOpenFrom;
  public taskNameList: TaskItemDropdown[];
  public categoryID: string;
  public activeProperty: UserPropInSelectPeople[];
  private currentUser: CurrentUser;

  public currentConversation: PreviewConversation;
  public MESSAGES_STATUS_TYPE = TaskStatusType;
  public MAIL_BOX_STATUS = EMailBoxStatus;
  public currentPopupConversionTask: EPopupConversionTask;
  public popupTypeConversionTask = EPopupConversionTask;
  public isConsole: boolean;
  public isShowBackBtn: boolean = true;
  public isShowModalConfirmProperties: boolean = false;
  public isActionSyncConversationToRM: boolean = false;
  public conversationNotMove = {};
  readonly SYNC_TYPE = SyncMaintenanceType;
  public selectedPropertyId: string = '';
  public errorMessage: string;
  public isShowModalWarning: boolean = false;
  public popupState = {
    showPeople: false,
    verifyEmail: false,
    emailVerifiedSuccessfully: false,
    confirmCall: false,
    option: false,
    confirmDelete: false,
    isShowForwardConversation: false,
    isShowMoveToAnotherTaskModal: false,
    isShowExportSuccess: false,
    plansSummary: false,
    requestSent: false
  };
  public taskIds: string[] = [];
  public propertyIds: string[] = [];
  public currentDraggingToFolderName: string = '';
  public propertySelected: string;
  private listOpenTabStatus = [
    EConversationStatus.open,
    EConversationStatus.reopen,
    EConversationStatus.schedule
  ];
  public isPropertyArchiveOrDelete: boolean = false;
  public EConversationType = EConversationType;
  public EPropertyStatus = EPropertyStatus;
  private isTriggeredDownloadPDFOption: boolean = false;

  constructor(
    private router: Router,
    private agencyService: AgencyService,
    private taskDragDropService: TaskDragDropService,
    private toastService: ToastrService,
    public inboxService: InboxService,
    public taskService: TaskService,
    private emailApiService: EmailApiService,
    private inboxSidebarService: InboxSidebarService,
    private sharedMessageViewService: SharedMessageViewService,
    public propertiesService: PropertiesService,
    public conversationService: ConversationService,
    private messageMenuService: MessageMenuService,
    private websocketService: RxWebsocketService,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private toastCustomService: ToastCustomService,
    private activatedRoute: ActivatedRoute,
    private companyService: CompanyService,
    private sharedService: SharedService,
    private syncResolveMessageService: SyncResolveMessageService,
    private popupService: PopupService,
    private loadingService: LoadingService,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private inboxExpandService: InboxExpandService,
    public taskDetailService: TaskDetailService
  ) {}

  ngOnChanges(): void {
    this._conversations$.next(
      this.taskPreview?.conversations
        .sort(
          (a, b) =>
            new Date(b.messageDate).getTime() -
            new Date(a.messageDate).getTime()
        )
        .filter((conversation) => {
          return (
            this.listOpenTabStatus.includes(
              conversation?.status as EConversationStatus
            ) && !conversation.isScratchDraft
          );
        })
    );
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isArchive) => (this.isArchiveMailbox = isArchive));

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        if (company) {
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        }
      });
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((mailboxId) => {
        if (mailboxId) {
          this.currentMailboxId = mailboxId;
        }
      });
    this.userService
      .getSelectedUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => (this.currentUser = rs));

    this.taskService
      .getTaskById(this.taskPreview.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.taskService.currentTask$.next(value));

    this.subscribeToSocketMessageToTask();
    this.subscribeSocketAssignContact();
    this.subscribeToggleMoveConversationSate();
  }

  subscribeToggleMoveConversationSate() {
    this.taskService.triggerToggleMoveConversationSate
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.currentPopupConversionTask = res.singleMessage
          ? EPopupConversionTask.MOVE_TASK
          : null;
        this.cdr.markForCheck();
      });
  }

  handleMenuChange(event: {
    conversation: PreviewConversation;
    option: EMessageMenuOption;
    messageIds?: string[];
  }) {
    const { conversation, option } = event;
    this.isShowBackBtn = false;
    this.currentConversation = conversation;

    switch (option) {
      case EMessageMenuOption.CREATE_NEW_TASK:
        this.handleOpenConvertToTask();
        break;

      case EMessageMenuOption.MOVE_TO_TASK:
        this.handleOpenMoveToTask();
        break;

      case EMessageMenuOption.MOVE_TO_FOLDER:
        this.handleMoveToEmail(conversation);
        break;

      case EMessageMenuOption.MOVE_TO_INBOX:
        this.handleMoveToInbox(conversation);
        break;

      case EMessageMenuOption.REOPEN:
        this.handleReopen(conversation);
        break;

      case EMessageMenuOption.RESOLVE:
        this.handleResolve(conversation);
        break;

      case EMessageMenuOption.REPORT_SPAM:
        this.handleReportSpam(conversation);
        break;

      case EMessageMenuOption.UNREAD:
      case EMessageMenuOption.READ:
        this.handleMarkUnreadConversation(conversation, option);
        break;

      case EMessageMenuOption.UN_FLAG:
      case EMessageMenuOption.FLAG:
        this.handleFlagUrgent(conversation);
        break;

      case EMessageMenuOption.SAVE_TO_RENT_MANAGER:
      case EMessageMenuOption.SAVE_TO_PROPERTY_TREE:
      case EMessageMenuOption.DOWNLOAD_AS_PDF:
        this.handleSaveToCRM(option);
        break;

      case EMessageMenuOption.DELETE:
        this.handleDelete(conversation);
        break;
      case EMessageMenuOption.REMOVE_FROM_TASK:
        this.handleRemoveFromTask(conversation);
        break;
    }
  }

  handleMoveToInbox(conversation: PreviewConversation) {
    this.handleMoveToMailFolder(
      {
        conversationIds: [conversation.id],
        mailBoxId: this.currentMailboxId,
        typeMove: EMailFolderMoveType.TASK_TO_INBOX,
        newStatus: 'INPROGRESS'
      },
      conversation
    );
  }

  handleMoveToEmail(conversation: PreviewConversation) {
    if (!conversation) {
      return;
    }
    this.conversationService.selectedConversation.next(conversation);
    this.inboxService.setPopupMoveToTaskState(
      EPopupMoveMessToTaskState.MOVE_MESSAGE_TO_EMAIL_FOLDER
    );
  }

  handleReportSpam(conversation: PreviewConversation) {
    if (!conversation) {
      return;
    }
    this.toastService.clear();
    this.toastService.show(
      MESSAGE_MOVING_TO_TASK,
      '',
      { disableTimeOut: false },
      'toast-syncing-custom'
    );
    const body = {
      mailBoxId: this.currentMailboxId,
      conversationIds: [conversation.id],
      threadIds: []
    };
    this.emailApiService
      .reportSpamFolder(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {},
        error: () => {
          this.toastService.clear();
          this.toastService.error(EToastSocketTitle.MESSAGE_SPAM_FAIL);
        }
      });
  }

  handleResolve(conversation: PreviewConversation) {
    if (conversation.scheduleMessageCount) {
      this.errorMessage = ErrorMessages.RESOLVE_CONVERSATION;
      this.isShowModalWarning = true;
      return;
    }
    const summaryMsg = '';
    this.loadingService.stopLoading();
    this.conversationService
      .updateStatus(
        EConversationType.resolved,
        conversation?.id,
        this.currentConversation.lastMessage.isSendFromEmail,
        summaryMsg
      )
      .subscribe((res) => {
        if (res) {
          const dataForToast = {
            conversationId: conversation.id,
            taskId: this.taskId,
            isShowToast: true,
            type: SocketType.changeStatusTask,
            mailBoxId: this.currentMailboxId,
            taskType: TaskType.TASK,
            status: TaskStatusType.resolved,
            pushToAssignedUserIds: [],
            conversationType: conversation.conversationType
          };
          this.toastCustomService.openToastCustom(
            dataForToast,
            true,
            EToastCustomType.SUCCESS_WITH_VIEW_BTN
          );
          this.loadingService.stopLoading();
          this.conversationService.currentUserChangeConversationStatus(
            EMessageType.solved
          );
          this.conversationService.setUpdatedConversation(
            res.id,
            EConversationType.resolved
          );
          this.conversationService.reloadConversationList.next(true);
          this.taskService.reloadTaskArea$.next(true);
        }
      });
  }

  handleReopen(conversation: PreviewConversation) {
    if (!conversation) return;
    this.conversationService.activeOptionsID$.next('');
    this.conversationService
      .updateStatus(
        EConversationType.open,
        conversation?.id,
        this.currentConversation.lastMessage.isSendFromEmail,
        ''
      )
      .subscribe((res) => {
        if (res) {
          this.conversationService.currentUserChangeConversationStatus(
            EMessageType.open
          );
          this.conversationService.setUpdatedConversation(
            res.id,
            EConversationType.open
          );
          this.conversationService.reloadConversationList.next(true);
        }
      });
  }

  handleSaveToCRM(crm: EMessageMenuOption) {
    const isTemporaryProperty =
      this.taskService.currentTask$.value?.property?.isTemporary;
    this.isTriggeredDownloadPDFOption = false;

    switch (crm) {
      case EMessageMenuOption.SAVE_TO_RENT_MANAGER:
        this.syncResolveMessageService.isSyncToRM$.next(true);
        break;
      case EMessageMenuOption.SAVE_TO_PROPERTY_TREE:
        this.syncMessagePropertyTreeService.setIsSyncToPT(true);
        break;
      case EMessageMenuOption.DOWNLOAD_AS_PDF:
        this.isTriggeredDownloadPDFOption = true;
        break;
    }

    if (
      ((this.isRmEnvironment &&
        (isNoProperty(
          this.currentConversation.startMessageBy as EUserPropertyType
        ) ||
          ([EUserPropertyType.OWNER, EUserPropertyType.LANDLORD].includes(
            this.currentConversation.startMessageBy as EUserPropertyType
          ) &&
            !this.currentConversation.streetline))) ||
        isTemporaryProperty) &&
      !this.isTriggeredDownloadPDFOption
    ) {
      this.conversationNotMove = {
        listConversationNotMove: [this.currentConversation]
      };
      this.isShowModalConfirmProperties = true;
      this.isActionSyncConversationToRM = true;
      this.cdr.markForCheck();
      return;
    }
    this.syncConversationToCRM(crm);
  }

  syncConversationToCRM(crm: EMessageMenuOption) {
    const conversationSyncing = {
      conversationIds: [this.currentConversation.id],
      status: this.SYNC_TYPE.INPROGRESS
    };
    const payload = [
      {
        conversationId: this.currentConversation.id,
        propertyId: this.taskPreview.property.id
      }
    ];
    if (crm === EMessageMenuOption.SAVE_TO_RENT_MANAGER) {
      this.syncResolveMessageService.setListConversationStatus(
        conversationSyncing
      );
      this.syncResolveMessageService
        .syncResolveMessageNoteProperties(payload)
        .subscribe();
    } else {
      const exportPayload = {
        conversations: payload,
        mailBoxId: this.currentMailboxId
      };
      if (!this.isTriggeredDownloadPDFOption) {
        this.syncMessagePropertyTreeService.setListConversationStatus(
          conversationSyncing
        );
      }

      this.syncMessagePropertyTreeService.setTriggerExportHistoryAction(
        exportPayload,
        this.isTriggeredDownloadPDFOption
      );
    }
  }

  handleDelete(conversation: PreviewConversation) {
    if (conversation.scheduleMessageCount) {
      this.errorMessage = ErrorMessages.DELETE_CONVERSATION;
      this.isShowModalWarning = true;
      return;
    }
    switch (this.taskService.currentTask$.value?.taskType) {
      case TaskType.MESSAGE:
        let isFromCompletedSection;
        if (
          this.currentConversation?.status === TaskStatusTypeLC.inprogress ||
          this.currentConversation?.status === TaskStatusTypeLC.unassigned
        ) {
          isFromCompletedSection = false;
        } else if (
          this.currentConversation?.status === TaskStatusTypeLC.completed
        ) {
          isFromCompletedSection = true;
        }
        this.popupService.fromDeleteTask.next({
          display: true,
          isFromCompletedSection
        });
        this.showQuitConfirm(true);
        break;
      case TaskType.TASK:
        this.conversationService
          .deleteConversation(conversation.id)
          .subscribe((res) => {
            if (res) {
              this._conversations$.next(
                this._conversations$
                  .getValue()
                  .filter((item) => item.id !== conversation.id)
              );
              this.conversationService.reloadConversationList.next(true);
            }
          });
        break;
    }
  }

  private handleRemoveFromTask(conversation: PreviewConversation) {
    if (conversation?.scheduleMessageCount) {
      this.errorMessage = ErrorMessages.REMOVE_CONVERSATION_FROM_TASK;
      this.isShowModalWarning = true;
      return;
    }
    this.toastService.show(
      MESSAGE_MOVING_TO_TASK,
      '',
      {
        disableTimeOut: false
      },
      'toast-syncing-custom'
    );

    this.conversationService
      .deleteConversationFromTaskHandler(conversation.id)
      .subscribe({
        next: () => {
          this.isMoving = false;
          this.inboxSidebarService.refreshStatisticsUnreadTask(
            this.currentMailboxId
          );
          this.conversationService.reloadConversationList.next(true);
          this.conversationService.navigateToFirstOfNextConversation(
            conversation.id
          );
        },
        error: () => {
          this.handleMoveError();
        }
      });
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  showQuitConfirm(status: boolean) {
    if (status) {
      this.handlePopupState({ confirmDelete: status });
    } else {
      this.handlePopupState({ confirmDelete: status });
    }
  }

  private handleMarkAsUnread(
    conversation: PreviewConversation,
    option: EMessageMenuOption
  ) {
    if (option === EMessageMenuOption.UNREAD) {
      this.conversationService
        .markAsUnread(conversation.id)
        .subscribe((res: IMarkAsUnreadResponse) => {
          // this.updateConversationsProperty(
          //   conversation,
          //   EMessageProperty.IS_SEEN,
          //   res?.isSeen
          // );
          this._conversations$.next(
            this._conversations$.getValue().map((e) =>
              e.id === conversation.id
                ? {
                    ...e,
                    isSeen: res?.isSeen,
                    isRead: res.isSeen
                  }
                : e
            )
          );
        });
    } else {
      this.conversationService
        .markAsReadConversation(conversation.id, this.currentMailboxId)
        .subscribe((res) => {
          // this.updateConversationsProperty(
          //   conversation,
          //   EMessageProperty.IS_SEEN,
          //   res?.isSeen
          // );
          this._conversations$.next(
            this._conversations$.getValue().map((e) =>
              e.id === conversation.id
                ? {
                    ...e,
                    isSeen: res?.isSeen,
                    isRead: res.isSeen
                  }
                : e
            )
          );
        });
    }
  }

  private handleMarkUnreadConversation(
    conversation: PreviewConversation,
    option: EMessageMenuOption
  ) {
    const handleResponse = (res) => {
      if (!res) {
        return;
      }

      this.currentConversation = {
        ...(this.currentConversation ?? {}),
        isSeen: res.isSeen,
        isRead: res.isRead
      };

      this._conversations$.next(
        this._conversations$.getValue().map((conversation) =>
          conversation.id === res.conversationId
            ? {
                ...conversation,
                isSeen: res.isSeen,
                isRead: res.isRead
              }
            : conversation
        )
      );

      this.conversationService.markCurrentConversationBS.next({
        ...res,
        option
      });
    };

    if (option === EMessageMenuOption.UNREAD) {
      this.conversationService
        .markAsUnread(conversation.id)
        .subscribe((res) => {
          handleResponse(res);
        });
    } else {
      this.conversationService
        .markAsReadConversation(conversation.id, this.currentMailboxId)
        .subscribe((res) => {
          handleResponse(res);
        });
    }
  }

  private handleFlagUrgent(conversation: PreviewConversation) {
    this.conversationService
      .updateFlagUrgent(conversation.id)
      .subscribe((res: IFlagUrgentMessageResponse) => {
        this.updateConversationsProperty(
          conversation,
          EMessageProperty.IS_URGENT,
          res?.isUrgent
        );
      });
  }

  selectedPropertyInDetail(propertySelected: string) {
    this.propertySelected = propertySelected;
  }

  handleConfirmProperties() {
    this.taskPreview.property.id = this.propertySelected;
    this.syncConversationToCRM(
      this.isRmEnvironment
        ? EMessageMenuOption.SAVE_TO_RENT_MANAGER
        : EMessageMenuOption.SAVE_TO_PROPERTY_TREE
    );
  }

  handleCancelConfirmProperties(value) {
    this.isShowModalConfirmProperties = value;
    this.isActionSyncConversationToRM = value;
    this.cdr.markForCheck();
  }

  updateConversationsProperty(
    conversation: PreviewConversation,
    propertyToUpdate: EMessageProperty,
    propertyValue: boolean
  ) {
    this._conversations$.next(
      this._conversations$.getValue().map((e) =>
        e.id === conversation.id
          ? {
              ...e,
              [propertyToUpdate]: propertyValue
            }
          : e
      )
    );
    // this.updateCachedMessages();
  }

  subscribeSocketAssignContact() {
    this.websocketService.onSocketAssignContact
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.updateConversationParticipants(
          res?.conversationId,
          res?.participants
        );
      });

    this.websocketService.onSocketDeleteSecondaryContact
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const conversationIds = res.participants
          ?.map((obj) => obj.conversationId)
          .filter((id) => id !== undefined);
        const conversationIdsUnique = [...new Set(conversationIds)][0];
        this.updateConversationParticipants(
          conversationIdsUnique,
          res.participants
        );
      });
  }

  private updateConversationParticipants(
    conversationId: string,
    participants: IConversationParticipant[]
  ) {
    const conversations = cloneDeep(this._conversations$.getValue());
    const conversationIndex = conversations.findIndex(
      (conversation) => conversation.id === conversationId
    );
    if (conversationIndex > -1) {
      conversations[conversationIndex].participants = participants;
      this._conversations$.next(conversations);
    }
  }

  dragMovedHandler(event: CdkDragMove) {
    this.currentDraggingToFolderName =
      this.inboxExpandService.getFolderNameWhenDragging(event.pointerPosition);
    this.inboxExpandService.expandSubMenu(event.pointerPosition);
  }

  handleDropConversation($event) {
    this.inboxExpandService.handleCollapseFolder();
    let elmDrop = this.taskDragDropService.getRootElement(
      $event.dropPoint,
      'drop_task--folder'
    );
    if (!elmDrop) return;

    const dataFolder = JSON.parse(elmDrop?.getAttribute('folder-data'));
    const folderType = elmDrop?.getAttribute('folder-type');
    const conversation = $event.item.data;
    switch (folderType) {
      case EFolderType.TASKS:
        this.folderUid = elmDrop?.getAttribute('folder-uid');
        this.currentConversation = conversation;
        this.targetConvId = conversation.id;
        this.currentPopupConversionTask = EPopupConversionTask.SELECT_OPTION;
        this.cdr.markForCheck();
        break;
      case EFolderType.EMAIL:
        if (this.isArchiveMailbox || this.isMoving) {
          this.toastService.clear();
          this.toastService.error(CAN_NOT_MOVE);
          return;
        }
        this.handleMoveToMailFolder(
          {
            conversationIds: [conversation.id],
            mailBoxId: this.currentMailboxId,
            typeMove: EMailFolderMoveType.TASK_TO_INBOX,
            newStatus: 'INPROGRESS'
          },
          conversation
        );
        break;
      case EFolderType.MAIL:
        if (!dataFolder?.moveAble || this.isMoving) {
          this.toastService.clear();
          this.toastService.error(CAN_NOT_MOVE);
          return;
        }
        this.handleMoveToMailFolder(
          {
            conversationIds: [conversation.id],
            mailBoxId: this.currentMailboxId,
            currentStatus: conversation.status,
            newLabelId: dataFolder.internalId,
            typeMove: EMailFolderMoveType.TASK_TO_FOLDER
          },
          conversation,
          true
        );
        break;
    }
  }

  handleCancelPopup() {
    this.currentPopupConversionTask = null;
    this.cdr.markForCheck();
  }

  handleOpenConvertToTask() {
    this.taskService
      .getTaskById(this.taskPreview.id)
      .pipe(
        switchMap((task) => {
          this.sharedMessageViewService.setPrefillCreateTaskData(task);
          const conversation = this.taskPreview.conversations.find(
            (convo) => convo.id === this.currentConversation.id
          );
          this.conversationService.currentConversation.next(conversation);
          this.categoryID = conversation?.categoryId;
          if (conversation?.trudiResponse) {
            this.conversationService.superHappyPathTrudiResponse.next(
              conversation?.trudiResponse
            );
          }
          const propertyId = this.messageMenuService.checkToShowAllProperty(
            task
          )
            ? ''
            : task?.property?.id;
          this.currentPropertyId = propertyId;
          return this.propertiesService.getAgencyProperty(
            conversation?.user.id,
            propertyId
          );
        })
      )
      .subscribe((activeProperty) => {
        this.openFrom = CreateTaskByCateOpenFrom.MESSAGE;
        this.currentPopupConversionTask = EPopupConversionTask.CREATE_TASK;
        this.activeProperty = activeProperty;
        this.isPropertyArchiveOrDelete = !this.activeProperty.find(
          (item) => item.id === this.currentConversation.propertyId
        );
        this.taskNameList = this.taskService.createTaskNameList();
        // if (
        //   this.currentConversation.conversationType === EConversationType.APP
        // ) {
        //   this.appMessageMenuService.setIsTrudiApp(true);
        // }
        this.cdr.markForCheck();
      });
  }
  handleBackPopupCreateTask() {
    this.currentPopupConversionTask = EPopupConversionTask.SELECT_OPTION;
    this.cdr.markForCheck();
  }
  stopProcessCreateNewTask() {
    this.isShowBackBtn = true;
    this.sharedMessageViewService.setPrefillCreateTaskData(null);
    this.currentPopupConversionTask = null;
    this.cdr.markForCheck();
  }

  handleOpenMoveToTask() {
    this.taskService.getTaskById(this.taskPreview.id).subscribe((task) => {
      const conversation = this.taskPreview.conversations.find(
        (convo) => convo.id === this.currentConversation.id
      );
      if (conversation) {
        conversation.categoryName =
          conversation.categoryName || conversation.title;
        conversation.propertyType = 'UNIDENTIFIED';
        this.conversationService.currentConversation.next(conversation);
      }

      this.propertyIds = [
        task.conversations.find((c) => c.id === this.currentConversation.id)
          ?.propertyId || ''
      ];
      this.taskIds = [task?.id || ''];
      this.isUnHappyPath = task?.isUnHappyPath;
      this.currentPropertyId = task.property.id;
      this.sharedMessageViewService.setPrefillCreateTaskData(task);
      this.currentPopupConversionTask = EPopupConversionTask.MOVE_TASK;
      this.cdr.markForCheck();
    });
  }
  handleBackPopupMoveTask() {
    this.currentPopupConversionTask = EPopupConversionTask.SELECT_OPTION;
    this.cdr.markForCheck();
  }

  stopMoveToTaskFolder() {
    this.isShowBackBtn = true;
    this.sharedMessageViewService.setPrefillCreateTaskData(null);
    this.currentPopupConversionTask = null;
    this.folderUid = null;
    this.cdr.markForCheck();
  }

  handleMoveToMailFolder(
    payload: IMailFolderQueryParams,
    conversation: PreviewConversation,
    emailCheck: boolean = false
  ) {
    if (
      emailCheck &&
      !conversation.lastMessage?.messageComeFrom?.includes(
        EMessageComeFromType.EMAIL
      )
    ) {
      this.toastService.clear();
      this.toastService.error(CAN_NOT_MOVE);
      return;
    }

    this.isMoving = true;
    this.toastService.show(
      MESSAGE_MOVING_TO_TASK,
      '',
      {
        disableTimeOut: false
      },
      'toast-syncing-custom'
    );
    this.emailApiService.moveMailFolder(payload).subscribe({
      next: () => {
        this.isMoving = false;
        this.inboxSidebarService.refreshStatisticsUnreadTask(
          this.currentMailboxId
        );
      },
      error: () => {
        this.handleMoveError();
      }
    });
  }

  handleMoveError() {
    this.isMoving = false;
    this.toastService.clear();
    this.toastService.error(MOVE_MESSAGE_FAIL);
  }

  public subscribeToSocketMessageToTask() {
    this.websocketService.onSocketMessageToTask
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (
          res?.fromUserId === this.currentUser?.id &&
          this.currentConversation?.id === res?.conversationId
        ) {
          this.currentPopupConversionTask = null;
          this.cdr.markForCheck();
          this.router.navigate(
            [
              stringFormat(
                AppRoute.TASK_DETAIL,

                res.taskId
              )
            ],
            {
              queryParams: { type: 'TASK' },
              replaceUrl: true
            }
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
