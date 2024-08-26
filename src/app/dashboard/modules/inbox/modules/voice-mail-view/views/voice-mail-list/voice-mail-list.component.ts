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
  debounceTime
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
import { voiceMailActions } from '@core/store/voice-mail/actions/voice-mail.actions';
import {
  selectAllMessage,
  selectFetchingMessage,
  selectFetchingMoreMessage,
  selectMessagePayload,
  selectTotalMessage,
  voiceMailPageActions
} from '@core/store/voice-mail';
import { hasMessageFilter } from '@/app/dashboard/modules/inbox/utils/function';
import {
  VoiceMailList,
  VoiceMailQueryType,
  VoiceMailProperty,
  EPopupConversionTask,
  VoiceMailRetrieval,
  IVoiceMailQueryParams,
  EConversationStatus
} from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import {
  EConversationType,
  EMailBoxStatus,
  EMessageComeFromType,
  EMessageType,
  GroupType,
  SocketType,
  TaskStatusType,
  TaskType
} from '@shared/enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { TaskItem } from '@shared/types/task.interface';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { UserService } from '@/app/dashboard/services/user.service';
import { CurrentUser } from '@shared/types/user.interface';
import { CompanyService } from '@services/company.service';
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
} from '@services/messages.constants';
import { ToastrService } from 'ngx-toastr';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { TaskService } from '@services/task.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { IMailFolderQueryParams } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { EInboxFilterSelected } from '@/app/dashboard/modules/inbox/modules/app-message-list/interfaces/message.interface';
import {
  addItem,
  removeActiveItem,
  selectedItems
} from '@/app/dashboard/modules/inbox/utils/msg-task';
import { ISocketMoveMessageToFolder } from '@shared/types/socket.interface';
import { buildVoiceMailQueryParams } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/utils/function';
import { omit, isEqual, cloneDeep } from 'lodash-es';
import { VoiceMailIdSetService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail-id-set.service';
import { LIMIT_TASK_LIST } from '@/app/dashboard/utils/constants';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import { TaskDragDropService } from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import {
  AutoScrollService,
  SiblingEnum
} from '@/app/dashboard/modules/inbox/services/auto-scroll.service';
import { VoiceMailApiService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail-api.service';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';

@Component({
  selector: 'voice-mail-list',
  templateUrl: './voice-mail-list.component.html',
  styleUrls: ['./voice-mail-list.component.scss']
})
export class VoiceMailListComponent implements OnInit, OnDestroy {
  @ViewChild('infiniteScrollContainer')
  infiniteScrollContainer: ElementRef<HTMLElement>;

  public queryTaskId: string = '';
  public queryConversationId: string = '';
  public textMessage = [
    `You've resolved all voicemails assigned to you.`,
    'There are no resolved voicemails assigned to you'
  ];
  public textNoResult = [
    `Give yourself a high five! You've cleared your voicemails.`,
    'No resolved voicemails to display'
  ];
  private companyId: string = '';
  private currentMailboxId: string = '';
  private currentUser: CurrentUser;
  private queryParams: Params = {};
  private statusMailBox: EMailBoxStatus;
  private targetFolderName: string;
  private taskFolders = {};
  private autoFetchingMore: boolean = true;
  public _voiceMails: VoiceMailList = [];
  public searchText: string = '';
  public listProperty: UserPropertyInPeople[] = [];
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

  public inboxList: TaskItem[] = [];
  public folderUid: string = '';
  public currentDraggingToFolderName: string = '';

  public startIndex = -1;
  public listMsgActive: string[] = [];
  public hasSelectedInbox: boolean = false;

  private scrollTimeOut: NodeJS.Timeout = null;
  private readonly fetchVoiceMailMessage$ = new Subject<{
    payload: IVoiceMailQueryParams;
  }>();
  public readonly showList$ = new BehaviorSubject<boolean>(true);
  public readonly showDetail$ = new BehaviorSubject<boolean>(false);
  private readonly destroy$ = new Subject<void>();

  public readonly EMailBoxStatus = EMailBoxStatus;
  public readonly EPopupConversionTask = EPopupConversionTask;
  public readonly EViewDetailMode = EViewDetailMode;
  public TaskType = TaskType;
  public currentVoicemailTask: TaskItem;

  public set voiceMails(value: VoiceMailList) {
    this.dispatchZone(
      voiceMailActions.setAll({
        messages: value
      })
    );
  }

  get isSelectedMove() {
    return this.inboxToolbarService.hasItem;
  }

  private get loadingMore() {
    return this.showSpinnerTop || this.showSpinnerBottom;
  }

  private set loadingMore(value: boolean) {
    this.showSpinnerTop = value;
    this.showSpinnerBottom = value;
  }

  // getter for voice mail list
  get voiceMails() {
    return this._voiceMails;
  }
  public totalTasks = 0;

  // observable cache store
  public readonly voiceMail$ = combineLatest({
    tasks: this.store.select(selectAllMessage).pipe(
      tap((tasks) => {
        this._voiceMails = tasks;
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
    takeUntil(this.destroy$),
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
    })
  );

  private processTaskListResponse(response: {
    tasks: TaskItem[];
    totalTasks: number;
    fetching: boolean;
    payload: Partial<IVoiceMailQueryParams>;
  }) {
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
      this.dispatchZone(voiceMailPageActions.prevPage());
      this.isAutoScrollToMessage = true;
      this.loadingMore = false;
      this.autoFetchingMore = false;
    }

    return !isLastPage;
  }

  constructor(
    public readonly inboxService: InboxService,
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
    public readonly voicemailInboxService: VoiceMailService,
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
    private readonly voiceMailIdSetService: VoiceMailIdSetService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly ngZone: NgZone,
    private readonly syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private readonly syncResolveMessageService: SyncResolveMessageService,
    private readonly autoScrollService: AutoScrollService,
    private readonly voiceMailApiService: VoiceMailApiService,
    private readonly conversationSummaryService: ConverationSummaryService
  ) {}

  ngOnInit(): void {
    this.initializeVoiceMailHandling();
    this.subscribeCurrentCompany();
    this.subscribeListProperty();
    this.subscribeInbox();
    this.subscribeToSocketMoveEmailFolderSocket();
    this.subscribeChangePropertySocket();
    this.subscribeSeenConversationSocket();
    this.subscribeMessageSocket();
    this.subscribeSocketSend();
    this.subscribeSocketAssignContact();
    this.subscribeDeleteSecondaryContact();
    this.subcribeCurrentVoicemailTask();
    this.subscribeToSocketMoveEmailStatus();
    this.subscribeMoveMessageSocket();
    this.subscribeReadTicketConversationSocket();
    this.subscribeUpdateCountTicket();
  }

  private initializeVoiceMailHandling() {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.store.dispatch(voiceMailPageActions.enterPage());
    this.store
      .select(selectTotalMessage)
      .pipe(
        tap((total) => {
          this.statisticService.setStatisticTotalTask({
            type: this.queryParams[VoiceMailQueryType.MESSAGE_STATUS],
            value: total
          });
        })
      )
      .subscribe();

    this.voicemailInboxService.menuRightClick$
      .pipe(
        takeUntil(this.destroy$),
        filter(
          ({ field, value, taskId, conversationId }) =>
            !!field && !!value && !!taskId && !!conversationId
        )
      )
      .subscribe(({ field, value, taskId, conversationId }) => {
        this.updateMessageList(field, value?.[field], taskId, conversationId);
      });

    this.userService
      .getSelectedUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => (this.currentUser = rs));

    this.inboxService
      .getSyncMailBoxStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.statusMailBox = res));

    this.fetchVoiceMailMessage$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((previous, current) =>
          isEqual(
            omit(previous.payload, [VoiceMailQueryType.CURRENT_TASK_ID]),
            omit(current.payload, [VoiceMailQueryType.CURRENT_TASK_ID])
          )
        ),
        filter((rs) => !!rs.payload)
      )
      .subscribe(({ payload }) => {
        this.store.dispatch(voiceMailPageActions.payloadChange({ payload }));

        if (payload?.isLoading) {
          this.isHiddenFilter = true;
          this.showList$.next(true);
          this.voicemailInboxService.suspenseTrigger$.next(true);
        }
      });

    this.setupVoiceMailMessageRetrieval()
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((data) => {
        this.queryParams = data.queryParams;
        this.currentMailboxId = data.mailboxId;
        this.searchText = this.queryParams[EInboxFilterSelected.SEARCH];

        const payload = buildVoiceMailQueryParams(
          false,
          this.sharedService.isConsoleUsers(),
          data
        );
        this.fetchVoiceMailMessage$.next({
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
        this.voiceMails = this.voiceMails?.map((message) => {
          return {
            ...message,
            conversations: message.conversations.map((conversation) => {
              if (
                listMessageSyncStatus.conversationIds?.includes(conversation.id)
              ) {
                return {
                  ...conversation,
                  syncStatus: listMessageSyncStatus.status,
                  downloadingPDFFile: listMessageSyncStatus.downloadingPDFFile,
                  conversationSyncDocumentStatus:
                    listMessageSyncStatus.conversationSyncDocumentStatus ||
                    conversation?.conversationSyncDocumentStatus
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

  private subcribeCurrentVoicemailTask() {
    this.voicemailInboxService?.currentVoicemailTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.currentVoicemailTask = res));
  }

  private setupVoiceMailMessageRetrieval(): Observable<VoiceMailRetrieval> {
    return combineLatest({
      queryParams: this.activatedRoute.queryParams,
      mailboxId: this.inboxService.getCurrentMailBoxId(),
      selectedInbox: this.inboxFilterService.selectedInboxType$,
      selectedPortfolio: this.inboxFilterService.selectedPortfolio$,
      selectedAgency: this.inboxFilterService.selectedAgency$,
      selectedStatus: this.inboxFilterService.selectedStatus$,
      userDetail: this.userService.getUserDetail()
    }).pipe(
      distinctUntilChanged((previous, current) => isEqual(previous, current)),
      filter(this.navigateWithDefaultParams.bind(this)),
      tap(this.handleSideEffects.bind(this)),
      tap(this.updateInternalState.bind(this))
    );
  }

  private handleSideEffects(data) {
    this.queryTaskId =
      this.activatedRoute.snapshot?.queryParams?.[VoiceMailQueryType.TASK_ID];
    this.queryConversationId =
      this.activatedRoute.snapshot?.queryParams?.[
        VoiceMailQueryType.CONVERSATION_ID
      ];
    this.updateQueryParamsForBackNavigation(data);
    this.checkSelectTaskDetail();
  }

  private updateInternalState({ queryParams }) {
    this.isFocusView =
      queryParams[VoiceMailQueryType.INBOX_TYPE] === GroupType.MY_TASK;
    this.isResolved =
      queryParams[VoiceMailQueryType.MESSAGE_STATUS] ===
      TaskStatusType.completed;
    this.isFilter = hasMessageFilter(queryParams);
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
  }: VoiceMailRetrieval): boolean {
    const activatedQueryParams =
      this.activatedRoute?.snapshot?.queryParams ?? {};

    // Determine if navigation is needed
    const shouldNavigate =
      (!queryParams[VoiceMailQueryType.INBOX_TYPE] ||
        !queryParams[VoiceMailQueryType.MESSAGE_STATUS]) &&
      this.statusMailBox !== EMailBoxStatus.UNSYNC;

    if (shouldNavigate) {
      const defaultQueryParams = {
        inboxType: selectedInbox ?? GroupType.MY_TASK,
        status:
          activatedQueryParams[VoiceMailQueryType.MESSAGE_STATUS] ??
          TaskStatusType.inprogress,
        taskId: activatedQueryParams?.[EInboxFilterSelected.TASK_ID],
        conversationId:
          activatedQueryParams?.[EInboxFilterSelected.CONVERSATION_ID]
      };

      if (
        userDetail?.userOnboarding?.useDefaultFocusView &&
        !queryParams[VoiceMailQueryType.INBOX_TYPE]
      ) {
        defaultQueryParams[VoiceMailQueryType.INBOX_TYPE] = this.isConsole
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
      this.queryConversationId &&
        this._voiceMails.some(
          (t) => t.conversationId === this.queryConversationId
        )
    );
  }

  public onScrollUp() {
    if (this.showSpinnerTop) return;
    this.dispatchZone(voiceMailPageActions.prevPage());
  }

  public onScrollDown() {
    if (this.showSpinnerBottom) return;
    this.dispatchZone(voiceMailPageActions.nextPage());
  }

  public handleSelectedMsg(event) {
    if (this.startIndex === -1) {
      this.startIndex = this.voiceMails.findIndex(
        (item) => item.conversationId === this.queryConversationId
      );
    }
    const isIndexVoiceMail = this.router.url.includes(
      'inbox/voicemail-messages'
    );
    this.listMsgActive = selectedItems(
      event.isKeepShiftCtr,
      this.startIndex,
      event.lastIndex,
      this.listMsgActive,
      this.voiceMails,
      isIndexVoiceMail
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

  trackVoiceMail(_, item) {
    return item.conversationId;
  }

  /*
    socket voice mail
  */

  private subscribeToSocketMoveEmailStatus() {
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

  private subscribeToSocketMoveEmailFolderSocket() {
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
            this.voiceMailIdSetService.delete(item?.conversationId);
          });
          const isNewMessageSubFolder =
            currentTaskStatus === TaskStatusType.inprogress &&
            res?.newLabel?.id ===
              this.queryParams[VoiceMailQueryType.EXTERNAL_ID];
          if (
            currentTaskStatus ===
              this.queryParams[VoiceMailQueryType.MESSAGE_STATUS] ||
            isNewMessageSubFolder
          ) {
            this.fetchAndMergeNewMessages(res);
            if (this.statusMailBox !== EMailBoxStatus.SYNCING)
              this.inboxSidebarService.refreshStatisticsUnreadTask(
                this.currentMailboxId
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

      this.voiceMails = this.voiceMails.map((item) => {
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
        this.currentVoicemailTask?.conversations.some(
          (item) => socketData.conversationInTaskId === item.id
        ) &&
        !!dataNeedUpdate
      ) {
        this.voicemailInboxService.setCurrentVoicemailTask({
          ...this.currentVoicemailTask,
          taskType: TaskType.MESSAGE,
          id: dataNeedUpdate.taskId || this.currentVoicemailTask.id,
          conversations: mapConversations(
            this.currentVoicemailTask.conversations
          )
        });
      }

      if (
        this.router.url.includes(ERouterLinkInbox.VOICEMAIL_MESSAGES) &&
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
      this.voiceMails = this.voiceMails.filter(
        (item) => !conversationIds?.includes(item.conversationId)
      );
    }
    this.conversationService.handleMessageActionTriggered();
  }

  private subscribeChangePropertySocket() {
    // Note: handle change property of message
    this.rxWebsocketService.onSocketChangeConversationProperty
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        this.updateChangeProperty(res);
      });
  }

  private subscribeReadTicketConversationSocket() {
    this.voicemailInboxService.readTicketConversation$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.updateMessageList(
          'isReadTicket',
          data?.isReadTicket,
          data?.taskId,
          data?.conversationId
        );
      });
  }

  private subscribeSeenConversationSocket() {
    // Note: handle read/ unread of message
    this.rxWebsocketService.onSocketSeenConversation
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(
          (pre, curr) => pre?.socketTrackId === curr?.socketTrackId
        ),
        filter(({ mailBoxId }) => {
          return mailBoxId === this.currentMailboxId;
        })
      )
      .subscribe((res) => {
        const {
          isSeen,
          taskId,
          conversationId,
          userId,
          taskType,
          isBulkSeen,
          conversations
        } = res;
        if (isBulkSeen) {
          let listMessageUpdate = [...this.voiceMails];
          conversations.forEach((conversation) => {
            if (
              [TaskType.MESSAGE, TaskType.TASK].includes(
                conversation.taskType as TaskType
              ) &&
              this.voiceMailIdSetService.has(conversation.conversationId)
            ) {
              if (userId && userId === this.currentUser.id) return;
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
                      isSeen
                    }))
                  };
                }
                return msg;
              });

              this.voicemailInboxService.setSocketExtenal(
                conversation.conversationId,
                {
                  field: VoiceMailProperty.IS_SEEN,
                  value: isSeen
                }
              );

              this.inboxToolbarService.updateInboxItem(
                [conversation.taskId],
                VoiceMailProperty.IS_SEEN,
                isSeen
              );
            }
          });
          this.voiceMails = listMessageUpdate;
        } else {
          if (
            [TaskType.MESSAGE, TaskType.TASK].includes(taskType as TaskType) &&
            this.voiceMailIdSetService.has(conversationId)
          ) {
            if (userId && userId === this.currentUser.id) return;

            this.updateMessageList(
              VoiceMailProperty.IS_SEEN,
              isSeen,
              taskId,
              conversationId
            );

            this.voicemailInboxService.setSocketExtenal(conversationId, {
              field: VoiceMailProperty.IS_SEEN,
              value: isSeen
            });

            this.inboxToolbarService.updateInboxItem(
              [taskId],
              VoiceMailProperty.IS_SEEN,
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
    const newProperty = this.listProperty.find(
      (item) => item.id === res.propertyId
    );
    this.voiceMails = this.voiceMails.map((msg) => {
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
  private subscribeMoveMessageSocket() {
    this.rxWebsocketService.onSocketMoveConversations
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res.mailBoxId === this.currentMailboxId)
      )
      .subscribe((res) => {
        this.removeMessagesByConversationIds(res.conversationIds);
      });

    this.rxWebsocketService.onSocketMoveConversation
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res.mailBoxId === this.currentMailboxId)
      )
      .subscribe((res) => {
        this.removeMessagesByConversationIds([res.conversationId]);
      });
  }

  removeMessagesByConversationIds(ids: string[]) {
    ids.forEach((id) => this.voiceMailIdSetService.delete(id));

    this.voiceMails = this.voiceMails.filter((message) => {
      const conversationId =
        message.conversationId || message.conversations?.[0]?.id;
      return !ids.includes(conversationId);
    });

    this.handleCheckShowSelect();
  }

  private subscribeDeleteSecondaryContact() {
    this.rxWebsocketService.onSocketDeleteSecondaryContact
      .pipe(
        takeUntil(this.destroy$),
        filter((res) =>
          this.voiceMails?.some((message) => message.id === res.taskId)
        )
      )
      .subscribe((res) => {
        this.updateMessageList(
          VoiceMailProperty.PARTICIPANTS,
          res.participants,
          res.taskId,
          res.conversationId
        );
      });
  }

  private subscribeSocketAssignContact() {
    this.rxWebsocketService.onSocketAssignContact
      .pipe(
        takeUntil(this.destroy$),
        filter((res) =>
          this.voiceMails?.some((message) => message.id === res.taskId)
        )
      )
      .subscribe((res) => {
        this.updateMessageList(
          VoiceMailProperty.PARTICIPANTS,
          res.participants,
          res.taskId,
          res.conversationId
        );
      });
  }

  private subscribeMessageSocket() {
    this.rxWebsocketService.onSocketMessage
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (res) =>
            res &&
            res.companyId === this.companyId &&
            res.mailBoxId === this.currentMailboxId
        )
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
  }

  private handleCreateNewMessageSocket(data) {
    if (
      data.conversationType !== EConversationType.VOICE_MAIL ||
      !data?.taskIds ||
      this.queryParams[EInboxFilterSelected.SEARCH] ||
      !!this.queryParams[EInboxFilterSelected.ASSIGNED_TO]?.length ||
      !!this.queryParams[EInboxFilterSelected.PROPERTY_MANAGER_ID]?.length
    ) {
      return;
    }

    this.fetchAndMergeNewMessages(data);

    if (this.statusMailBox !== EMailBoxStatus.SYNCING)
      this.inboxSidebarService.refreshStatisticsUnreadTask(
        this.currentMailboxId
      );
  }

  private handleChangeStatusMessageSocket(data) {
    const currentStatus =
      this.activatedRoute.snapshot.queryParams[
        VoiceMailQueryType.MESSAGE_STATUS
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
      if (this.voiceMailIdSetService.has(conversationId)) {
        this.voiceMailIdSetService.delete(conversationId);
        this.voiceMails = this.voiceMails.filter(
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
    }
  }

  private handleAssignMessageSocket(data: TaskItem) {
    const isUnassignedPM =
      this.isFocusView &&
      data.assignToAgents.every((agent) => {
        return agent.id !== this.currentUser.id;
      }) &&
      this.voiceMails.some((item) => item.id === data.id);
    const currentUrlTaskId =
      this.activatedRoute.snapshot.queryParams?.['taskId'];

    if (isUnassignedPM && data.id !== currentUrlTaskId) {
      this.removeMessage(data);
      this.statisticService.updateStatisticTotalTask(
        this.queryParams[VoiceMailQueryType.MESSAGE_STATUS],
        -1
      );
      this.handleCheckShowSelect();
      this.inboxToolbarService.setInboxItem([]);
    }
    this.inboxSidebarService.refreshStatisticsUnreadTask(this.currentMailboxId);
  }

  private handleConvertMessageToTaskSocket(data: TaskItem) {
    if (this.voiceMailIdSetService.has(data.conversationId)) {
      this.removeMessage(data);
      this.handleCheckShowSelect();
    }
  }

  private handleCheckShowSelect() {
    this.sharedMessageViewService.setIsShowSelect(this.voiceMails.length > 0);
  }

  private fetchAndMergeNewMessages(data) {
    const payload = buildVoiceMailQueryParams(
      false,
      this.sharedService.isConsoleUsers(),
      {
        queryParams: {
          ...this.queryParams,
          taskIds: data.taskIds ?? [data?.taskId]
        },
        mailboxId: data.mailBoxId
      }
    );
    if (!data?.taskIds && !data?.taskId) return;
    this.voiceMailApiService
      .getVoiceMailMessage(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.tasks) {
          this.voiceMails = this.pushAndReplaceMessages(
            this.voiceMails,
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
    this.voiceMailIdSetService.delete(message.conversationId);
    this.voiceMails = this.voiceMails.filter(
      (item) => item.conversationId !== message?.conversationId
    );

    const currentUrlConversationId =
      this.activatedRoute.snapshot.queryParams?.['conversationId'];

    if (currentUrlConversationId === message?.conversationId) {
      this.router.navigate([], {
        queryParams: { taskId: null, conversationId: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  subscribeUpdateCountTicket() {
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

  private updateMessageList(
    propertyToUpdate: string,
    propertyValue,
    taskId: string,
    conversationId: string
  ) {
    this.isAutoScrollToMessage = false;
    // this.voicemailInboxService.readTicketConversation$.next(null);
    this.voiceMails = this.voiceMails.map((msg) => {
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
    drag / drop voice mail
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
          currentStatus: this.queryParams[VoiceMailQueryType.MESSAGE_STATUS],
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
      this.queryParams[VoiceMailQueryType.MESSAGE_STATUS] ===
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
          this.voiceMails = this.voiceMails.filter(
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
            this.queryParams[VoiceMailQueryType.TASKTYPEID] ||
              this.queryParams[VoiceMailQueryType.MESSAGE_STATUS],
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
        this.inboxSidebarService.refreshStatisticsUnreadTask(
          this.currentMailboxId
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

  private resetSelectedMessage() {
    this.conversationService.selectedConversation.next(null);
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
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
      !this.elementRef.nativeElement
        ?.querySelector('.voice-mail-inbox__index-section--container')
        ?.contains(event.target) &&
      this.sharedMessageViewService.isRightClickDropdownVisibleValue
    ) {
      this.resetRightClickSelectedState();
    }
  }

  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    if (
      !this.elementRef.nativeElement
        ?.querySelector('.voice-mail-inbox__index-section--container')
        ?.contains(event.target) &&
      this.sharedMessageViewService.isRightClickDropdownVisibleValue
    ) {
      this.resetRightClickSelectedState();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.fetchVoiceMailMessage$.complete();
    this.voiceMailIdSetService.clear();
    this.voicemailInboxService.setCurrentVoicemailConversation(null);
    clearTimeout(this.scrollTimeOut);
    this.store.dispatch(voiceMailPageActions.exitPage());
  }
}
