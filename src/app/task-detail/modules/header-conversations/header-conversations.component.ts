import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ActivatedRoute, EventType, Router } from '@angular/router';
import {
  BehaviorSubject,
  Subject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  skipWhile,
  switchMap,
  takeUntil,
  tap,
  zip
} from 'rxjs';
import { AppRoute } from '@/app/app.route';
import { stringFormat } from '@core';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import {
  CONVERSATION_CATEGORIES,
  DEBOUNCE_SOCKET_TIME,
  ErrorMessages,
  trudiUserId
} from '@services/constants';
import {
  ConversationService,
  EReloadConversationSource,
  MessageStatus
} from '@services/conversation.service';
import { HeaderService } from '@services/header.service';
import { PopupService } from '@services/popup.service';
import { PropertiesService } from '@services/properties.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { EHeaderTitle } from '@shared/components/select-people-popup/select-people-popup.component';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { EMessageProperty, EMessageType } from '@shared/enum/messageType.enum';
import { SocketType } from '@shared/enum/socket.enum';
import {
  TaskStatusType,
  TaskStatusTypeLC,
  TaskType
} from '@shared/enum/task.enum';
import { EPropertyStatus, EUserPropertyType } from '@shared/enum/user.enum';
import { replaceMessageToOneLine } from '@shared/feature/function.feature';
import { userType } from '@trudi-ui';
import {
  ICreateNewConversationApp,
  UserConversation
} from '@shared/types/conversation.interface';
import { SocketCallData, SocketSendData } from '@shared/types/socket.interface';
import { ITaskDetail, TaskItem } from '@shared/types/task.interface';
import { TaskDetailPet } from '@shared/types/trudi.interface';
import { UnhappyStatus } from '@shared/types/unhappy-path.interface';
import { TrudiScheduledMsgService } from '@/app/trudi-scheduled-msg/services/trudi-scheduled-msg.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { MessageLoadingService } from '@/app/task-detail/services/message-loading.service';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import { InternalNoteApiService } from '@/app/task-detail/modules/internal-note/services/internal-note-api.service';
import { InternalNoteService } from '@/app/task-detail/modules/internal-note/services/internal-note.service';
import { ENoteType } from '@/app/task-detail/modules/internal-note/utils/internal-note.enum';
import {
  EMessageMenuOption,
  IFlagUrgentMessageResponse
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import {
  EToastSocketTitle,
  EToastSocketType
} from '@/app/toast-custom/toastCustomType';
import { ETrudiType } from '@shared/enum/trudi';
import { isNoProperty } from '@/app/user/utils/user.type';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import {
  CAN_NOT_MOVE,
  DRAFT_SAVED,
  MESSAGE_MOVING_TO_TASK,
  MOVE_MESSAGE_FAIL
} from '@services/messages.constants';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '@services/loading.service';
import { CompanyService } from '@services/company.service';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import {
  EPopupMoveMessToTaskState,
  ERouterLinkInbox
} from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { IAddToTaskConfig } from '@/app/task-detail/interfaces/task-detail.interface';
import { MessageMenuService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-menu.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { mapUsersToName } from '@core';
import { MessageService } from '@services/message.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import {
  EConversationStatus,
  EConversationStatusTab
} from './enums/conversation-status.enum';
import { Store } from '@ngrx/store';
import { selectAllConversation } from '@core/store/task-detail';
import { taskDetailActions } from '@core/store/task-detail';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { conversationPageActions } from '@core/store/conversation/actions/conversation.actions';
import { AppMessageListService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-list.service';
import { EMailBoxType, ESendMessageType } from '@shared/enum';
import { isEqual } from 'lodash-es';
import { ITempConversation } from '@/app/dashboard/modules/inbox/interfaces/conversation.interface';
import { HelperService } from '@services/helper.service';
import { TaskHelper } from '@/app/task-detail/utils/task.helper';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { FilesService } from '@/app/services/files.service';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';

type UserConversationOption = Partial<UserConversation>;
const mapTabValues = {
  [EConversationStatus.open]: EConversationStatusTab.OPEN,
  [EConversationStatus.resolved]: EConversationStatusTab.RESOLVED,
  [EConversationStatus.deleted]: EConversationStatusTab.DELETED,
  [EConversationStatus.draft]: EConversationStatusTab.DRAFT
};
const mapTabTitles = [
  EConversationStatus.open,
  EConversationStatus.resolved,
  EConversationStatus.deleted,
  EConversationStatus.draft
];

@Component({
  selector: 'header-conversations',
  templateUrl: './header-conversations.component.html',
  styleUrls: ['./header-conversations.component.scss']
})
@DestroyDecorator
export class HeaderConversationsComponent implements OnInit, OnDestroy {
  @Input() taskDetailViewMode: EViewDetailMode = EViewDetailMode.TASK;
  @Input() visible = true;
  @Input() task: TaskItem;
  @Input() currentProperty: any;
  @Output() isReadEvent = new EventEmitter<boolean>();
  @Output() currentTabChanged = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<void>();
  public taskStatusType = TaskStatusType;
  public status = MessageStatus;
  public currentConvId: string;
  public currentStatus: MessageStatus;
  public currentNotificationId: string = '';
  public currentConversation: UserConversation;
  public listOfConversations$: BehaviorSubject<UserConversationOption[]> =
    new BehaviorSubject([]);
  public listConversationsByStatus: UserConversationOption[] = [];
  private _timeoutNavigateWhenChangeTab: NodeJS.Timeout;
  private _currentTabTemplateBind: EConversationStatusTab =
    EConversationStatusTab.OPEN;
  private isTriggeredDownloadPDFOption: boolean = false;

  get currentTabTemplateBind() {
    return this._currentTabTemplateBind;
  }
  set currentTabTemplateBind(value: EConversationStatusTab) {
    this._currentTabTemplateBind = value;
    this.conversationService.currentTabConversation.next(value);
    const isUpdatedQueryParam =
      this.route.snapshot.queryParams?.['tab'] === mapTabTitles[value];

    if ((value || value === 0) && !isUpdatedQueryParam) {
      clearTimeout(this._timeoutNavigateWhenChangeTab);
      this._timeoutNavigateWhenChangeTab = setTimeout(() => {
        this.router.navigate([], {
          queryParams: {
            tab: mapTabTitles[value]
          },
          queryParamsHandling: 'merge'
        });
      }, 0);
    }
  }
  private toastDataChangeStatusTask = null;
  private isTabChangeFromUser: boolean = true;
  private unsubscribe = new Subject<void>();
  public conversationId: string;
  public currentConversationType: string;
  public isTargetAfterInit: boolean = true;
  public taskId: string;
  public isTaskType: boolean = false;
  public isCreateAppMsg: boolean = false;
  public TaskTypeEnum = TaskType;
  public resetSendMessageModal = false;
  public trudiUserId = trudiUserId;
  public isLoading = true;
  public fileIdDropdown: string;
  public activeActionGroupIndex: number;
  public taskDetailData: ITaskDetail | TaskDetailPet = null;
  public isRead: boolean = false;
  public pipeType: string = userType.DEFAULT;
  public isRmEnvironment: boolean = false;
  private currentMailboxId: string;
  public isConsole: boolean;
  selectedUser = [];
  conversationType = EConversationType;
  userPropertyType = EUserPropertyType;
  public currentTaskDeleted: boolean = false;
  isUnHappyPath = false;
  public isSupplierOrOther: boolean = false;
  unHappyStatus: UnhappyStatus;
  EHeaderTitle = EHeaderTitle;
  EConversationStatusTab = EConversationStatusTab;
  isShowTrudiSendMsg = false; // todo: remove unused code
  createNewConversationConfigs = {
    'header.hideSelectProperty': true,
    'header.title': null,
    'header.showDropdown': false,
    'body.prefillReceivers': false,
    'body.tinyEditor.isShowDynamicFieldFunction': true,
    'footer.buttons.nextTitle': 'Send',
    'footer.buttons.showBackBtn': false,
    'footer.buttons.disableSendBtn': false,
    'otherConfigs.isCreateMessageType': false,
    'otherConfigs.createMessageFrom': ECreateMessageFrom.TASK_HEADER,
    'otherConfigs.isShowGreetingContent': true
  };

  public currentTaskTitle: string = '';
  public isClickSendTask: boolean = false;
  public isMaintenanceFlow: boolean = false;
  public MessageStatus = MessageStatus;

  public isLoadingMessage = this.messageLoadingService.isLoading$;

  public firstLoad = true;
  private timeout1: NodeJS.Timeout = null;
  isArchiveMailbox: boolean;

  public EViewMode = EViewDetailMode;
  public viewMode: EViewDetailMode;
  public agencyId: string = '';
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
  public countConversationUnread: number = 0;
  public taskNotes;
  public noteMessage: string = '';
  public ENoteType = ENoteType;
  public showConvertToTask = false;
  public isActiveProperty: boolean;
  public propertyId;
  readonly SYNC_TYPE = SyncMaintenanceType;
  public isShowModalConfirmProperties: boolean = false;
  public isActionSyncConversationToRM: boolean = false;
  public conversationNotMove = {};
  public errorMessage: string;
  public isShowModalWarning: boolean = false;
  public popupState = {
    showPeople: false,
    verifyEmail: false,
    emailVerifiedSuccessfully: false,
    confirmCall: false,
    isShowAddConversationOption: false,
    confirmDelete: false,
    isShowForwardConversation: false,
    isShowMoveToAnotherTaskModal: false,
    isShowMoveToEmailFolder: false,
    isShowExportSuccess: false,
    plansSummary: false,
    requestSent: false
  };
  public EPopupState = EPopupMoveMessToTaskState;
  public currentTask: TaskItem;
  public isMoving: boolean = false;
  public EButtonType = EButtonType;
  public EButtonTask = EButtonTask;
  public selectedProperty = '';
  public currentTab: EConversationStatusTab;
  public activeMobileApp: boolean = false;
  public shouldClearConversationIdParam = false;
  public justChangeTab = false;
  public taskDetailTab = [
    {
      title: 'OPEN',
      isUnreadMessage: false
    },
    {
      title: 'RESOLVED',
      isUnreadMessage: false
    },
    {
      title: 'DELETED',
      isUnreadMessage: false
    },
    {
      title: 'DRAFT',
      isUnreadMessage: false
    }
  ];

  private listOpenTabStatus = [
    EConversationStatus.open,
    EConversationStatus.reopen,
    EConversationStatus.schedule
  ];
  private initialConversationId: string;
  public isCompanyMailbox: boolean = false;
  private dataCreateConversationApp: ICreateNewConversationApp = {
    taskId: '',
    conversationId: ''
  };

  public tempConversations: ITempConversation[] = [];
  private tempConversatioIdCaches: Set<string> = new Set();

  constructor(
    public readonly sharedService: SharedService,
    public conversationService: ConversationService,
    public popupService: PopupService,
    public userService: UserService,
    public taskService: TaskService,
    private agencyService: AgencyService,
    private activatedRoute: ActivatedRoute,
    private websocketService: RxWebsocketService,
    private propertyService: PropertiesService,
    private headerService: HeaderService,
    private trudiScheduledMsgService: TrudiScheduledMsgService,
    private messageLoadingService: MessageLoadingService,
    private messageTaskLoadingService: MessageTaskLoadingService,
    private inboxService: InboxService,
    public taskDetailService: TaskDetailService,
    private router: Router,
    private route: ActivatedRoute,
    private internalNoteService: InternalNoteService,
    private internalNoteApiService: InternalNoteApiService,
    private cdRef: ChangeDetectorRef,
    private toastCustomService: ToastCustomService,
    private companyService: CompanyService,
    private syncResolveMessageService: SyncResolveMessageService,
    private toastService: ToastrService,
    private loadingService: LoadingService,
    private emailApiService: EmailApiService,
    private sharedMessageViewService: SharedMessageViewService,
    private messageMenuService: MessageMenuService,
    private inboxSidebarService: InboxSidebarService,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private messageFlowService: MessageFlowService,
    private messageService: MessageService,
    private PreventButtonService: PreventButtonService,
    private voiceMailService: VoiceMailService,
    private store: Store,
    private appMessageListService: AppMessageListService,
    private helper: HelperService,
    private inboxFilterService: InboxFilterService,
    private filesService: FilesService,
    private conversationSummaryService: ConverationSummaryService
  ) {
    this.isTaskType = this.helper.isInboxDetail;
    this.isCreateAppMsg = TaskHelper.isCreateAppMsg(this.router.url);

    this.activatedRoute.queryParams
      .pipe(
        takeUntil(this.unsubscribe),
        tap((queryParams) => {
          this.conversationId = queryParams?.['conversationId'];
          this.currentNotificationId = queryParams?.['notificationId'];
          this.currentConversationType = queryParams?.['conversationType'];
          const tempConversationId = queryParams?.['tempConversationId'];
          if (tempConversationId) {
            this.tempConversatioIdCaches.add(tempConversationId);
          }
        }),
        filter(() => this.router.url.includes(ERouterLinkInbox.TASK_DETAIL)),
        map((queryParams) => ({
          tab: queryParams?.['tab'],
          conversationId: queryParams?.['conversationId']
        })),
        tap(({ tab, conversationId }) => {
          const conversationList = this.listOfConversations$.value || [];
          const conversation: UserConversationOption = conversationList.find(
            (el) => el.id === conversationId
          );
          if (!tab && conversationId && conversation) {
            const detectCurrentTabValue =
              this.getCurrentTabFromConversationId(
                conversationId
              ).currentTabConversation;
            this.router.navigate([], {
              queryParams: {
                tab: mapTabTitles[detectCurrentTabValue]
              },
              queryParamsHandling: 'merge'
            });
          }
        }),
        filter(({ tab }) => {
          return tab;
        }),
        distinctUntilChanged(isEqual)
      )
      .subscribe(({ tab, conversationId }) => {
        const conversationList = this.listOfConversations$.value || [];
        const conversation: UserConversationOption = conversationList.find(
          (el) => el.id === conversationId
        );
        const currentConversationId =
          this.conversationService.trudiResponseConversation.value?.id;
        this.currentTabTemplateBind = mapTabValues[tab];
        this.handleFilterConversationStatus(
          this.currentTabTemplateBind,
          this.listOfConversations$.value
        );
        if (conversation && conversation.id !== currentConversationId) {
          this.openConversation(conversation);
          if (
            !this.propertyService.currentPropertyId.value &&
            conversation.propertyId
          ) {
            this.propertyService.currentPropertyId.next(
              conversation?.propertyId
            );
          }
        }
      });

    this.router.events
      .pipe(
        takeUntil(this.unsubscribe),
        filter((event) => event.type === EventType.NavigationEnd)
      )
      .subscribe(() => {
        this.isCreateAppMsg = TaskHelper.isCreateAppMsg(this.router.url);
      });

    this.activatedRoute.params
      .pipe(
        takeUntil(this.unsubscribe),
        map((params) => params?.['taskId']),
        filter(Boolean),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.conversationService.reloadConversationList.next(false);
      });
  }

  shouldHandleProcess(): boolean {
    return this.PreventButtonService.shouldHandleProcess(
      EButtonTask.CONVERSATION_ADD_TO_EXISTING_TASK,
      EButtonType.TASK
    );
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.isShowTrudiSendMsg = false;
        this.conversationService.reloadConversationList.next(true);
        if (!event.isDraft) {
          this.toastCustomService.handleShowToastMessSend(event);
          this.messageSent.emit();
        }
        break;
      default:
        break;
    }
  }

  onTriggerLoadingHeaderConversation() {
    this.conversationService.triggerLoadingHeaderConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (!data) return;
        if (data['isNewCompose']) {
          this.listConversationsByStatus.unshift(data);
        } else {
          this.listConversationsByStatus.push(data);
        }
      });
  }

  onTriggerRemoveScratchTicket() {
    this.conversationService.triggerRemoveScratchTicket
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((status) => {
        if (!status) return;
        this.dataCreateConversationApp = null;
      });
  }

  ngOnInit() {
    this.onTriggerLoadingHeaderConversation();
    this.onTriggerRemoveScratchTicket();
    this.conversationService.tempConversations
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((conversations) => {
        if (!this.helper.isInboxDetail) return;
        this.tempConversations = conversations;
      });

    this.messageLoadingService.setLoading(true);
    this.isConsole = this.sharedService.isConsoleUsers();
    this.messageLoadingService.isLoading$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isLoading) => {
        this.isLoading = isLoading;
      });

    combineLatest([
      this.inboxService.getIsDisconnectedMailbox(),
      this.inboxService.isArchiveMailbox$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([isArchiveMailbox, isDisconnectedMailbox]) => {
        this.isArchiveMailbox = isArchiveMailbox;
        this.createNewConversationConfigs['footer.buttons.disableSendBtn'] = [
          isArchiveMailbox,
          isDisconnectedMailbox
        ].includes(true);
      });
    const params$ = this.isTaskType
      ? zip(this.activatedRoute.params, this.activatedRoute.queryParams)
      : this.activatedRoute.queryParams.pipe(
          map((queryParams) => [null, queryParams])
        );

    this.onStoreChange();

    combineLatest([params$, this.taskService.reloadTaskDetail])
      .pipe(
        takeUntil(this.unsubscribe),
        map(([params]) => params),
        map((res) => {
          if (!res) return {};
          const [params, _] = res;
          const queryParams = this.activatedRoute.snapshot.queryParams;
          return {
            taskId: params?.['taskId'] || queryParams?.['taskId'],
            conversationId:
              params?.['conversationId'] || queryParams?.['conversationId']
          };
        }),
        // skip reload when prev conversationId is empty
        // or params are the same
        distinctUntilChanged(
          (prev, curr) =>
            prev.taskId === curr.taskId &&
            !!prev.conversationId &&
            prev.conversationId === curr.conversationId
        ),
        tap(() => {
          if (!this.initialConversationId) {
            this.loadingService.onLoading();
            this.messageTaskLoadingService.onLoading();
            this.messageTaskLoadingService.onLoadingMessage();
          }
          this.firstLoad = true;
        }),
        switchMap((queryParams) => {
          const { taskId, conversationId } = queryParams;
          this.conversationId = conversationId;
          // skip api call if taskId is the same
          if (
            this.taskId === taskId &&
            this.listOfConversations$.getValue().length
          ) {
            return combineLatest([
              of(false),
              of(this.listOfConversations$.getValue())
            ]);
          }
          if (!taskId) {
            return combineLatest([of(false), of()]);
          }
          this.taskId = taskId;
          this.listOfConversations$.next([]);
          this.taskService.currentTaskId$.next(this.taskId);
          return combineLatest([
            of(true),
            this.conversationService
              .getListOfConversationsByTaskId(this.taskId)
              .pipe(catchError(() => of([])))
          ]);
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe(([isCallApi, res]) => {
        this.firstLoad = false;
        this.messageLoadingService.setLoading(false);
        if (!res) return;

        this.loadingService.stopLoading();
        this.messageTaskLoadingService.stopLoading();
        this.messageTaskLoadingService.stopLoadingMessage();
        const conversation = res.find(
          (item) => item.id === this.conversationId
        );

        if (this.isTaskType && isCallApi) {
          const detectTab = this.getCurrentTabFromConversationId(
            this.conversationId,
            res,
            conversation?.isDraft &&
              !(
                this.listOpenTabStatus.includes(
                  conversation?.status as EConversationStatus
                ) && !conversation.isScratchDraft
              )
          ).currentTabConversation;
          if (
            conversation?.isDraft &&
            detectTab === EConversationStatusTab.OPEN &&
            this.currentTabTemplateBind === EConversationStatusTab.DRAFT
          ) {
            this.currentTabTemplateBind = EConversationStatusTab.DRAFT;
          } else {
            this.currentTabTemplateBind = detectTab;
          }
          this.router.navigate([], {
            queryParams: {
              tab: mapTabTitles[this.currentTabTemplateBind]
            },
            queryParamsHandling: 'merge'
          });
        }

        this.shouldClearConversationIdParam = true;
        this.taskService.listOfConversations$.next(res);
        this.mapConversationProperties(res);
        this.taskService.checkAllConversationsInTaskIsRead(
          this.taskId || this.taskService.currentTaskId$.getValue(),
          this.taskService.currentTask$.getValue()?.status as TaskStatusType,
          this.listOfConversations$.getValue() as UserConversation[]
        );
        if (!this.isCreateAppMsg || !this.isTaskType) {
          this.selectFirstConversationInList();
        }
        this.countConversationUnread = this.listOfConversations$
          .getValue()
          ?.filter(
            (conversation) =>
              !conversation.isSeen &&
              (conversation.status === EConversationStatus.open ||
                conversation.status === EConversationStatus.reopen)
          ).length;
      });

    combineLatest([
      this.taskService.currentTaskId$.pipe(distinctUntilChanged()),
      this.conversationService.reloadConversationList
    ])
      .pipe(
        debounceTime(500),
        skipWhile(() => this.firstLoad),
        takeUntil(this.unsubscribe)
      )
      .subscribe(([taskId, res]) => {
        if (!res || !taskId) return;
        // skip when the task is not the same when sending new message
        // this case will be handled by query params change
        if (
          typeof res === 'string' &&
          EReloadConversationSource[res] ===
            EReloadConversationSource.SendMessage &&
          taskId !== this.taskId
        ) {
          return;
        }
        this.reloadListConversation(taskId, true);
      });

    this.currentStatus = this.conversationService.currentStatus;
    this.conversationService.updatedConversationList
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.mapConversationProperties(res);
          this.taskService.checkAllConversationsInTaskIsRead(
            this.taskService.currentTaskId$.getValue(),
            this.taskService.currentTask$.getValue()?.status as TaskStatusType,
            this.listOfConversations$.getValue() as UserConversation[]
          );
          this.conversationService.setListOfConversation(
            this.listOfConversations$.getValue()
          );
          this.countConversationUnread = this.listOfConversations$
            .getValue()
            .filter(
              (conversation) =>
                !conversation.isSeen &&
                (conversation.status === EConversationStatus.open ||
                  conversation.status === EConversationStatus.reopen)
            ).length;
        }
      });
    this.conversationService.conversationList
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.mapConversationProperties(res);
          this.taskService.checkAllConversationsInTaskIsRead(
            this.taskService.currentTaskId$.getValue(),
            this.taskService.currentTask$.getValue()?.status as TaskStatusType,
            this.listOfConversations$.getValue() as UserConversation[]
          );
          this.conversationService.setListOfConversation(
            this.listOfConversations$.getValue()
          );
        }
      });

    this.conversationService.joinConversation$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((state) => {
        if (state) {
          this.moveConversationToTopList(
            state.conversationId,
            state.conversationStatus,
            state.messageStatus
          );
        }
      });

    this.conversationService.currentConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.currentConvId = res?.id;
      });

    this.conversationService.changeConversationStatus
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && res.id === MessageStatus.resolved) {
          this.selectConversationTab(res);
        }
        if (res && res.id === MessageStatus.reopen) {
          this.currentStatus = this.status.open;
          this.conversationService.reloadConversationList.next(true);
        }
      });

    this.websocketService.onSocketUpdateTaskStatus
      .pipe(
        filter(
          (data) =>
            data?.taskIds?.includes(this.taskId) || data?.taskId === this.taskId
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((data) => {
        const { taskType, newStatus: taskStatus } = data;
        this.headerService.headerState$.next({
          ...this.headerService.headerState$.value,
          currentStatus: taskStatus,
          currentTask: this.taskService.currentTask$.value
        });
        if (
          taskStatus !== this.taskService.currentTask$.value?.status &&
          taskType === this.taskService.currentTask$.value?.taskType
        ) {
          this.taskService.currentTask$.next({
            ...this.taskService.currentTask$.value,
            status: taskStatus
          });
        }

        const currentConversation =
          this.conversationService.currentConversation?.getValue();
        if (currentConversation && taskStatus === TaskStatusType.inprogress) {
          this.conversationService.trudiChangeConversationStatus(
            EMessageType.open
          );
          this.conversationService.setUpdatedConversation(
            currentConversation.id,
            EConversationType.reopened
          );
        }
        this.conversationService.reloadConversationList.next(true);
      });

    this.websocketService.onSocketVoiceCall
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        filter((socket) => socket.taskId === this.taskId),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        if (!this.headerService.getIsSendBulkMessage()) {
          this.conversationService.reloadConversationList.next(true);
        }
      });

    this.websocketService.onSocketSend
      .pipe(
        distinctUntilChanged(),
        filter((socket) => socket.taskId === this.taskId),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        // load new msg socket send
        if (!this.headerService.getIsSendBulkMessage()) {
          this.conversationService.reloadConversationList.next(true);
          this.messageService.triggerUseMasterDB.next(true);
        }
      });

    this.websocketService.onSocketDeleteDraft
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        filter((socket) => socket.taskId === this.taskId),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        this.conversationService.reloadConversationList.next(true);
      });

    this.websocketService.onSocketNewInvoice
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        filter((socket) => socket.taskId === this.taskId),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        this.taskService.reloadTaskDetail.next(true);
      });

    this.websocketService.onSocketCall
      .pipe(
        distinctUntilChanged(),
        debounceTime(200),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        const data = res;
        try {
          const index = this.listOfConversations$
            .getValue()
            .findIndex((el) => el.id === data.conversationId);
          if (index > -1) {
            const currentListConversations =
              this.listOfConversations$.getValue();
            currentListConversations[index] = {
              ...currentListConversations[index],
              updatedAt: new Date().toISOString(),
              message: 'Call in progress',
              isRead: this.checkConversationIsReadSocket(data),
              lastUser: {
                ...this.listOfConversations$.getValue()[index].lastUser,
                avatar: data.googleAvatar || data.callerAvatar,
                firstName: data.senderName || data.callerFirstName,
                lastName: data.lastName || data.callerLastName,
                type: 'AGENT',
                id: data.userId
              },
              isSendViaEmail: data.isSendFromEmail
            };

            this.mapConversationProperties(currentListConversations);
            this.taskService.checkAllConversationsInTaskIsRead(
              this.taskService.currentTaskId$.getValue(),
              this.taskService.currentTask$.getValue()
                ?.status as TaskStatusType,
              currentListConversations as UserConversation[]
            );
          } else {
          }
        } catch (e) {
          console.log(e);
        }
      });
    this.websocketService.onSocketConv
      .pipe(
        distinctUntilChanged(),
        debounceTime(200),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        const data = res;
        this.handleMoveConversationRealTime(data);
      });
    this.websocketService.onSocketBulkMessage
      .pipe(
        distinctUntilChanged(),
        debounceTime(200),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        if (!this.headerService.getIsSendBulkMessage()) {
          const data = res;
          this.handleBulkMessageRealTime(data);
        }
      });

    this.subscribeCurrentTask();
    this.conversationService.markCurrentConversationBS
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),
        filter(Boolean)
      )
      .subscribe((res) => {
        if (
          !res ||
          (!res.hasOwnProperty('isSeen') && !res.hasOwnProperty('isRead'))
        )
          return;
        if (
          [EMessageMenuOption.READ, EMessageMenuOption.UNREAD].includes(
            res?.option
          )
        )
          this.handleChangeCountMsg(res?.conversationId, res?.isSeen, false);
        this.listConversationsByStatus = [
          ...this.listConversationsByStatus.map((item) => {
            if (item.id === res.conversationId) {
              return {
                ...item,
                isSeen: res.isSeen,
                isRead: res.isRead
              };
            }
            return item;
          })
        ];
      });

    this.taskService.clickSendTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isClickSendTask = res;
      });

    this.inboxService.currentMailBox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailbox) => {
        if (mailbox) {
          this.isCompanyMailbox = mailbox?.type === EMailBoxType.COMPANY;
        }
      });

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailboxId) => {
        if (mailboxId) {
          this.currentMailboxId = mailboxId;
        }
      });

    this.trudiScheduledMsgService.scheduleMessageCount$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((msg) => {
        if (!msg) return;
        const listOfConversations =
          this.listOfConversations$
            .getValue()
            ?.map((conversation: UserConversation) => {
              if (msg.conversationId === conversation.id) {
                conversation.scheduleMessageCount = msg.count;
              }
              conversation.lastMessage = this.getLastMessage(conversation);
              return conversation;
            }) || [];
        this.listOfConversations$.next(listOfConversations);
      });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
      });

    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe(() => {
        this.setCurrentTab();
      });
    this.subscribeToSocketMoveEmailFolder();
    this._subscriberCurrentViewIdSocket();
    this._getCurrentViewNote();
    this._subscribeSeenConversationSocket();
    this._subscribeNewNoteMentionSocket();
    this._subscriberEditInternalNote();
    this.subscribeSocketAssignContact();
    this._subscriberNewUnreadNoteData();
    this.onSocketJobScheduled();
    this.checkDisableButton();
    this.websocketService.onSocketChangeStatusTaskToTaskDetail
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (data.taskId === this.taskId) {
          this.toastDataChangeStatusTask = data;
        } else {
          this.toastCustomService.openToastCustom(data as unknown);
        }
      });

    this.listOfConversations$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listConversation) => {
        this.store.dispatch(
          taskDetailActions.updateConversations({
            conversations: listConversation,
            taskId: this.taskId
          })
        );
      });

    this.companyService
      .getActiveMobileApp()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.activeMobileApp = res;
      });

    this.triggerRemoveMsgDraftFromOpen();
    this.triggerCreateConversationApp();
    this.onTriggerSendMessage();
    this.subscribeSocketUnReadTicket();
  }

  private subscribeSocketUnReadTicket() {
    this.conversationSummaryService.triggerCountTicketConversation$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.listConversationsByStatus = this.listConversationsByStatus.map(
          (msg) => {
            if (
              msg.id === data?.conversationId &&
              msg.taskId === data?.taskId
            ) {
              return {
                ...msg,
                countUnreadTicket: data?.countUnreadTicket
              };
            }
            return msg;
          }
        );
      });
  }

  onTriggerSendMessage() {
    this.conversationService.triggerSendMessage
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((event) => {
        if (!this.helper.isInboxDetail) return;
        this.tempConversatioIdCaches.add(event.tempConversationId);
      });
  }

  handleChangeTabManual(currentTab: number) {
    this.justChangeTab = true;
    this.conversationId = null;
    this.router.navigate([], {
      queryParams: {
        conversationId: null,
        tab: mapTabTitles[currentTab],
        appMessageCreateType: null
      },
      queryParamsHandling: 'merge'
    });
  }

  handleChangeTabSelected(currentTab: number) {
    this.currentTabTemplateBind = currentTab;
    this.conversationService.currentTabConversation.next(currentTab);
    this.handleFilterConversationStatus(
      this.currentTabTemplateBind,
      this.listOfConversations$.getValue()
    );
    // Change tab but do not automatically open conversation
    // In cases where this.isTabChangeFromUser is false, conversation selection needs to be handled manually
    if (this.isTabChangeFromUser) {
      this.conversationService.setCurrentConversation(null);
      this.selectFirstConversationInList();
      this.handleNavigator(
        this.EViewMode.CONVERSATION,
        this.listConversationsByStatus[0] as UserConversation
      );
    }
    this.isTabChangeFromUser = true;
    this.currentTabChanged.emit();
  }

  handleFilterConversationStatus(
    currentTab: EConversationStatusTab,
    listConversation: UserConversationOption[]
  ) {
    const categorizedConversations =
      this.categorizeAndIndicateUnreadMessages(listConversation);
    this.setConversationsByCurrentTab(
      currentTab,
      categorizedConversations[EConversationStatusTab.OPEN],
      categorizedConversations[EConversationStatusTab.RESOLVED],
      categorizedConversations[EConversationStatusTab.DELETED]
    );
  }

  getCurrentTabFromConversationId(
    conversationId,
    listConversation?,
    isTabDraft = false
  ) {
    if (conversationId) {
      const conversation = (
        listConversation || this.listOfConversations$.getValue()
      )?.find((conversations) => {
        return conversations.id === conversationId;
      });

      if (conversation) {
        let messageToast = this.generateTitleForToast(
          conversation.conversationType,
          conversation.status as EConversationType
        );
        let currentTabConversation;
        switch (conversation.status) {
          case EConversationStatus.open:
          case EConversationStatus.reopen:
            currentTabConversation = isTabDraft
              ? EConversationStatusTab.DRAFT
              : EConversationStatusTab.OPEN;

            if (isTabDraft) {
              messageToast = DRAFT_SAVED;
            }
            break;
          case EConversationStatus.draft:
            messageToast = DRAFT_SAVED;
            currentTabConversation = EConversationStatusTab.DRAFT;
            break;
          case EConversationStatus.resolved:
            currentTabConversation = EConversationStatusTab.RESOLVED;
            break;
          case EConversationStatus.deleted:
            currentTabConversation = EConversationStatusTab.DELETED;
            break;
          default:
            currentTabConversation = EConversationStatusTab.OPEN;
            break;
        }
        return {
          messageToast,
          currentTabConversation
        };
      }
    }
    return {
      messageToast: null,
      currentTabConversation: EConversationStatusTab.OPEN
    };
  }

  generateTitleForToast(
    conversationType: EConversationType,
    status = EConversationType.reopened
  ) {
    const typeLowerCase = [
      EConversationType.reopened,
      EConversationType.open
    ].includes(status as EConversationType)
      ? 'reopened'
      : status.toLowerCase();
    switch (conversationType) {
      case EConversationType.APP:
        return `App message ${typeLowerCase}`;
      case EConversationType.VOICE_MAIL:
        return `Voicemail message ${typeLowerCase}`;
      default:
        return `Message ${typeLowerCase}`;
    }
  }

  setConversationsByCurrentTab(
    currentTab: EConversationStatusTab,
    open: UserConversationOption[],
    resolved: UserConversationOption[],
    deleted: UserConversationOption[]
  ) {
    this.currentTab = currentTab;
    switch (currentTab) {
      case EConversationStatusTab.OPEN:
        if (this.dataCreateConversationApp?.conversationId) {
          this.listConversationsByStatus = open.filter(
            (conversation) =>
              conversation.id ===
                this.dataCreateConversationApp.conversationId ||
              !conversation.isScratchTicket
          );
        } else {
          this.listConversationsByStatus = open.filter(
            (conversation) => !conversation.isScratchTicket
          );
        }
        break;
      case EConversationStatusTab.RESOLVED:
        this.listConversationsByStatus = resolved;
        break;
      case EConversationStatusTab.DELETED:
        this.listConversationsByStatus = deleted;
        break;
      case EConversationStatusTab.DRAFT:
        this.listConversationsByStatus = this.listOfConversations$
          .getValue()
          ?.filter((conversation) => {
            const isDraftConversation =
              conversation.isDraft &&
              (conversation.conversationType !== EConversationType.APP ||
                conversation.status !== EConversationStatus.resolved);

            const isDraftResolvedAppConversation =
              conversation.isLastMessageDraft &&
              conversation.conversationType === EConversationType.APP &&
              conversation.status === EConversationStatus.resolved;

            return isDraftConversation || isDraftResolvedAppConversation;
          });
        break;
      default:
        this.listConversationsByStatus = open;
        break;
    }
    this.conversationService.sortData(
      this.listConversationsByStatus,
      currentTab === EConversationStatusTab.DRAFT
    );
  }

  triggerDisallowReassignProperty(listConversation) {
    const matchesConversationType = Array.isArray(listConversation)
      ? listConversation.find(
          (item) =>
            (item.conversationType === EConversationType.VOICE_MAIL &&
              ![EPropertyStatus.deleted, EPropertyStatus.archived].includes(
                item.propertyStatus as EPropertyStatus
              )) ||
            (item.conversationType === EConversationType.APP &&
              !item.isScratchDraft)
        )
      : null;

    const isDisallowReassignProperty = !!matchesConversationType;
    this.headerService.triggerDisallowReassignProperty$.next({
      isDisallowReassignProperty,
      matchesConversationType
    });
  }

  categorizeAndIndicateUnreadMessages(
    listConversation: UserConversationOption[]
  ) {
    const filters = [
      (conversation: UserConversationOption) =>
        (this.listOpenTabStatus.includes(
          conversation?.status as EConversationStatus
        ) &&
          !conversation.isScratchDraft) ||
        (!this.isTaskType ? conversation?.isScratchTicket : false),
      (conversation: UserConversationOption) =>
        conversation.status === EConversationStatus.resolved,
      (conversation: UserConversationOption) =>
        conversation.status === EConversationStatus.deleted
    ];

    const categorizedConversations = {
      [EConversationStatusTab.OPEN]: [],
      [EConversationStatusTab.RESOLVED]: [],
      [EConversationStatusTab.DELETED]: []
    };
    Array.isArray(listConversation) &&
      listConversation?.forEach((conversation) => {
        filters.forEach((filter, index) => {
          if (filter(conversation)) {
            const tabKey = Object.keys(categorizedConversations)[index];
            categorizedConversations[tabKey].push(conversation);
          }
        });
      });

    Object.keys(categorizedConversations).forEach((tab) => {
      const hasUnread = categorizedConversations[tab].some(
        (conversation) => !conversation.isSeen
      );
      this.taskDetailTab[tab].isUnreadMessage = hasUnread;
    });

    return categorizedConversations;
  }

  private onStoreChange() {
    this.store
      .select(selectAllConversation)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((listConversation) => {
        this.triggerDisallowReassignProperty(listConversation);
        if (
          this.currentConversationType === EConversationType.VOICE_MAIL &&
          this.isTargetAfterInit
        ) {
          this.handleVoiceMailConversationSelection(listConversation);
        } else {
          this.handleConversationSelection(listConversation);
        }

        if (!this.isTaskType) {
          this.initialConversationId = listConversation?.find(
            (item) => item.id === this.conversationId
          )?.id;
          if (this.initialConversationId) {
            this.store.dispatch(
              conversationPageActions.loadConversationState({
                id: this.initialConversationId
              })
            );
          }
        }
      });
  }

  handleConversationSelection(listConversation) {
    this.handleFilterConversationStatus(
      this.currentTabTemplateBind,
      listConversation
    );
  }

  handleVoiceMailConversationSelection(listConversation) {
    if (this.conversationId && listConversation.length) {
      this.currentTabTemplateBind = this.getCurrentTabFromConversationId(
        this.conversationId,
        listConversation
      ).currentTabConversation;
      this.isTargetAfterInit = false;
    }
    this.handleFilterConversationStatus(
      this.currentTabTemplateBind,
      listConversation
    );
    if (
      this.listConversationsByStatus.length === 0 &&
      this.isTaskType &&
      this.shouldClearConversationIdParam
    ) {
      this.selectFirstConversationInList();
    }
  }

  private subscribeToSocketMoveEmailFolder() {
    this.websocketService.onSocketMoveMessageToFolder
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res.listSuccess?.length > 0) {
          const idMessagesRemoved = res.listSuccess
            .filter((item) => item?.isTask)
            .map((item) => item.conversationId);
          let listConversations;
          if (res.isRemoveFromTask && !this.isTaskType) {
            listConversations = this.listOfConversations$
              ?.getValue()
              .map((item) => {
                if (res.conversationInTaskId !== item.id) return item;

                return {
                  ...item,
                  id: idMessagesRemoved[0],
                  taskId: res.listSuccess[0].taskId
                };
              });
          } else {
            listConversations = this.listOfConversations$
              ?.getValue()
              .filter((item) => !idMessagesRemoved.includes(item.id));
          }
          this.listOfConversations$.next(listConversations);
          this.conversationService.listConversationByTask.next(
            this.listOfConversations$.getValue() as UserConversation[]
          );
          if (this.listOfConversations$.getValue().length === 0) {
            this.conversationService.setCurrentConversation(null);
          } else {
            if (!res.isRemoveFromTask) this.selectFirstConversationInList();
          }
        }
        if (res?.typeMove === EToastSocketType.UNDO_SPAM) {
          this.conversationService.reloadConversationList.next(true);
        }
      });
  }
  // todo find other solution
  // onFocusConversation() {
  //   window.document.getElementById(this.conversationId)?.focus();
  // }

  checkDisableButton() {
    this.isActiveProperty = ![
      EPropertyStatus.deleted,
      EPropertyStatus.archived,
      EPropertyStatus.inactive
    ].includes(this.currentConversation?.propertyStatus);
  }

  private subscribeSocketAssignContact() {
    this.websocketService.onSocketAssignContact
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (
          this.listOfConversations$
            .getValue()
            ?.findIndex(
              (conversation) => conversation.id === res.conversationId
            ) > -1
        ) {
          const listConversations = this.listOfConversations$
            .getValue()
            .map((conversation) => {
              if (conversation.id === res?.conversationId) {
                return {
                  ...conversation,
                  participants: res.participants
                };
              }
              return conversation;
            });
          this.listOfConversations$.next(listConversations);
        }
      });
  }

  private _subscribeSeenConversationSocket() {
    this.websocketService.onSocketSeenConversation
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),
        filter((res) =>
          this.websocketService.checkIgnoreCurrentUser(res?.fromUserId)
        )
      )
      .subscribe((res) => {
        const { conversationId, isSeen, userId, isBulkSeen, conversations } =
          res;
        const currentUserId = this.userService.userInfo$.getValue()?.id;
        if (isBulkSeen) {
          conversations.forEach((conversation) => {
            if (
              userId &&
              userId === currentUserId &&
              !conversation?.conversationId
            ) {
              return;
            }
            if (conversation?.conversationId) {
              this.handleChangeCountMsg(
                conversation?.conversationId,
                isSeen,
                true
              );
            }
          });
        } else {
          if (userId && userId === currentUserId && !conversationId) {
            return;
          }
          if (conversationId) {
            this.handleChangeCountMsg(conversationId, isSeen, true);
          }
        }
        this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
          this.currentMailboxId
        );
      });
  }

  handleChangeCountMsg(conversationId: string, isSeen: boolean, isWS: boolean) {
    // Handle listOfConversations
    const conversation = this.listOfConversations$
      .getValue()
      ?.find((x) => x.id === conversationId);
    let hasChange = false;
    if (conversation && conversation.isSeen !== isSeen) {
      conversation.isSeen = isSeen;
      conversation.isRead = isSeen;
      hasChange = true;
    }
    // Handle appChatHeader
    if (isWS) {
      this.conversationService.markCurrentConversationBS.next({
        conversationId,
        isSeen,
        isRead: isSeen,
        option: isSeen ? EMessageMenuOption.READ : EMessageMenuOption.UNREAD
      });
    }

    // Handle total unreadCount
    const unreadCount = this.listOfConversations$
      .getValue()
      ?.filter(
        (conversation) =>
          !conversation.isSeen &&
          (conversation.status === EConversationStatus.open ||
            conversation.status === EConversationStatus.reopen)
      ).length;
    if (this.countConversationUnread != unreadCount) {
      this.countConversationUnread = unreadCount;
      hasChange = true;
    }
    this.categorizeAndIndicateUnreadMessages(
      this.listOfConversations$.getValue()
    );
    if (hasChange) {
      this.cdRef.markForCheck();
    }
  }

  private _subscribeNewNoteMentionSocket() {
    this.websocketService.onSocketNewNoteMention
      .pipe(
        takeUntil(this.unsubscribe),
        filter(
          (note) =>
            Boolean(note) &&
            note.taskId === this.taskService.currentTaskId$.getValue()
        )
      )
      .subscribe(() => {
        this.internalNoteService.setRefreshNote(true);
      });
  }

  private _subscriberEditInternalNote() {
    this.websocketService.onSocketEditNoteMention
      .pipe(
        takeUntil(this.unsubscribe),
        filter(
          (note) =>
            Boolean(note) &&
            note.taskId === this.taskService.currentTaskId$.getValue()
        )
      )
      .subscribe((res) => {
        this.internalNoteService.setRefreshNote(true);
      });
  }

  private _subscriberNewUnreadNoteData() {
    this.websocketService.onSocketNewUnreadNoteData
      .pipe(
        takeUntil(this.unsubscribe),
        filter(
          (res) =>
            !!res && res.taskId === this.taskService.currentTaskId$.getValue()
        )
      )
      .subscribe((res) => {
        if (this.taskNotes?.unReadData?.unreadCount !== res.unreadCount) {
          this.taskNotes.unReadData.unreadCount = res.unreadCount;
          this.cdRef.markForCheck();
        }
      });
  }
  private onSocketJobScheduled() {
    // navigate to conversation if scheduled from resolve tab
    this.websocketService.onSocketJob
      .pipe(
        filter(
          (response) =>
            Boolean(response) && response?.action === ESendMessageType.SCHEDULE
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((response) => {
        if (response.type === SocketType.completeJob) {
          const queryParams = this.route.snapshot.queryParams;
          if (
            this.helper.isInboxDetail &&
            queryParams['tab'] === EConversationStatus.resolved &&
            queryParams['conversationType'] === EConversationType.APP
          ) {
            this.router.navigate(
              ['/dashboard', 'inbox', 'detail', queryParams['taskId']],
              {
                queryParams: {
                  tab: EConversationStatus.open,
                  conversationId: response.conversationId,
                  pendingSelectFirst: true
                },
                queryParamsHandling: 'merge'
              }
            );
            this.toastService.success('App message reopened');
          }
        }
      });
  }

  private getDataNotes(taskId: string = this.taskId) {
    if (taskId) {
      this.internalNoteApiService
        .getDataInternalNote(taskId)
        .pipe(
          distinctUntilChanged((prev, curr) => !!(prev.taskId === curr.taskId)),
          filter(Boolean),
          map((res) => {
            const participants = res.noteParticipants
              .map(({ firstName, lastName }) =>
                [firstName, lastName].filter(Boolean).join(' ')
              )
              .join(', ');
            return {
              ...res,
              participants
            };
          })
        )
        .subscribe((res) => {});
    }
  }

  setCurrentTab() {
    const currentURL = this.router.url;
    if (currentURL.includes('internal-note')) {
      this.viewMode = EViewDetailMode.INTERNAL_NOTE;
    } else {
      this.viewMode = EViewDetailMode.CONVERSATION;
    }
  }

  private _subscriberCurrentViewIdSocket() {
    this.websocketService.onSocketCurrentNoteViewed
      .pipe(
        takeUntil(this.unsubscribe),
        filter((note) => Boolean(note) && note.data.taskId === this.taskId)
      )
      .subscribe((data) => {
        this.internalNoteService.setCurrentViewNote(data.data);
      });
  }

  private _getCurrentViewNote() {
    this.internalNoteService.getRefreshNote
      .pipe(takeUntil(this.unsubscribe), filter(Boolean))
      .subscribe((value) => {
        this.getDataNotes();
      });
  }

  handleNavigator(
    viewMode: EViewDetailMode,
    conversation?: UserConversation,
    callback?: () => void
  ) {
    const url = this.router?.url ?? '';
    if (
      viewMode !== EViewDetailMode.CONVERSATION &&
      TaskHelper.isCreateAppMsg(url)
    ) {
      return;
    }
    this.viewMode = viewMode;
    const { status, taskType, taskNameId } =
      this.taskService.currentTask$.getValue() || {};
    const prefixURL = stringFormat(AppRoute.TASK_DETAIL, this.taskId);
    switch (viewMode) {
      case EViewDetailMode.CONVERSATION:
        this.inboxService.setChangeUnreadData(null);
        this.router
          .navigate(['/dashboard', 'inbox', 'detail', this.taskId], {
            queryParams: {
              inboxType: this.inboxFilterService.getSelectedInboxType(),
              taskStatus: status,
              taskTypeID: taskNameId,
              type: taskType,
              conversationId: this.conversationId,
              conversationType: conversation?.conversationType,
              appMessageCreateType: null,
              tab: this.isTaskType
                ? mapTabTitles[this.currentTabTemplateBind]
                : null,
              fromScratch: null
            },
            queryParamsHandling: 'merge'
          })
          .then(() => {
            callback && callback();
          });
        break;
      case EViewDetailMode.INTERNAL_NOTE:
        this.router.navigateByUrl(`${prefixURL}/internal-note`);
        break;
      case EViewDetailMode.APP_MESSAGE:
        this.router.navigateByUrl(
          `${prefixURL}/app-messages?appMessageCreateType=NEW_APP_MESSAGE`
        );
        break;
    }
  }

  checkConversationIsReadSocket(socket: SocketSendData | SocketCallData) {
    if (socket.userId === trudiUserId) {
      return true;
    }
    if (
      socket.userType === 'SUPPLIER' ||
      socket.userType === 'USER' ||
      !socket.userType
    ) {
      return false;
    }
    return true;
  }
  get isShowConversation() {
    return this.viewMode === EViewDetailMode.CONVERSATION;
  }
  subscribeCurrentTask() {
    this.taskService.currentTask$
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && res.id === this.taskId) {
          this.currentTask = res;
          const currentCategory = res.trudiResponse?.setting?.categoryId;
          this.currentTaskTitle =
            currentCategory === CONVERSATION_CATEGORIES.LEASE_RENEWAL
              ? res.title + ' - ' + res.property.streetline
              : res.title;
          this.currentTaskDeleted =
            this.taskService.checkIfCurrentTaskDeleted();
          this.headerService.headerState$.next({
            ...this.headerService.headerState$.value,
            currentTask: res,
            title: res?.status?.toLowerCase()
          });
          this.unHappyStatus = res.unhappyStatus;
          this.isUnHappyPath = res.isUnHappyPath;
          this.taskDetailData = res.trudiResponse?.data?.[0]?.taskDetail;
        }
      });

    this.taskService.readTask$
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.taskService.readTask(res.id).subscribe();
        }
      });
  }

  updateCurrentConversationStatusInAppChat() {
    const currentConversationInService =
      this.conversationService.currentConversation.value;
    const currentConversation = this.listOfConversations$
      .getValue()
      .find((el) => el.id === currentConversationInService?.id);
    if (currentConversation && currentConversation.id) {
      this.conversationService.updateConversationStatus$.next({
        status: currentConversation.status,
        user: {
          ...currentConversation.lastUser
        },
        option: null,
        addMessageToHistory: false
      });
    }
  }

  loadListConversationByTaskId(taskId: string) {
    this.conversationService
      .getListOfConversationsByTaskId(taskId)
      .pipe(catchError(() => of([])))
      .subscribe((res) => {
        if (!res) return;

        this.mapConversationProperties(res);
        this.taskService.checkAllConversationsInTaskIsRead(
          this.taskService.currentTaskId$.getValue(),
          this.taskService.currentTask$.getValue().status as TaskStatusType,
          this.listOfConversations$.getValue() as UserConversation[]
        );
      });
  }

  moveConversationToTopList(
    conversationId: string,
    conversationStatus: string,
    messageStatus?: string
  ): void {
    const index = this.listOfConversations$
      .getValue()
      .findIndex((el) => el.id === conversationId);
    const currentUser = this.userService.userInfo$.value;
    if (index > -1) {
      const currentListConversations = this.listOfConversations$.getValue();

      currentListConversations[index] = {
        ...currentListConversations[index],
        status: conversationStatus,
        updatedAt: new Date().toISOString(),
        message: this.conversationService.getMessageByStatus(
          messageStatus || conversationStatus,
          currentListConversations[index].message
        ),
        lastUser: {
          ...currentListConversations[index].lastUser,
          id: currentUser.id,
          avatar: currentUser.googleAvatar,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          type: currentUser.type
        }
      };

      this.listOfConversations$.next(currentListConversations);
    }
  }

  selectFirstConversationInList() {
    const url = this.router.url;
    const queryParams = this.route.snapshot.queryParams;
    const foundConversation = this.listConversationsByStatus?.some(
      (item) => item.id === queryParams['conversationId']
    );
    if (!foundConversation && queryParams['pendingSelectFirst']) {
      return;
    }
    if (TaskHelper.isCreateAppMsg(url)) {
      return;
    }
    const listConversation =
      (this.isTaskType
        ? this.listConversationsByStatus
        : this.listOfConversations$.getValue()) || [];
    let conversation: UserConversationOption =
      listConversation.find((el) => el.id === this.conversationId) ||
      listConversation[0];
    this.openConversation(conversation);
    if (!this.propertyService.currentPropertyId.value) {
      if (conversation?.propertyId) {
        this.propertyService.currentPropertyId.next(conversation?.propertyId);
      }
    }
  }

  parseStringToArray(arrayString) {
    if (typeof arrayString === 'string') {
      const listOfMessageOptiopns = JSON.parse(arrayString);
      return listOfMessageOptiopns[listOfMessageOptiopns.length - 1] || '';
    } else if (Array.isArray(arrayString)) {
      return arrayString[arrayString.length - 1] || '';
    }
    return '';
  }

  async handleClickConversation(conversation) {
    const handleNavigation = () => {
      this.handleNavigator(EViewDetailMode.CONVERSATION, conversation, () => {
        this.openConversation(conversation);
      });
    };

    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['fromScratch'] || queryParams['pendingSelectFirst']) {
      await this.router.navigate([], {
        queryParams: {
          fromScratch: null,
          pendingSelectFirst: null
        },
        queryParamsHandling: 'merge'
      });
    }
    handleNavigation();
  }

  openConversation(conversation: any) {
    const queryParams = this.route.snapshot.queryParams;
    if (!conversation?.id && queryParams['pendingSelectFirst']) {
      return;
    }

    this.conversationId = conversation?.id;
    let trudiResponse;
    if (
      this.listOfConversations$.getValue() &&
      this.listOfConversations$.getValue().length
    ) {
      trudiResponse = this.listOfConversations$
        .getValue()
        .find((el) => el.trudiResponse);

      this.isRead = this.listOfConversations$
        .getValue()
        ?.some(
          (item) =>
            item.isRead == false && item.status !== MessageStatus.schedule
        );
    }

    this.conversationService.openConversation(
      conversation,
      trudiResponse || this.listOfConversations$.getValue()
    );
    this.conversationService.resetConversationState();
    this.conversationService.actionLinkList.next([]);
    this.conversationService._actionLinkList = [];
    this.isReadEvent.emit(this.isRead);
  }

  reloadListConversation(taskId: string, useMaster: boolean = false) {
    this.conversationService
      .getListOfConversationsByTaskId(taskId, false, useMaster)
      .pipe(
        catchError(() => of([])),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        if (res) {
          this.countConversationUnread = res?.filter(
            (conversation) =>
              !conversation.isSeen &&
              (conversation.status === EConversationStatus.open ||
                conversation.status === EConversationStatus.reopen)
          ).length;
          this.mapConversationProperties(res);
          this.taskService.checkAllConversationsInTaskIsRead(
            this.taskService.currentTaskId$.getValue(),
            this.taskService.currentTask$.getValue()?.status as TaskStatusType,
            this.listOfConversations$.getValue() as UserConversation[]
          );
          this.updateCurrentConversationStatusInAppChat();
          if (!this.isCreateAppMsg || !this.isTaskType) {
            this.selectFirstConversationInList();
          }
          if (
            this.isTaskType &&
            this.isCreateAppMsg &&
            this.messageFlowService.sendMsgCommunicationStep$.getValue()
          ) {
            let conversation = res.find((el) => el.id === this.conversationId);
            this.handleNavigator(EViewDetailMode.CONVERSATION, conversation);
            this.messageFlowService.sendMsgCommunicationStep$.next(false);
          }
          if (this.toastDataChangeStatusTask) {
            this.toastCustomService.openToastCustom(
              this.toastDataChangeStatusTask
            );
            this.toastDataChangeStatusTask = null;
          }
          const previousConversation =
            this.conversationService.previousConversation$.getValue();
          if (previousConversation && this.isTaskType) {
            const { messageToast, currentTabConversation } =
              this.getCurrentTabFromConversationId(
                previousConversation.id,
                null,
                previousConversation.isTabDraft
              );

            const dataForToast = {
              title: messageToast
            };
            const previousConversationTemp = previousConversation;
            this.toastCustomService
              .handleShowToastTaskDetailSubNav(dataForToast)
              .pipe(takeUntil(this.unsubscribe))
              .subscribe(() => {
                this.router.navigate([], {
                  queryParams: {
                    conversationId: previousConversationTemp?.id,
                    tab: mapTabTitles[currentTabConversation]
                  },
                  queryParamsHandling: 'merge'
                });
              });
          }
          this.conversationService.previousConversation$.next(null);
          // clear loading reply via app
          this.conversationService.filterTempConversations(
            (item) => !this.tempConversatioIdCaches.has(item.id),
            'HEADER_CONVERSATIONS'
          );

          const queryParams = this.route.snapshot.queryParams;
          if (queryParams['pendingSelectFirst']) {
            this.router
              .navigate([], {
                queryParams: {
                  appMessageCreateType: null,
                  pendingSelectFirst: null,
                  tempConversationId: null
                },
                queryParamsHandling: 'merge'
              })
              .then(() => {
                this.selectFirstConversationInList();
              });
            return;
          }
        }
      });
  }

  selectConversationTab(event) {
    this.currentStatus = event;
    this.currentStatus && this.conversationService.setNewTab(event);
  }

  search(search) {
    this.conversationService.applySearch(search);
  }

  replaceBr(message) {
    return message.replace(/<br>/gi, '');
  }

  isUnreadIndicator(conversation: UserConversation) {
    return (
      !conversation.isRead && conversation.status !== MessageStatus.schedule
    );
  }

  getLastMessage(conversation: UserConversation) {
    if (conversation.message) {
      let { message, lastUser } = conversation;
      if (message) {
        message = replaceMessageToOneLine(message);
      }
      if (lastUser.id === this.userService.selectedUser.value.id) {
        return this.replaceBr('You' + ': ' + message);
      } else if (lastUser.id === trudiUserId) {
        return this.replaceBr('Trudi' + ': ' + message);
      } else if (lastUser.id === conversation.userId) {
        return message;
      } else {
        return this.replaceBr(
          this.sharedService.displayName(
            lastUser.firstName,
            lastUser.lastName
          ) +
            ': ' +
            message
        );
      }
    } else if (conversation.status === MessageStatus.resolved) {
      return 'Trudi: Resolved';
    } else if (conversation.status === MessageStatus.schedule) {
      return `${conversation.scheduleMessageCount} ${
        conversation.scheduleMessageCount === 1 ? 'message' : 'messages'
      } scheduled`;
    } else if (conversation.messageOptions) {
      return this.replaceBr(
        'Trudi: ' + this.parseStringToArray(conversation.messageOptions)
      );
    } else {
      return 'new conversation';
    }
  }

  handleMoveConversationRealTime(data: any): boolean {
    try {
      if (data.type !== SocketType.moveConversation || !data?.conversationId)
        return false;
      if (data.taskId === this.taskService.currentTaskId$.getValue()) {
        const listConversations = this.listOfConversations$
          .getValue()
          .filter((item: any) => item.id !== data.conversationId);
        this.listOfConversations$.next(listConversations);
      } else if (
        data.newTaskId === this.taskService.currentTaskId$.getValue()
      ) {
        this.loadListConversationByTaskId(data.newTaskId);
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  handleBulkMessageRealTime(data: any): boolean {
    try {
      if (
        data.type !== SocketType.bulkMessage ||
        !data.taskId ||
        this.taskService.currentTaskId$.getValue() !== data.taskId
      )
        return false;
      this.loadListConversationByTaskId(data.taskId);
      if (
        data &&
        data.type === SocketType.bulkMessage &&
        this.taskId === data.taskId
      ) {
        this.taskService.currentTask$.next({
          ...this.taskService.currentTask$.value,
          status: data.status
        });

        this.headerService.headerState$.next({
          ...this.headerService.headerState$.value,
          currentStatus: data.status,
          currentTask: this.taskService.currentTask$.value
        });
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  getCurrentTabConversation(conversationStatus, isTabDraft) {
    let currentTabConversation;

    switch (conversationStatus) {
      case EConversationStatus.open:
      case EConversationStatus.reopen:
        currentTabConversation = isTabDraft
          ? EConversationStatusTab.DRAFT
          : EConversationStatusTab.OPEN;
        break;

      case EConversationStatus.resolved:
        currentTabConversation = EConversationStatusTab.RESOLVED;
        break;

      case EConversationStatus.deleted:
        currentTabConversation = EConversationStatusTab.DELETED;
        break;

      default:
        currentTabConversation = EConversationStatusTab.OPEN;
        break;
    }

    return currentTabConversation;
  }

  mapConversationProperties(listOfConversations: Partial<UserConversation>[]) {
    if (!Array.isArray(listOfConversations)) return;
    const isInternalNoteOpening = this.router.url.includes('internal-note');
    const triggerFilterScratchTicket =
      this.appMessageListService.triggerFilterScratchTicket.getValue();
    const listConversations = listOfConversations.map((item) => {
      const detectCurrentTabValue = this.getCurrentTabConversation(
        item,
        item.isDraft
      );
      if (
        item.id === this.currentConvId &&
        detectCurrentTabValue === this.currentTabTemplateBind &&
        !isInternalNoteOpening &&
        !this.isConsole
      ) {
        item.isRead = true;
        item.isSeen = true;
      }
      if (triggerFilterScratchTicket && item.isScratchTicket) {
        item.status = EConversationStatus.open;
      }
      item.isUnreadIndicator = this.isUnreadIndicator(item as UserConversation);
      item.fullName =
        this.sharedService.displayName(item?.firstName, item?.lastName) || '';
      item.lastMessage = this.getLastMessage(item as UserConversation);
      return item;
    });
    if (triggerFilterScratchTicket) {
      this.appMessageListService.triggerFilterScratchTicket.next(false);
    }
    this.listOfConversations$.next(listConversations);
  }

  openSendMsgModal() {
    this.isShowTrudiSendMsg = true;
    const currentTask = this.taskService.currentTask$.getValue();
    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs,
      'header.hideSelectProperty':
        !this.taskService.currentTask$?.getValue()?.property?.isTemporary,
      'header.title':
        this.taskService.currentTask$?.getValue()?.property?.streetline || null
    };

    const tasks = [
      {
        taskId: currentTask.id,
        propertyId: currentTask.property?.id
      }
    ];
    this.createNewConversationConfigs['inputs.selectedTasksForPrefill'] = tasks;
    if (this.router.url.includes(ERouterLinkInbox.TASK_DETAIL)) {
      this.createNewConversationConfigs['footer.buttons.disableSendBtn'] =
        false;
    }
    this.messageFlowService
      .openSendMsgModal(this.createNewConversationConfigs)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.handlePopupState({ isShowAddConversationOption: false });
        switch (rs.type) {
          case ESendMessageModalOutput.MessageSent:
            this.onSendMsg(rs.data);
            break;
        }
      });
  }

  onOutSide() {
    this.handlePopupState({ isShowAddConversationOption: false });
  }

  handleCloseSendMsgModal() {
    this.isShowTrudiSendMsg = false;
    this.selectedTasks = [];
  }

  handleMenuChange(event: {
    conversation: UserConversation;
    option: EMessageMenuOption;
    messageIds?: string[];
  }) {
    const { conversation, option } = event;
    this.currentConversation = conversation;
    switch (option) {
      case EMessageMenuOption.CREATE_NEW_TASK:
        if (!this.shouldHandleProcess()) return;
        this.handleConvertToTask(conversation);
        break;

      case EMessageMenuOption.MOVE_TO_TASK:
        if (!this.shouldHandleProcess()) return;
        this.handleMoveToAnotherTask(conversation);
        break;

      case EMessageMenuOption.MOVE_TO_FOLDER:
        if (!this.shouldHandleProcess()) return;
        this.handleMoveToEmail(conversation);
        break;

      case EMessageMenuOption.REMOVE_FROM_TASK:
        this.handleRemoveFromTask(conversation);
        break;

      case EMessageMenuOption.REOPEN:
        this.handleReopen(conversation);
        break;

      case EMessageMenuOption.DELETE:
        this.handleDelete(conversation);
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
        this.handleFlagUrgent(conversation, option);
        break;
      case EMessageMenuOption.EDIT:
        this.handleClickConversation(conversation);
        this.handleNavigator(this.EViewMode.CONVERSATION, conversation);
        break;

      case EMessageMenuOption.SAVE_TO_RENT_MANAGER:
      case EMessageMenuOption.SAVE_TO_PROPERTY_TREE:
      case EMessageMenuOption.DOWNLOAD_AS_PDF:
        this.handleSaveConversationToCRM(option);
        break;
    }
  }

  handleDeleteOnKeyUp(conversation: UserConversation) {
    this.handleMenuChange({ conversation, option: EMessageMenuOption.DELETE });
  }

  handleConvertToTask(conversation: UserConversation) {
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

          const propertyId = conversation?.isTemporaryProperty
            ? ''
            : conversation?.propertyId;

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
          currentPropertyId,
          isFromTrudiApp:
            conversation.conversationType === EConversationType.APP,
          isFromVoiceMail:
            !!currentPropertyId &&
            conversation.conversationType === EConversationType.VOICE_MAIL
        };
        this.taskDetailService.setAddToTaskConfig(data);
      });
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
        next: () => {},
        error: () => {
          this.toastService.clear();
          this.toastService.error(EToastSocketTitle.MESSAGE_SPAM_FAIL);
        },
        complete: () => {
          this.conversationService.reloadConversationList.next(true);
        }
      });
  }

  private handleFlagUrgent(
    conversation: UserConversation,
    option: EMessageMenuOption
  ) {
    this.conversationService
      .updateFlagUrgent(conversation.id)
      .subscribe((res: IFlagUrgentMessageResponse) => {
        this.updateConversationsProperty(
          conversation,
          EMessageProperty.IS_URGENT,
          res?.isUrgent,
          option
        );
        this.voiceMailService.setUpdatedConversation(
          EMessageProperty.IS_URGENT,
          res.id,
          res?.isUrgent
        );
      });
  }

  private handleMarkUnreadConversation(
    conversation: UserConversation,
    option: EMessageMenuOption
  ) {
    if (option === EMessageMenuOption.UNREAD) {
      this.conversationService
        .markAsUnread(conversation.id)
        .subscribe((res) => {
          this.currentConversation.isSeen = res.isSeen;
          this.currentConversation.isRead = res.isSeen;
          this.conversationService.markCurrentConversationBS.next({
            ...res,
            option
          });
          this.voiceMailService.setUpdatedConversation(
            EMessageProperty.IS_SEEN,
            conversation.id,
            res.isSeen
          );
        });
    } else {
      this.conversationService
        .markAsReadConversation(conversation.id, this.currentMailboxId)
        .subscribe((res) => {
          this.currentConversation.isSeen = res.isSeen;
          this.currentConversation.isRead = res.isSeen;
          this.conversationService.markCurrentConversationBS.next({
            ...res,
            option
          });
          this.voiceMailService.setUpdatedConversation(
            EMessageProperty.IS_SEEN,
            conversation.id,
            res.isSeen
          );
        });
      this.inboxService.setChangeUnreadData({
        isReadMessage: true,
        previousMessageId: null,
        currentMessageId: null
      });
    }
  }

  updateConversationsProperty(
    conversation: UserConversation,
    propertyToUpdate: EMessageProperty,
    propertyValue: boolean,
    option: EMessageMenuOption
  ) {
    const listConversations = this.listOfConversations$.getValue().map((e) =>
      e.id === conversation.id
        ? {
            ...e,
            [propertyToUpdate]: propertyValue
          }
        : e
    );
    this.listOfConversations$.next(listConversations);
    this.conversationService.markCurrentConversationBS.next({
      conversationId: conversation.id,
      propertyToUpdate: propertyToUpdate,
      propertyValue: propertyValue,
      option
    });
  }

  handleDelete(conversation: UserConversation) {
    const isDraft = !!(
      this.isConsole ||
      conversation.isScratchDraft ||
      conversation.isScratchTicket
    );
    if (isDraft) {
      this.conversationService
        .deleteDraftMsg({
          draftMessageId: conversation.lastMessageDraft.id,
          taskId: conversation.taskId,
          conversationId: conversation.id,
          isFromDraftFolder: this.router.url?.includes(
            ERouterLinkInbox.MSG_DRAFT
          )
        })
        .subscribe(() => {
          const listConversations = [
            ...this.listOfConversations$
              .getValue()
              .filter((item) => item.id !== conversation.id)
          ];
          this.listOfConversations$.next(listConversations);
          // this.conversationService.previousConversation$.next(conversation);
          this.conversationService.reloadConversationList.next(true);
        });
      return;
    }
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
          .deleteConversationV2(conversation.id)
          .subscribe((res) => {
            if (res) {
              const listConversations = [
                ...this.listOfConversations$
                  .getValue()
                  .filter((item) => item.id !== conversation.id)
              ];
              this.listOfConversations$.next(listConversations);
              this.conversationService.navigateToFirstOfNextConversation(
                res.conversationId
              );
              this.conversationService.previousConversation$.next(conversation);
              this.conversationService.reloadConversationList.next(true);
            }
          });
        break;
    }
  }

  showQuitConfirm(status: boolean) {
    this.handlePopupState({ confirmDelete: status });
  }

  handleResolve(conversation: UserConversation) {
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
      .subscribe((res) => {
        if (res) {
          this.conversationService.previousConversation$.next({
            ...conversation,
            status: EConversationType.resolved
          });
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

  handleSaveConversationToCRM(crm: EMessageMenuOption) {
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
        propertyId: this.task.property.id
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

  handleCancelConfirmProperties(value) {
    this.isShowModalConfirmProperties = value;
    this.isActionSyncConversationToRM = value;
  }

  selectedPropertyInDetail(selectedProperty) {
    this.selectedProperty = selectedProperty;
  }

  handleConfirmProperties() {
    this.task.property.id = this.selectedProperty;
    this.syncConversationToCRM(
      this.isRmEnvironment
        ? EMessageMenuOption.SAVE_TO_RENT_MANAGER
        : EMessageMenuOption.SAVE_TO_PROPERTY_TREE
    );
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
      propertyId: this.propertyId,
      conversationId: conversation.id,
      isFromVoiceMail:
        conversation?.conversationType === EConversationType.VOICE_MAIL,
      isFromTrudiApp: conversation?.conversationType === EConversationType.APP
    };
    this.taskDetailService.setAddToTaskConfig(data);
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
          this.messageLoadingService.setLoading(false);
          this.conversationService.reloadConversationList.next(true);
          this.filesService.reloadAttachments.next(true);
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

  handleQuitModal() {
    this.handlePopupState({ isShowMoveToAnotherTaskModal: false });
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  triggerRemoveMsgDraftFromOpen() {
    this.appMessageListService.triggerRemoveMsgDraftFromOpen
      .pipe(
        takeUntil(this.unsubscribe),
        filter(() => this.helper.isInboxDetail)
      )
      .subscribe((res) => {
        if (res) {
          this.appMessageListService.triggerRemoveMsgDraftFromOpen.next(false);
        }
      });
  }

  trackByFn(_, item) {
    return item.id;
  }

  triggerCreateConversationApp() {
    this.conversationService
      .getCreateConversationApp()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (!this.isTaskType || !data) return;
        this.dataCreateConversationApp = data;
      });
  }
  // end handle slide component

  ngOnDestroy() {
    clearTimeout(this.timeout1);
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.resetSendMessageModal = true;
    this.popupService.isShowActionLinkModal.next(false);
    this.conversationService.reloadConversationList.next(false);
    this.conversationService.resetCurrentPropertyId();
    this.conversationService.resetConversationList();
    this.conversationService.resetSearchAddressFromUsers();
    this.conversationService.currentConversationId.next(null);
  }
}
