import {
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  distinctUntilChanged,
  filter,
  first,
  mergeMap,
  takeUntil,
  tap,
  debounceTime,
  delay,
  merge,
  timer
} from 'rxjs';
import { Action, Store } from '@ngrx/store';
import {
  ActivatedRoute,
  NavigationExtras,
  Params,
  Router
} from '@angular/router';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService } from '@/app/services/shared.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import {
  selectAllMessage,
  selectFetchingMessage,
  selectFetchingMoreMessage,
  selectMessagePayload,
  selectTotalMessage,
  whatsappPageActions
} from '@core/store/whatsapp';
import { hasMessageFilter } from '@/app/dashboard/modules/inbox/utils/function';
import {
  EConfirmContactType,
  EConversationType,
  EMailBoxStatus,
  EMessageComeFromType,
  EMessageType,
  EPropertyStatus,
  ETrudiType,
  GroupType,
  SocketType,
  TaskStatusType,
  TaskType,
  UserTypeEnum
} from '@shared/enum';
import { SharedMessageViewService } from '@/app/services/shared-message-view.service';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { TaskItem } from '@shared/types/task.interface';
import { RxWebsocketService } from '@/app/services/rx-websocket.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { CurrentUser, IUserParticipant } from '@shared/types/user.interface';
import { CompanyService } from '@/app/services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { InboxExpandService } from '@/app/dashboard/modules/inbox/services/inbox-expand.service';
import { EFolderType } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import {
  CAN_NOT_MOVE,
  MESSAGES_MOVING_TO_TASK,
  MESSAGE_MOVING_TO_TASK,
  MOVE_MESSAGE_FAIL,
  MOVE_MESSAGE_TO_FOlDER
} from '@/app/services/messages.constants';
import { ToastrService } from 'ngx-toastr';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { TaskService } from '@/app/services/task.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { IMailFolderQueryParams } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { ConversationService } from '@/app/services/conversation.service';
import { PropertiesService } from '@/app/services/properties.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { EInboxFilterSelected } from '@/app/dashboard/modules/inbox/modules/app-message-list/interfaces/message.interface';
import {
  addItem,
  removeActiveItem,
  selectedItems
} from '@/app/dashboard/modules/inbox/utils/msg-task';
import {
  ISocketMessageToTask,
  ISocketMoveMessageToFolder,
  SocketSendData
} from '@shared/types/socket.interface';
import { omit, isEqual, cloneDeep } from 'lodash-es';
import { LIMIT_TASK_LIST } from '@/app/dashboard/utils/constants';
import { SyncMessagePropertyTreeService } from '@/app/services/sync-message-property-tree.service';
import { SyncResolveMessageService } from '@/app/services/sync-resolve-message.service';
import { TaskDragDropService } from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';
import {
  EInboxAction,
  ERouterLinkInbox
} from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import {
  AutoScrollService,
  SiblingEnum
} from '@/app/dashboard/modules/inbox/services/auto-scroll.service';
import { whatsappActions } from '@/app/core/store/whatsapp/actions/whatsapp.actions';
import { WhatsappMenuService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp-menu.service';
import { WhatsappIdSetService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp-id-set.service';
import { WhatsappService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp.service';
import { buildWhatsappQueryParams } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/utils/function';
import {
  EConversationStatus,
  EPopupConversionTask,
  WhatsappList,
  WhatsappProperty,
  WhatsappQueryType,
  WhatsappRetrieval,
  IWhatsappQueryParams,
  MenuOption
} from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';
import {
  PageWhatsAppType,
  WhatsAppConnectStatus
} from '@/app/dashboard/shared/types/whatsapp-account.interface';
import { WhatsappAccountService } from '@/app/dashboard/services/whatsapp-account.service';
import { LAST_MSG_TYPE_EXCLUDED } from '@/app/dashboard/modules/inbox/constants/constants';
import {
  CONVERSATION_STATUS,
  trudiUserId,
  UserType
} from '@/app/services/constants';
import { HeaderService } from '@/app/services/header.service';
import { FacebookService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook.service';
import { WhatsappApiService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp-api.service';
import { whatsappDetailApiActions } from '@/app/core/store/whatsapp-detail/actions/whatsapp-detail-api.actions';
import { getUserFromParticipants } from '@/app/trudi-send-msg/utils/helper-functions';
import { IParticipant } from '@/app/shared';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';
import { RxStrategyNames } from '@rx-angular/cdk/render-strategies';

@Component({
  selector: 'whatsapp-view-list',
  templateUrl: './whatsapp-view-list.component.html',
  styleUrl: './whatsapp-view-list.component.scss'
})
export class WhatsappViewListComponent implements OnInit, OnDestroy {
  @ViewChild('infiniteScrollContainer')
  infiniteScrollContainer: ElementRef<HTMLElement>;

  public queryTaskId: string = '';
  public channelId: string = '';
  public queryConversationId: string = '';
  public textMessage = [
    `You've resolved all WhatsApp messages assigned to you.`,
    'There are no resolved WhatsApp messages assigned to you'
  ];
  public subTextMessage = [
    'To view WhatsApp messages assigned to other team members',
    'To view all resolved WhatsApp messages'
  ];
  public textNoResult = [
    `Give yourself a high five! You've cleared your WhatsApp messages.`,
    'No resolved WhatsApp messages to display'
  ];
  private companyId: string = '';
  private currentMailboxId: string = '';
  private pageWhatsApp: PageWhatsAppType;
  private currentUser: CurrentUser;
  private queryParams: Params = {};
  private statusMailBox: EMailBoxStatus;
  private targetFolderName: string;
  private taskFolders = {};
  private autoFetchingMore: boolean = true;
  private lastMessageTypeExcluded = LAST_MSG_TYPE_EXCLUDED;

  public _whatsapps: WhatsappList = [];
  public totalTasks: number = 0;
  public searchText: string = '';
  public listProperty: UserPropertyInPeople[] = [];
  public listArchiveChannel: PageWhatsAppType[] = [];
  public currentWhatsappTask: TaskItem;
  public isAutoScrollToMessage: boolean = true;
  public isFocusView: boolean = false;
  public isFilter: boolean = false;
  public isRmEnvironment: boolean = false;
  public isResolved: boolean = false;
  public isHiddenFilter: boolean = false;
  public isMoving: boolean = false;
  public showSpinnerTop: boolean = false;
  public showSpinnerBottom: boolean = false;
  public isError: boolean = false;
  public isConsole: boolean = false;
  public isLoadingIndex: boolean = true;
  public inboxList: TaskItem[] = [];
  public folderUid: string = '';
  public currentDraggingToFolderName: string = '';

  public startIndex = -1;
  public listMsgActive: string[] = [];
  public hasSelectedInbox: boolean = false;
  public isWhatsappDisconnect: boolean = false;
  public currentSyncStatus: {
    status: string;
    conversationSyncDocumentAt: string;
  };
  public renderStrategy: RxStrategyNames = 'immediate';
  public isConnectWhatsAppScreen: boolean = false;

  private readonly destroy$ = new Subject<void>();
  public readonly showList$ = new BehaviorSubject<boolean>(true);
  public readonly showDetail$ = new BehaviorSubject<boolean>(false);
  public readonly EMailBoxStatus = EMailBoxStatus;
  public readonly EPopupConversionTask = EPopupConversionTask;
  public readonly EViewDetailMode = EViewDetailMode;
  public readonly TaskType = TaskType;

  private readonly fetchWhatsappMessage$ = new Subject<{
    payload: IWhatsappQueryParams;
  }>();

  public set whatsapps(value: WhatsappList) {
    this.dispatchZone(
      whatsappActions.setAll({
        messages: value
      })
    );
  }

  get isSelectedMove(): boolean {
    return this.inboxToolbarService.hasItem;
  }

  private get loadingMore(): boolean {
    return this.showSpinnerTop || this.showSpinnerBottom;
  }

  private set loadingMore(value: boolean) {
    this.showSpinnerTop = value;
    this.showSpinnerBottom = value;
  }

  // getter for whatsapp list
  get whatsapps(): WhatsappList {
    return this._whatsapps;
  }

  // observable cache store
  public readonly whatsapp$ = combineLatest({
    tasks: this.store.select(selectAllMessage).pipe(
      tap((tasks) => {
        this._whatsapps = tasks;
        this.isHiddenFilter = !tasks.length;
      })
    ),
    totalTasks: this.store.select(selectTotalMessage).pipe(
      tap((value) => {
        this.totalTasks = value;
      })
    ),
    payload: this.store.select(selectMessagePayload),
    fetching: this.store.select(selectFetchingMessage),
    fetchingMore: this.store.select(selectFetchingMoreMessage).pipe(
      tap((fetchingMore) => {
        this.loadingMore !== fetchingMore && (this.loadingMore = fetchingMore);
      })
    )
  }).pipe(
    debounceTime(300),
    filter(
      (data) =>
        this.processTaskListResponse(data) &&
        !data.fetching &&
        !data.fetchingMore
    ),
    tap(({ tasks }) => {
      this.showList$.next(!!tasks.length);
      this.inboxService.setIsAllFiltersDisabled(false);
      this.checkSelectTaskDetail();
      timer(500).subscribe(() => (this.isLoadingIndex = false));
    }),
    takeUntil(this.destroy$)
  );

  private processTaskListResponse(response: {
    tasks: TaskItem[];
    totalTasks: number;
    fetching: boolean;
    payload: Partial<IWhatsappQueryParams>;
  }): boolean {
    // if current page is not the first page and the messages's length is less than the limit
    // mean that we have reached the last page,
    // so we need to load previous page to make the list scrollable
    const { tasks, payload, totalTasks } = response;

    const calculateLastPage = Math.ceil(totalTasks / LIMIT_TASK_LIST) - 1;
    const isLastPage =
      payload.page > 0 &&
      tasks.length < LIMIT_TASK_LIST &&
      payload.page === calculateLastPage;

    if (this.autoFetchingMore && isLastPage) {
      this.dispatchZone(whatsappPageActions.prevPage());
      this.isAutoScrollToMessage = true;
      this.loadingMore = false;
      this.autoFetchingMore = false;
    }

    return !isLastPage;
  }

  constructor(
    private readonly sharedService: SharedService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly inboxFilterService: InboxFilterService,
    private readonly elementRef: ElementRef,
    private readonly sharedMessageViewService: SharedMessageViewService,
    private readonly nzContextMenuService: NzContextMenuService,
    private readonly rxWebsocketService: RxWebsocketService,
    private readonly userService: UserService,
    private readonly agencyService: AgencyService,
    private readonly companyService: CompanyService,
    private readonly inboxExpandService: InboxExpandService,
    private readonly taskDragDropService: TaskDragDropService,
    private readonly inboxSidebarService: InboxSidebarService,
    private readonly taskService: TaskService,
    private readonly statisticService: StatisticService,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly conversationService: ConversationService,
    private readonly toastService: ToastrService,
    private readonly toastCustomService: ToastCustomService,
    private readonly emailApiService: EmailApiService,
    private readonly propertiesService: PropertiesService,
    private readonly whatsappMenuService: WhatsappMenuService,
    private readonly whatsappIdSetService: WhatsappIdSetService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly ngZone: NgZone,
    private readonly syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private readonly syncResolveMessageService: SyncResolveMessageService,
    private readonly autoScrollService: AutoScrollService,
    private readonly headerService: HeaderService,
    public readonly inboxService: InboxService,
    public readonly whatsappService: WhatsappService,
    public readonly whatsappAccountService: WhatsappAccountService,
    public readonly facebookService: FacebookService,
    private readonly whatsappApiService: WhatsappApiService,
    private readonly conversationSummaryService: ConverationSummaryService
  ) {}

  ngOnInit(): void {
    this.initializeWhatsappHandling();
    this.subscribeCurrentCompany();
    this.subscribeListProperty();
    this.subscribeInbox();
    this.subcribeCurrentWhatsappTask();

    this.subscribeSocketMoveEmailFolderSocket();
    this.subscribeSocketChangeProperty();
    this.subscribeSocketSeenConversation();
    this.subscribeSocketMessage();
    this.subscribeSocketSend();
    this.subscribeSocketAssignContact();
    this.subscribeSocketMoveEmailStatus();
    this.subscribeSocketMoveMessage();
    this.subscribeDeleteDraft();
    this.subscribeUpdateCountTicketConSocket();
    this.setWhatsAppConnected();
    this.subscribeConnectWhatsApp();
    this.subscribeSocketPmJoinConverstation();
  }

  setWhatsAppConnected() {
    combineLatest([
      this.whatsappService.whatsappSelected$,
      this.activatedRoute.queryParams
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([messager, queryParams]) => {
        this.whatsappService.setWhatsappConnected(
          !!messager || !!queryParams['channelId']
        );
      });
  }

  private initializeWhatsappHandling() {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.store.dispatch(whatsappPageActions.enterPage());
    this.store
      .select(selectTotalMessage)
      .pipe(
        tap((total) => {
          this.statisticService.setStatisticTotalTask({
            type: this.queryParams[WhatsappQueryType.MESSAGE_STATUS],
            value: total
          });
        })
      )
      .subscribe();

    this.whatsappService.listArchiveWhatsApp$
      .pipe(filter(Boolean), takeUntil(this.destroy$))
      .subscribe(
        (listArchiveChannel) => (this.listArchiveChannel = listArchiveChannel)
      );

    this.whatsappService.menuRightClick$
      .pipe(
        filter(({ taskId, conversationId }) => {
          return (
            !!taskId &&
            !!conversationId &&
            this.whatsappIdSetService.has(conversationId)
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ field, value, taskId, conversationId, option }) => {
        if ([MenuOption.REOPEN, MenuOption.RESOLVE].includes(option)) {
          this.removeMessagesByConversationId([conversationId]);
        }

        if (
          [
            MenuOption.FLAG,
            MenuOption.UN_FLAG,
            MenuOption.READ,
            MenuOption.UNREAD
          ].includes(option)
        ) {
          this.updateMessageList(field, value?.[field], taskId, conversationId);
        }
      });

    this.userService
      .getSelectedUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => (this.currentUser = rs));

    this.inboxService
      .getSyncMailBoxStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.statusMailBox = res));

    this.fetchWhatsappMessage$
      .pipe(
        distinctUntilChanged((previous, current) =>
          isEqual(
            omit(previous.payload, [WhatsappQueryType.CURRENT_TASK_ID]),
            omit(current.payload, [WhatsappQueryType.CURRENT_TASK_ID])
          )
        ),
        filter((rs) => !!rs.payload && !!rs.payload.channelId),
        takeUntil(this.destroy$)
      )
      .subscribe(({ payload }) => {
        this.store.dispatch(whatsappPageActions.payloadChange({ payload }));

        if (payload?.isLoading) {
          this.isHiddenFilter = true;
          this.showList$.next(true);
          this.whatsappService.suspenseTrigger$.next(true);
        }
      });

    this.setupWhatsappMessageRetrieval()
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((data) => {
        this.currentMailboxId = data.mailboxId;
        this.pageWhatsApp = data.pageWhatsApp;
        this.searchText = this.queryParams[EInboxFilterSelected.SEARCH];
        const payload = buildWhatsappQueryParams(
          false,
          this.sharedService.isConsoleUsers(),
          data
        );
        this.fetchWhatsappMessage$.next({
          payload
        });
      });

    this.subscribeSyncStatusMessageList();
  }

  subscribeSyncStatusMessageList() {
    const currentListByCRM$ = this.isRmEnvironment
      ? this.syncResolveMessageService.getListConversationStatus()
      : this.syncMessagePropertyTreeService.listConversationStatus;
    currentListByCRM$
      .pipe(takeUntil(this.destroy$))
      .subscribe((listMessageSyncStatus) => {
        if (!listMessageSyncStatus) return;
        this.whatsapps = this.whatsapps?.map((message) => {
          return {
            ...message,
            conversations: message.conversations.map((conversation) => {
              if (
                listMessageSyncStatus.conversationIds?.includes(conversation.id)
              ) {
                return {
                  ...conversation,
                  syncStatus:
                    listMessageSyncStatus.conversationSyncDocumentStatus ||
                    listMessageSyncStatus.status,
                  downloadingPDFFile: listMessageSyncStatus.downloadingPDFFile,
                  conversationSyncDocumentStatus:
                    listMessageSyncStatus.conversationSyncDocumentStatus ||
                    conversation?.conversationSyncDocumentStatus,
                  conversationSyncDocumentAt: new Date(
                    listMessageSyncStatus?.timestamp
                  ).toString()
                };
              }
              return conversation;
            })
          };
        });
      });
  }

  private subscribeInbox() {
    this.inboxSidebarService.taskFolders$
      .pipe(takeUntil(this.destroy$))
      .subscribe((folders) => {
        this.taskFolders = folders?.reduce((acc, folder) => {
          acc[folder.id] = {
            name: folder.name,
            groups: folder.taskGroups
          };
          return acc;
        }, {});
      });

    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs.length === 0 && this.listMsgActive.length > 0) {
          this.handleRemoveActiveMsg();
        }
        this.inboxList = (rs ?? []) as TaskItem[];
        this.hasSelectedInbox = !!this.inboxList.length;
      });

    this.inboxToolbarService.filterInboxList$
      .pipe(takeUntil(this.destroy$))
      .subscribe((filterInboxList) => {
        if (!filterInboxList && this.listMsgActive.length > 0) {
          this.handleRemoveActiveMsg();
        }
      });

    this.inboxToolbarService.handleInboxItemSelection$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ id, conversationId, isReset }) => {
          if (id && this.listMsgActive.length <= 1) {
            this.listMsgActive = [conversationId];
          }
          this._navigateMessageDetail({ taskId: id, conversationId, isReset });
        }
      });

    this.headerService.conversationAction$
      .pipe(takeUntil(this.destroy$))
      .subscribe((action) => {
        if (
          [EInboxAction.RE_OPEN, EInboxAction.RESOLVE].includes(
            action.option as EInboxAction
          )
        ) {
          this.removeMessagesByConversationId(action.conversationIds);
        }
      });
  }

  private subscribeUpdateCountTicketConSocket() {
    this.conversationSummaryService.triggerCountTicketConversation$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.updateMessageList(
          'countUnreadTicket',
          data?.countUnreadTicket,
          data?.taskId,
          data?.conversationId
        );
      });
  }

  private subscribeListProperty() {
    this.propertiesService.listPropertyAllStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((properties) => {
        this.listProperty = properties;
      });
  }

  private subscribeCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        this.companyId = company.id;
      });
  }

  private subcribeCurrentWhatsappTask() {
    this.whatsappService?.currentWhatsappTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.currentWhatsappTask = res));
  }

  private setupWhatsappMessageRetrieval(): Observable<WhatsappRetrieval> {
    return combineLatest({
      queryParams: this.activatedRoute.queryParams,
      mailboxId: this.inboxService.getCurrentMailBoxId(),
      selectedInbox: this.inboxFilterService.selectedInboxType$,
      selectedPortfolio: this.inboxFilterService.selectedPortfolio$,
      selectedAgency: this.inboxFilterService.selectedAgency$,
      selectedStatus: this.inboxFilterService.selectedStatus$,
      userDetail: this.userService.getUserDetail(),
      pageWhatsApp: this.whatsappService.whatsappSelected$
    }).pipe(
      distinctUntilChanged((previous, current) => isEqual(previous, current)),
      filter(this.navigateWithDefaultParams.bind(this)),
      tap(this.handleSideEffects.bind(this)),
      tap(this.updateInternalState.bind(this))
    );
  }

  private handleSideEffects(data) {
    this.queryTaskId =
      this.activatedRoute.snapshot?.queryParams?.[WhatsappQueryType.TASK_ID];
    this.channelId =
      this.activatedRoute.snapshot?.queryParams?.[WhatsappQueryType.CHANNELID];
    this.queryConversationId =
      this.activatedRoute.snapshot?.queryParams?.[
        WhatsappQueryType.CONVERSATION_ID
      ];
    this.isWhatsappDisconnect =
      (!this.listArchiveChannel.find(
        (channel) => channel.id == this.channelId
      ) &&
        [WhatsAppConnectStatus.ARCHIVED].includes(data.pageWhatsApp?.status)) ||
      !data.pageWhatsApp;
    this.updateQueryParamsForBackNavigation(data);
    this.checkSelectTaskDetail();
  }

  private updateInternalState({
    queryParams,
    selectedPortfolio,
    selectedAgency,
    selectedStatus
  }) {
    this.isFocusView =
      queryParams[WhatsappQueryType.INBOX_TYPE] === GroupType.MY_TASK;
    this.isResolved =
      queryParams[WhatsappQueryType.MESSAGE_STATUS] ===
      TaskStatusType.completed;
    this.isFilter = hasMessageFilter(
      queryParams,
      selectedPortfolio,
      selectedAgency,
      selectedStatus
    );
  }

  private updateQueryParamsForBackNavigation({
    queryParams,
    selectedAgency,
    selectedPortfolio,
    selectedStatus
  }) {
    const compareParams = (first: unknown[], second: unknown[]) =>
      Array.isArray(first) &&
      Array.isArray(second) &&
      isEqual(first.sort(), second.sort());

    if (
      !compareParams(
        queryParams[EInboxFilterSelected.ASSIGNED_TO],
        selectedAgency
      ) ||
      !compareParams(
        queryParams[EInboxFilterSelected.PROPERTY_MANAGER_ID],
        selectedPortfolio
      ) ||
      !compareParams(
        queryParams[EInboxFilterSelected.MESSAGE_STATUS],
        selectedStatus
      )
    ) {
      const newQueryParams = {
        ...queryParams,
        assignedTo: selectedAgency,
        messageStatus: selectedStatus,
        propertyManagerId: selectedPortfolio
      };
      this.queryParams = { ...newQueryParams };
      const navigationExtras: NavigationExtras = {
        queryParams: newQueryParams,
        queryParamsHandling: 'merge'
      };
      if (this.statusMailBox !== EMailBoxStatus.UNSYNC) {
        this.router.navigate([], navigationExtras);
      }
    }
  }

  private navigateWithDefaultParams({
    queryParams,
    selectedInbox,
    userDetail
  }: WhatsappRetrieval): boolean {
    const activatedQueryParams =
      this.activatedRoute?.snapshot?.queryParams ?? {};

    // Determine if navigation is needed
    const shouldNavigate =
      (!queryParams[WhatsappQueryType.INBOX_TYPE] ||
        !queryParams[WhatsappQueryType.MESSAGE_STATUS]) &&
      this.statusMailBox !== EMailBoxStatus.UNSYNC;

    if (shouldNavigate) {
      const defaultQueryParams = {
        inboxType: selectedInbox ?? GroupType.MY_TASK,
        status:
          activatedQueryParams[WhatsappQueryType.MESSAGE_STATUS] ??
          TaskStatusType.inprogress,
        taskId: activatedQueryParams?.[EInboxFilterSelected.TASK_ID],
        conversationId:
          activatedQueryParams?.[EInboxFilterSelected.CONVERSATION_ID]
      };

      if (
        userDetail?.userOnboarding?.useDefaultFocusView &&
        !queryParams[WhatsappQueryType.INBOX_TYPE]
      ) {
        defaultQueryParams[WhatsappQueryType.INBOX_TYPE] = this.isConsole
          ? GroupType.TEAM_TASK
          : GroupType.MY_TASK;
      }

      // Merge default and existing query parameters and navigate
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: {
          ...this.queryParams,
          ...activatedQueryParams,
          ...defaultQueryParams
        },
        queryParamsHandling: 'merge'
      });
    }

    return !shouldNavigate;
  }

  private dispatchZone(action: Action) {
    this.ngZone.run(() => this.store.dispatch(action));
  }

  private checkSelectTaskDetail() {
    this.showDetail$.next(
      this._whatsapps.some(
        (t) => t.conversationId === this.queryConversationId
      ) || !!this.queryConversationId
    );
    const currentConversation = this.whatsapps.find(
      (t) => t.conversationId === this.queryConversationId
    );
    if (currentConversation) {
      this.currentSyncStatus = {
        status: currentConversation.conversations[0].syncStatus,
        conversationSyncDocumentAt:
          currentConversation.conversations[0].conversationSyncDocumentAt
      };
    }
  }

  public onScrollUp() {
    if (this.showSpinnerTop) return;
    this.dispatchZone(whatsappPageActions.prevPage());
  }

  public onScrollDown() {
    if (this.showSpinnerBottom) return;
    this.dispatchZone(whatsappPageActions.nextPage());
  }

  public handleSelectedMsg(event) {
    if (this.startIndex === -1) {
      this.startIndex = this.whatsapps.findIndex(
        (item) => item.conversationId === this.queryConversationId
      );
    }
    const isIndexWhatsapp = this.router.url.includes('inbox/whatsapp-messages');
    this.listMsgActive = selectedItems(
      event.isKeepShiftCtr,
      this.startIndex,
      event.lastIndex,
      this.listMsgActive,
      this.whatsapps,
      isIndexWhatsapp
    );
  }

  public handleAddSelectedMsg(event) {
    const res = addItem(
      event.currentMsgId,
      event.currentMsgIndex,
      this.listMsgActive
    );
    if (res) {
      this.listMsgActive = res.activeItems;
      this.startIndex = res._startIndex;
    }
  }

  handleRemoveActiveMsg(currentMsgId?: string) {
    const { activeItems, _startIndex } = removeActiveItem(
      this.listMsgActive,
      this.startIndex,
      currentMsgId
    );
    this.listMsgActive = activeItems;
    this.startIndex = _startIndex;
  }

  public onNextMessage() {
    this.handleNavigateMessage(SiblingEnum.nextElementSibling);
  }

  public onPrevMessage() {
    this.handleNavigateMessage(SiblingEnum.previousElementSibling, true);
  }

  handleNavigateMessage(type, navigatePreMessage: boolean = false) {
    const dataSet = this.autoScrollService.findSiblingElement(
      this.infiniteScrollContainer.nativeElement,
      {
        taskId: this.queryTaskId,
        conversationId: this.queryConversationId,
        type
      }
    );
    this.updateQueryParameters(dataSet);
    this.autoScrollService.scrollToElementSmoothly(dataSet.targetElement, {
      navigatePreMessage,
      callback: () => this._navigateMessageDetail(dataSet)
    });
  }

  private updateQueryParameters(dataSet) {
    if (dataSet?.conversationId && dataSet?.taskId) {
      this.queryConversationId = dataSet?.conversationId;
      this.queryTaskId = dataSet?.taskId;
    }
  }

  private _navigateMessageDetail(data: {
    taskId: string;
    conversationId: string;
    isReset?: boolean;
  }) {
    const { taskId, conversationId, isReset = true } = data;
    const currentQueryParams = this.activatedRoute.snapshot.queryParamMap;
    if (
      currentQueryParams.get(EInboxFilterSelected.TASK_ID) === taskId &&
      currentQueryParams.get(EInboxFilterSelected.CONVERSATION_ID) ===
        conversationId
    ) {
      return;
    }
    this.router
      .navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: {
          taskId,
          conversationId
        },
        queryParamsHandling: 'merge'
      })
      .then(() => {
        this.taskService.triggerOpenMessageDetail.next(taskId);
        isReset && this.inboxToolbarService.setInboxItem([]);
      });
  }

  trackWhatsapp(_, item) {
    return item.conversationId;
  }

  /*
    socket whatsapp
  */

  private subscribeSocketMoveEmailStatus() {
    this.rxWebsocketService.onSocketMoveEmailStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.listSuccess?.length && res.isRemoveFromTask) {
          const idMessageRemoved = res?.listSuccess.map(
            (item) => item?.conversationId
          );
          this.handleMovedEmailFolder(idMessageRemoved, res);
        }
      });
  }

  private subscribeSocketMoveEmailFolderSocket() {
    this.rxWebsocketService.onSocketMoveMessageToFolder
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.listSuccess?.length) {
          const currentTaskStatus = this.mapConversationStatusToTaskStatus(
            res?.newStatus
          );
          const idMessageRemoved = res?.listSuccess.map(
            (item) => item?.conversationId
          );
          if (!res.isRemoveFromTask)
            this.handleMovedEmailFolder(idMessageRemoved, res);
          res?.listSuccess?.forEach((item) => {
            this.whatsappIdSetService.delete(item?.conversationId);
          });
          const isNewMessageSubFolder =
            currentTaskStatus === TaskStatusType.inprogress &&
            res?.newLabel?.id ===
              this.queryParams[WhatsappQueryType.EXTERNAL_ID];
          if (
            currentTaskStatus ===
              this.queryParams[WhatsappQueryType.MESSAGE_STATUS] ||
            isNewMessageSubFolder
          ) {
            this.fetchAndMergeNewMessages(res);
            if (this.statusMailBox !== EMailBoxStatus.SYNCING)
              this.inboxSidebarService.refreshStatisticUnreadTaskChannel(
                this.channelId
              );
          }
        }
      });
  }

  mapConversationStatusToTaskStatus(status: string) {
    return {
      [EConversationStatus.resolved]: TaskStatusType.completed,
      [EConversationStatus.open]: TaskStatusType.inprogress
    }?.[status];
  }

  private handleMovedEmailFolder(
    conversationIds: string[],
    socketData: ISocketMoveMessageToFolder
  ) {
    if (socketData?.isRemoveFromTask) {
      const dataNeedUpdate = socketData.listSuccess.find(
        (x: any) => x.mailBoxId === this.currentMailboxId
      );
      const mapConversations = (conversations) => {
        return conversations.map((item) => {
          if (socketData.conversationInTaskId !== item.id || !dataNeedUpdate) {
            return item;
          }
          return {
            ...item,
            id: dataNeedUpdate.conversationId,
            taskId: dataNeedUpdate.taskId || item.taskId
          };
        });
      };

      this.whatsapps = this.whatsapps.map((item) => {
        if (
          socketData.conversationInTaskId !== item?.conversations[0].id ||
          !dataNeedUpdate
        )
          return item;

        return {
          ...item,
          isMessageInTask: false,
          taskType: TaskType.MESSAGE,
          id: dataNeedUpdate.taskId || item.taskId,
          conversationId: dataNeedUpdate.conversationId,
          conversations: mapConversations(item.conversations)
        };
      });

      if (
        this.currentWhatsappTask?.conversations.some(
          (item) => socketData.conversationInTaskId === item.id
        ) &&
        !!dataNeedUpdate
      ) {
        this.whatsappService.setCurrentWhatsappTask({
          ...this.currentWhatsappTask,
          taskType: TaskType.MESSAGE,
          id: dataNeedUpdate.taskId || this.currentWhatsappTask.id,
          conversations: mapConversations(
            this.currentWhatsappTask.conversations
          )
        });
      }

      if (
        this.router.url.includes(ERouterLinkInbox.WHATSAPP) &&
        this.router.url.includes('&taskId=') &&
        this.router.url.includes(
          `&conversationId=${socketData.conversationInTaskId}`
        ) &&
        !!dataNeedUpdate
      ) {
        const queryParams = {
          taskId: dataNeedUpdate.taskId,
          conversationId: dataNeedUpdate.conversationId,
          reminderType: null
        };

        this.router.navigate([], {
          queryParams,
          queryParamsHandling: 'merge'
        });
      }
    } else {
      this.whatsapps = this.whatsapps.filter(
        (item) => !conversationIds?.includes(item.conversationId)
      );
    }
    this.conversationService.handleMessageActionTriggered();
  }

  private subscribeSocketChangeProperty() {
    // Note: handle change property of message
    this.rxWebsocketService.onSocketChangeConversationProperty
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((res) => {
        this.updateChangeProperty(res);
      });
  }

  private subscribeSocketSeenConversation() {
    // Note: handle read/ unread of message
    this.rxWebsocketService.onSocketSeenConversation
      .pipe(
        distinctUntilChanged(
          (pre, curr) => pre?.socketTrackId === curr?.socketTrackId
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        const {
          isSeen,
          taskId,
          conversationId,
          taskType,
          userId,
          isBulkSeen,
          conversations
        } = res;
        if (userId && userId === this.currentUser.id) return;
        let listMessageUpdate = [...this.whatsapps];
        if (isBulkSeen) {
          conversations.forEach((conversation) => {
            if (
              conversation.taskType === TaskType.MESSAGE &&
              this.whatsappIdSetService.has(conversation.conversationId)
            ) {
              this.isAutoScrollToMessage = false;
              listMessageUpdate = listMessageUpdate.map((msg) => {
                if (
                  msg.id === conversation.taskId &&
                  msg.conversationId === conversation.conversationId
                ) {
                  return {
                    ...msg,
                    conversations: msg.conversations.map((it) => ({
                      ...it,
                      isSeen: isSeen
                    }))
                  };
                }
                return msg;
              });

              this.whatsappService.setSocketExtenal(conversation.taskId, {
                field: WhatsappProperty.IS_SEEN,
                value: isSeen,
                taskId: conversation.taskId,
                conversationId: conversation.conversationId
              });

              this.inboxToolbarService.updateInboxItem(
                [conversation.taskId],
                WhatsappProperty.IS_SEEN,
                isSeen
              );
            }
          });
          this.whatsapps = listMessageUpdate;
        } else {
          if (
            taskType === TaskType.MESSAGE &&
            this.whatsappIdSetService.has(conversationId)
          ) {
            this.updateMessageList(
              WhatsappProperty.IS_SEEN,
              isSeen,
              taskId,
              conversationId
            );

            this.whatsappService.setSocketExtenal(taskId, {
              field: WhatsappProperty.IS_SEEN,
              value: isSeen,
              taskId,
              conversationId
            });

            this.inboxToolbarService.updateInboxItem(
              [taskId],
              WhatsappProperty.IS_SEEN,
              isSeen
            );
          }
        }
      });
  }

  private subscribeSocketSend() {
    this.rxWebsocketService.onSocketSend
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (
          res &&
          res.companyId === this.companyId &&
          res.mailBoxId === this.currentMailboxId
        ) {
          switch (res.messageType) {
            case EMessageType.changeProperty:
              this.updateChangeProperty(res);
              break;
            default:
              break;
          }
        }
      });
  }

  private updateChangeProperty(res) {
    this.isAutoScrollToMessage = false;
    const newProperty = this.listProperty?.find(
      (item) => item.id === res.propertyId
    );
    this.whatsapps = this.whatsapps.map((msg) => {
      const matched =
        msg.id === res.taskId && msg.conversationId === res.conversationId;
      const originalProperty = msg.property;
      const noProperty = {
        id: res.propertyId,
        isTemporary: true,
        agencyId: res.agencyId,
        companyId: res.companyId,
        ...Object.keys(originalProperty)
          .filter(
            (key) =>
              key !== 'id' &&
              key !== 'isTemporary' &&
              key !== 'agencyId' &&
              key !== 'companyId'
          )
          .reduce((obj, key) => {
            obj[key] = null;
            return obj;
          }, {})
      } as any;

      return matched
        ? {
            ...msg,
            property: newProperty || noProperty
          }
        : msg;
    });
  }
  private subscribeSocketMoveMessage() {
    this.rxWebsocketService.onSocketMoveConversations
      .pipe(
        filter((res) => res.mailBoxId === this.currentMailboxId),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.removeMessagesByConversationIds(res.conversationIds);
      });
  }

  removeMessagesByConversationIds(ids: string[]) {
    ids.forEach((id) => this.whatsappIdSetService.delete(id));

    this.whatsapps = this.whatsapps.filter((message) => {
      const conversationId =
        message.conversationId || message.conversations?.[0]?.id;
      return !ids.includes(conversationId);
    });

    this.handleCheckShowSelect();
  }

  private subscribeSocketAssignContact() {
    merge(
      this.rxWebsocketService.onSocketDeleteSecondaryContact,
      this.rxWebsocketService.onSocketAssignContact
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (this.whatsapps?.some((message) => message.id === res.taskId)) {
          this.whatsapps = this.whatsapps.map((message) => {
            if (message?.id === res?.taskId) {
              const participants =
                getUserFromParticipants(res?.participants as IParticipant[]) ||
                res.participants;
              const newUserId = participants?.[0]?.userId;
              return this.mapChannelMessageIndexParticipant(
                participants as IParticipant[],
                message,
                newUserId,
                res?.isDetectedContact
              );
            }
            return message;
          });
        }
      });
  }

  mapChannelMessageIndexParticipant(
    participants: IParticipant[],
    message: TaskItem,
    newUserId: string,
    isDetectedContact: boolean
  ) {
    return {
      ...message,
      conversations: [
        {
          ...message.conversations[0],
          participants,
          userId: newUserId || this.findUserIdInSocketAssign(participants),
          isDetectedContact
        }
      ]
    };
  }

  findUserIdInSocketAssign(participants: IParticipant[]) {
    return (
      participants.find((user) => user.type === UserType.USER)?.userId ||
      participants[0]?.userId
    );
  }

  subscribeDeleteDraft() {
    this.rxWebsocketService.onSocketDeleteDraft
      .pipe(delay(500), takeUntil(this.destroy$))
      .subscribe((res) => {
        const taskIndex = this.whatsapps.findIndex(
          (task) =>
            task.id === res.taskId && task.conversationId === res.conversationId
        );
        const task = { ...this.whatsapps[taskIndex] };

        this.handleReceivedDataForConversations(res, task, taskIndex);
      });
  }

  private handleReceivedDataForConversations(
    res: SocketSendData,
    task: TaskItem,
    taskIndex: number
  ) {
    if (
      !task ||
      !task.conversations ||
      !task.conversations.length ||
      ([
        EMessageType.solved,
        EMessageType.deleted,
        EMessageType.reopened
      ].includes(res.messageType as EMessageType) &&
        this.queryParams['status'] === TaskStatusType.draft)
    )
      return;

    let conversation = task.conversations?.[0];
    const isAfterDeleteDraft = res.type === SocketType.deleteDraftMessage;

    if (res.messageType?.toUpperCase() === EMessageType.defaultText) {
      conversation = {
        ...conversation,
        message: res.message
      };
    }
    if (res.messageType === EMessageType.changeProperty) {
      const newProperty = this.listProperty.find(
        (item) => item.id === res.propertyId
      );
      task.property = {
        ...task.property,
        ...newProperty,
        isTemporary: !newProperty
      };
      task.propertyStatus = newProperty?.status as EPropertyStatus;
    }
    conversation = this.updateConversationFromMessage(
      conversation,
      res,
      isAfterDeleteDraft
    );
    if (res.textContent) {
      conversation.textContent = res.textContent;
    }

    task.conversations = task.conversations.map((item) => {
      if (item.id === conversation.id) return conversation;
      else return item;
    });

    this.whatsapps[taskIndex] = cloneDeep(task);
    const sortMsgList = this.taskService.sortListDescByConversation(
      this.whatsapps,
      false
    );

    this.whatsapps = [...sortMsgList];

    if (res.taskId === this.taskService.currentTask$?.value?.id) {
      if (res.messageDate) {
        this.updateCurrentTask('messageDate', res.messageDate);
      }
      if (res.participants) {
        this.updateCurrentTask(
          'participants',
          res.participants as IUserParticipant[]
        );
        this.updateCurrentTask(
          'userId',
          getUserFromParticipants(res?.participants as IParticipant[])?.[0]
            ?.userId
        );
      }
    }
  }

  updateCurrentTask(
    propertyToUpdate: string,
    propertyValue: boolean | string | IUserParticipant[]
  ) {
    const currentTask = this.taskService.currentTask$.value;
    if (currentTask?.conversations)
      this.taskService.currentTask$.next({
        ...currentTask,
        conversations: currentTask.conversations.map((conversation) => ({
          ...conversation,
          [propertyToUpdate]: propertyValue
        }))
      });
    this.whatsappService.currentWhatsappTaskValue$ &&
      this.store.dispatch(
        whatsappDetailApiActions.updateWhatsappTask({
          task: {
            ...this.whatsappService.currentWhatsappTaskValue$,
            conversations:
              this.whatsappService.currentWhatsappTaskValue$?.conversations?.map(
                (conversation) => ({
                  ...conversation,
                  [propertyToUpdate]: propertyValue
                })
              )
          }
        })
      );
  }

  private updateConversationFromMessage(
    conversation,
    res,
    isAfterDeleteDraft = false
  ) {
    return {
      ...conversation,
      options: res.options || conversation.options,
      messageDate:
        [
          EMessageType.changeProperty,
          EMessageType.syncConversation,
          EMessageType.agentJoin
        ].includes(res.messageType) || res.isDraft
          ? conversation.messageDate
          : res.messageDate,
      isRead: false,
      isSeen: res?.isSyncMail
        ? res.isReadFromSyncMail
        : [EMessageType.changeProperty, EMessageType.syncConversation].includes(
            res.messageType
          ) ||
          [
            SocketType.deleteDraftMessage,
            SocketType.deleteSecondaryEmail,
            SocketType.deleteSecondaryPhone,
            SocketType.deleteInternalContact
          ].includes(res.type) ||
          [
            EMessageComeFromType.VOICE_CALL,
            EMessageComeFromType.VIDEO_CALL
          ].includes(res.messageComeFrom)
        ? true
        : [UserTypeEnum.LEAD, UserTypeEnum.AGENT].includes(res.userType) &&
          res.userId !== trudiUserId,
      isUrgent: res?.isUrgent || conversation.isUrgent,
      messageComeFrom: res?.messageComeFrom || conversation.messageComeFrom,
      propertyType:
        res.propertyType || res.userPropertyType || conversation.propertyType,
      lastUser: {
        ...conversation.lastUser,
        id: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        avatar: res.googleAvatar
      },
      isDraft: res?.isDraft || false,
      isScratchTicket: res?.isDraft ? conversation.isScratchTicket : false,
      isLastMessageDraft: res?.isLastMessageDraft || false,
      textContent:
        res.messageType === ETrudiType.ticket &&
        res.title === EConversationType.WHATSAPP
          ? conversation.textContent
          : isAfterDeleteDraft ||
            !(
              !!res.bulkMessageId ||
              this.lastMessageTypeExcluded.includes(
                res.messageType as EMessageType
              )
            )
          ? res.textContent
          : conversation.textContent,
      updatedAt: [
        EMessageType.changeProperty,
        EMessageType.syncConversation
      ].includes(res.messageType)
        ? conversation.messageDate
        : res.messageDate,
      lastMessageType: res.messageType as EMessageType,
      participants: res.participants?.length
        ? getUserFromParticipants(res.participants)
        : conversation.participants,
      title: res.title || res.title === '' ? res.title : conversation.title,
      attachmentCount: res.attachmentCount ?? conversation.attachmentCount,
      userId: res.participants?.length
        ? getUserFromParticipants(res.participants)?.[0]?.userId ||
          res.participants[0]?.userId
        : conversation?.userId
    };
  }

  private subscribeSocketMessage() {
    this.rxWebsocketService.onSocketMessage
      .pipe(
        filter(
          (res) =>
            res &&
            res.companyId === this.companyId &&
            res.mailBoxId === this.currentMailboxId
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (
          (res.isAutoReopen && res.fromUserId === this.currentUser?.id) ||
          res.isAutoReopenedByPM
        )
          return;
        switch (res.type) {
          case SocketType.newMessages:
            this.handleCreateNewMessageSocket(res);
            break;
          case SocketType.assignTask:
            this.handleAssignMessageSocket(res as TaskItem);
            break;
          case SocketType.changeStatusTask:
            this.handleChangeStatusMessageSocket(res);
            break;
          case SocketType.messageToTask:
            this.handleConvertMessageToTaskSocket(res as TaskItem);
            break;
        }
      });

    this.rxWebsocketService.onSocketSend
      .pipe(
        distinctUntilChanged(),
        filter((res) => {
          return !(
            !res ||
            ((res.isResolveConversation ||
              res.messageType === CONVERSATION_STATUS.RESOLVED) &&
              !this.router.url?.includes(ERouterLinkInbox.MSG_COMPLETED))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        const taskIndex = this.whatsapps.findIndex(
          (task) =>
            task.id === res.taskId && task.conversationId === res.conversationId
        );

        if (taskIndex !== -1) {
          const task = { ...this.whatsapps[taskIndex] };
          if (res.messageDate) {
            task.messageDate = res.messageDate;
          }

          const currentTask = this.taskService.currentTask$.value;
          const newAgents = res?.assignToAgents?.[0];
          if (
            newAgents &&
            currentTask &&
            !currentTask.assignToAgents.find(
              (agent) => agent.id === newAgents.id
            ) &&
            currentTask?.id === res.taskId
          ) {
            this.taskService.currentTask$.next({
              ...currentTask,
              assignToAgents: [...currentTask.assignToAgents, newAgents]
            });

            this.whatsappService.currentWhatsappTaskValue$ &&
              this.store.dispatch(
                whatsappDetailApiActions.updateWhatsappTask({
                  task: {
                    ...this.whatsappService.currentWhatsappTaskValue$,
                    assignToAgents: [
                      ...this.whatsappService.currentWhatsappTaskValue$
                        .assignToAgents,
                      newAgents
                    ]
                  }
                })
              );
          }
          // update message in conversation
          this.handleReceivedDataForConversations(res, task, taskIndex);
        }

        this.inboxSidebarService.refreshStatisticUnreadTaskChannel(
          this.channelId
        );
      });
  }

  private handleCreateNewMessageSocket(data) {
    if (
      data.conversationType !== EConversationType.WHATSAPP ||
      !data?.taskIds ||
      this.queryParams[EInboxFilterSelected.SEARCH] ||
      !!this.queryParams[EInboxFilterSelected.ASSIGNED_TO]?.length ||
      !!this.queryParams[EInboxFilterSelected.PROPERTY_MANAGER_ID]?.length ||
      !!this.queryParams[EInboxFilterSelected.SHOW_MESSAGE_IN_TASK]
    ) {
      return;
    }
    this.fetchAndMergeNewMessages(data);

    if (this.statusMailBox !== EMailBoxStatus.SYNCING)
      this.inboxSidebarService.refreshStatisticUnreadTaskChannel(
        this.channelId
      );
  }

  private handleChangeStatusMessageSocket(data) {
    const currentStatus =
      this.activatedRoute.snapshot.queryParams[
        WhatsappQueryType.MESSAGE_STATUS
      ];
    if (data.newStatus !== currentStatus) {
      this.removeMessagesByConversationId(
        data?.conversationIds || [data.conversationId]
      );
    }

    const isSameMailbox = this.currentMailboxId === data.mailBoxId;
    if (isSameMailbox) {
      this.fetchAndMergeNewMessages(data);
    }
  }

  removeMessagesByConversationId(conversationIds: string[]) {
    conversationIds?.forEach((conversationId) => {
      if (this.whatsappIdSetService.has(conversationId)) {
        this.whatsappIdSetService.delete(conversationId);
        this.whatsapps = this.whatsapps.filter(
          (message) => message.conversationId !== conversationId
        );
        this.handleCheckShowSelect();
      }
    });

    const currentUrlConversationId =
      this.activatedRoute.snapshot.queryParams?.['conversationId'];

    if (conversationIds?.includes(currentUrlConversationId)) {
      this.router.navigate([], {
        queryParams: { taskId: null, conversationId: null },
        queryParamsHandling: 'merge'
      });
      this.whatsappService.setCurrentWhatsappTask(null);
      this.taskService.currentTask$.next(null);
    }
  }

  private handleAssignMessageSocket(data: TaskItem) {
    const isUnassignedPM =
      this.isFocusView &&
      data.assignToAgents.every((agent) => {
        return agent.id !== this.currentUser.id;
      }) &&
      this.whatsapps.some((item) => item.id === data.id);
    const currentUrlTaskId =
      this.activatedRoute.snapshot.queryParams?.['taskId'];

    if (isUnassignedPM && data.id !== currentUrlTaskId) {
      this.removeMessage(data);
      this.statisticService.updateStatisticTotalTask(
        this.queryParams[WhatsappQueryType.MESSAGE_STATUS],
        -1
      );
      this.handleCheckShowSelect();
      this.inboxToolbarService.setInboxItem([]);
    }
    this.inboxSidebarService.refreshStatisticUnreadTaskChannel(this.channelId);
  }

  private handleConvertMessageToTaskSocket(data: TaskItem) {
    if (this.whatsappIdSetService.has(data.conversationId)) {
      this.removeMessage(data);
      this.handleCheckShowSelect();
    }
  }

  private handleCheckShowSelect() {
    this.sharedMessageViewService.setIsShowSelect(this.whatsapps.length > 0);
  }

  private removeMessage(message: TaskItem) {
    this.whatsappIdSetService.delete(message.conversationId);
    this.whatsapps = this.whatsapps.filter(
      (item) => item.conversationId !== message?.conversationId
    );

    const currentUrlConversationId =
      this.activatedRoute.snapshot.queryParams?.['conversationId'];

    if (currentUrlConversationId === message?.conversationId) {
      this.router.navigate([], {
        queryParams: { taskId: null, conversationId: null },
        queryParamsHandling: 'merge'
      });
      this.whatsappService.setCurrentWhatsappTask(null);
      this.taskService.currentTask$.next(null);
    }
  }

  private updateMessageList(
    propertyToUpdate: string,
    propertyValue,
    taskId: string,
    conversationId: string
  ) {
    this.isAutoScrollToMessage = false;
    this.whatsapps = this.whatsapps.map((msg) => {
      if (msg.id === taskId && msg.conversationId === conversationId) {
        return {
          ...msg,
          conversations: msg.conversations.map((it) => ({
            ...it,
            [propertyToUpdate]: propertyValue
          }))
        };
      }
      return msg;
    });
  }

  /*
    drag / drop whatsapp
   */

  dragMovedHandler(event: CdkDragMove) {
    this.currentDraggingToFolderName =
      this.inboxExpandService.getFolderNameWhenDragging(event.pointerPosition);
    this.inboxExpandService.expandSubMenu(event.pointerPosition);

    if (this.sharedMessageViewService.isRightClickDropdownVisibleValue) {
      this.resetRightClickSelectedState();
    }
  }

  dragDroppedHandler($event) {
    if (this.sharedService.isConsoleUsers()) return;

    this.inboxExpandService.handleCollapseFolder();
    let elmDrop = this.taskDragDropService.getRootElement(
      $event.dropPoint,
      'drop_task--folder'
    );

    if (!elmDrop || this.isMoving) return;

    const folderData = {
      folderUid: elmDrop?.getAttribute('folder-uid'),
      folderType: elmDrop?.getAttribute('folder-type'),
      folderStatus: elmDrop?.getAttribute('folder-status') as TaskStatusType,
      ...JSON.parse(elmDrop?.getAttribute('folder-data'))
    };

    if (this.isSelectedMove) {
      this.handleDropSelectedMessageToFolderInbox(folderData, $event.item.data);
      return;
    }

    const message: TaskItem = $event.item.data;
    this.handleDropSelectedMessageToFolder(folderData, message);
  }

  private handleDropSelectedMessageToFolderInbox(
    folderData,
    messages: TaskItem[]
  ) {
    switch (folderData.folderType) {
      case EFolderType.MORE:
      case EFolderType.EMAIL:
        if (
          ![
            TaskStatusType.completed,
            TaskStatusType.inprogress,
            TaskStatusType.deleted
          ].includes(folderData.folderStatus) ||
          messages.some((m) => folderData.folderStatus === m.status)
        ) {
          this.toastService.clear();
          this.toastService.success(CAN_NOT_MOVE);
          return;
        }
        this.handleMoveToMessageFolder(messages, folderData.folderStatus);
        break;
      case EFolderType.MAIL:
        if (
          !folderData?.moveAble ||
          messages.some(
            (m) =>
              m.conversations[0].messageComeFrom !== EMessageComeFromType.EMAIL
          )
        ) {
          this.toastService.clear();
          this.toastService.success(CAN_NOT_MOVE);
          return;
        }
        this.handleMoveToMailFolder({
          conversationIds: messages.map(
            (m) => m.conversationId || m.conversations[0].id
          ),
          mailBoxId: this.currentMailboxId,
          currentStatus: this.queryParams[WhatsappQueryType.MESSAGE_STATUS],
          newLabelId: folderData.internalId
        });
        break;
    }
  }

  private handleDropSelectedMessageToFolder(folderData, message: TaskItem) {
    switch (folderData.folderType) {
      case EFolderType.MORE:
      case EFolderType.EMAIL:
        if (
          folderData.folderStatus === message.status ||
          ![
            TaskStatusType.completed,
            TaskStatusType.inprogress,
            TaskStatusType.deleted
          ].includes(folderData.folderStatus)
        ) {
          this.toastService.clear();
          this.toastService.success(CAN_NOT_MOVE);
          return;
        }
        this.handleMoveToMessageFolder([message], folderData.folderStatus);
        break;
      case EFolderType.MAIL:
        if (!folderData?.moveAble) {
          this.toastService.clear();
          this.toastService.success(CAN_NOT_MOVE);
          return;
        }
        const payload = {
          conversationIds: [
            message.conversationId || message.conversations[0].id
          ],
          mailBoxId: this.currentMailboxId,
          currentStatus: message.status,
          newLabelId: folderData.internalId
        };
        this.handleMoveToMailFolder(payload);
        break;
    }
  }

  private handleMoveToMessageFolder(data: TaskItem[], status: TaskStatusType) {
    if (
      this.queryParams[WhatsappQueryType.MESSAGE_STATUS] ===
        TaskStatusType.deleted &&
      status === TaskStatusType.completed
    ) {
      this.toastService.clear();
      this.toastService.success(CAN_NOT_MOVE);
      return;
    }

    this.isMoving = true;
    const messageIds = data.map((m) => m.id);
    const tasksData = data.map((item) => ({
      id: item.id,
      conversationId: item.conversationId || item.conversations?.[0]?.id,
      taskType: item.taskType
    }));
    this.toastService.show(
      messageIds.length > 1 ? MESSAGES_MOVING_TO_TASK : MESSAGE_MOVING_TO_TASK,
      '',
      { disableTimeOut: false },
      'toast-syncing-custom'
    );

    this.taskService
      .changeTaskStatusMultiple(tasksData, status)
      .pipe(
        tap(() => {
          this.handleToastByStatus(status, messageIds, data);
          this.taskService.removeTasks$.next(messageIds);
          this.whatsapps = this.whatsapps.filter(
            (item) =>
              !tasksData.some(
                (task) => task.conversationId === item.conversationId
              )
          );
          this.isMoving = false;
        }),
        mergeMap(() => this.statisticService.statisticTotalTask$),
        first()
      )
      .subscribe({
        next: () => {
          this.statisticService.updateStatisticTotalTask(
            this.queryParams[WhatsappQueryType.TASKTYPEID] ||
              this.queryParams[WhatsappQueryType.MESSAGE_STATUS],
            -messageIds.length
          );
        },
        error: () => {
          this.handleMoveError();
        }
      });
  }

  private handleMoveError() {
    this.isMoving = false;
    this.toastService.clear();
    this.toastService.error(MOVE_MESSAGE_FAIL);
  }

  private handleToastByStatus(
    status,
    messageIds?: string[],
    tasks?: TaskItem[]
  ) {
    this.toastService.clear();

    const isValidStatus = [
      TaskStatusType.inprogress,
      TaskStatusType.completed,
      TaskStatusType.deleted
    ].includes(status);
    if (!isValidStatus) {
      this.toastService.success(MOVE_MESSAGE_TO_FOlDER);
      return;
    }

    if (messageIds.length > 1) {
      switch (status) {
        case TaskStatusType.inprogress:
          this.toastService.success(`${messageIds.length} messages reopened`);
          break;
        case TaskStatusType.completed:
          this.toastService.success(`${messageIds.length} messages resolved`);
          break;
        case TaskStatusType.deleted:
          this.toastService.success(`${messageIds.length} messages deleted`);
          break;
        default:
          break;
      }
    } else {
      const dataForToast = {
        conversationId: tasks?.[0].conversationId,
        taskId: messageIds?.[0],
        isShowToast: true,
        type: SocketType.changeStatusTask,
        mailBoxId: this.currentMailboxId,
        taskType: TaskType.MESSAGE,
        status: status,
        pushToAssignedUserIds: []
      };
      this.toastCustomService.openToastCustom(
        dataForToast,
        true,
        EToastCustomType.SUCCESS_WITH_VIEW_BTN
      );
    }
  }

  private handleMoveToMailFolder(payload: IMailFolderQueryParams) {
    this.isMoving = true;
    this.toastService.clear();
    this.toastService.show(
      payload.conversationIds.length > 1
        ? MESSAGES_MOVING_TO_TASK
        : MESSAGE_MOVING_TO_TASK,
      '',
      { disableTimeOut: false },
      'toast-syncing-custom'
    );

    this.emailApiService.moveMailFolder(payload).subscribe({
      next: () => {
        this.resetSelectedMessage();
        this.isMoving = false;
        this.inboxSidebarService.refreshStatisticUnreadTaskChannel(
          this.channelId
        );
        this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
          this.currentMailboxId
        );
      },
      error: () => {
        this.resetSelectedMessage();
        this.handleMoveError();
      }
    });
  }

  private fetchAndMergeNewMessages(data) {
    const payload = buildWhatsappQueryParams(
      false,
      this.sharedService.isConsoleUsers(),
      {
        queryParams: {
          ...this.queryParams,
          taskIds: data.taskIds ?? [data?.taskId]
        },
        mailboxId: data.mailBoxId,
        pageWhatsApp: this.pageWhatsApp
      }
    );
    if (!data?.taskIds && !data?.taskId) return;
    this.whatsappApiService
      .getWhatsappMessage(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.tasks) {
          this.whatsapps = this.pushAndReplaceMessages(
            this.whatsapps,
            res.tasks
          );
        }
      });
  }
  private pushAndReplaceMessages(
    currentMessages: TaskItem[],
    newMessages: TaskItem[]
  ) {
    if (!currentMessages?.length) return newMessages ?? [];
    const clonedMessages = cloneDeep(currentMessages);
    const messageIndexMap = clonedMessages?.reduce<Map<string, number>>(
      (map, message, index) => {
        message.conversationId && map.set(message.conversationId, index);
        return map;
      },
      new Map()
    );
    for (const message of newMessages) {
      const indexToUpdate = messageIndexMap.get(message.conversationId);
      if (Number.isInteger(indexToUpdate)) {
        clonedMessages[indexToUpdate] = message;
      } else {
        clonedMessages.push(message);
      }
    }
    return this.taskService.sortListDescByConversation(clonedMessages);
  }

  private resetSelectedMessage() {
    this.conversationService.selectedConversation.next(null);
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
  }

  private subscribeSocketPmJoinConverstation() {
    // Note: handle PM Join Conversation of message
    this.rxWebsocketService.onSocketPmJoinConversation
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { taskId, conversationId, isPmJoined } = res;
        this.updateMessageList(
          WhatsappProperty.IS_PM_JOINED,
          isPmJoined,
          taskId,
          conversationId
        );

        this.whatsappService.setSocketExtenal(taskId, {
          field: WhatsappProperty.IS_PM_JOINED,
          value: isPmJoined,
          taskId,
          conversationId
        });
      });
  }

  subscribeConnectWhatsApp() {
    this.whatsappService.whatsappConnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((whatsappConnected) => {
        this.isConnectWhatsAppScreen = !whatsappConnected;
      });
  }

  handleCompleteConnect() {
    this.isConnectWhatsAppScreen = false;
  }

  /*
    event listener
  */

  resetRightClickSelectedState() {
    this.nzContextMenuService.close();
    this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
    this.sharedMessageViewService.setRightClickSelectedMessageId('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (
      !this.elementRef.nativeElement?.contains(event.target) &&
      this.sharedMessageViewService.isRightClickDropdownVisibleValue
    ) {
      this.resetRightClickSelectedState();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    if (
      !this.elementRef.nativeElement?.contains(event.target) &&
      this.sharedMessageViewService.isRightClickDropdownVisibleValue
    ) {
      this.resetRightClickSelectedState();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.fetchWhatsappMessage$.complete();
    this.whatsappIdSetService.clear();
    this.store.dispatch(whatsappPageActions.exitPage());
  }
}
