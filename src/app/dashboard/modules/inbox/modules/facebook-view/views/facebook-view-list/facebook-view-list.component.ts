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
  takeUntil,
  tap,
  debounceTime,
  delay,
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
import { SharedService } from '@services/shared.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import {
  selectAllMessage,
  selectFetchingMessage,
  selectFetchingMoreMessage,
  selectMessagePayload,
  selectTotalMessage,
  facebookPageActions
} from '@core/store/facebook';
import { hasMessageFilter } from '@/app/dashboard/modules/inbox/utils/function';
import {
  EConversationType,
  EMailBoxStatus,
  EMessageComeFromType,
  EMessageType,
  EPropertyStatus,
  GroupType,
  SocketType,
  TaskStatusType,
  TaskType,
  UserTypeEnum
} from '@shared/enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { TaskItem } from '@shared/types/task.interface';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { CurrentUser, IUserParticipant } from '@shared/types/user.interface';
import { CompanyService } from '@/app/services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { TaskService } from '@services/task.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { PropertiesService } from '@services/properties.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { EInboxFilterSelected } from '@/app/dashboard/modules/inbox/modules/app-message-list/interfaces/message.interface';
import {
  addItem,
  removeActiveItem,
  selectedItems
} from '@/app/dashboard/modules/inbox/utils/msg-task';
import { SocketSendData } from '@shared/types/socket.interface';
import { omit, isEqual, cloneDeep } from 'lodash-es';
import { LIMIT_TASK_LIST } from '@/app/dashboard/utils/constants';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import {
  EInboxAction,
  ERouterLinkInbox
} from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import {
  AutoScrollService,
  SiblingEnum
} from '@/app/dashboard/modules/inbox/services/auto-scroll.service';
import { facebookActions } from '@/app/core/store/facebook/actions/facebook.actions';
import { FacebookIdSetService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook-id-set.service';
import { FacebookService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook.service';
import { buildFacebookQueryParams } from '@/app/dashboard/modules/inbox/modules/facebook-view/utils/function';
import {
  EConversationStatus,
  EPopupConversionTask,
  FacebookList,
  FacebookProperty,
  FacebookQueryType,
  FacebookRetrieval,
  IFacebookQueryParams,
  MenuOption
} from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { PageFacebookMessengerType } from '@/app/dashboard/shared/types/facebook-account.interface';
import { FacebookAccountService } from '@/app/dashboard/services/facebook-account.service';
import { LAST_MSG_TYPE_EXCLUDED } from '@/app/dashboard/modules/inbox/constants/constants';
import { CONVERSATION_STATUS } from '@/app/services/constants';
import { HeaderService } from '@/app/services/header.service';
import { FacebookApiService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook-api.service';
import { facebookDetailApiActions } from '@/app/core/store/facebook-detail/actions/facebook-detail-api.actions';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';
import { RxStrategyNames } from '@rx-angular/cdk/render-strategies';

@Component({
  selector: 'facebook-view-list',
  templateUrl: './facebook-view-list.component.html',
  styleUrl: './facebook-view-list.component.scss'
})
export class FacebookViewListComponent implements OnInit, OnDestroy {
  @ViewChild('infiniteScrollContainer')
  infiniteScrollContainer: ElementRef<HTMLElement>;

  public queryTaskId: string = '';
  public channelId: string = '';
  public queryConversationId: string = '';
  public textMessage = [
    `You've resolved all Messenger messages assigned to you.`,
    'There are no resolved Messenger messages assigned to you'
  ];
  public subTextMessage = [
    'To view Messenger messages assigned to other team members',
    'To view all resolved Messenger messages'
  ];
  public textNoResult = [
    `Give yourself a high five! You've cleared your Messenger messages.`,
    'No resolved Messenger messages to display'
  ];
  private companyId: string = '';
  private currentMailboxId: string = '';
  private pageMessenger: PageFacebookMessengerType;
  private currentUser: CurrentUser;
  private queryParams: Params = {};
  private statusMailBox: EMailBoxStatus;
  private autoFetchingMore: boolean = true;
  private lastMessageTypeExcluded = LAST_MSG_TYPE_EXCLUDED;

  public _facebooks: FacebookList = [];
  public totalTasks: number = 0;
  public searchText: string = '';
  public listProperty: UserPropertyInPeople[] = [];
  public currentFacebookTask: TaskItem;
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
  public isFacebookDisconnect: boolean = false;
  public currentSyncStatus: {
    status: string;
    conversationSyncDocumentAt: string;
  };
  public renderStrategy: RxStrategyNames = 'immediate';

  private readonly destroy$ = new Subject<void>();
  public readonly showList$ = new BehaviorSubject<boolean>(true);
  public readonly showDetail$ = new BehaviorSubject<boolean>(false);
  public readonly EMailBoxStatus = EMailBoxStatus;
  public readonly EPopupConversionTask = EPopupConversionTask;
  public readonly EViewDetailMode = EViewDetailMode;
  public readonly TaskType = TaskType;

  private readonly fetchFacebookMessage$ = new Subject<{
    payload: IFacebookQueryParams;
  }>();

  public set facebooks(value: FacebookList) {
    this.dispatchZone(
      facebookActions.setAll({
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

  // getter for facebook list
  get facebooks(): FacebookList {
    return this._facebooks;
  }

  // observable cache store
  public readonly facebook$ = combineLatest({
    tasks: this.store.select(selectAllMessage).pipe(
      tap((tasks) => {
        this._facebooks = tasks;
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
    payload: Partial<IFacebookQueryParams>;
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
      this.dispatchZone(facebookPageActions.prevPage());
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
    private readonly inboxSidebarService: InboxSidebarService,
    private readonly taskService: TaskService,
    private readonly statisticService: StatisticService,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly propertiesService: PropertiesService,
    private readonly facebookIdSetService: FacebookIdSetService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly ngZone: NgZone,
    private readonly syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private readonly syncResolveMessageService: SyncResolveMessageService,
    private readonly autoScrollService: AutoScrollService,
    private readonly headerService: HeaderService,
    private readonly facebookApiService: FacebookApiService,
    public readonly inboxService: InboxService,
    public readonly facebookService: FacebookService,
    public readonly facebookAccountService: FacebookAccountService,
    private conversationSummaryService: ConverationSummaryService
  ) {}

  ngOnInit(): void {
    this.initializeFacebookHandling();
    this.subscribeCurrentCompany();
    this.subscribeListProperty();
    this.subscribeInbox();
    this.subcribeCurrentFacebookTask();
    this.subscribeSocketChangeProperty();
    this.subscribeSocketSeenConversation();
    this.subscribeSocketMessage();
    this.subscribeSocketSend();
    this.subscribeSocketAssignContact();
    this.subscribeSocketDeleteSecondaryContact();
    this.subscribeSocketMoveMessage();
    this.subscribeDeleteDraft();
    this.subscribeUpdateCountTicketConSocket();
    this.subscribeSocketPmJoinConverstation();
  }

  private initializeFacebookHandling() {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.store.dispatch(facebookPageActions.enterPage());
    this.store
      .select(selectTotalMessage)
      .pipe(
        tap((total) => {
          this.statisticService.setStatisticTotalTask({
            type: this.queryParams[FacebookQueryType.MESSAGE_STATUS],
            value: total
          });
        })
      )
      .subscribe();

    this.facebookService.menuRightClick$
      .pipe(
        filter(({ taskId, conversationId }) => {
          return (
            !!taskId &&
            !!conversationId &&
            this.facebookIdSetService.has(conversationId)
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
            MenuOption.UN_FLAG,
            MenuOption.FLAG,
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

    this.fetchFacebookMessage$
      .pipe(
        distinctUntilChanged((previous, current) =>
          isEqual(
            omit(previous.payload, [FacebookQueryType.CURRENT_TASK_ID]),
            omit(current.payload, [FacebookQueryType.CURRENT_TASK_ID])
          )
        ),
        filter((rs) => !!rs.payload && !!rs.payload.channelId),
        takeUntil(this.destroy$)
      )
      .subscribe(({ payload }) => {
        this.store.dispatch(facebookPageActions.payloadChange({ payload }));

        if (payload?.isLoading) {
          this.isHiddenFilter = true;
          this.showList$.next(true);
          this.facebookService.suspenseTrigger$.next(true);
        }
      });

    this.setupFacebookMessageRetrieval()
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((data) => {
        this.currentMailboxId = data.mailboxId;
        this.pageMessenger = data.pageMessenger;
        this.searchText = this.queryParams[EInboxFilterSelected.SEARCH];

        const payload = buildFacebookQueryParams(
          false,
          this.sharedService.isConsoleUsers(),
          data
        );

        this.fetchFacebookMessage$.next({
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
        this.facebooks = this.facebooks?.map((message) => {
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

  private subcribeCurrentFacebookTask() {
    this.facebookService?.currentFacebookTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.currentFacebookTask = res));
  }

  private setupFacebookMessageRetrieval(): Observable<FacebookRetrieval> {
    return combineLatest({
      queryParams: this.activatedRoute.queryParams,
      mailboxId: this.inboxService.getCurrentMailBoxId(),
      selectedInbox: this.inboxFilterService.selectedInboxType$,
      selectedPortfolio: this.inboxFilterService.selectedPortfolio$,
      selectedAgency: this.inboxFilterService.selectedAgency$,
      selectedStatus: this.inboxFilterService.selectedStatus$,
      userDetail: this.userService.getUserDetail(),
      pageMessenger: this.facebookService.facebookMessengerSelected$
    }).pipe(
      distinctUntilChanged((previous, current) => isEqual(previous, current)),
      filter(this.navigateWithDefaultParams.bind(this)),
      tap(this.handleSideEffects.bind(this)),
      tap(this.updateInternalState.bind(this))
    );
  }

  private handleSideEffects(data) {
    this.queryTaskId =
      this.activatedRoute.snapshot?.queryParams?.[FacebookQueryType.TASK_ID];
    this.channelId =
      this.activatedRoute.snapshot?.queryParams?.[FacebookQueryType.CHANNELID];
    this.queryConversationId =
      this.activatedRoute.snapshot?.queryParams?.[
        FacebookQueryType.CONVERSATION_ID
      ];
    this.isFacebookDisconnect =
      !data?.pageMessenger ||
      !this.activatedRoute.snapshot?.queryParams?.[FacebookQueryType.CHANNELID];
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
      queryParams[FacebookQueryType.INBOX_TYPE] === GroupType.MY_TASK;
    this.isResolved =
      queryParams[FacebookQueryType.MESSAGE_STATUS] ===
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
  }: FacebookRetrieval): boolean {
    const activatedQueryParams =
      this.activatedRoute?.snapshot?.queryParams ?? {};

    // Determine if navigation is needed
    const shouldNavigate =
      (!queryParams[FacebookQueryType.INBOX_TYPE] ||
        !queryParams[FacebookQueryType.MESSAGE_STATUS]) &&
      this.statusMailBox !== EMailBoxStatus.UNSYNC;

    if (shouldNavigate) {
      const defaultQueryParams = {
        inboxType: selectedInbox ?? GroupType.MY_TASK,
        status:
          activatedQueryParams[FacebookQueryType.MESSAGE_STATUS] ??
          TaskStatusType.inprogress,
        taskId: activatedQueryParams?.[EInboxFilterSelected.TASK_ID],
        conversationId:
          activatedQueryParams?.[EInboxFilterSelected.CONVERSATION_ID]
      };

      if (
        userDetail?.userOnboarding?.useDefaultFocusView &&
        !queryParams[FacebookQueryType.INBOX_TYPE]
      ) {
        defaultQueryParams[FacebookQueryType.INBOX_TYPE] = this.isConsole
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
      this._facebooks.some(
        (t) => t.conversationId === this.queryConversationId
      ) || !!this.queryConversationId
    );
    const currentConversation = this.facebooks.find(
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
    this.dispatchZone(facebookPageActions.prevPage());
  }

  public onScrollDown() {
    if (this.showSpinnerBottom) return;
    this.dispatchZone(facebookPageActions.nextPage());
  }

  public handleSelectedMsg(event) {
    if (this.startIndex === -1) {
      this.startIndex = this.facebooks.findIndex(
        (item) => item.conversationId === this.queryConversationId
      );
    }
    const isIndexFacebook = this.router.url.includes('inbox/facebook-messages');
    this.listMsgActive = selectedItems(
      event.isKeepShiftCtr,
      this.startIndex,
      event.lastIndex,
      this.listMsgActive,
      this.facebooks,
      isIndexFacebook
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
    this.navigateMessage(SiblingEnum.nextElementSibling);
  }

  public onPrevMessage() {
    this.navigateMessage(SiblingEnum.previousElementSibling, true);
  }

  navigateMessage(type, navigatePreMessage: boolean = false) {
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

  trackFacebook(_, item) {
    return item.conversationId;
  }

  dragMovedHandler() {}

  dragDroppedHandler($event) {}

  /*
    socket facebook
  */

  mapConversationStatusToTaskStatus(status: string) {
    return {
      [EConversationStatus.resolved]: TaskStatusType.completed,
      [EConversationStatus.open]: TaskStatusType.inprogress
    }?.[status];
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
        filter((res) => {
          return this.getConversations(res).every(
            (c) =>
              c.taskType === TaskType.MESSAGE &&
              this.facebookIdSetService.has(c.conversationId)
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res?.userId && res?.userId === this.currentUser.id) return;
        const conversations = this.getConversations(res);

        conversations.forEach((convertion) =>
          this.updateFacebookMessageStatus(
            convertion.taskId,
            convertion.conversationId,
            res.isSeen
          )
        );
      });
  }

  private getConversations(
    data
  ): Array<{ taskId: string; conversationId: string; taskType: string }> {
    return !data.isBulkSeen
      ? [
          {
            taskId: data?.taskId,
            conversationId: data.conversationId,
            taskType: data.taskType
          }
        ]
      : data.conversations;
  }

  private updateFacebookMessageStatus(taskId, conversationId, isSeen) {
    this.updateMessageList(
      FacebookProperty.IS_SEEN,
      isSeen,
      taskId,
      conversationId
    );

    this.facebookService.setSocketExtenal(taskId, {
      field: FacebookProperty.IS_SEEN,
      value: isSeen,
      taskId,
      conversationId
    });

    this.inboxToolbarService.updateInboxItem(
      [taskId],
      FacebookProperty.IS_SEEN,
      isSeen
    );
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
    this.facebooks = this.facebooks.map((msg) => {
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
    ids.forEach((id) => this.facebookIdSetService.delete(id));

    this.facebooks = this.facebooks.filter((message) => {
      const conversationId =
        message.conversationId || message.conversations?.[0]?.id;
      return !ids.includes(conversationId);
    });

    this.handleCheckShowSelect();
  }

  private subscribeSocketDeleteSecondaryContact() {
    this.rxWebsocketService.onSocketDeleteSecondaryContact
      .pipe(
        filter((res) =>
          this.facebooks?.some((message) => message.id === res.taskId)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.updateMessageList(
          FacebookProperty.PARTICIPANTS,
          res.participants,
          res.taskId,
          res.conversationId
        );
      });
  }

  private subscribeSocketAssignContact() {
    this.rxWebsocketService.onSocketAssignContact
      .pipe(
        filter((res) =>
          this.facebooks?.some((message) => message.id === res.taskId)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.participants) {
          this.updateMessageList(
            FacebookProperty.PARTICIPANTS,
            res.participants,
            res.taskId,
            res.conversationId
          );
        }
      });
  }

  subscribeDeleteDraft() {
    this.rxWebsocketService.onSocketDeleteDraft
      .pipe(delay(500), takeUntil(this.destroy$))
      .subscribe((res) => {
        const taskIndex = this.facebooks.findIndex(
          (task) =>
            task.id === res.taskId && task.conversationId === res.conversationId
        );
        const task = { ...this.facebooks[taskIndex] };

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

    task.conversations = task.conversations.map((item) => {
      if (item.id === conversation.id) return conversation;
      else return item;
    });

    this.facebooks[taskIndex] = cloneDeep(task);
    const sortMsgList = this.taskService.sortListDescByConversation(
      this.facebooks,
      false
    );

    this.facebooks = [...sortMsgList];
    if (res.taskId === this.taskService.currentTask$.value?.id) {
      this.updateCurrentTask('messageDate', res.messageDate);

      if (res.participants) {
        this.updateCurrentTask(
          'participants',
          res.participants as IUserParticipant[]
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

    this.facebookService.currentFacebookTaskValue$ &&
      this.store.dispatch(
        facebookDetailApiActions.updateFacebookTask({
          task: {
            ...this.facebookService.currentFacebookTaskValue$,
            conversations:
              this.facebookService.currentFacebookTaskValue$?.conversations?.map(
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
        : [UserTypeEnum.LEAD, UserTypeEnum.AGENT].includes(res.userType),
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
        isAfterDeleteDraft ||
        !(
          !!res.bulkMessageId ||
          this.lastMessageTypeExcluded.includes(res.messageType as EMessageType)
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
      // participants: res.participants
      //   ? res.participants
      //   : conversation.participants,
      title: res.title || res.title === '' ? res.title : conversation.title,
      attachmentCount: res.attachmentCount ?? conversation.attachmentCount
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
        const taskIndex = this.facebooks.findIndex(
          (task) =>
            task.id === res.taskId && task.conversationId === res.conversationId
        );
        const task = { ...this.facebooks[taskIndex] };

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
          this.facebookService.currentFacebookTaskValue$ &&
            this.store.dispatch(
              facebookDetailApiActions.updateFacebookTask({
                task: {
                  ...this.facebookService.currentFacebookTaskValue$,
                  assignToAgents: [
                    ...this.facebookService.currentFacebookTaskValue$
                      .assignToAgents,
                    newAgents
                  ]
                }
              })
            );
        }

        // update message in conversation
        this.handleReceivedDataForConversations(res, task, taskIndex);

        this.inboxSidebarService.refreshStatisticUnreadTaskChannel(
          this.channelId
        );
      });
  }

  private handleCreateNewMessageSocket(data) {
    if (
      data.conversationType !== EConversationType.MESSENGER ||
      !data?.taskIds ||
      this.queryParams[EInboxFilterSelected.SEARCH] ||
      !!this.queryParams[EInboxFilterSelected.ASSIGNED_TO]?.length ||
      !!this.queryParams[EInboxFilterSelected.PROPERTY_MANAGER_ID]?.length ||
      !!this.queryParams[EInboxFilterSelected.SHOW_MESSAGE_IN_TASK]
    ) {
      return;
    }
    this.facebookAccountService.updateStateNew(false);

    this.fetchAndMergeNewMessages(data);

    if (this.statusMailBox !== EMailBoxStatus.SYNCING)
      this.inboxSidebarService.refreshStatisticUnreadTaskChannel(
        this.channelId
      );
  }

  private handleChangeStatusMessageSocket(data) {
    const currentStatus =
      this.activatedRoute.snapshot.queryParams[
        FacebookQueryType.MESSAGE_STATUS
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
    conversationIds.forEach((conversationId) => {
      if (this.facebookIdSetService.has(conversationId)) {
        this.facebookIdSetService.delete(conversationId);
        this.facebooks = this.facebooks.filter(
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
      this.facebookService.setCurrentFacebookTask(null);
    }
  }

  private handleAssignMessageSocket(data: TaskItem) {
    const isUnassignedPM =
      this.isFocusView &&
      data.assignToAgents.every((agent) => {
        return agent.id !== this.currentUser.id;
      }) &&
      this.facebooks.some((item) => item.id === data.id);
    const currentUrlTaskId =
      this.activatedRoute.snapshot.queryParams?.['taskId'];

    if (isUnassignedPM && data.id !== currentUrlTaskId) {
      this.removeMessage(data);
      this.statisticService.updateStatisticTotalTask(
        this.queryParams[FacebookQueryType.MESSAGE_STATUS],
        -1
      );
      this.handleCheckShowSelect();
      this.inboxToolbarService.setInboxItem([]);
    }
    this.inboxSidebarService.refreshStatisticUnreadTaskChannel(this.channelId);
  }

  private handleConvertMessageToTaskSocket(data: TaskItem) {
    if (this.facebookIdSetService.has(data.conversationId)) {
      this.removeMessage(data);
      this.handleCheckShowSelect();
    }
  }

  private handleCheckShowSelect() {
    this.sharedMessageViewService.setIsShowSelect(this.facebooks.length > 0);
  }

  private fetchAndDispatchFacebook(data, newFetching = false) {
    if (!this.pageMessenger) return;
    const payload = buildFacebookQueryParams(
      false,
      this.sharedService.isConsoleUsers(),
      {
        queryParams: {
          ...this.queryParams,
          taskId: newFetching ? null : data?.taskId || null
        },
        mailboxId: data.mailBoxId,
        pageMessenger: this.pageMessenger
      }
    );

    this.dispatchZone(facebookPageActions.payloadChange({ payload }));
  }

  private fetchAndMergeNewMessages(data) {
    const payload = buildFacebookQueryParams(
      false,
      this.sharedService.isConsoleUsers(),
      {
        queryParams: {
          ...this.queryParams,
          taskIds: data.taskIds ?? [data?.taskId]
        },
        mailboxId: data.mailBoxId,
        pageMessenger: this.pageMessenger
      }
    );
    if (!data?.taskIds && !data?.taskId) return;
    this.facebookApiService
      .getFacebookMessage(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.tasks) {
          this.facebooks = this.pushAndReplaceMessages(
            this.facebooks,
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

  private removeMessage(message: TaskItem) {
    this.facebookIdSetService.delete(message.conversationId);
    this.facebooks = this.facebooks.filter(
      (item) => item.conversationId !== message?.conversationId
    );

    const currentUrlConversationId =
      this.activatedRoute.snapshot.queryParams?.['conversationId'];

    if (currentUrlConversationId === message?.conversationId) {
      this.router.navigate([], {
        queryParams: { taskId: null, conversationId: null },
        queryParamsHandling: 'merge'
      });
      this.facebookService.setCurrentFacebookTask(null);
    }
  }

  private updateMessageList(
    propertyToUpdate: string,
    propertyValue,
    taskId: string,
    conversationId: string
  ) {
    this.isAutoScrollToMessage = false;
    this.facebooks = this.facebooks.map((msg) => {
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

  private subscribeSocketPmJoinConverstation() {
    // Note: handle PM Join Conversation of message
    this.rxWebsocketService.onSocketPmJoinConversation
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { taskId, conversationId, isPmJoined } = res;
        this.updateMessageList(
          FacebookProperty.IS_PM_JOINED,
          isPmJoined,
          taskId,
          conversationId
        );

        this.facebookService.setSocketExtenal(taskId, {
          field: FacebookProperty.IS_PM_JOINED,
          value: isPmJoined,
          taskId,
          conversationId
        });
      });
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
    this.fetchFacebookMessage$.complete();
    this.facebookIdSetService.clear();
    this.store.dispatch(facebookPageActions.exitPage());
  }
}
