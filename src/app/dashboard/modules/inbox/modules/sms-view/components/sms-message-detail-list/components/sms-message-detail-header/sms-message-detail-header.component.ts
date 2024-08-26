import {
  EMessageMenuOption,
  IFlagUrgentMessageResponse
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  switchMap,
  takeUntil
} from 'rxjs';
import { HeaderService } from '@/app/services/header.service';
import {
  AssignToAgent,
  TaskItem,
  TaskItemDropdown
} from '@shared/types/task.interface';
import { TaskService } from '@services/task.service';
import { SharedService } from '@services/shared.service';
import {
  EConversationType,
  EExcludedUserRole,
  EMessageType,
  EPropertyStatus,
  ERecognitionStatus,
  ESyncToRmStatus,
  EUserPropertyType,
  SocketType,
  SyncMaintenanceType,
  TaskStatusType,
  TaskType
} from '@shared/enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { CompanyService } from '@services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import {
  CurrentUser,
  UserPropInSelectPeople
} from '@shared/types/user.interface';
import { MessageService } from '@/app/services/message.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { TrudiResponse } from '@shared/types/trudi.interface';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { FormGroup } from '@angular/forms';
import { EDataE2EConversation } from '@shared/enum/E2E.enum';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { UnhappyStatus } from '@shared/types/unhappy-path.interface';
import {
  TaskDetailService,
  UserProfileDrawerService
} from '@/app/task-detail/services/task-detail.service';
import { SYNC_PT_FAIL } from '@services/constants';
import {
  IParticipant,
  UserConversation
} from '@shared/types/conversation.interface';
import { Property } from '@shared/types/property.interface';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { ECrmStatus, ETypePage } from '@/app/user/utils/user.enum';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { HelperService } from '@services/helper.service';
import { getUserFromParticipants } from '@/app/trudi-send-msg/utils/helper-functions';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { sortSuggestedProperties, UserPropertyInPeople } from '@/app/shared';
import { UserService } from '@/app/dashboard/services/user.service';
import { SmsMessageListService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message.services';
import { ReminderMessageService } from '@/app/task-detail/services/reminder-message.service';
import { RxWebsocketService } from '@/app/services/rx-websocket.service';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';
import { MessageFlowService } from '@/app/dashboard/modules/message-flow/services/message-flow.service';

type UserConversationOption = Partial<UserConversation>;
export const BelongToOtherPropertiesText = ` (${EExcludedUserRole.BELONGS_TO_OTHER_PROPERTIES})`;

@Component({
  selector: 'sms-message-detail-header',
  templateUrl: './sms-message-detail-header.component.html',
  styleUrl: './sms-message-detail-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmsMessageDetailHeaderComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() currentConversation: UserConversation;
  @Input() currentProperty: Property;
  @Output() reopenMsg = new EventEmitter();
  public isThreeDotsMenuVisible = false;
  private destroy$ = new Subject<boolean>();
  public assignedAgents: AssignToAgent[] = [];
  public isArchiveMailbox: boolean = false;
  public reassignTooltip: '';

  readonly TaskStatusType = TaskStatusType;
  readonly EMessageMenuOption = EMessageMenuOption;
  readonly EConversationType = EConversationType;
  readonly ESyncToRmStatus = ESyncToRmStatus;
  readonly EButtonType = EButtonType;
  readonly EButtonTask = EButtonTask;
  readonly EUserPropertyType = EUserPropertyType;
  readonly ERecognitionStatus = ERecognitionStatus;
  readonly BelongToOtherPropertiesText = BelongToOtherPropertiesText;
  readonly contactTitleVariable = {
    isNoPropertyConversation: false,
    isMatchingPropertyWithConversation: true,
    showPrimaryText: true
  };

  public isReadMsg: boolean = false;
  public isRmEnvironment: boolean = false;
  public isPTEnvironment: boolean = false;
  public currentTaskDeleted: boolean = false;
  public categoryID: string;
  public openFrom: CreateTaskByCateOpenFrom;
  public activeProperty: UserPropInSelectPeople[];
  public taskNameList: TaskItemDropdown[];
  public propertyIds: string[] = [];
  public taskIds: string[] = [];

  public isShowBackBtn: boolean = false;
  public isNoProperty: boolean = false;
  public readonly EPropertyStatus = EPropertyStatus;
  public propertyStatus: EPropertyStatus;
  public toolTipProperty: string;
  public streetProperty: string;
  readonly EViewDetailMode = EViewDetailMode;
  readonly ECrmStatus = ECrmStatus;
  readonly TaskType = TaskType;
  public trudiResponse: TrudiResponse;
  public unhappyPathLoading: boolean = false;
  public isUnidentifiedEmail = false;
  public isUnidentifiedPhoneNumber = false;
  public isUnidentifiedProperty = false;
  public isSuperHappyPath = false;
  public isDraftFolder: boolean = false;
  public isShowModalPeople: boolean = false;
  public crmSystemId;
  public isShowPersonMd = false;
  public isShowModalAddNote: boolean = false;
  public isExpandProperty: boolean = true;
  public isRequestShowUserInfoFromTaskConversation: boolean = false;
  public taskNameCreateForm: FormGroup;
  public currentAgencyId: string;
  public isConsole = false;
  public task: TaskItem;
  public selectedPropertyId: string = '';
  assignAttachBoxState = false;
  selectingUserIdListInTask: string[];
  currentAssignButton: HTMLElement;
  attachBoxPosition = { left: 0, top: 0, bottom: 0 };
  readonly EDataE2EConversation = EDataE2EConversation;
  readonly SYNC_TYPE = SyncMaintenanceType;
  readonly SYNC_PT_FAIL = SYNC_PT_FAIL;
  public currentTask: TaskItem;
  public isUrgent: boolean = false;
  public unhappyStatus: UnhappyStatus;
  public propertyId: string;
  public statusMessage: string;
  public params: Params;
  public showResolvedBtn: boolean = false;
  public userInfo: IParticipant;
  public disabledBtn: boolean = false;
  public isMessage: boolean = false;
  public currentMailboxId: string;
  public visiblePropertyProfile = false;
  public isShowModalConfirmProperties: boolean = false;
  public isActionSyncConversationToRM: boolean = false;
  public conversationNotMove = {};
  public isDisableActionByOffBoardStatus: boolean;
  private isTriggeredDownloadPDFOption: boolean = false;
  private queryParams: ParamMap;
  public disabledDownloadPDF: boolean = false;
  public prefillScratchDraft = {
    receivers: [],
    title: '',
    to: ''
  };
  public confirmResolveSms: boolean = false;
  protected readonly ETypePage = ETypePage;
  public currentUser: CurrentUser = null;
  public listPropertyAllStatus: UserPropertyInPeople[] = [];
  public showUpdatePropertyModal: boolean = false;
  public getSuggestedProperty$ = new BehaviorSubject<string>(null);
  public smsPhoneNumber: string = '';
  public isLoadingDetailHeader: boolean = false;
  public currentPMJoined: boolean = false;

  get isSyncSuccess() {
    return (
      [ESyncToRmStatus.COMPLETED, ESyncToRmStatus.SUCCESS].includes(
        this.currentConversation.syncStatus as ESyncToRmStatus
      ) ||
      [ESyncToRmStatus.SUCCESS].includes(
        this.currentConversation
          .conversationSyncDocumentStatus as ESyncToRmStatus
      )
    );
  }

  get isSyncInprogress() {
    return (
      [ESyncToRmStatus.PENDING, ESyncToRmStatus.INPROGRESS].includes(
        this.currentConversation?.syncStatus as ESyncToRmStatus
      ) ||
      [ESyncToRmStatus.PENDING, ESyncToRmStatus.INPROGRESS].includes(
        this.currentConversation
          ?.conversationSyncDocumentStatus as ESyncToRmStatus
      )
    );
  }

  constructor(
    private headerService: HeaderService,
    public taskService: TaskService,
    private sharedService: SharedService,
    public inboxService: InboxService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private sharedMessageViewService: SharedMessageViewService,
    public conversationService: ConversationService,
    public propertiesService: PropertiesService,
    private messageService: MessageService,
    private activatedRoute: ActivatedRoute,
    private agencyService: AgencyService,
    private propertyService: PropertiesService,
    private nzContextMenuService: NzContextMenuService,
    private readonly userProfileDrawerService: UserProfileDrawerService,
    public router: Router,
    public taskDetailService: TaskDetailService,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private toastCustomService: ToastCustomService,
    private hepler: HelperService,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private userService: UserService,
    private smsMessageListService: SmsMessageListService,
    private reminderMessageService: ReminderMessageService,
    private rxWebsocketService: RxWebsocketService,
    private messageTaskLoadingService: MessageTaskLoadingService,
    private messageFlowService: MessageFlowService
  ) {
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.queryParams = params;
      });
    this.userService
      .getSelectedUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => (this.currentUser = user));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentConversation']?.currentValue) {
      if (this.currentConversation.isScratchDraft) {
        this.setScratchDraftData(this.currentConversation);
      }
      this.currentConversation = changes['currentConversation']?.currentValue;
      this.propertyStatus =
        changes['currentConversation']?.currentValue?.propertyStatus;

      this.showResolvedBtn =
        this.currentConversation?.status === TaskStatusType.open;
      this.isMessage =
        !this.hepler.isInboxDetail ||
        this.currentConversation?.taskType === TaskType.MESSAGE;

      this.isDisableActionByOffBoardStatus =
        this.currentConversation?.conversationType === EConversationType.APP &&
        this.currentConversation?.status === TaskStatusType.resolved &&
        !!this.currentConversation?.offBoardedDate;
    }
    this.userInfo = this.smsMessageListService.getUserRaiseMsgFromParticipants(
      this.currentConversation
    );
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.subscribeListPropertyAllStatus();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentMailboxId) => {
        this.currentMailboxId = currentMailboxId;
      });

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isShow) => {
        this.isArchiveMailbox = isShow;
      });

    this.taskService.currentTask$
      .pipe(takeUntil(this.destroy$), filter(Boolean))
      .subscribe((res) => {
        this.currentTask = res;
        this.currentAgencyId = res.agencyId;
        this.isReadMsg = this.currentTask.conversations.some(
          (msg) =>
            this.queryParams.get('conversationId') === msg.id && msg.isSeen
        );
        this.isUrgent = this.currentTask.conversations.some(
          (msg) =>
            this.queryParams.get('conversationId') === msg.id && msg.isUrgent
        );
        this.unhappyStatus = res.unhappyStatus;
        this.messageService.requestDataMsgDetail.next([
          this.currentTask,
          this.currentConversation
        ]);
        const { status, propertyType } = res?.property || {};
        this.toolTipProperty = this.propertyService.getTooltipPropertyStatus({
          propertyStatus: status,
          propertyType
        });
        this.currentTaskDeleted = this.taskService.checkIfCurrentTaskDeleted();
      });

    this.conversationService.currentConversation
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        if (!res || !Object.keys(res).length) return;
        this.currentConversation = {
          ...res,
          syncStatus: res.syncStatus || res.conversationSyncDocumentStatus
        };
        this.smsPhoneNumber = res.channelUser?.externalId;
        this.userInfo =
          this.smsMessageListService.getUserRaiseMsgFromParticipants(
            this.currentConversation
          );
        this.currentPMJoined =
          res?.isPmJoined && res?.lastPmJoined?.id === this.currentUser?.id;
        this.getSuggestedProperty$.next(res?.id);
        this.selectedPropertyId = res?.propertyId;
        this.sharedService.setLoadingDetailHeader(false);
      });

    this.subscribePortalConversation();
    this.getCurrentCompany();
    this.conversationService.markCurrentConversationBS
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        filter(
          (res) => !!res && this.currentConversation?.id === res.conversationId
        )
      )
      .subscribe((res) => {
        const syncStatus =
          this.currentConversation.syncStatus ||
          this.currentConversation.conversationSyncDocumentStatus;
        if (
          [EMessageMenuOption.UN_FLAG, EMessageMenuOption.FLAG].includes(
            res?.option
          )
        ) {
          this.currentConversation = {
            ...this.currentConversation,
            [res.propertyToUpdate]: res.propertyValue,
            syncStatus
          };
        } else {
          this.currentConversation = {
            ...this.currentConversation,
            syncStatus,
            isSeen: res?.isSeen ?? this.currentConversation.isSeen,
            isRead: res?.isRead ?? this.currentConversation.isRead
          };
        }
      });
    this.handleSyncStatusMessage();
    this.subscribeSocketTask();
    this.syncMessagePropertyTreeService.isSyncToPT$
      .pipe(takeUntil(this.destroy$), filter(Boolean))
      .subscribe(() => {
        this.handleSyncStatusMessage();
      });
    this.subscribeLoadingDetailHeader();
  }

  subscribeLoadingDetailHeader() {
    this.sharedService.getLoadingDetailHeader().subscribe((res) => {
      this.isLoadingDetailHeader = res;
    });
  }

  subscribeSocketTask() {
    const isSocKetAssignTask = (data) =>
      Boolean(
        data &&
          data?.type === SocketType.assignTask &&
          data?.id === this.currentTask?.id
      );
    this.rxWebsocketService.onSocketTask
      .pipe(filter(isSocKetAssignTask), takeUntil(this.destroy$))
      .subscribe((data) => {
        this.taskService.currentTask$.next({ ...this.currentTask, ...data });
      });
  }

  subscribeListPropertyAllStatus() {
    combineLatest([
      this.propertyService.listPropertyAllStatus,
      this.getSuggestedProperty$.pipe(debounceTime(300)),
      this.messageFlowService.isAddContact
    ])
      .pipe(
        filter(([listProperty]) => Boolean(listProperty?.length)),
        switchMap(this.processPropertyAndContactData),
        takeUntil(this.destroy$)
      )
      .subscribe(this.updateListPropertyAllStatus);
  }

  private processPropertyAndContactData = ([
    listProperty,
    conversationId,
    _
  ]) => {
    this.listPropertyAllStatus = listProperty;
    if (!conversationId) return EMPTY;
    return this.reminderMessageService
      .getSuggestedProperty(conversationId)
      .pipe(
        catchError(() => EMPTY),
        map((suggestedPropertyIds) => ({ listProperty, suggestedPropertyIds }))
      );
  };

  private updateListPropertyAllStatus = (data) => {
    if (!data) return;
    const { listProperty, suggestedPropertyIds } = data;
    this.listPropertyAllStatus = sortSuggestedProperties({
      suggestedPropertyIds: suggestedPropertyIds,
      propertiesList: listProperty
    });
  };

  handleSyncStatusMessage() {
    this.syncMessagePropertyTreeService.listConversationStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((listMessageSyncStatus) => {
        if (!listMessageSyncStatus) return;
        const {
          conversationSyncDocumentStatus,
          timestamp,
          status,
          downloadingPDFFile
        } = listMessageSyncStatus || {};
        if (
          listMessageSyncStatus?.conversationIds?.includes(
            this.currentConversation.id
          )
        ) {
          this.currentConversation.syncStatus = status;
          this.currentConversation.conversationSyncDocumentStatus =
            conversationSyncDocumentStatus ||
            this.currentConversation?.conversationSyncDocumentStatus;
          this.currentConversation.updatedSyncAt =
            this.currentConversation.updatedSyncAt || timestamp;
          this.currentConversation.downloadingPDFFile = downloadingPDFFile;
        }
        this.disabledDownloadPDF =
          this.syncMessagePropertyTreeService.checkToEnableDownloadPDFOption(
            this.isArchiveMailbox,
            this.isConsole,
            this.currentConversation?.downloadingPDFFile
          );
        this.cdr.markForCheck();
      });
  }

  handleReopenMsg() {
    if (this.currentConversation?.crmStatus === ECrmStatus.DELETED) return;
    this.reopenMsg.emit(EMessageType.reopened);
  }

  getCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs) {
          this.crmSystemId = rs?.CRM;
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(rs);
        }
      });
  }

  subscribePortalConversation() {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((param) => {
        this.params = param;
        this.isDraftFolder =
          (param['tab'] || param['status']) === TaskStatusType.draft;

        if (!this.isDraftFolder) {
          this.statusMessage =
            param['status'] === TaskStatusType.inprogress
              ? TaskStatusType.open
              : TaskStatusType.resolved;
        }
      });
  }

  setScratchDraftData(conversation: UserConversation) {
    const appUser = getUserFromParticipants(conversation.participants)?.[0];
    const isDraftMessage = conversation.lastMessageDraft;
    this.prefillScratchDraft = {
      receivers: appUser
        ? [
            {
              ...appUser,
              id: appUser.userId,
              type: isDraftMessage ? appUser.userPropertyType : appUser.type,
              isAppUser: true,
              streetline:
                conversation.shortenStreetline || conversation.streetline
            }
          ]
        : [],
      title: conversation.categoryName,
      to: ''
    };
    this.prefillScratchDraft.to = this.prefillScratchDraft?.receivers
      ?.map((item) => {
        const user = this.formatReceiverTitle(item);
        return user.content;
      })
      ?.join(', ');
  }

  formatReceiverTitle(receiver) {
    const fullName = this.contactTitleByConversationPropertyPipe.transform(
      receiver,
      {
        isNoPropertyConversation: !this.selectedPropertyId,
        isMatchingPropertyWithConversation:
          receiver?.propertyId === this.selectedPropertyId,
        skipClientName: true
      }
    );
    const role = this.contactTitleByConversationPropertyPipe.transform(
      receiver,
      {
        isNoPropertyConversation: false,
        isMatchingPropertyWithConversation: true,
        showOnlyRole: true
      }
    );
    const bulletPoint = '•';
    const shortenStreetLine =
      receiver?.shortenStreetLine ||
      receiver?.shortenStreetline ||
      receiver?.streetline ||
      receiver?.streetLine ||
      'No property';
    const content = `${fullName} (${role}) ${bulletPoint} ${shortenStreetLine}`;

    const isUnidentified =
      (!receiver.type || receiver.type === EUserPropertyType.UNIDENTIFIED) &&
      receiver?.isValid === false;

    return {
      content,
      isUnidentified
    };
  }

  handleNavigateToConversation() {
    const { taskId, conversationType, conversationId, taskStatus, taskType } =
      this.currentConversation?.linkedConversationAppLog?.[0];
    const statusUrl = {
      [TaskStatusType.inprogress]: 'all',
      [TaskStatusType.completed]: 'resolved',
      [TaskStatusType.deleted]: 'deleted'
    };
    if (taskType === TaskType.TASK) {
      this.router.navigate(['dashboard', 'inbox', 'detail', taskId], {
        queryParams: {
          type: 'TASK',
          conversationType: conversationType,
          conversationId: conversationId,
          fromScratch: null,
          tempConversationId: null,
          appMessageCreateType: null,
          pendingSelectFirst: null,
          tab: null
        },
        queryParamsHandling: 'merge'
      });
      this.conversationService.currentConversation.next(null);
      this.inboxService.triggerConversationId$.next(conversationId);
    } else {
      this.router.navigate(
        ['dashboard/inbox/sms-messages', statusUrl[taskStatus]],
        {
          queryParams: {
            status: taskStatus,
            taskId: taskId,
            conversationId: conversationId,
            taskTypeID: null,
            inboxType: TaskStatusType.team_task,
            fromScratch: null,
            tempConversationId: null,
            pendingSelectFirst: null
          },
          queryParamsHandling: 'merge'
        }
      );
      this.conversationService.triggerGoToAppMessage$.next(true);
    }
  }

  handleOpenUserProfile(event) {
    event.stopPropagation();
    const dataUser = {
      ...this.currentConversation?.participants?.find(
        (user) => user.userId === this.currentConversation.userId
      ),
      conversationType: this.currentConversation.conversationType,
      fromPhoneNumber: this.currentConversation?.channelUser?.externalId,
      emailVerified: this.currentConversation?.emailVerified,
      isBelongToOtherContact: this.userInfo?.isBelongToOtherProperties,
      conversationId: this.currentConversation.id,
      currentPMJoined: this.currentPMJoined
    };
    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }

  handleReopen(conversation: UserConversation) {
    this.conversationService.activeOptionsID$.next('');
    if (!conversation) {
      return;
    }
    this.conversationService
      .updateStatus(
        EConversationType.open,
        conversation?.id,
        this.currentConversation.isSendViaEmail
      )
      .subscribe((res) => {
        if (res) {
          this.showToastChangeStatus(conversation, TaskStatusType.inprogress);
          this.conversationService.currentUserChangeConversationStatus(
            EMessageType.open
          );
          this.conversationService.setUpdatedConversation(
            res.id,
            EConversationType.open
          );
          this.conversationService.previousConversation$.next({
            ...conversation,
            status: EConversationType.open
          });
          this.conversationService.reloadConversationList.next(true);
        }
      });
  }

  handleMenu(
    option: EMessageMenuOption,
    event: Event,
    isCheckCrmStatus: boolean = false
  ) {
    if (
      this.currentConversation?.crmStatus === ECrmStatus.DELETED &&
      isCheckCrmStatus
    )
      return;

    if (
      this.isConsole &&
      ![
        EMessageMenuOption.MOVE_TO_FOLDER,
        EMessageMenuOption.MOVE_TO_TASK,
        EMessageMenuOption.CREATE_NEW_TASK,
        EMessageMenuOption.DOWNLOAD_AS_PDF
      ].includes(option)
    ) {
      event.stopPropagation();
      return;
    }
    switch (option) {
      case EMessageMenuOption.REOPEN:
        this.handleReopen(this.currentConversation);
        this.disabledBtn = true;
        break;

      case EMessageMenuOption.RESOLVE:
        this.confirmResolveSms = true;
        this.disabledBtn = true;
        break;

      case EMessageMenuOption.UNREAD:
      case EMessageMenuOption.READ:
        this.handleMarkUnreadConversation(this.currentConversation, option);
        break;

      case EMessageMenuOption.UN_FLAG:
      case EMessageMenuOption.FLAG:
        this.handleFlagUrgent(this.currentConversation);
        break;
      case EMessageMenuOption.SAVE_TO_PROPERTY_TREE:
        this.saveMessageToCRM(event, option);
        break;
      case EMessageMenuOption.DOWNLOAD_AS_PDF:
        this.saveMessageToCRM(event, option, true);
        break;
    }
    this.isThreeDotsMenuVisible = false;
  }

  selectedPropertyInDetail(propertyId) {
    this.selectedPropertyId = propertyId;
  }

  handleCancelConfirmProperties(value) {
    this.isShowModalConfirmProperties = value;
  }

  handleConfirmProperties() {
    this.syncConversationToCRM(EMessageMenuOption.SAVE_TO_PROPERTY_TREE);
  }

  saveMessageToCRM(e, type, isDownloadPDFAction: boolean = false) {
    this.isTriggeredDownloadPDFOption = isDownloadPDFAction;
    if (
      this.currentConversation.syncStatus === this.SYNC_TYPE.INPROGRESS ||
      this.isArchiveMailbox ||
      (this.isConsole && !isDownloadPDFAction)
    ) {
      e.stopPropagation();
      return;
    }

    this.syncMessagePropertyTreeService.setIsSyncToPT(true);

    const isTemporaryProperty = this.currentConversation?.isTemporaryProperty;

    if (isTemporaryProperty && !isDownloadPDFAction) {
      this.conversationNotMove = {
        listConversationNotMove: [this.currentConversation]
      };
      this.isShowModalConfirmProperties = true;
      return;
    }
    this.syncConversationToCRM(type);
  }

  syncConversationToCRM(crm: EMessageMenuOption) {
    const conversationSyncing = {
      conversationIds: [this.currentConversation.id],
      status: this.SYNC_TYPE.INPROGRESS
    };
    const payload = [
      {
        conversationId: this.currentConversation.id,
        propertyId: this.selectedPropertyId
      }
    ];
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

  showToastChangeStatus(conversation, status: TaskStatusType) {
    const dataForToast = {
      conversationId: conversation.id,
      taskId: this.currentTask.id,
      isShowToast: true,
      type: SocketType.changeStatusTask,
      mailBoxId: this.currentMailboxId,
      taskType: TaskType.MESSAGE,
      status: status,
      pushToAssignedUserIds: [],
      isAppMessage: true,
      conversationType: this.currentConversation.conversationType
    };
    if (!this.router.url.includes(ERouterLinkInbox.TASK_DETAIL))
      this.toastCustomService.openToastCustom(
        dataForToast,
        true,
        EToastCustomType.SUCCESS_WITH_VIEW_BTN
      );
  }

  handleMarkUnreadConversation(
    currentConversation,
    option: EMessageMenuOption
  ) {
    if (option === EMessageMenuOption.UNREAD) {
      this.conversationService
        .markAsUnread(currentConversation.id)
        .subscribe((res) => {
          this.currentConversation.isSeen = res.isSeen;
          this.currentConversation.isRead = res.isSeen;
          this.isReadMsg = res.isSeen;
          this.conversationService.markCurrentConversationBS.next({
            ...res,
            option
          });
          this.cdr.detectChanges();
        });
    } else {
      this.conversationService
        .markAsReadConversation(currentConversation.id, this.currentMailboxId)
        .subscribe((res) => {
          this.currentConversation.isSeen = res.isSeen;
          this.currentConversation.isRead = res.isSeen;
          this.conversationService.markCurrentConversationBS.next({
            ...res,
            option
          });
          this.inboxService.setChangeUnreadData({
            isReadMessage: true,
            previousMessageId: null,
            currentMessageId: null
          });
          this.cdr.detectChanges();
        });
    }
  }

  handleFlagUrgent(conversation: UserConversation) {
    this.conversationService
      .updateFlagUrgent(conversation.id)
      .subscribe((res: IFlagUrgentMessageResponse) => {
        this.currentConversation = {
          ...this.currentConversation,
          isUrgent: res?.isUrgent
        };
        this.isUrgent = res?.isUrgent;
        this.conversationService.reloadConversationList.next(true);
        this.cdr.detectChanges();
      });
  }

  handleConfirmResolveSms() {
    this.handleResolve(this.currentConversation);
    this.confirmResolveSms = false;
  }

  handleCancelModal() {
    this.confirmResolveSms = false;
  }

  handleResolve(conversation: UserConversationOption) {
    const summaryMsg = '';
    this.messageTaskLoadingService.onLoading();
    this.conversationService
      .updateStatus(
        EConversationType.resolved,
        conversation?.id,
        this.currentConversation.isSendViaEmail,
        summaryMsg
      )
      .pipe(finalize(() => this.messageTaskLoadingService.stopLoading()))
      .subscribe((res) => {
        if (res) {
          this.showToastChangeStatus(conversation, TaskStatusType.resolved);
          this.disabledBtn = false;
          this.conversationService.currentUserChangeConversationStatus(
            EMessageType.solved
          );
          this.conversationService.setUpdatedConversation(
            res.id,
            EConversationType.resolved
          );
          this.conversationService.previousConversation$.next({
            ...conversation,
            status: EConversationType.resolved
          });
          this.conversationService.reloadConversationList.next(true);
          this.taskService.reloadTaskArea$.next(true);
        }
      });
  }

  handleConversationAction(
    event: Event,
    option: EMessageMenuOption,
    isSchedule: boolean = false,
    isCheckCrmStatus: boolean = false
  ) {
    if (option === EMessageMenuOption.RESOLVE) {
      if (this.activatedRoute.snapshot.queryParams['fromScratch']) {
        this.router.navigate([], {
          queryParams: {
            fromScratch: null
          },
          queryParamsHandling: 'merge'
        });
      }
    }

    if (
      this.currentConversation?.crmStatus === ECrmStatus.DELETED &&
      isCheckCrmStatus
    )
      return;

    this.headerService.setConversationAction({
      option,
      taskId: this.currentTask?.id,
      conversationId: this.queryParams.get('conversationId'),
      isTriggeredFromRightPanel: true
    });

    this.isThreeDotsMenuVisible = false;
  }

  onShowUpdatePropertyModal() {
    this.showUpdatePropertyModal = true;
  }

  closeMenu(): void {
    this.nzContextMenuService.close();
    this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
    this.sharedMessageViewService.setRightClickSelectedMessageId('');
  }

  updateUI() {
    this.cdr.markForCheck();
  }

  handleAssignAgentsSelectedClick(value) {
    this.taskService.currentTask$.next(value?.task);
  }

  handleOpenPropertyProfile() {
    if (
      this.currentConversation?.isTemporaryProperty ||
      !this.currentConversation?.streetline
    )
      return;
    this.visiblePropertyProfile = true;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
