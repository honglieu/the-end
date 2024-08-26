import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

import { animate, style, transition, trigger } from '@angular/animations';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { startCase } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import {
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  merge,
  of,
  pairwise,
  startWith,
  switchMap,
  takeUntil
} from 'rxjs';
import {
  EAddOn,
  EAgencyPlan
} from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { ControlPanelService } from '@/app/control-panel/control-panel.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  AgencyService as AgencyDashboardService,
  AgencyService
} from '@/app/dashboard/services/agency.service';
import {
  CALL_TYPE,
  CONVERSATION_STATUS,
  ErrorMessages,
  SYNC_PT_FAIL,
  trudiUserId
} from '@services/constants';
import {
  ConversationService,
  MessageStatus
} from '@services/conversation.service';
import { HeaderService } from '@services/header.service';
import { LoadingService } from '@services/loading.service';
import { CallButtonState, MessageService } from '@services/message.service';
import {
  CAN_NOT_MOVE,
  MESSAGE_DELETED,
  MESSAGE_MOVING_TO_TASK,
  MOVE_MESSAGE_FAIL,
  UPGRADE_REQUEST_SENT
} from '@services/messages.constants';
import { PopupService } from '@services/popup.service';
import { PropertiesService } from '@services/properties.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { AssignAttachBoxComponent } from '@shared/components/assign-attach-box/assign-attach-box.component';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { EConfirmContactType } from '@shared/enum/contact-type';
import {
  EConversationType,
  ESyncToRmStatus
} from '@shared/enum/conversationType.enum';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import {
  ECallTooltipType,
  ECreatedFrom,
  EConversationAction,
  EMessageComeFromType,
  EMessageType
} from '@shared/enum/messageType.enum';
import { CallTypeEnum, ImgPath } from '@shared/enum/share.enum';
import {
  TaskStatusType,
  TaskStatusTypeLC,
  TaskType
} from '@shared/enum/task.enum';
import { ETrudiType } from '@shared/enum/trudi';
import {
  EPropertyStatus,
  EUserDetailStatus,
  EUserPropertyType,
  GroupType,
  UserStatus
} from '@shared/enum/user.enum';
import { displayName, isEmail } from '@shared/feature/function.feature';
import { userType } from '@trudi-ui';
import { UserConversation } from '@shared/types/conversation.interface';
import { CallType, ConfirmToCall } from '@shared/types/share.model';
import {
  AssignToAgent,
  SearchTask,
  TaskItem,
  TaskListMove
} from '@shared/types/task.interface';
import { TrudiResponse } from '@shared/types/trudi.interface';
import { UnhappyStatus } from '@shared/types/unhappy-path.interface';
import { IMailBox, IUserParticipant } from '@shared/types/user.interface';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import {
  EMessageMenuOption,
  EMessageQueryType,
  IFlagUrgentMessageResponse,
  IListMessageResolve
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { IconsSync } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import {
  ShowSidebarRightService,
  TaskDetailService
} from '@/app/task-detail/services/task-detail.service';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import {
  EmailItem,
  ICheckMoveMailFolderResponse,
  IPortalConversation
} from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import {
  EButtonAction,
  IAddToTaskConfig
} from '@/app/task-detail/interfaces/task-detail.interface';
import { MessageMenuService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-menu.service';
import { CompanyService } from '@services/company.service';
import { AISummaryFacadeService } from '@/app/task-detail/modules/app-chat/components/ai-summary/ai-summary-facade.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import {
  EToastCustomType,
  EToastSocketTitle
} from '@/app/toast-custom/toastCustomType';
import { EPopupMoveMessToTaskState } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { EPopupConversionTask } from '@/app/dashboard/modules/inbox/modules/message-list-view/enum/message.enum';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { SocketType } from '@shared/enum';
import { ETypePage } from '@/app/user/utils/user.enum';
import { AddToTaskWarningService } from '@/app/dashboard/modules/inbox/components/add-to-task-warning/add-to-task-warning.service';
import { HelperService } from '@/app/services/helper.service';
import { FormControl, FormGroup } from '@angular/forms';
import {
  ILinkedConversationToDisplay,
  sortSuggestedProperties,
  UserPropertyInPeople
} from '@/app/shared';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { ITaskRow } from '@/app/dashboard/modules/task-page/interfaces/task.interface';

const NOTE_ZONE_TRANSITION = '.25s';

type UserConversationOption = Partial<UserConversation>;
@Component({
  selector: 'app-chat-header',
  templateUrl: './app-chat-header.component.html',
  styleUrls: ['./app-chat-header.component.scss'],
  animations: [
    trigger('toTopFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          NOTE_ZONE_TRANSITION,
          style({ opacity: 1, transform: 'translateY(8px)' })
        )
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(8px)' }),
        animate(
          NOTE_ZONE_TRANSITION,
          style({ opacity: 0, transform: 'translateY(-10px)' })
        )
      ])
    ]),
    trigger('collapse', [
      transition(':enter', [
        style({ height: '0' }),
        animate(NOTE_ZONE_TRANSITION, style({ height: '108px' }))
      ]),
      transition(':leave', [
        style({ height: '108px' }),
        animate(NOTE_ZONE_TRANSITION, style({ height: '0' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('0.25s', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('0.25s', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class AppChatHeaderComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('assignAttachBox') assignAttachBox: AssignAttachBoxComponent;
  @ViewChild('editIconEl') editIconEl: ElementRef<HTMLElement>;
  @ViewChild('divideLine') divideLine: ElementRef;
  @Input() taskDetailViewMode: EViewDetailMode = EViewDetailMode.TASK;
  @Input() currentConversation: UserConversation;
  @Input() currentProperty: any;
  @Input() currentPropertyType: string;
  @Input() inviteDeactive: boolean;
  @Input() showVideoCallBtn: boolean;
  @Input() chatDetailWidth: number;
  @Input() selectedUser: string;
  @Input() listNonAppUserPhoneNumber: string[];
  @Input() selectedRole: string;
  @Input() isTaskType: boolean = false;
  @Input() isShowConfirmCallModal: boolean = false;
  @Input() appChatHeader: boolean = false;
  @Input() statusModalMessage: boolean = false;
  @Input() prefillToCcBccReceiversList;
  @Input() messageInTask: boolean = false;

  @Output() onShowAgentJoin = new EventEmitter<void>();
  @Output() onActiveCall = new EventEmitter<boolean>();
  @Output() toggleSidebarRight = new EventEmitter<boolean>();
  public assignedAgents: AssignToAgent[] = [];
  public isUnHappyPath: boolean;
  public unhappyStatus: UnhappyStatus;
  public currentTaskDeleted: boolean = false;
  public userPropertyType = EUserPropertyType;
  public callType = CallTypeEnum;
  public ImgPath = ImgPath;
  public popupModalPosition = ModalPopupPosition;
  public listTask: TaskListMove[];
  public iconSync;
  public listConversationSyncing = [];
  readonly SYNC_STATUS = SyncMaintenanceType;
  private LAZY_LOAD_TASK = 50;
  readonly SYNC_TYPE = SyncMaintenanceType;
  readonly ICON_SYNC = IconsSync;
  readonly EButtonAction = EButtonAction;
  public propertyId;
  private searchTask: SearchTask = {
    term: '',
    onlyMyTasks: true,
    onlyInprogress: true
  };

  public EUserDetailStatus = EUserDetailStatus;
  public emailConfirmSendVerified = '';
  public userIdConfirmSendVerified = '';
  public selectedUserPropertiesId: '';
  public task: TaskItem;
  public isShowQuitConfirmModal: boolean = false;
  public isActionSyncConversationToRM: boolean = false;
  public isCreateMessageType: boolean = false;
  conversationForward: UserConversationOption;
  eConfirmContactType = EConfirmContactType;
  public taskMsgDetail: TaskItem;
  public isThreeDotBtnActive: boolean = false;
  public isVoiceCall: boolean = false;
  public isVideoCall: boolean = false;
  public isActiveVoiceCallMessage: boolean = false;
  public isActiveVideoCallMessage: boolean = false;
  public isArchiveMailbox: boolean = false;
  public isDisconnected: boolean = false;
  public isDisconnectCompanyMailbox: boolean;
  public isHiddenPrimary = false;
  public isDisplayButtonMove: boolean;
  public modalAddToTask: EPopupConversionTask;
  public modalTypeAddToTask = EPopupConversionTask;
  public isInbox: boolean = false;
  private prevConversationId: string = null;

  TaskStatusType = TaskStatusType;
  messageComeFromType = EMessageComeFromType;
  ECreatedFrom = ECreatedFrom;
  public typeOfCall: CallType;
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
  public callInProgressTooltip = 'Call in progress';

  public readonly ECallTooltipType = ECallTooltipType;
  public callTooltipType: {
    voice: ECallTooltipType;
    video: ECallTooltipType;
  };
  public isProgressCall: boolean;
  public agencyPlans: EAgencyPlan;
  EConversationType = EConversationType;
  private verifyMailTimeOut: NodeJS.Timeout = null;

  private unsubscribe = new Subject<boolean>();
  public assignAttachBoxState = false;
  public taskType = TaskType;
  public isShowModalAddNote: boolean = false;
  public isExpandProperty: boolean = true;
  public isShowAddressMoveConversation: boolean = false;
  public isShowModalUpdateProperty = false;
  public isDisallowReassignProperty = false;
  public errorMessage: string;
  public isShowModalWarning: boolean = false;
  public isDeletedOrArchived: boolean;
  public activeMobileApp: boolean;
  public isSendViaEmail: boolean;
  public isAppUser: boolean;
  public requestDataCall: CallButtonState;
  public fullName: string = '';

  readonly TaskType = TaskType;
  public trudiResponse: TrudiResponse;
  public typeTrudi: string;
  public TYPE_TRUDI = ETrudiType;
  public isUnindentifiedEmail = false;
  public isUnindentifiedPhoneNumber = false;
  public isUnindentifiedProperty = false;
  public isSuperHappyPath = false;
  public overlayDropdown: boolean;
  public placeHolderTrudiUnhappy = '';
  public showPopup: boolean = false;
  public isConfirmContactUser: boolean = false;
  public unhappyPathLoading: boolean = false;
  public showPopover: boolean = false;
  public isRmEnvironment: boolean = false;
  public isDetectInfoRm: boolean = false;
  public pipeType: string = userType.DEFAULT;
  public currentAgencyId: string;
  public conversationName: string;
  public currentMailboxId: string;
  public canUseAISummary: boolean;
  public upSellAISummaryMessage: string;
  public isConsoleUser: boolean;
  public noMessages: boolean;
  public mailBox: IMailBox;
  public messageStatus = MessageStatus;
  public isShowModalConfirmProperties: boolean = false;
  public selectedPropertyId: string = '';
  public conversationNotMove = {};
  public isDraftFolder: boolean = false;
  public portalConversation: IPortalConversation;
  readonly taskStatusType = TaskStatusType;
  readonly SYNC_PT_FAIL = SYNC_PT_FAIL;
  readonly IconsSync = IconsSync;
  readonly ESyncToRmStatus = ESyncToRmStatus;
  EViewDetailMode = EViewDetailMode;
  isShowSidebarRight: boolean = false;
  EConversationAction = EConversationAction;
  EMessageMenuOption = EMessageMenuOption;
  public menuDropDown = {
    moveToFolder: true,
    forward: true,
    unread: false,
    resolve: true,
    reOpen: true,
    reportSpam: true,
    delete: true,
    urgent: true
  };
  isReadMsg: boolean = false;
  isUrgent: boolean = false;
  readonly EMessageStatus = MessageStatus;
  showConvertToTask = false;
  isAddToTaskSubMenuVisible = false;
  isThreeDotsMenuVisible = false;
  public isDeletedEnquiries: boolean;
  public currentQueryParams: Params;
  public participantId: string;
  public listMobileNumber: string[];
  public selectedParticipant: IUserParticipant;
  public selectedRoleParticipant: string;
  public selectedUserId: string;
  public participantPropertyId: string;
  // visibleAITemplate: boolean = false;
  private refetchCheckMoveToFolder$ = new Subject<void>();
  public summaryContent: string;
  public aiSummaryFiles = [];
  public isMoving: boolean = false;
  public listMessageSyncPropertyTree: IListMessageResolve[];
  public isPTEnvironment: boolean = false;
  public disableExportButton: boolean = false;

  readonly EPropertyStatus = EPropertyStatus;
  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;
  public disabledBtn: boolean = false;
  public visiblePropertyProfile = false;
  private isTriggeredDownloadPDFOption: boolean = false;
  public showMessageHasLinkedTask: boolean = false;
  public isMessage: boolean = false;
  private queryParams: ParamMap;
  public disabledDownloadPDF: boolean = false;
  public isPropertyUpdating = false;
  public formSelectProperty: FormGroup;
  private inboxItem: TaskItem[] | EmailItem[] | ITaskRow[] = [];
  public listPropertyAllStatus: UserPropertyInPeople[] = [];
  public listPropertyActive: UserPropertyInPeople[] = [];
  linkedConversationToDisplay: ILinkedConversationToDisplay;

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

  get getUserInfo() {
    return this.userService.userInfo$;
  }

  constructor(
    private voicemailInboxService: VoiceMailService,
    private agencyService: AgencyService,
    private agencyDashboardService: AgencyDashboardService,
    private panelService: ControlPanelService,
    private propertyService: PropertiesService,
    public conversationService: ConversationService,
    private userService: UserService,
    public taskService: TaskService,
    private sharedService: SharedService,
    private loadingService: LoadingService,
    private headerService: HeaderService,
    private popupService: PopupService,
    private toastService: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    public inboxService: InboxService,
    public shareService: SharedService,
    public addToTaskWarningService: AddToTaskWarningService,
    private cdr: ChangeDetectorRef,
    private aiSummaryFacadeService: AISummaryFacadeService,
    private syncResolveMessageService: SyncResolveMessageService,
    private emailApiService: EmailApiService,
    private showSidebarRightService: ShowSidebarRightService,
    private inboxToolbarService: InboxToolbarService,
    private titleCasePipe: TrudiTitleCasePipe,
    private messageMenuService: MessageMenuService,
    private companyService: CompanyService,
    private taskDetailService: TaskDetailService,
    private sharedMessageViewService: SharedMessageViewService,
    private inboxSidebarService: InboxSidebarService,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private toastCustomService: ToastCustomService,
    private hepler: HelperService,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((params) => {
        this.queryParams = params;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { isShowConfirmCallModal, currentConversation, statusModalMessage } =
      changes;

    if (isShowConfirmCallModal?.currentValue) {
      this.handlePopupState({ confirmCall: true });
    }
    if (currentConversation?.currentValue) {
      this.messageService.requestDataMsgDetail.next([
        this.task,
        this.currentConversation
      ]);
      this.getPlaceholderTrudiUnhappy(
        this.currentConversation?.trudiResponse?.data?.[0]?.body?.text
      );

      this.isMessage =
        !this.hepler.isInboxDetail ||
        this.currentConversation?.taskType === TaskType.MESSAGE;
      this.handleSetTrudiResponse(this.currentConversation?.trudiResponse);
      this.setDataUnHappyPath();
    }

    if (!statusModalMessage?.currentValue) {
      this.isVideoCall = statusModalMessage?.currentValue;
      this.isVoiceCall = statusModalMessage?.currentValue;
    }
    this.bindConversationName();
  }

  subscribeCheckMoveToFolder() {
    this.refetchCheckMoveToFolder$
      .pipe(
        switchMap(() =>
          this.emailApiService.checkMoveMailFolder({
            mailBoxId: this.currentMailboxId,
            threadIds: [],
            conversationIds: [this.task.conversations[0].id],
            status: this.currentQueryParams['status']
          })
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res: ICheckMoveMailFolderResponse) => {
        if (!res) return;
        this.isDisplayButtonMove = !res?.emailFolders?.length;
        const emailFolders = res?.emailFolders.map((item) => item.id);
        this.emailApiService.setlistEmailFolder(emailFolders);
      });
  }
  handleClickThreeDotsButton() {
    if (!this.isThreeDotsMenuVisible) {
      this.refetchCheckMoveToFolder$.next();
    }
  }

  handleClearSelected() {
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.taskService.setSelectedConversationList([]);
    this.inboxService.currentSelectedTaskTemplate$.next(null);
    this.isAddToTaskSubMenuVisible = false;
  }

  handleConversationAction(
    event: Event,
    option: EMessageMenuOption,
    isSchedule: boolean = false
  ) {
    this.handleClearSelected();
    if (
      (this.isConsoleUser &&
        ![
          EMessageMenuOption.MOVE_TO_FOLDER,
          EMessageMenuOption.MOVE_TO_TASK
        ].includes(option)) ||
      isSchedule
    ) {
      event.stopPropagation();
      return;
    }
    this.headerService.setConversationAction({
      option,
      taskId: this.task.id,
      conversationId: this.queryParams.get('conversationId'),
      isTriggeredFromRightPanel: true
    });
    this.isAddToTaskSubMenuVisible = false;
    this.isThreeDotsMenuVisible = false;
    this.handleCancelModal();
  }

  requestToCallWithType(call: {
    type: CallTypeEnum;
    isActive: boolean;
    participant: IUserParticipant;
  }) {
    const { type, isActive, participant } = call;
    this.listMobileNumber = participant?.secondaryPhoneNumber
      ? [participant.secondaryPhoneNumber]
      : participant?.phoneNumberFromConversationLog
      ? [participant.phoneNumberFromConversationLog]
      : participant?.mobileNumber?.length
      ? [...participant.mobileNumber]
      : participant?.phoneNumber
      ? [participant.phoneNumber]
      : [];
    this.selectedParticipant = participant;
    this.selectedUserId = participant?.userId;
    this.participantPropertyId =
      participant?.propertyId ||
      this.conversationService.currentConversation.value?.propertyId;
    this.selectedRoleParticipant = this.titleCasePipe.transform(
      participant?.determineUserType?.toLowerCase()
    );
    if (type === this.callType.videoCall) {
      this.isActiveVideoCallMessage = !this.isActiveVideoCallMessage;
    } else if (type === this.callType.voiceCall) {
      this.isActiveVoiceCallMessage = !this.isActiveVoiceCallMessage;
    }
    const conversationId =
      this.conversationService.currentConversation.value?.id;
    this.messageService.requestToCall.next({ conversationId, type });

    if (isActive) {
      this.messageService.isActiveCallMessage.next(
        this.messageService.isActiveCallMessage.getValue() + 1
      );
    }
  }

  onUserProfilePage() {
    if (this.currentConversation?.crmStatus === EUserDetailStatus.DELETED)
      return;
    this.messageService.requestShowUserProfile.next({
      ...this.messageService.requestShowUserProfile.getValue,
      showModal: true,
      userId: this.currentConversation?.userId,
      propertiesId: this.taskMsgDetail?.property?.id
    });
  }

  getPlaceholderTrudiUnhappy(title: string) {
    if (title?.includes('property')) {
      this.overlayDropdown = true;
      this.placeHolderTrudiUnhappy = 'Search for property';
    } else if (title?.includes('contact')) {
      this.overlayDropdown = true;
      this.placeHolderTrudiUnhappy = 'Search for contact';
    } else if (title?.includes('task')) {
      this.overlayDropdown = false;
      this.placeHolderTrudiUnhappy = 'Search for task';
    }
  }

  bindConversationName() {
    if (isEmail(this.currentConversation?.firstName)) {
      this.conversationName = displayName(
        this.currentConversation.firstName,
        this.currentConversation.lastName
      );
    } else {
      this.conversationName = startCase(
        displayName(
          this.currentConversation?.firstName,
          this.currentConversation?.lastName
        )
      )?.trim();
    }
  }

  handleSetTrudiResponse(trudiResponse: TrudiResponse) {
    this.trudiResponse = JSON.parse(JSON.stringify(trudiResponse || {}));
    this.typeTrudi = this.trudiResponse?.type;
    this.getPlaceholderTrudiUnhappy(this.trudiResponse?.data?.[0]?.body?.text);
  }

  ngOnInit(): void {
    this.formSelectProperty = new FormGroup({
      propertyId: new FormControl(null)
    });
    this.subscribeListProperties();
    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.inboxItem = res;
      });
    this.conversationService.isShowModalWarrningSchedule
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data: boolean) => {
        this.errorMessage = ErrorMessages.RESOLVE_CONVERSATION;
        this.isShowModalWarning = data;
      });

    this.route.queryParams
      .pipe(
        startWith(this.route.snapshot.queryParams),
        pairwise(),
        takeUntil(this.unsubscribe)
      )
      .subscribe(([prevParams, currentParams]) => {
        const prevTaskId = prevParams['taskId'];
        const currentTaskId = currentParams['taskId'];
        this.currentQueryParams = currentParams;
        this.isDeletedEnquiries =
          currentParams[EMessageQueryType.MESSAGE_STATUS] ===
          TaskStatusType.deleted;

        if (currentTaskId && currentTaskId !== prevTaskId) {
          this.isShowSidebarRight = false;
          this.toggleSidebarRight.emit(this.isShowSidebarRight);
        }
      });

    this.agencyService.currentPlan$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((configPlan) => {
        if (!configPlan) return;
        this.agencyPlans = configPlan.plan;
      });

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow) => {
        this.isArchiveMailbox = isShow;
      });

    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isDisconnected) => {
        this.isDisconnected = isDisconnected;
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentMailboxId) => {
        this.currentMailboxId = currentMailboxId;
      });

    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res || !Object.keys(res).length) {
          this.currentConversation = null;
          this.task = null;
        }
        if (res && Array.isArray(res.assignToAgents)) {
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
        if (res) {
          this.task = res;
          this.currentAgencyId = res.agencyId;
          this.selectedPropertyId = res.property.id;
          this.isReadMsg = this.task.conversations.some(
            (msg) =>
              this.queryParams.get('conversationId') === msg.id && msg.isSeen
          );
          this.isUrgent = this.task.conversations.some(
            (msg) =>
              this.queryParams.get('conversationId') === msg.id && msg.isUrgent
          );
          this.checkMenuCondition();
          this.isUnHappyPath = res.isUnHappyPath;
          this.unhappyStatus = res.unhappyStatus;
          this.messageService.requestDataMsgDetail.next([
            this.task,
            this.currentConversation
          ]);
        }
        this.setDataUnHappyPath();
        this.currentTaskDeleted = this.taskService.checkIfCurrentTaskDeleted();
      });

    this.messageService.requestToCall
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.requestToCall(res.conversationId, res.type);
        this.messageService.requestToCall.next(null);
      });

    this.messageService.requestForwardEmailHeader
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.handleForwardConversation(res);
        this.messageService.requestForwardEmailHeader.next(null);
      });

    this.messageService.requestShowUserProfile
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.showModal(res.showModal, res?.userId, res?.propertiesId);
        this.messageService.requestShowUserProfile.next(null);
      });

    this.setIsDeletedOrArchived();
    combineLatest([
      this.companyService.getActiveMobileApp(),
      this.conversationService.currentConversation
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([status, res]) => {
        if (!res || !Object.keys(res).length) return;
        this.activeMobileApp = status;

        this.isSendViaEmail = res?.isSendViaEmail;
        this.isAppUser =
          res?.inviteStatus === UserStatus.ACTIVE && this.activeMobileApp;
      });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment =
          this.agencyDashboardService.isRentManagerCRM(company);
        this.isPTEnvironment = this.companyService.isPropertyTreeCRM(company);
      });

    this.getDataConversation();
    this.checkAISummary();
    this.aiSummaryFacadeService
      .isConsoleUser()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        this.isConsoleUser = value;
      });
    this.inboxService.listMailBoxs$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listMailBox) => {
        if (!listMailBox?.length) return;
        this.mailBox = listMailBox.find(
          (item) => item?.status !== 'ARCHIVE' && item?.type === 'COMPANY'
        );
        this.isDisconnectCompanyMailbox =
          this.mailBox?.status === EMailBoxStatus.DISCONNECT;
      });

    this.subscribeIsShowSidebarRight();
    this.subscribeCheckMoveToFolder();

    this.conversationService.markCurrentConversationBS
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),
        filter(Boolean)
      )
      .subscribe((res) => {
        if (!res) return;
        if (this.currentConversation.id === res.conversationId) {
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
        }
      });

    this.aiSummaryFacadeService
      .getSummaryContent()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.summaryContent = res;
      });
    this.aiSummaryFacadeService
      .getSelectedFiles()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.aiSummaryFiles = res?.filter((f) => f?.id);
        }
      });

    this.taskDetailService.isCloseMenuThreeDots$.subscribe((value) => {
      if (value && this.isThreeDotBtnActive === true) {
        this.isThreeDotBtnActive = false;
        this.handlePopupState({ option: false });
      }
    });
    this.subscribePortalConversation();
    this.handleSyncStatusMessage();
    merge([
      this.syncMessagePropertyTreeService.isSyncToPT$,
      this.syncResolveMessageService.isSyncToRM$
    ])
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe(() => {
        this.handleSyncStatusMessage();
      });
    this.subscribeToggleMoveConversationSate();
  }

  private subscribeListProperties() {
    const currentTask = this.taskService.currentTask$?.value;
    const listProperty$ =
      currentTask?.taskType === TaskType.MESSAGE
        ? this.propertyService.listPropertyAllStatus
        : this.propertyService.listPropertyActiveStatus;

    combineLatest([
      listProperty$,
      this.conversationService.currentConversation.pipe(
        filter(Boolean),
        distinctUntilChanged((prev, curr) => prev?.id === curr?.id)
      )
    ])
      .pipe(
        filter(
          ([propertiesList, currentConv]) =>
            !!currentConv?.id && !!propertiesList
        ),
        switchMap(([propertiesList, currentConv]) => {
          return this.conversationService
            .getSuggestedProperty(currentConv?.id)
            .pipe(map((res) => [propertiesList, res]));
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe(([propertiesList, suggestedPropertyIds]) => {
        const res = sortSuggestedProperties({
          suggestedPropertyIds,
          propertiesList
        });
        if (currentTask?.taskType === TaskType.MESSAGE) {
          this.listPropertyAllStatus = res;
        } else {
          this.listPropertyActive = res;
        }
      });
  }

  private mapLinkedConversationToDisplay(): ILinkedConversationToDisplay {
    const {
      linkedConversationEmail,
      linkedConversationAppLog,
      linkedConversationMessenger,
      linkedConversationSms,
      linkedConversationVoicemailLog,
      linkedConversationWhatsApp
    } = this.currentConversation || {};

    const linkedConversations = [
      linkedConversationEmail,
      linkedConversationAppLog,
      linkedConversationMessenger,
      linkedConversationSms,
      linkedConversationVoicemailLog,
      linkedConversationWhatsApp
    ];

    const mapChannelTitle = (conversationType: EConversationType): string => {
      const channelTitleMap = {
        [EConversationType.EMAIL]: 'Email',
        [EConversationType.APP]: 'Trudi® App',
        [EConversationType.MESSENGER]: 'Messenger',
        [EConversationType.SMS]: 'SMS',
        [EConversationType.VOICE_MAIL]: 'Voicemail',
        [EConversationType.WHATSAPP]: 'WhatsApp'
      };

      return channelTitleMap[conversationType] || '';
    };

    for (const conversation of linkedConversations) {
      if (conversation?.length > 0) {
        const {
          taskId,
          conversationType,
          conversationId,
          taskStatus,
          taskType,
          status,
          isAssigned,
          channelId,
          requestRaisedDate
        } = conversation[0] || {};
        const channelTitle = mapChannelTitle(conversationType);
        return {
          taskId,
          conversationType,
          conversationId,
          taskStatus,
          taskType,
          status,
          isAssigned,
          channelId,
          channelTitle,
          requestRaisedDate
        };
      }
    }

    return null;
  }

  navigateToLinkedConversationHandler() {
    const {
      taskId,
      conversationId,
      conversationType,
      taskStatus,
      taskType,
      isAssigned,
      channelId
    } = this.linkedConversationToDisplay || {};

    const baseQueryParams = {
      inboxType: isAssigned ? GroupType.MY_TASK : GroupType.TEAM_TASK,
      mailBoxId: this.currentMailboxId,
      status: taskStatus,
      taskId,
      conversationId
    };

    const navigationConfig = {
      [EConversationType.EMAIL]: {
        path:
          taskType === TaskType.TASK
            ? `detail/${taskId}`
            : `messages/${
                taskStatus === TaskStatusType.inprogress
                  ? 'all'
                  : taskStatus === TaskStatusType.completed
                  ? 'resolved'
                  : 'deleted'
              }`,
        queryParams: taskType === TaskType.TASK ? { tab: null } : {}
      },
      [EConversationType.APP]: {
        path: `app-messages/${
          taskStatus === TaskStatusType.inprogress ? 'all' : 'resolved'
        }`,
        queryParams: {}
      },
      [EConversationType.MESSENGER]: {
        path: `facebook-messages/${
          taskStatus === TaskStatusType.inprogress ? 'all' : 'resolved'
        }`,
        queryParams: { channelId }
      },
      [EConversationType.SMS]: {
        path: `sms-messages/${
          taskStatus === TaskStatusType.inprogress ? 'all' : 'resolved'
        }`,
        queryParams: {}
      },
      [EConversationType.VOICE_MAIL]: {
        path: `voicemail-messages/${
          taskStatus === TaskStatusType.inprogress ? 'all' : 'resolved'
        }`,
        queryParams: {}
      },
      [EConversationType.WHATSAPP]: {
        path: `whatsapp-messages/${
          taskStatus === TaskStatusType.inprogress ? 'all' : 'resolved'
        }`,
        queryParams: { channelId }
      }
    };

    const config = navigationConfig[conversationType];

    if (config) {
      if (conversationType === EConversationType.APP) {
        this.conversationService.triggerGoToAppMessage$.next(true);
      }
      this.router.navigate([`dashboard/inbox/${config.path}`], {
        queryParams: { ...baseQueryParams, ...config.queryParams }
      });
    }
  }

  subscribePortalConversation() {
    combineLatest([this.route.queryParams, this.taskService.currentTask$])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([param, currentTask]) => {
        this.isDraftFolder =
          (param['tab'] || param['status']) === TaskStatusType.draft;
        const currentConversationId =
          this.currentConversation?.id ||
          currentTask?.conversations?.find(
            (one) => one.id === param['conversationId']
          )?.id;
        if (currentTask && this.isDraftFolder && currentConversationId) {
          this.portalConversation = {
            id: currentConversationId,
            status: currentTask.status,
            taskGroupName: currentTask.taskGroupName,
            taskId: currentTask.id,
            title: currentTask.title,
            topicId: currentTask.topicId,
            topicName: currentTask.topicName,
            type: currentTask.taskType
          };
        }
      });
  }

  subscribeToggleMoveConversationSate() {
    this.taskService.triggerToggleMoveConversationSate
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res?.isTaskDetail)
          this.handleMoveToAnotherTask(this.currentConversation);
      });
  }

  selectedPropertyInDetail(propertyId) {
    this.selectedPropertyId = propertyId;
  }

  handleCancelConfirmProperties(value) {
    this.isShowModalConfirmProperties = value;
    this.isActionSyncConversationToRM = value;
  }

  handleConfirmProperties() {
    this.syncConversationToCRM(
      this.isRmEnvironment
        ? EMessageMenuOption.SAVE_TO_RENT_MANAGER
        : EMessageMenuOption.SAVE_TO_PROPERTY_TREE
    );
  }

  saveMessageToCRM(e, type, isDownloadPDFAction: boolean = false) {
    this.isTriggeredDownloadPDFOption = isDownloadPDFAction;
    if (
      this.currentConversation.syncStatus === this.SYNC_TYPE.INPROGRESS ||
      this.isArchiveMailbox ||
      this.isConsoleUser
    ) {
      e.stopPropagation();
      return;
    }
    this.isAddToTaskSubMenuVisible = false;
    this.isThreeDotsMenuVisible = false;
    if (type === EMessageMenuOption.SAVE_TO_RENT_MANAGER) {
      this.syncResolveMessageService.isSyncToRM$.next(true);
    } else {
      this.syncMessagePropertyTreeService.setIsSyncToPT(true);
    }

    const isTemporaryProperty =
      this.taskService.currentTask$.value?.property?.isTemporary;
    if (isTemporaryProperty && !isDownloadPDFAction) {
      this.conversationNotMove = {
        listConversationNotMove: [this.currentConversation]
      };
      this.isShowModalConfirmProperties = true;
      this.isActionSyncConversationToRM = true;
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

  setDataUnHappyPath() {
    if (!!this.task && !!this.currentConversation) {
      this.isConfirmContactUser =
        !!this.task?.unhappyStatus?.isConfirmContactUser;
      if (
        this.task.taskType === TaskType.MESSAGE ||
        this.trudiResponse?.type !== ETrudiType.unhappy_path
      ) {
        this.isUnHappyPath = this.task?.isUnHappyPath;
        this.unhappyStatus = this.task?.unhappyStatus;
        this.isSuperHappyPath = this.task?.isSuperHappyPath;
        if (!this.unhappyPathLoading) {
          this.isUnindentifiedEmail = this.task?.isUnindentifiedEmail;
          this.isUnindentifiedPhoneNumber =
            this.trudiResponse?.data?.[0]?.body?.isUnindentifiedPhoneNumber;
        }
        this.isUnindentifiedProperty = this.task?.isUnindentifiedProperty;
      } else if (this.trudiResponse?.type === ETrudiType.unhappy_path) {
        this.isUnHappyPath = true;
        this.unhappyStatus = this.trudiResponse?.data?.[0]?.body?.unhappyStatus;
        this.isSuperHappyPath =
          this.trudiResponse?.data?.[0]?.body?.isSuperHappyPath;
        this.isUnindentifiedEmail =
          this.trudiResponse?.data?.[0]?.body?.isUnindentifiedEmail;
        this.isUnindentifiedPhoneNumber =
          this.trudiResponse?.data?.[0]?.body?.isUnindentifiedPhoneNumber;
        this.isUnindentifiedProperty =
          this.trudiResponse?.data?.[0]?.body?.isUnindentifiedProperty;
      }
    }
  }

  getDataConversation() {
    this.messageService.callButtonData
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.requestDataCall = res;
        this.isProgressCall = res.isProgressCall;
        this.callTooltipType = res.isProgressCall
          ? {
              voice: ECallTooltipType.CALLING,
              video: ECallTooltipType.CALLING
            }
          : {
              ...res.callTooltipType,
              voice:
                res.callTooltipType.voice ??
                (res.callBtnTooltip ? ECallTooltipType.DEFAULT : null)
            };
      });

    this.conversationService.currentConversation
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        if (!res || !Object.keys(res).length) return;
        if (this.prevConversationId !== res.id) {
          this.prevConversationId = res.id;
        }
        this.showMessageHasLinkedTask = this.task?.conversations?.some(
          (conversation) =>
            conversation?.id === res?.id && !!conversation?.linkedTask
        );
        this.currentConversation = {
          ...res,
          syncStatus: res.syncStatus || res.conversationSyncDocumentStatus
        };
        this.fullName = this.sharedService.displayName(
          this.currentConversation?.firstName,
          this.currentConversation?.lastName
        );
        this.isHiddenPrimary = [
          EUserPropertyType.TENANT_PROSPECT,
          EUserPropertyType.OWNER_PROSPECT
        ].includes(this.currentConversation?.propertyType as EUserPropertyType);

        if (
          this.currentConversation?.propertyType ===
          this.userPropertyType.EXTERNAL
        ) {
          this.currentConversation = {
            ...this.currentConversation,
            ExternalType: 'External email'
          };
        }

        if (
          this.currentConversation?.propertyType === this.userPropertyType.OTHER
        ) {
          this.currentConversation.contactType =
            this.currentConversation?.contactType?.replace(/_/g, ' ');
        }

        this.isDetectInfoRm = [
          EUserPropertyType.TENANT_PROSPECT,
          EUserPropertyType.TENANT_UNIT,
          EUserPropertyType.TENANT_PROPERTY,
          EUserPropertyType.LANDLORD_PROSPECT
        ].includes(this.currentConversation?.propertyType as EUserPropertyType);
        this.linkedConversationToDisplay =
          this.mapLinkedConversationToDisplay();
        this.cdr.markForCheck();
      });

    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res || !Object.keys(res).length) return;
        this.taskMsgDetail = res;
        this.cdr.markForCheck();
      });
  }

  showModalHistoryConversation(e) {
    if (e) {
      this.selectedUserPropertiesId = e;
      this.handlePopupState({ isShowExportSuccess: true, showPeople: false });
    }
  }

  showModal(
    status: any,
    userId?: string,
    propId?: string,
    participant?: IUserParticipant
  ) {
    if (status) {
      this.handlePopupState({ showPeople: true });
      this.panelService.setSelectedID(participant?.userId);
      this.propertyService.setSelectedID(participant?.propertyId);
    } else {
      this.handlePopupState({ showPeople: false });
    }
  }

  exportConversationHistory() {
    this.disableExportButton = true;
    const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.conversationService
      .exportHistoryConversation(this.selectedUserPropertiesId, clientTimeZone)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        error: () => {
          this.disableExportButton = false;
          this.handlePopupState({
            isShowExportSuccess: false
          });
        },
        complete: () => {
          this.disableExportButton = false;
          this.handlePopupState({
            showPeople: true,
            isShowExportSuccess: false
          });
        }
      });
  }

  moreOption() {
    this.isThreeDotBtnActive = !this.isThreeDotBtnActive;
    this.handlePopupState({ option: !this.popupState.option });
  }

  handleMenu(
    option: EMessageMenuOption,
    conversation: UserConversation,
    event: Event
  ) {
    if (
      this.isConsoleUser &&
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
      case EMessageMenuOption.CREATE_NEW_TASK:
        this.handleConvertConversationToTask(conversation);
        break;

      case EMessageMenuOption.MOVE_TO_TASK:
        this.handleMoveToAnotherTask(conversation);
        break;

      case EMessageMenuOption.MOVE_TO_FOLDER:
        this.handleMoveToEmail(conversation);
        break;

      case EMessageMenuOption.REMOVE_FROM_TASK:
        this.handleRemoveFromTask(conversation);
        break;

      case EMessageMenuOption.REOPEN:
        this.handleReopen(conversation);
        this.disabledBtn = true;
        break;

      case EMessageMenuOption.DELETE:
        this.onDeleteTask(conversation);
        break;

      case EMessageMenuOption.RESOLVE:
        this.handleResolve(conversation);
        this.disabledBtn = true;
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
        this.saveMessageToCRM(event, option);
        break;
      case EMessageMenuOption.DOWNLOAD_AS_PDF:
        this.saveMessageToCRM(event, option, true);
        break;
    }
  }

  handleRemoveFromTask(conversation: UserConversation) {
    if (conversation?.scheduleMessageCount) {
      this.errorMessage = ErrorMessages.REMOVE_CONVERSATION_FROM_TASK;
      this.isShowModalWarning = true;
      return;
    }
    if (this.isMoving) {
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
    this.conversationService
      .deleteConversationFromTaskHandler(conversation.id)
      .subscribe({
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

  handleMoveToEmail(conversation: UserConversation) {
    if (!conversation) {
      return;
    }
    this.conversationService.selectedConversation.next(conversation);
    this.inboxService.setPopupMoveToTaskState(
      EPopupMoveMessToTaskState.MOVE_MESSAGE_TO_EMAIL_FOLDER
    );
  }

  handleReportSpam(conversation: UserConversation) {
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
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: () => {
          this.conversationService.reloadConversationList.next(true);
        },
        error: () => {
          this.toastService.clear();
          this.toastService.error(EToastSocketTitle.MESSAGE_SPAM_FAIL);
        },
        complete: () => {}
      });
  }

  private handleFlagUrgent(conversation: UserConversation) {
    this.conversationService
      .updateFlagUrgent(conversation.id)
      .subscribe((res: IFlagUrgentMessageResponse) => {
        this.currentConversation = {
          ...this.currentConversation,
          isUrgent: res?.isUrgent
        };
        this.conversationService.reloadConversationList.next(true);
      });
  }

  handleConvertConversationToTask(conversation: UserConversation) {
    let categoryID, currentPropertyId: string;
    this.taskService
      .getTaskById(this.task.id)
      .pipe(
        switchMap((task) => {
          this.sharedMessageViewService.setPrefillCreateTaskData(task);
          this.conversationService.currentConversation.next(conversation);
          categoryID = conversation?.categoryId;
          if (conversation?.trudiResponse) {
            this.conversationService.superHappyPathTrudiResponse.next(
              conversation?.trudiResponse
            );
          }
          const propertyConversation = conversation?.isTemporaryProperty
            ? null
            : conversation?.propertyId || conversation.propertyId;
          const propertyId = this.isTaskType
            ? propertyConversation
            : this.messageMenuService.checkToShowAllProperty(task)
            ? ''
            : task?.property?.id;
          currentPropertyId = propertyId;
          return this.propertyService.getAgencyProperty(
            conversation?.userId,
            propertyId
          );
        })
      )
      .subscribe((activeProperty) => {
        const data: IAddToTaskConfig = {
          isOpenCreateNewTask: true,
          openFrom: CreateTaskByCateOpenFrom.MESSAGE,
          activeProperty,
          taskNameList: this.taskService.createTaskNameList(),
          categoryID,
          currentPropertyId
        };
        this.taskDetailService.setAddToTaskConfig(data);
      });
    this.handleCancelModal();
  }

  handleForwardConversation(conversation: UserConversation) {
    this.isCreateMessageType = !this.isTaskType;
    this.conversationService.activeOptionsID$.next('');
    if (!conversation || conversation.status === this.messageStatus.schedule) {
      return;
    }
    this.conversationService
      .getHistoryOfConversationWithTrudi(conversation.id, 0)
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        let message;
        const listSortMessage = res?.list?.sort((a, b) =>
          a.createdAt > b.createdAt ? 1 : -1
        );
        const isAppCase = !(
          (this.isSendViaEmail && !this.isAppUser) ||
          !this.activeMobileApp
        );
        const messageUserApp = listSortMessage.find(
          (e) =>
            e.inviteStatus === UserStatus.ACTIVE && e.userId !== trudiUserId
        );
        const isStartAgentJoin =
          listSortMessage?.[0].messageType === EMessageType.agentJoin;
        if (!(isAppCase && messageUserApp) || isStartAgentJoin) {
          message = this.getFirstMessDiffAgentJoin(listSortMessage);
        } else {
          message = messageUserApp;
        }
        const file = (res?.list || [])
          .reverse()
          .filter(
            (e) =>
              e?.messageType === EMessageType.file &&
              message.id == e.bulkMessageId
          )
          .map((e) => e?.file);
        this.conversationForward = { ...message, options: file };
      });
    this.handlePopupState({ isShowForwardConversation: true });
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
          this.conversationService.markCurrentConversationBS.next({
            ...res,
            option
          });
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
        });
    }
  }

  getFirstMessDiffAgentJoin(listSortMessage) {
    return listSortMessage.find(
      (mess) => mess.messageType !== EMessageType.agentJoin
    );
  }

  handleResolve(conversation: UserConversationOption) {
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
        this.currentConversation.isSendViaEmail,
        summaryMsg
      )
      .pipe(
        finalize(() => {
          this.disabledBtn = false;
        })
      )
      .subscribe((res) => {
        if (res) {
          this.toastChangeStatusSuccess(conversation, TaskStatusType.completed);

          this.disabledBtn = false;
          this.loadingService.stopLoading();
          this.conversationService.currentUserChangeConversationStatus(
            EMessageType.solved
          );
          this.conversationService.setUpdatedConversation(
            res.id,
            EConversationType.resolved
          );
          this.conversationService.previousConversation$.next(conversation);
          this.conversationService.reloadConversationList.next(true);
          this.taskService.reloadTaskArea$.next(true);
        }
      });
  }

  handleMoveToAnotherTask(conversation: UserConversation) {
    const isSupplierOrOther =
      conversation.propertyType === EUserPropertyType.SUPPLIER ||
      conversation.propertyType === EUserPropertyType.OTHER;
    this.propertyId = isSupplierOrOther ? '' : this.currentProperty.id;
    this.isUnHappyPath =
      conversation?.trudiResponse?.type === ETrudiType.unhappy_path;
    const data: IAddToTaskConfig = {
      isOpenMoveToExistingTask: true,
      isUnHappyPath: this.isUnHappyPath,
      isShowAddress: this.isUnHappyPath ? true : false,
      propertyId: this.propertyId
    };
    this.taskDetailService.setAddToTaskConfig(data);
    this.handleCancelModal();
  }

  handleQuitModal() {
    this.handlePopupState({ isShowMoveToAnotherTaskModal: false });
  }

  requestToCall(id: string, type?: CallTypeEnum) {
    this.onActiveCall.emit(true);
    if (type === this.callType.videoCall) {
      this.isVideoCall = !this.isVideoCall;
    } else if (type === this.callType.voiceCall) {
      this.isVoiceCall = !this.isVoiceCall;
    }
    this.typeOfCall = type;
    if (id) {
      return this.handlePopupState({ confirmCall: true });
    }
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  onHandleConfirmSendVerifiedEmailModal(data: {
    status: boolean;
    email: string;
    userId: string;
  }) {
    this.handlePopupState({ showPeople: false, verifyEmail: data.status });
    this.emailConfirmSendVerified = data.email;
    this.userIdConfirmSendVerified = data.userId;
  }

  cancelConfirmSendVerifiedEmail() {
    this.handlePopupState({ showPeople: true, verifyEmail: false });
  }

  onHandleSuccessfullySendVerified(status: boolean) {
    this.handlePopupState({
      verifyEmail: !status,
      emailVerifiedSuccessfully: status
    });

    if (status) {
      this.verifyMailTimeOut = setTimeout(() => {
        this.handlePopupState({ emailVerifiedSuccessfully: false });
      }, 3000);
    }
  }

  /**
   * @deprecated
   */
  confirmToCall({ event, type, phone }: ConfirmToCall) {
    localStorage.setItem(CALL_TYPE, type);
    phone && localStorage.setItem('VOICE_CALL_NUMBER', phone);
    if (event) {
      if (
        this.currentConversation.status === CONVERSATION_STATUS.LOCKED ||
        this.currentConversation.status ===
          CONVERSATION_STATUS.AGENT_EXPECTATION ||
        !this.conversationService.agentJoined()
      ) {
        this.onShowAgentJoin.emit();
      }
      const fullNameRemote = {
        firstName: this.currentConversation.firstName,
        lastName: this.currentConversation.lastName
      };
      localStorage.setItem('remoteName', JSON.stringify(fullNameRemote));
      localStorage.setItem(
        'remoteAvt',
        this.userService.selectedUser.value.googleAvatar
      );
      localStorage.setItem('userId', this.userService.selectedUser.value.id);
      if (type && type === CallTypeEnum.voiceCall) {
        window.open(
          `/voice-call/${this.currentConversation.id}/${this.selectedUserId}/${this.participantPropertyId}?isPTEnvironment=${this.isPTEnvironment}`,
          '_blank'
        );
      } else {
        window.open(
          `/call/${this.currentConversation.id}/${this.selectedUserId}/${this.participantPropertyId}?isPTEnvironment=${this.isPTEnvironment}`,
          '_blank'
        );
      }
      this.handlePopupState({ confirmCall: false });
    }
  }

  closeConfirmCallModal(status: boolean) {
    this.isVideoCall = false;
    this.isVoiceCall = false;
    this.isActiveVideoCallMessage = false;
    this.isActiveVoiceCallMessage = false;
    this.handlePopupState({ confirmCall: !status });
  }

  onOutSide() {
    this.handlePopupState({ option: false });
    this.isThreeDotBtnActive = false;
  }

  toastChangeStatusSuccess(conversation, status: TaskStatusType) {
    const dataForToast = {
      conversationId: conversation?.id,
      taskId: this.task.id,
      isShowToast: true,
      type: SocketType.changeStatusTask,
      mailBoxId: this.currentMailboxId,
      taskType: TaskType.MESSAGE,
      status: status,
      pushToAssignedUserIds: [],
      isAppMessage: false,
      conversationType: conversation?.conversationType
    };
    if (!this.router.url.includes('inbox/detail')) {
      this.toastCustomService.openToastCustom(
        dataForToast,
        true,
        EToastCustomType.SUCCESS_WITH_VIEW_BTN
      );
    }
  }

  handleReopen(conversation: UserConversation) {
    if (!conversation) return;
    this.conversationService.activeOptionsID$.next('');
    this.conversationService
      .updateStatus(
        EConversationType.open,
        conversation?.id,
        this.currentConversation.isSendViaEmail,
        ''
      )
      .subscribe((res) => {
        if (res) {
          this.toastChangeStatusSuccess(
            conversation,
            TaskStatusType.inprogress
          );
          this.conversationService.currentUserChangeConversationStatus(
            EMessageType.open
          );
          this.conversationService.setUpdatedConversation(
            res.id,
            EConversationType.open
          );
          this.conversationService.previousConversation$.next(conversation);
          this.conversationService.reloadConversationList.next(true);
        }
      });
  }

  handleReopenConversation(currentConversation: UserConversation) {
    this.taskService
      .changeTaskStatus(this.task.id, TaskStatusType.inprogress)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((res) => {
          if (res) {
            this.loadingService.onLoading();
            return this.conversationService.updateStatus(
              EConversationType.open,
              currentConversation?.id,
              currentConversation.isSendViaEmail,
              ''
            );
          }
          return of(null);
        })
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.toastChangeStatusSuccess(
              currentConversation,
              TaskStatusType.inprogress
            );
            this.conversationService.reloadConversationList.next(true);
          }
          this.loadingService.stopLoading();
        },
        error: () => {
          this.loadingService.stopLoading();
        }
      });
  }

  onDeleteTask(conversation: UserConversationOption) {
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
          .deleteConversationV2(this.currentConversation.id)
          .subscribe((res) => {
            if (res) {
              this.toastChangeStatusSuccess(
                conversation,
                TaskStatusType.deleted
              );
              this.conversationService.previousConversation$.next(conversation);
              this.conversationService.reloadConversationList.next(true);
              this.conversationService.navigateToFirstOfNextConversation(
                res.conversationId
              );
            }
          });
        break;
      default:
        break;
    }
    this.aiSummaryFacadeService.resetData();
  }

  deleteTask(event: boolean) {
    this.handlePopupState({ confirmDelete: false });
    if (!event) return;
    this.loadingService.onLoading();
    const currentTaskId = this.taskService.currentTaskId$.getValue();
    this.taskService
      .changeTaskStatus(currentTaskId, TaskStatusType.deleted)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.toastService.success(MESSAGE_DELETED);
          this.taskService.currentTask$.next({
            ...this.task,
            status: TaskStatusType.deleted
          });
          this.headerService.headerState$.next({
            ...this.headerService.headerState$.value,
            currentTask: {
              ...this.headerService.headerState$.value?.currentTask,
              status: TaskStatusType.deleted
            },
            currentStatus: TaskStatusType.deleted
          });
          this.conversationService.currentUserChangeConversationStatus(
            EMessageType.solved
          );
          this.conversationService.setUpdatedConversation(
            res.id,
            EConversationType.resolved
          );
          this.conversationService.reloadConversationList.next(true);
          this.loadingService.stopLoading();
        }
      });
  }

  showQuitConfirm(status: boolean) {
    this.handlePopupState({ confirmDelete: status });
  }

  setIsDeletedOrArchived() {
    if (
      this.currentConversation &&
      (this.currentConversation?.crmStatus === 'DELETED' ||
        this.currentConversation?.crmStatus === 'ARCHIVED')
    ) {
      this.isDeletedOrArchived = true;
    } else {
      this.isDeletedOrArchived = false;
    }
  }

  upgradePlan(template: ECallTooltipType) {
    switch (template) {
      case ECallTooltipType.VIDEO_CALL_ADMIN:
      case ECallTooltipType.VOICE_CALL_ADMIN:
        this.handlePopupState({ plansSummary: true });
        break;
      case ECallTooltipType.VIDEO_CALL_MENBER:
        if (this.isConsoleUser) return;
        this.conversationService
          .sendMailRequestFeature(EAddOn.MOBILE_APP, this.currentMailboxId)
          .subscribe(() => {
            this.toastService.success(UPGRADE_REQUEST_SENT);
          });
        break;
      case ECallTooltipType.VOICE_CALL_MENBER:
        if (this.isConsoleUser) return;
        this.conversationService
          .sendMailRequestFeature(EAddOn.OUTGOING_CALLS, this.currentMailboxId)
          .subscribe(() => {
            this.toastService.success(UPGRADE_REQUEST_SENT);
          });
        break;
    }
  }

  checkAISummary() {
    this.aiSummaryFacadeService
      .canUseAI()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        this.canUseAISummary = value;
      });

    this.conversationService.currentConversation
      .pipe(
        map((conversation) => conversation?.id),
        filter(Boolean),
        distinctUntilChanged(),
        switchMap((conversationId) => {
          return this.aiSummaryFacadeService
            .checkNoMessageOnConversation(conversationId)
            .pipe(takeUntil(this.unsubscribe));
        })
      )
      .subscribe((value) => {
        this.noMessages = value;
      });

    this.aiSummaryFacadeService
      .getUpradeAction()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((action) => {
        if (action == 'upgrade') {
          this.upSellAISummaryMessage = 'upgrade your plan';
        }
        if (action == 'request') {
          this.upSellAISummaryMessage = 'request plan upgrade';
        }
      });
  }

  handleToggleSidebarRight() {
    this.showSidebarRightService.handleToggleSidebarRight(
      !this.isShowSidebarRight
    );
    this.toggleSidebarRight.emit(this.isShowSidebarRight);
  }

  checkMenuCondition() {
    this.menuDropDown.reOpen = !(
      this.task.status === TaskStatusType.unassigned ||
      this.task.status === TaskStatusType.inprogress
    );
    this.menuDropDown.reportSpam = !this.isArchiveMailbox;
    this.menuDropDown.delete = !(this.task.status === TaskStatusType.deleted);
    this.menuDropDown.resolve = !(
      this.task.status === TaskStatusType.deleted ||
      this.task.status === TaskStatusType.completed
    );
    this.menuDropDown.urgent =
      this.task.status === TaskStatusType.inprogress ||
      this.task.status === TaskStatusType.unassigned;

    this.menuDropDown.unread = this.isReadMsg;
  }

  handleSyncStatusMessage() {
    const currentListByCRM$ = this.isRmEnvironment
      ? this.syncResolveMessageService.getListConversationStatus()
      : this.syncMessagePropertyTreeService.listConversationStatus;
    currentListByCRM$
      .pipe(takeUntil(this.unsubscribe))
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
          this.currentConversation.downloadingPDFFile = downloadingPDFFile;
          this.currentConversation.updatedSyncAt =
            this.currentConversation.updatedSyncAt || timestamp;
          this.disabledDownloadPDF =
            this.syncMessagePropertyTreeService.checkToEnableDownloadPDFOption(
              this.isArchiveMailbox,
              this.isConsoleUser,
              this.currentConversation?.downloadingPDFFile
            );
        }
      });
  }
  handleUpdateExpand(id) {
    this.participantId = id;
  }

  handleConvertToTask(): void {
    this.messageMenuService.handleCreateNewTask(this.task);
    this.handleClearSelected();
    this.handleCancelModal();
  }

  subscribeIsShowSidebarRight() {
    this.showSidebarRightService.isShowSidebarRight$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isShowSidebarRight = res;
      });
  }

  openAddToTaskModal(isInbox: boolean) {
    this.isInbox = isInbox;
    if (!isInbox) {
      this.modalAddToTask = EPopupConversionTask.SELECT_OPTION;
      return;
    }
    this.addToTaskWarningService.showWarningAddToTask(() => {
      this.modalAddToTask = EPopupConversionTask.SELECT_OPTION;
    }, this);
  }

  handleCancelModal() {
    this.modalAddToTask = null;
  }

  onInfoUser() {
    if (
      this.currentConversation?.propertyStatus === EPropertyStatus.deleted ||
      !this.currentConversation.streetline
    )
      return;
    this.messageService.requestShowUserInfo.next({
      ...this.messageService.requestShowUserInfo.getValue,
      showModal: true,
      isFromTaskCoversation: true
    });
  }

  navigateToLinkedConversation() {
    const {
      conversationId,
      status,
      taskId,
      taskStatus,
      isAssigned,
      taskType,
      conversationType
    } = this.currentConversation?.linkedConversationVoicemailLog?.[0] || {};

    if (taskType === TaskType.TASK) {
      this.router.navigate(['dashboard/inbox/detail/', taskId], {
        queryParams: {
          conversationType,
          conversationId,
          mailBoxId: this.currentMailboxId,
          status: taskStatus
        }
      });
      return;
    }

    if (taskType === TaskType.MESSAGE) {
      this.router.navigate(
        [
          '/dashboard/inbox/voicemail-messages',
          status === TaskStatusType.open ? 'all' : 'resolved'
        ],
        {
          queryParams: {
            taskId,
            conversationId,
            status: taskStatus,
            mailBoxId: this.currentMailboxId,
            inboxType: isAssigned ? GroupType.MY_TASK : GroupType.TEAM_TASK
          }
        }
      );
      return;
    }
  }

  handleOpenPropertyProfile() {
    const { id } = this.currentProperty || {};
    if (
      this.currentConversation?.propertyStatus === EPropertyStatus.deleted ||
      !this.currentConversation.streetline ||
      !id
    )
      return;
    this.visiblePropertyProfile = true;
  }

  onOpenPopupEditProperty() {
    if (this.isConsoleUser || this.isDisallowReassignProperty) return;
    let propertyId = this.task.property.id;
    if (
      this.checkIsHasPropertyOnDetail(propertyId, this.listPropertyAllStatus)
    ) {
      this.propertyIdFormControl.setValue(propertyId);
    }
    this.isShowModalUpdateProperty = true;
  }

  public onCloseUpdatePropertyModal() {
    this.isPropertyUpdating = false;
    this.isShowModalUpdateProperty = false;
    this.propertyIdFormControl.setValue(null);
  }

  public handleConfirmUpdateProperty() {
    this.isPropertyUpdating = true;
    const { id, isTemporary } = this.task?.property || {};
    const isSameProperty =
      this.propertyIdFormControl.value === id ||
      (!this.propertyIdFormControl.value && isTemporary) ||
      (!this.propertyIdFormControl.value &&
        !this.checkIsHasPropertyOnDetail(id, this.listPropertyAllStatus));
    if (isSameProperty) {
      this.isPropertyUpdating = false;
      this.isShowModalUpdateProperty = false;
      this.propertyIdFormControl.setValue(null);
      return;
    }
    const bodyChangeConversationProperty = {
      conversationId: this.currentConversation.id,
      newPropertyId: this.propertyIdFormControl.value
    };

    this.propertyService
      .updateConversationProperty(bodyChangeConversationProperty)
      .pipe(finalize(() => (this.isPropertyUpdating = false)))
      .subscribe((res) => {
        if (res) {
          this.toastService.success(
            'The conversation property has been changed'
          );
          this.updateCurrentTaskProperty(res);
          this.reLoadCurrentTaskWhenChangeProperty(res);
        }
        this.isShowModalUpdateProperty = false;
        this.propertyIdFormControl.setValue(null);
      });
  }
  private checkIsHasPropertyOnDetail(propertyId: string, listProperty) {
    return listProperty.find((item) => item.id === propertyId);
  }
  private updateCurrentTaskProperty(property: UserPropertyInPeople | any) {
    this.taskService.currentTask$.next({
      ...this.task,
      agencyId: property.agencyId,
      companyId: property.companyId,
      property
    });
    this.propertyService.currentPropertyId.next(property?.id);
  }
  private reLoadCurrentTaskWhenChangeProperty(data) {
    this.updateCurrentTaskAssignees();
    this.updateToolbarWithCurrentTask(data);
    this.conversationService.reloadConversationList.next(true);
  }
  private updateToolbarWithCurrentTask(currentProperty) {
    if (!this.inboxItem.length || !currentProperty || !this.task) return;

    const index = this.inboxItem.findIndex((item) => item.id === this.task.id);

    if (index !== -1) {
      this.inboxItem[index]['property'] = currentProperty;
    }

    this.inboxToolbarService.setInboxItem(this.inboxItem);
  }
  private updateCurrentTaskAssignees() {
    if (!this.task) return;
    const { firstName, lastName, id, googleAvatar } =
      this.userService.getUserInfo() || {};
    const assigneeIds = this.task.assignToAgents.map((agent) => agent.id);
    if (!assigneeIds.includes(id)) {
      this.taskService.currentTask$.next({
        ...this.task,
        assignToAgents: [
          ...this.task.assignToAgents,
          { id, firstName, lastName, googleAvatar }
        ]
      });
    }
  }

  get propertyIdFormControl() {
    return this.formSelectProperty.get('propertyId');
  }

  ngOnDestroy() {
    clearTimeout(this.verifyMailTimeOut);
    this.unsubscribe.next(true);
    this.unsubscribe.complete();
  }

  protected readonly ETypePage = ETypePage;
}
