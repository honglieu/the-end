import { AppMessageListService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-list.service';
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
import { Subject, distinctUntilChanged, filter, takeUntil } from 'rxjs';
import { HeaderService } from '@services/header.service';
import {
  AssignToAgent,
  TaskItem,
  TaskItemDropdown
} from '@shared/types/task.interface';
import { TaskService } from '@services/task.service';
import { SharedService } from '@services/shared.service';
import {
  ECategoryType,
  EConversationType,
  EMessageType,
  EPropertyStatus,
  ESyncToRmStatus,
  ETrudiType,
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
import { EPopupConversionTask } from '@/app/dashboard/modules/inbox/modules/message-list-view/enum/message.enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { UserPropInSelectPeople } from '@shared/types/user.interface';
import { MessageService } from '@services/message.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { TrudiResponse } from '@shared/types/trudi.interface';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import { FormControl, FormGroup } from '@angular/forms';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { EDataE2EConversation } from '@shared/enum/E2E.enum';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { UnhappyStatus } from '@shared/types/unhappy-path.interface';
import {
  TaskDetailService,
  UserProfileDrawerService
} from '@/app/task-detail/services/task-detail.service';
import { ErrorMessages, SYNC_PT_FAIL } from '@services/constants';
import {
  IParticipant,
  UserConversation
} from '@shared/types/conversation.interface';
import { Property } from '@shared/types/property.interface';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { AppMessageMenuService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-menu.service';
import { ToastrService } from 'ngx-toastr';
import {
  MESSAGE_MOVING_TO_TASK,
  MOVE_MESSAGE_FAIL
} from '@services/messages.constants';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { MessageLoadingService } from '@/app/task-detail/services/message-loading.service';
import { ECrmStatus, ETypePage } from '@/app/user/utils/user.enum';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { HelperService } from '@services/helper.service';
import { getUserFromParticipants } from '@/app/trudi-send-msg/utils/helper-functions';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';

type UserConversationOption = Partial<UserConversation>;
@Component({
  selector: 'app-message-detail-header',
  templateUrl: './app-message-detail-header.component.html',
  styleUrls: ['./app-message-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppMessageDetailHeaderComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() currentConversation: UserConversation;
  @Input() currentProperty: Property;
  @Input() isAppMessageLog: boolean = false;
  @Input() isCallConversation: boolean = false;
  @Input() activeMobileApp: boolean;
  @Input() typeShowAppMsg: boolean = false;
  @Input() loading: boolean = false;
  @Input() hasTrudiAssignee: boolean = false;
  @Output() reopenMsg = new EventEmitter();
  @Output() resolveMsg = new EventEmitter();
  public isThreeDotsMenuVisible = false;
  private unsubscribe = new Subject<boolean>();
  public isAddToTaskSubMenuVisible = false;
  public assignedAgents: AssignToAgent[] = [];
  public isArchiveMailbox: boolean = false;
  public menuDropDown = {
    addTask: true,
    read: true,
    unread: false,
    resolve: true,
    reOpen: true,
    urgent: true
  };
  readonly TaskStatusType = TaskStatusType;
  readonly EMessageMenuOption = EMessageMenuOption;
  readonly EConversationType = EConversationType;
  readonly ESyncToRmStatus = ESyncToRmStatus;
  public isReadMsg: boolean = false;
  public isRmEnvironment: boolean = false;
  public isPTEnvironment: boolean = false;
  public currentTaskDeleted: boolean = false;
  readonly EButtonType = EButtonType;
  readonly EButtonTask = EButtonTask;
  readonly popupTypeConversionTask = EPopupConversionTask;
  public currentPropertyId: string;
  public categoryID: string;
  public openFrom: CreateTaskByCateOpenFrom;
  public activeProperty: UserPropInSelectPeople[];
  public taskNameList: TaskItemDropdown[];
  public propertyIds: string[] = [];
  public taskIds: string[] = [];
  public isUnHappyPath = false;
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
  public isShowModalUpdateProperty: boolean = false;
  public isShowModalAddNote: boolean = false;
  public isExpandProperty: boolean = true;
  public formSelectProperty: FormGroup;
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
  public errorMessage: string;
  public isShowModalWarning: boolean = false;
  public statusMessage: string;
  public targetConvId: string;
  public confirmDelete: boolean = false;
  public params: Params;
  public isReopen: boolean = false;
  public isResolved: boolean = false;
  public userInfo: IParticipant;
  readonly EUserPropertyType = EUserPropertyType;
  public currentMailboxId: string;
  public iconMessageTypeTicket: string;
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
    private appMessageMenuService: AppMessageMenuService,
    private cdr: ChangeDetectorRef,
    private sharedMessageViewService: SharedMessageViewService,
    public conversationService: ConversationService,
    public propertiesService: PropertiesService,
    private messageService: MessageService,
    private activatedRoute: ActivatedRoute,
    private agencyService: AgencyService,
    private propertyService: PropertiesService,
    private inboxToolbarService: InboxToolbarService,
    private nzContextMenuService: NzContextMenuService,
    private readonly userProfileDrawerService: UserProfileDrawerService,
    public router: Router,
    private toastService: ToastrService,
    private inboxSidebarService: InboxSidebarService,
    public taskDetailService: TaskDetailService,
    private messageLoadingService: MessageLoadingService,
    private appMessageListService: AppMessageListService,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private toastCustomService: ToastCustomService,
    private hepler: HelperService,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe
  ) {
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((params) => {
        this.queryParams = params;
      });
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentMailboxId) => {
        this.currentMailboxId = currentMailboxId;
      });
    this.conversationService.isShowModalWarrningSchedule
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data: boolean) => {
        this.errorMessage = ErrorMessages.RESOLVE_CONVERSATION;
        this.isShowModalWarning = data;
      });

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow) => {
        this.isArchiveMailbox = isShow;
      });

    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((res) => {
        if (Array.isArray(res.assignToAgents)) {
          this.assignedAgents = res.assignToAgents
            ?.map((item) => ({
              ...(item || {}),
              fullName: this.sharedService.displayName(
                item.firstName,
                item.lastName
              )
            }))
            .filter(
              (value, index, self) =>
                index === self.findIndex((t) => t.id === value.id)
            );
        }
        this.currentTask = res;
        this.selectedPropertyId = res.property.id;
        this.currentAgencyId = res.agencyId;
        this.isReadMsg = this.currentTask.conversations.some(
          (msg) =>
            this.queryParams.get('conversationId') === msg.id && msg.isSeen
        );
        this.isUrgent = this.currentTask.conversations.some(
          (msg) =>
            this.queryParams.get('conversationId') === msg.id && msg.isUrgent
        );
        this.checkMenuCondition();
        this.isUnHappyPath = res.isUnHappyPath;
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
        this.setDataUnHappyPath();
        this.currentTaskDeleted = this.taskService.checkIfCurrentTaskDeleted();
      });

    this.messageService.requestShowUserInfo
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.isRequestShowUserInfoFromTaskConversation =
          res.isFromTaskCoversation;
        this.showModalPeople();
        this.messageService.requestShowUserInfo.next(null);
      });

    this.conversationService.currentConversation
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        if (!res || !Object.keys(res).length) return;
        this.currentConversation = {
          ...res,
          syncStatus: res.syncStatus || res.conversationSyncDocumentStatus
        };
      });

    this.initForm();
    this.subscribePortalConversation();
    this.getCurrentCompany();
    this.getPropertyId();
    this.conversationService.markCurrentConversationBS
      .pipe(
        takeUntil(this.unsubscribe),
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
    this.syncMessagePropertyTreeService.isSyncToPT$
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe(() => {
        this.handleSyncStatusMessage();
      });
  }

  handleSyncStatusMessage() {
    this.syncMessagePropertyTreeService.listConversationStatus
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listMessageSyncStatus) => {
        if (!listMessageSyncStatus) return;
        const {
          conversationSyncDocumentStatus,
          timestamp,
          status,
          downloadingPDFFile
        } = listMessageSyncStatus || {};
        if (!this.currentConversation) return;
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

  initForm() {
    this.formSelectProperty = new FormGroup({
      propertyId: new FormControl(null)
    });
  }

  getPropertyId() {
    this.propertyService.currentPropertyId
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.currentPropertyId = res;
      });
  }

  getCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs) {
          this.crmSystemId = rs?.CRM;
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(rs);
        }
      });
  }

  subscribePortalConversation() {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentConversation']?.currentValue) {
      if (this.currentConversation.isScratchDraft) {
        this.setScratchDraftData(this.currentConversation);
      }
      this.currentConversation = changes['currentConversation']?.currentValue;
      this.checkIconMessageTypeTicket(this.currentConversation?.categoryId);
      this.propertyStatus =
        changes['currentConversation']?.currentValue?.propertyStatus;
      this.userInfo = changes[
        'currentConversation'
      ]?.currentValue?.participants?.find(
        (item) => item?.type === EUserPropertyType.USER
      );
      if (this.params?.['status'] === TaskStatusType.draft) {
        this.statusMessage =
          this.currentConversation?.status === TaskStatusType.open
            ? TaskStatusType.open
            : TaskStatusType.resolved;
      }
      this.isReopen =
        this.currentConversation?.status === TaskStatusType.resolved ||
        this.currentConversation?.status === TaskStatusType.deleted;
      this.isResolved =
        this.currentConversation?.status === TaskStatusType.open ||
        this.currentConversation?.status === EConversationType.reopened ||
        this.currentConversation?.status === EConversationType.schedule;

      this.isDisableActionByOffBoardStatus =
        this.currentConversation?.conversationType === EConversationType.APP &&
        this.currentConversation?.status === TaskStatusType.resolved &&
        !!this.currentConversation?.offBoardedDate;
    }
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
        ['dashboard/inbox/app-messages', statusUrl[taskStatus]],
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
    const userId = this.currentConversation?.userId;
    const currentDataUserProfile = this.currentConversation?.participants.find(
      (p) => p.userId === userId
    );
    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      currentDataUserProfile as unknown as UserProperty
    );
  }

  checkIconMessageTypeTicket(categoryId: string) {
    switch (categoryId) {
      case ECategoryType.routineMaintenance:
        this.iconMessageTypeTicket = 'maintenanceV2';
        break;
      case ECategoryType.generalEnquiryId:
        this.iconMessageTypeTicket = 'iconHelpV2';
        break;
      case ECategoryType.tenantVacate:
        this.iconMessageTypeTicket = 'vacateV2';
        break;
      case ECategoryType.request_inspection_reschedule:
        this.iconMessageTypeTicket = 'timeIcon';
        break;
      default:
        this.iconMessageTypeTicket = null;
        break;
    }
  }

  stopProcessTask() {
    this.taskService.triggerToggleMoveConversationSate.next({
      singleMessage: false,
      multipleMessages: false,
      isTaskDetail: false
    });
    this.sharedMessageViewService.setPrefillCreateTaskData(null);
    this.appMessageListService.setIsMoveToExistingTask(false);
    this.cdr.markForCheck();
  }

  setDataUnHappyPath() {
    if (!!this.currentTask && !!this.currentConversation) {
      if (
        this.currentTask.taskType === TaskType.MESSAGE ||
        this.trudiResponse?.type !== ETrudiType.unhappy_path
      ) {
        this.isUnHappyPath = this.currentTask?.isUnHappyPath;
        if (!this.unhappyPathLoading) {
          this.isUnidentifiedEmail = this.currentTask?.isUnindentifiedEmail;
          this.isUnidentifiedPhoneNumber =
            this.trudiResponse?.data?.[0]?.body?.isUnindentifiedPhoneNumber;
        }
        this.isUnidentifiedProperty = this.currentTask?.isUnindentifiedProperty;
      } else if (this.trudiResponse?.type === ETrudiType.unhappy_path) {
        this.isUnHappyPath = true;
        this.isSuperHappyPath =
          this.trudiResponse?.data?.[0]?.body?.isSuperHappyPath;
        this.isUnidentifiedEmail =
          this.trudiResponse?.data?.[0]?.body?.isUnindentifiedEmail;
        this.isUnidentifiedPhoneNumber =
          this.trudiResponse?.data?.[0]?.body?.isUnindentifiedPhoneNumber;
        this.isUnidentifiedProperty =
          this.trudiResponse?.data?.[0]?.body?.isUnindentifiedProperty;
      }
    }
  }

  checkMenuCondition() {
    this.menuDropDown.reOpen = !(
      this.currentTask.status === TaskStatusType.unassigned ||
      this.currentTask.status === TaskStatusType.inprogress
    );
    this.menuDropDown.resolve = !(
      this.currentTask.status === TaskStatusType.deleted ||
      this.currentTask.status === TaskStatusType.completed
    );
    this.menuDropDown.urgent =
      this.currentTask.status === TaskStatusType.inprogress ||
      this.currentTask.status === TaskStatusType.unassigned;

    this.menuDropDown.unread = this.isReadMsg;
  }

  handleMenu(
    option: EMessageMenuOption,
    conversation: UserConversation,
    event: Event,
    isCheckCrmStatus: boolean = false
  ) {
    this.taskService.reloadTaskDetail.next(true);
    if (conversation?.crmStatus === ECrmStatus.DELETED && isCheckCrmStatus)
      return;

    if (
      this.isConsole &&
      ![
        EMessageMenuOption.MOVE_TO_FOLDER,
        EMessageMenuOption.MOVE_TO_TASK,
        EMessageMenuOption.CREATE_NEW_TASK
      ].includes(option)
    ) {
      event.stopPropagation();
      return;
    }
    this.currentConversation = conversation;
    switch (option) {
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
      this.isConsole
    ) {
      e.stopPropagation();
      return;
    }

    this.syncMessagePropertyTreeService.setIsSyncToPT(true);

    const isTemporaryProperty =
      this.taskService.currentTask$.value?.property?.isTemporary;
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

  handleConversationAction(
    event: Event,
    option: EMessageMenuOption,
    isSchedule: boolean = false,
    isCheckCrmStatus: boolean = false
  ) {
    this.taskService.reloadTaskDetail.next(true);
    if (option === EMessageMenuOption.RESOLVE) {
      this.resolveMsg.emit();
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

    this.handleClearSelected();
    this.headerService.setConversationAction({
      option,
      taskId: this.currentTask?.id,
      conversationId: this.queryParams.get('conversationId'),
      isTriggeredFromRightPanel: true
    });
    this.isAddToTaskSubMenuVisible = false;
    this.isThreeDotsMenuVisible = false;
  }

  handleConvertToTask(): void {
    this.appMessageMenuService.handleCreateNewTask(this.currentTask);
    this.handleClearSelected();
  }

  handleClearSelected() {
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.taskService.setSelectedConversationList([]);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
    this.isAddToTaskSubMenuVisible = false;
  }

  handleOpenConvertToTask() {
    this.sharedMessageViewService.setPrefillCreateTaskData(this.currentTask);
    const conversation = this.currentTask?.conversations.find(
      (convo) => convo.id === this.currentConversation.id
    );
    this.conversationService.currentConversation.next({
      ...this.currentConversation,
      conversation
    });
    this.categoryID = conversation?.categoryId;
    if (conversation?.trudiResponse) {
      this.conversationService.superHappyPathTrudiResponse.next(
        conversation?.trudiResponse
      );
    }
    const propertyId = conversation?.propertyId || conversation?.property?.id;
    this.currentPropertyId = propertyId;

    this.propertiesService
      .getAgencyProperty(conversation?.user?.id, propertyId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((activeProperty) => {
        this.openFrom = CreateTaskByCateOpenFrom.MESSAGE;
        this.activeProperty = activeProperty;
        this.taskNameList = this.taskService.createTaskNameList();
        this.cdr.markForCheck();
      });
  }

  removeAppMessage(conversation) {
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
          this.inboxSidebarService.refreshStatisticsUnreadTask(
            this.currentMailboxId
          );
          this.conversationService.reloadConversationList.next(true);
          if (this.router.url.includes(ERouterLinkInbox.TASK_DETAIL)) {
            this.conversationService.navigateToFirstOfNextConversation(
              conversation.id
            );
          }

          this.messageLoadingService.setLoading(false);
        },
        error: () => {
          this.toastService.clear();
          this.toastService.error(MOVE_MESSAGE_FAIL);
        }
      });
  }

  showQuitConfirm(status: boolean) {
    this.confirmDelete = status;
  }

  closeMenu(): void {
    this.nzContextMenuService.close();
    this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
    this.sharedMessageViewService.setRightClickSelectedMessageId('');
  }

  onInfoUser() {
    if (this.propertyStatus === EPropertyStatus.deleted) return;
    this.messageService.requestShowUserInfo.next({
      ...this.messageService.requestShowUserInfo.getValue,
      showModal: true,
      isFromTaskCoversation: true
    });
  }

  showModalPeople() {
    let isExistedStreetLine;
    const { shortenStreetline, streetline } =
      this.taskService.currentTask$?.getValue()?.property || {};
    switch (this.crmSystemId) {
      case ECrmSystemId.PROPERTY_TREE:
        isExistedStreetLine = shortenStreetline;
        break;
      case ECrmSystemId.RENT_MANAGER:
        isExistedStreetLine = streetline;
        break;
      default:
        break;
    }
    if (isExistedStreetLine !== '') {
      this.isShowModalPeople = true;
      this.isShowPersonMd = true;
    }
  }

  get propertyIdFormControl() {
    return this.formSelectProperty.get('propertyId');
  }

  isCloseModal($event) {
    this.isShowModalAddNote = false;
    this.isShowModalPeople = false;
    this.isShowModalUpdateProperty = false;
    this.propertyIdFormControl.setValue(null);
  }

  isCloseModalAddNote(e) {
    this.isShowModalAddNote = false;
    this.isShowModalPeople = false;
  }

  isShowModalAdd($event) {
    this.isShowModalAddNote = true;
    this.isShowPersonMd = false;
    this.isShowModalPeople = true;
  }

  statusProperty($event) {
    this.isExpandProperty = $event;
  }

  onSubmitAddNote(body) {
    this.isShowPersonMd = true;
    this.isShowModalAddNote = false;
  }

  handleBackAddNote(e) {
    this.isShowModalAddNote = e;
    this.isShowPersonMd = true;
  }

  statusExpandProperty($event) {
    this.isExpandProperty = $event;
  }

  updateUI() {
    this.cdr.markForCheck();
  }

  handleAssignAgentsSelectedClick(value) {
    this.taskService.currentTask$.next(value?.task);
  }

  handleOpenPropertyProfile() {
    const { id } = this.currentTask?.property || {};
    if (this.propertyStatus === EPropertyStatus.deleted || !id) return;
    this.visiblePropertyProfile = true;
  }

  ngOnDestroy() {
    this.unsubscribe.next(true);
    this.unsubscribe.complete();
  }

  protected readonly ETypePage = ETypePage;
}
