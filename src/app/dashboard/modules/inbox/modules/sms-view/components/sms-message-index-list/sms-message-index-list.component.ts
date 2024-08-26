import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationExtras,
  Params,
  Router
} from '@angular/router';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  first,
  of,
  switchMap,
  takeUntil,
  tap,
  delay,
  map,
  merge
} from 'rxjs';
import {
  EActionSyncResolveMessage,
  EInboxFilterSelected,
  EMessageQueryType,
  IFlagUrgentMessageResponse,
  IMarkAsUnreadResponse,
  IMessageQueryParams,
  IConversationAction
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { EMessageMenuOption } from '@/app/dashboard/modules/inbox/modules/app-message-list/interfaces/message.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { UserService } from '@/app/dashboard/services/user.service';
import {
  DEBOUNCE_DASHBOARD_TIME,
  LIMIT_TASK_LIST
} from '@/app/dashboard/utils/constants';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import {
  CONVERSATION_STATUS,
  trudiUserId,
  UserType
} from '@/app/services/constants';
import { ConversationService } from '@/app/services/conversation.service';
import { RxWebsocketService } from '@/app/services/rx-websocket.service';
import { TaskService } from '@/app/services/task.service';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import {
  EConversationAction,
  EMessageComeFromType,
  EMessageProperty,
  EMessageType
} from '@shared/enum/messageType.enum';
import { SocketType } from '@shared/enum/socket.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  EPropertyStatus,
  GroupType,
  UserTypeEnum
} from '@shared/enum/user.enum';
import {
  ISocketChangeConversationProperty,
  SocketMessage,
  SocketSendData
} from '@shared/types/socket.interface';
import {
  TaskItem,
  TaskItemDropdown,
  TaskListMove
} from '@shared/types/task.interface';
import { CurrentUser } from '@shared/types/user.interface';
import { isEqual, cloneDeep } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import { UserPropInSelectPeople } from '@shared/types/user.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { PropertiesService } from '@services/properties.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import {
  EAppMessageCreateType,
  EPopupConversionTask
} from '@/app/dashboard/modules/inbox/modules/app-message-list/enum/message.enum';
import { HeaderService } from '@/app/services/header.service';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/message-task-loading.service';
import { ISelectedCalendarEventId } from '@shared/types/calendar.interface';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { SharedService } from '@services/shared.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import {
  addItem,
  removeActiveItem,
  selectedItems
} from '@/app/dashboard/modules/inbox/utils/msg-task';
import { hasMessageFilter } from '@/app/dashboard/modules/inbox/utils/function';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import {
  IListConversationConfirmProperties,
  IListConvertMultipleTask,
  IParticipant,
  PreviewConversation
} from '@shared/types/conversation.interface';
import { CompanyService } from '@/app/services/company.service';
import { Action, Store } from '@ngrx/store';
import { SyncMessagePropertyTreeService } from '@/app/services/sync-message-property-tree.service';
import { EConfirmContactType, EConversationType } from '@shared/enum';
import { ITempConversation } from '@/app/dashboard/modules/inbox/interfaces/conversation.interface';

import {
  AutoScrollService,
  SiblingEnum
} from '@/app/dashboard/modules/inbox/services/auto-scroll.service';
import { SmsMessageMenuService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message-menu.service';
import { SmsMessageConversationIdSetService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message-id-set.service';
import { SmsMessageListService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message.services';
import {
  selectAllSmsMessage,
  selectFetchingMessage,
  selectFetchingMoreMessage,
  selectMessagePayload,
  selectTotalMessage
} from '@/app/core/store/sms-message/selectors/sms-message.selectors';
import { smsMessagePageActions } from '@/app/core/store/sms-message/actions/sms-message-page.actions';
import { smsMessageActions } from '@/app/core/store/sms-message/actions/sms-message.actions';
import { LAST_MSG_TYPE_EXCLUDED } from '@/app/dashboard/modules/inbox/constants/constants';
import { SmsMessageApiService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms.message.api.services';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';

@Component({
  selector: 'sms-message-index-list',
  templateUrl: './sms-message-index-list.component.html',
  styleUrl: './sms-message-index-list.component.scss',
  providers: []
})
export class SmsMessageIndexListComponent implements OnInit, OnDestroy {
  @Input() activeSms: boolean = true;
  @ViewChild('infiniteScrollView')
  infiniteScrollView: ElementRef<HTMLElement>;
  @ViewChild('infiniteScrollIndex')
  infiniteScrollIndex: ElementRef<HTMLElement>;

  public readonly viewDetailMode = EViewDetailMode;
  public readonly messagesStatusType = TaskStatusType;
  public readonly mailBoxStatus = EMailBoxStatus;
  private _messageList: TaskItem[] = [];
  private selectMessageIdMap: Map<string, boolean> = new Map();
  public isLoading: boolean = false;
  public moveConversationState = false;
  public taskList: TaskListMove[];
  public isUnHappyPath = false;
  public targetConversationId: string;
  public statusMessages: TaskStatusType;
  public currentPropertyId: string;
  public errorMessage: string;
  public searchText: string = '';
  public popupState = {
    isShowForwardConversation: false
  };
  public activeProperty: UserPropInSelectPeople[];
  public categoryID: string;
  public taskNameList: TaskItemDropdown[];
  public openFrom: CreateTaskByCateOpenFrom;
  public currentPopupConversionTask: EPopupConversionTask;
  public popupTypeConversionTask = EPopupConversionTask;
  public folderUid: string;
  public queryTaskId: string = '';
  public queryConversationId: string = '';
  public search: string = '';
  public importEmailId: string;
  public selectedInboxType: string = GroupType.MY_TASK;
  public selectedPortfolio: string[] = [];
  public selectedAgency: string[] = [];
  public selectedStatus: string[] = [];
  public selectedTaskEditorId: string[] = [];
  public selectedCalendarEventId: ISelectedCalendarEventId;
  public isShowModalWarning: boolean = false;
  public isSendViaEmail: boolean;
  public isAppUser: boolean;
  public isNotFound: boolean = false;
  public inboxList: TaskItem[] = [];
  public scrollTop: number = 0;
  public currentMarkUnreadMsgId: string;
  public dataMessageSocket: SocketMessage;
  public isRmEnvironment: boolean;
  public isConsole: boolean;
  public showSpinnerTop: boolean = false;
  public showSpinnerBottom: boolean = false;
  public isSyncedAttachment: boolean = true;
  public threadId: string = null;
  public taskId: string = null;
  public isError = false;
  public isFocusView: boolean = false;
  public activeMsgList: string[] = [];
  public startIndex: number = -1;
  public EMessageQueryType = EMessageQueryType;
  public EMessageMenuOption = EMessageMenuOption;
  public dataFormat: string;
  public hasFilter: boolean = false;
  public isDraftFolder = false;
  public listProperty: UserPropertyInPeople[] = [];
  public socketSendData: SocketSendData;
  private lastMessageTypeExcluded = LAST_MSG_TYPE_EXCLUDED;
  public isShowPopupAddToTask: boolean = false;
  public targetFolderName: string;
  public taskFolders = {};
  public dataConvert: IListConversationConfirmProperties[];
  public isShowConfirmProperty: boolean = false;
  public confirmPropertyData: IListConvertMultipleTask;
  public showBackBtn: boolean = false;
  public currentDraggingToFolderName: string = '';
  private readonly destroy$ = new Subject<void>();
  private readonly refreshMessageSubject$ = new Subject();
  private pageLimit = LIMIT_TASK_LIST;
  private scrollTimeOut: NodeJS.Timeout = null;
  private queryParams: Params = {};
  private payloadMessage = {} as IMessageQueryParams;
  private companyId: string;
  private currentUser: CurrentUser;
  private currentMailboxId: string;
  private teamMembersInMailBox: number;
  private statusMailBox: EMailBoxStatus;
  private isPreventScrollToTop: boolean = false;
  public countSelected: number = 0;
  public isHiddenMessageTypeCallFile = false;
  public totalMessage = 0;
  public TaskType = TaskType;
  private currentMessage: TaskItem;

  public confirmResolveSms: boolean = false;
  public emptyTitle: string;
  public isFirstRender: boolean = true;
  public currentConversation;

  constructor(
    private agencyService: AgencyService,
    private activatedRoute: ActivatedRoute,
    private statisticService: StatisticService,
    private router: Router,
    private inboxToolbarService: InboxToolbarService,
    private websocketService: RxWebsocketService,
    private taskService: TaskService,
    private conversationService: ConversationService,
    private smsMessageMenuService: SmsMessageMenuService,
    private smsMessageConversationIdSetService: SmsMessageConversationIdSetService,
    private toastService: ToastrService,
    private userService: UserService,
    private inboxSidebarService: InboxSidebarService,
    private inboxFilterService: InboxFilterService,
    private agencyDateFormatService: AgencyDateFormatService,
    private cdr: ChangeDetectorRef,
    private headerService: HeaderService,
    private syncResolveMessageService: SyncResolveMessageService,
    private sharedMessageViewService: SharedMessageViewService,
    private messageTaskLoadingService: MessageTaskLoadingService,
    private renderer: Renderer2,
    private mailboxSettingService: MailboxSettingService,
    private propertiesService: PropertiesService,
    private nzContextMenuService: NzContextMenuService,
    private elementRef: ElementRef,
    private sharedService: SharedService,
    private toastCustomService: ToastCustomService,
    private companyService: CompanyService,
    private store: Store,
    public inboxService: InboxService,
    private autoScrollService: AutoScrollService,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private smsMessageListService: SmsMessageListService,
    private readonly ngZone: NgZone,
    private readonly conversationSummaryService: ConverationSummaryService,
    private smsMessageApiService: SmsMessageApiService
  ) {}

  get isCreateNewMessage() {
    return this.smsMessageListService.isCreateNewMessage$;
  }

  set messageList(value: TaskItem[]) {
    this.store.dispatch(
      smsMessageActions.setAll({
        messages: value
      })
    );
  }
  get messageList() {
    return this._messageList;
  }

  get loadingMore() {
    return this.showSpinnerTop || this.showSpinnerBottom;
  }

  set loadingMore(value: boolean) {
    this.showSpinnerTop = value;
    this.showSpinnerBottom = value;
  }

  get isSelectedMove() {
    return this.inboxToolbarService.hasItem;
  }

  ngOnInit(): void {
    this.subscribeCurrentConversations();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.onStoreChange();
    this.refreshMessageSubject$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged(isEqual))
      .subscribe((rs) => {
        this.store.dispatch(
          smsMessagePageActions.payloadChange({ payload: rs['payload'] })
        );
      });

    this.agencyDateFormatService.dateFormatDayJS$
      .pipe(first(Boolean))
      .subscribe((value) => {
        this.dataFormat = value;
      });

    this.propertiesService.listPropertyAllStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((properties) => {
        this.listProperty = properties;
      });

    this.onQueryAndFilterChanged();
    this.subscribeFilterInboxList();
    this.subscribeFilterMessageList();
    this.subscribeSetup();
    this.subscribeCurrentCompany();
    this.subscribeMailboxSettings();
    this.subscribeInboxItem();
    this.subscribeSyncStatusMessageList();
    this.subscribeConversationAction();
    this.subscribeMessageSocket();
    this.subscribeSeenConversationSocket();
    this.subscribeSocketAssignContact();
    this.subscribeMarkReadAndUnread();
    this.subscribeGoToSmsMessage();
    this.subscribeUpdateCountTicketConSocket();
    this.subscribeDeleteDraft();
    this.subscribeSocketPmJoinConverstation();

    this.inboxFilterService.selectedItem$
      .pipe(
        takeUntil(this.destroy$),
        map(
          ({ assignee, portfolio, messageStatus, taskType, eventType }) =>
            assignee + portfolio + messageStatus + taskType + eventType
        )
      )
      .subscribe((count) => {
        this.countSelected = count;
      });

    this.handleCalculateTotalMsg();
    this.subscribeNewTicketMessageSummary();
  }

  filterSocketNewTicket = (data) => {
    const { type, conversationType, conversationId } = data || {};
    //In the case where standing in a different conversation, the count of the conversation with the new ticket needs to be updated.
    return (
      type === SocketType.newTicket &&
      conversationType === EConversationType.SMS &&
      conversationId !==
        this.conversationService.currentConversationId.getValue()
    );
  };

  private subscribeNewTicketMessageSummary() {
    this.websocketService.onSocketNewTicket
      .pipe(takeUntil(this.destroy$), filter(this.filterSocketNewTicket))
      .subscribe((data) => {
        this.updateMessageListWithNewTicket(data);
      });
  }

  private updateMessageListWithNewTicket(data) {
    this.messageList = this.messageList.map((msg) => {
      if (
        msg?.id === data?.taskId &&
        msg.conversationId === data?.conversationId
      ) {
        return {
          ...msg,
          conversations: msg.conversations.map((it) => ({
            ...it,
            countUnreadTicket: it?.countUnreadTicket + 1
          }))
        };
      }
      return msg;
    });
  }

  subscribeDeleteDraft() {
    this.websocketService.onSocketDeleteDraft
      .pipe(delay(500), takeUntil(this.destroy$))
      .subscribe((res) => {
        const taskIndex = this.messageList.findIndex(
          (task) =>
            task.id === res.taskId && task.conversationId === res.conversationId
        );
        const task = { ...this.messageList[taskIndex] };

        this.handleReceivedDataForConversations(res, task, taskIndex);
      });
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
    if (this.checkDiffStatus()) return;
    if (
      !this.elementRef.nativeElement?.contains(event.target) &&
      this.sharedMessageViewService.isRightClickDropdownVisibleValue
    ) {
      this.resetRightClickSelectedState();
    }
  }

  filterCurrentConversation = (conversation) => {
    return Object?.keys(conversation)?.length > 0;
  };

  subscribeCurrentConversations() {
    this.conversationService.currentConversation
      .pipe(
        filter((conversation) => !!conversation),
        filter(this.filterCurrentConversation),
        takeUntil(this.destroy$)
      )
      .subscribe((conversation) => {
        const {
          taskId,
          id: conversationId,
          isDetectedContact,
          userId
        } = conversation || {};
        this.currentConversation = conversation;
        const updatedConversation = this.getTaskFromMessageList(
          taskId,
          conversationId
        ).conversations?.[0];

        if (
          !updatedConversation ||
          (updatedConversation.isDetectedContact === isDetectedContact &&
            updatedConversation.userId === userId)
        )
          return;

        this.updateMessageList(
          'id',
          conversationId,
          taskId,
          conversationId,
          conversation
        );
        this.cdr.markForCheck();
      });
  }

  getTaskFromMessageList(taskId: string, conversationId: string) {
    return this.messageList.find(
      (msg) => msg.id === taskId && msg.conversationId === conversationId
    );
  }

  subscribeUpdateCountTicketConSocket() {
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

  handleCalculateTotalMsg() {
    this.inboxSidebarService.statisticsSmsMessage$
      .pipe(
        filter((mess) => Boolean(mess?.length)),
        takeUntil(this.destroy$)
      )
      .subscribe((messages) => {
        const isEmptyMessage = messages.every((mess) => !mess.count);
        this.emptyTitle = isEmptyMessage
          ? 'No SMS messages to display'
          : `Give yourself a high five! You've cleared your SMS messages inbox.`;
        this.cdr.markForCheck();
      });
  }

  subscribeGoToSmsMessage() {
    this.conversationService.triggerGoToAppMessage$
      .pipe(takeUntil(this.destroy$), delay(200))
      .subscribe(() => {
        const messageIndex = this.messageList?.findIndex(
          (item) => item.id === this.queryTaskId
        );
        if (messageIndex >= 0) {
          this.scrollToElement(messageIndex, 'start');
          return;
        }
        this.refreshMessageSubject$.next({
          payload: {
            ...this.payloadMessage,
            currentTaskId: this.queryTaskId
          },
          timer: 500
        });
      });
  }

  private onStoreChange() {
    const messages$ = this.store.select(selectAllSmsMessage).pipe(
      tap((messages) => {
        this._messageList = this.handleMapMessageList(
          messages,
          this.selectMessageIdMap
        ).map((message) => ({ ...message, taskType: TaskType.SMS }));
        this.cdr.markForCheck();
      })
    );
    const payload$ = this.store.select(selectMessagePayload);
    const fetching$ = this.store
      .select(selectFetchingMessage)
      .pipe(
        tap(
          (fetching) =>
            this.isLoading !== fetching &&
            this.isFirstRender &&
            (this.isLoading = fetching)
        )
      );
    const fetchingMore$ = this.store
      .select(selectFetchingMoreMessage)
      .pipe(
        tap(
          (fetchingMore) =>
            this.loadingMore !== fetchingMore &&
            (this.loadingMore = fetchingMore)
        )
      );

    const total$ = this.store.select(selectTotalMessage);
    combineLatest([messages$, total$, payload$, fetching$, fetchingMore$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([messages, total, payload]) => {
        this.totalMessage = total;
        this.isFirstRender = false;
        const response = {
          tasks: messages,
          currentPage: payload.page,
          totalTask: total
        };
        this.cdr.markForCheck();
        this.updateMessageListUIV2(response);
      });
  }

  private checkDiffStatus() {
    const urlStatusRegex = /status=([^&]+)/;
    const currentUrlStatus =
      this.router.url.match(urlStatusRegex) &&
      this.router.url.match(urlStatusRegex)[1];
    const currentQueryParamsStatus = this.queryParams['status'];
    return (
      currentQueryParamsStatus &&
      currentUrlStatus &&
      currentQueryParamsStatus !== currentUrlStatus
    );
  }

  private subscribeSocketAssignContact() {
    merge(
      this.websocketService.onSocketDeleteSecondaryContact,
      this.websocketService.onSocketAssignContact
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (this.messageList?.some((message) => message.id === res.taskId)) {
          this.messageList = this.messageList.map((message) => {
            if (message?.id === res?.taskId) {
              const newUserId = res?.newUserId;
              const participants = (res?.participants as IParticipant[]) || [];
              return this.mapSmsMessageIndexParticipant(
                participants,
                message,
                newUserId
              );
            }
            return message;
          });
        }
      });
  }

  mapSmsMessageIndexParticipant(
    participants: IParticipant[],
    message: TaskItem,
    newUserId: string
  ) {
    if (!participants?.length) return message;
    const participant =
      participants.find((item) => item.userId === newUserId) || participants[0];
    const isNoPropertyType =
      [EConfirmContactType.SUPPLIER, EConfirmContactType.OTHER].includes(
        participant.type as EConfirmContactType
      ) || participant.isTemporary;
    const newTask = isNoPropertyType
      ? message
      : this.mapSmsIndexProperty(participant?.propertyId, message);
    return {
      ...newTask,
      conversations: [
        {
          ...newTask.conversations[0],
          participants,
          userId: newUserId || this.findUserIdInSocketAssign(participants)
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

  private subscribeCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        this.companyId = company.id;
      });
  }

  private onQueryAndFilterChanged() {
    this.invokeGetListMessage()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ([
          queryParams,
          mailBoxId,
          selectedInboxType,
          selectedPortfolio,
          selectedAgency,
          selectedStatus,
          selectedTaskEditorId,
          selectedCalendarEventId,
          ,
          ,
          ,
        ]) => {
          this.updateStateValues(
            selectedInboxType,
            selectedPortfolio,
            selectedStatus,
            selectedAgency,
            selectedTaskEditorId,
            selectedCalendarEventId
          );

          this.queryParams = { ...queryParams };

          this.updateQueryParamsForBackNavigation(
            queryParams,
            selectedAgency,
            selectedPortfolio,
            selectedStatus,
            selectedTaskEditorId,
            selectedCalendarEventId
          );

          if (mailBoxId && Object.keys(queryParams).length) {
            this.currentMailboxId = mailBoxId;
            this.searchText = queryParams[EInboxFilterSelected.SEARCH];
            this.payloadMessage =
              this.smsMessageListService.mapPayloadSmsMessageList(
                this.queryParams,
                this.teamMembersInMailBox <= 1,
                {
                  selectedInboxType,
                  selectedPortfolio,
                  selectedAgency,
                  selectedStatus,
                  mailBoxId: this.currentMailboxId
                }
              );

            this.handleSetIsMessageIdsEmpty();
            this.refreshMessageSubject$.next({
              payload: this.payloadMessage,
              timer: DEBOUNCE_DASHBOARD_TIME * 3
            });
          }
        }
      );
  }

  private invokeGetListMessage() {
    return combineLatest([
      this.activatedRoute.queryParams,
      this.inboxService.getCurrentMailBoxId().pipe(
        distinctUntilChanged(),
        tap(() => {
          this.messageList = [];
          this.handleSetIsMessageIdsEmpty();
        })
      ),
      this.inboxFilterService.selectedInboxType$,
      this.inboxFilterService.selectedPortfolio$,
      this.inboxFilterService.selectedAgency$,
      this.inboxFilterService.selectedStatus$,
      this.inboxFilterService.selectedTaskEditorId$,
      this.inboxFilterService.selectedCalendarEventId$,
      this.mailboxSettingService.mailboxSetting$,
      this.inboxService.importEmailId$,
      this.userService.getUserDetail()
    ]).pipe(
      distinctUntilChanged((previous, current) => isEqual(previous, current)),
      debounceTime(100),
      filter(() => this.router.url.includes('inbox/sms-messages')),
      filter((response) => {
        const queryParams = response[0];
        const inboxType = response[2];
        const currentUser = response[10];
        return this.navigateWithDefaultParams(
          queryParams,
          currentUser,
          inboxType
        );
      }),
      tap(() => {
        this.queryTaskId =
          this.activatedRoute?.snapshot?.queryParams?.[
            EInboxFilterSelected.TASK_ID
          ];
        this.queryConversationId =
          this.activatedRoute?.snapshot?.queryParams?.[
            EInboxFilterSelected.CONVERSATION_ID
          ];
        this.isDraftFolder =
          this.activatedRoute?.snapshot?.queryParams?.[
            EMessageQueryType.MESSAGE_STATUS
          ] === TaskStatusType.draft;
        this.handleSetIsMessageIdsEmpty();
        this.cdr.markForCheck();
      }),
      filter(
        ([
          queryParams,
          mailBoxId,
          selectedInboxType,
          selectedPortfolio,
          selectedAgency,
          selectedStatus,
          selectedTaskEditorId,
          selectedCalendarEventId,
          mailBoxSetting,
          importEmailId
        ]) => {
          this.isFocusView =
            queryParams[EMessageQueryType.INBOX_TYPE] === GroupType.MY_TASK;
          this.teamMembersInMailBox = mailBoxSetting.teamMembers;
          this.hasFilter = hasMessageFilter(queryParams);
          const shouldCallAPI = this.compareGetMessageParams(
            queryParams,
            selectedInboxType,
            mailBoxId,
            selectedTaskEditorId,
            selectedCalendarEventId,
            selectedPortfolio,
            selectedAgency,
            selectedStatus,
            importEmailId
          );
          return shouldCallAPI;
        }
      )
    );
  }

  private compareGetMessageParams(
    queryParams: Params,
    selectedInboxType: GroupType,
    mailBoxId: string,
    selectedTaskEditorId: string[],
    selectedCalendarEventId: ISelectedCalendarEventId,
    selectedPortfolio: string[],
    selectedAgency: string[],
    selectedStatus: string[],
    importEmailId: string
  ): boolean {
    if (!Object.keys(queryParams).length) {
      return false;
    }

    const isSearchTextDifferent =
      queryParams?.[EInboxFilterSelected.SEARCH] !== undefined &&
      this.searchText !== queryParams?.[EInboxFilterSelected.SEARCH];

    const isInboxTypeDifferent =
      this.selectedInboxType && this.selectedInboxType !== selectedInboxType;

    const isMailboxIdDifferent = this.currentMailboxId !== mailBoxId;

    const isImportEmailIdDifferent = Boolean(importEmailId);

    // reload when navigating to a message that is not in the current list
    const isSelectedMessageIdDifferent =
      queryParams[EInboxFilterSelected.TASK_ID] &&
      this.queryTaskId !== queryParams[EInboxFilterSelected.TASK_ID] &&
      queryParams[EInboxFilterSelected.CONVERSATION_ID] &&
      this.queryConversationId !==
        queryParams[EInboxFilterSelected.CONVERSATION_ID] &&
      !this.messageList?.some(
        (message) =>
          message.id === queryParams[EInboxFilterSelected.TASK_ID] &&
          message.conversationId ===
            queryParams[EInboxFilterSelected.CONVERSATION_ID]
      );

    const isSelectedTaskEditorIdDifferent =
      this.selectedTaskEditorId &&
      !isEqual(this.selectedTaskEditorId?.sort(), selectedTaskEditorId?.sort());

    const isSelectedCalendarEventIdDifferent =
      !this.isObjectNull(selectedCalendarEventId) &&
      !isEqual(this.selectedCalendarEventId, selectedCalendarEventId);

    const isSelectedPortfolioDifferent =
      this.selectedPortfolio &&
      !isEqual(this.selectedPortfolio?.sort(), selectedPortfolio?.sort());

    const isSelectedAgencyDifferent =
      this.selectedAgency &&
      !isEqual(this.selectedAgency?.sort(), selectedAgency?.sort());

    const isSelectedStatusDifferent =
      this.selectedStatus &&
      !isEqual(this.selectedStatus?.sort(), selectedStatus?.sort());

    const isLabelIdDifferent =
      this.queryParams?.[EInboxFilterSelected.EXTERNAL_ID] !==
      queryParams[EInboxFilterSelected.EXTERNAL_ID];

    const isStatusDifferent =
      this.queryParams?.[EMessageQueryType.MESSAGE_STATUS] !==
      queryParams?.[EMessageQueryType.MESSAGE_STATUS];

    const isTimeStampDifferent =
      this.queryParams?.[EMessageQueryType.TIME_STAMP] !=
      queryParams?.[EMessageQueryType.TIME_STAMP];

    if (isStatusDifferent) {
      this.queryParams[EInboxFilterSelected.TASK_ID] = null;
    }

    return (
      isSearchTextDifferent ||
      isInboxTypeDifferent ||
      isMailboxIdDifferent ||
      isSelectedTaskEditorIdDifferent ||
      isSelectedCalendarEventIdDifferent ||
      isSelectedPortfolioDifferent ||
      isSelectedAgencyDifferent ||
      isSelectedStatusDifferent ||
      isImportEmailIdDifferent ||
      isLabelIdDifferent ||
      isSelectedMessageIdDifferent ||
      isStatusDifferent ||
      isTimeStampDifferent
    );
  }

  private updateStateValues(
    selectedInboxType: GroupType,
    selectedPortfolio: string[],
    selectedStatus: string[],
    selectedAgency: string[],
    selectedTaskEditorId: string[],
    selectedCalendarEventId: ISelectedCalendarEventId
  ) {
    this.selectedInboxType = selectedInboxType;
    this.selectedPortfolio = cloneDeep(selectedPortfolio);
    this.selectedStatus = cloneDeep(selectedStatus);
    this.selectedAgency = cloneDeep(selectedAgency);
    this.selectedTaskEditorId = cloneDeep(selectedTaskEditorId);
    this.selectedCalendarEventId = cloneDeep(selectedCalendarEventId);
    this.smsMessageConversationIdSetService.clear();
  }

  private navigateWithDefaultParams(
    queryParams: Params,
    currentUser: CurrentUser,
    selectedInboxType: GroupType
  ) {
    let shouldNavigate = false;
    const activatedQueryParams =
      this.activatedRoute?.snapshot?.queryParams ?? {};
    const defaultQueryParams = {
      inboxType: selectedInboxType ?? GroupType.MY_TASK,
      status:
        activatedQueryParams[EMessageQueryType.MESSAGE_STATUS] ??
        TaskStatusType.inprogress,
      taskId: activatedQueryParams?.[EInboxFilterSelected.TASK_ID],
      conversationId:
        activatedQueryParams?.[EInboxFilterSelected.CONVERSATION_ID]
    };

    if (
      !queryParams[EMessageQueryType.INBOX_TYPE] ||
      !queryParams[EMessageQueryType.MESSAGE_STATUS]
    ) {
      shouldNavigate = true;
    }

    if (
      currentUser?.userOnboarding?.useDefaultFocusView &&
      !queryParams[EMessageQueryType.INBOX_TYPE]
    ) {
      defaultQueryParams[EMessageQueryType.INBOX_TYPE] = this.isConsole
        ? GroupType.TEAM_TASK
        : GroupType.MY_TASK;
    }

    if (shouldNavigate && this.statusMailBox !== EMailBoxStatus.UNSYNC) {
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: {
          ...(this.activatedRoute.snapshot.queryParams ?? {}),
          ...activatedQueryParams,
          ...defaultQueryParams
        },
        queryParamsHandling: 'merge'
      });

      return false;
    }
    return true;
  }

  private updateQueryParamsForBackNavigation(
    queryParams: Params,
    selectedAgency: string[],
    selectedPortfolio: string[],
    selectedStatus: string[],
    selectedTaskEditorId: string[],
    selectedCalendarEventId: ISelectedCalendarEventId
  ) {
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
      ) ||
      !compareParams(
        queryParams[EInboxFilterSelected.TASK_EDITOR_ID],
        selectedTaskEditorId
      ) ||
      ((!queryParams['eventType'] ||
        !queryParams['startDate'] ||
        !queryParams['endDate']) &&
        selectedCalendarEventId?.eventType?.length > 0) ||
      selectedCalendarEventId?.endDate ||
      selectedCalendarEventId?.startDate
    ) {
      const newQueryParams = {
        ...queryParams,
        assignedTo: selectedAgency,
        propertyManagerId: selectedPortfolio,
        messageStatus: selectedStatus,
        ...(selectedCalendarEventId?.eventType?.length > 0 && {
          eventType: selectedCalendarEventId.eventType
        }),
        ...(selectedCalendarEventId.startDate && {
          startDate: selectedCalendarEventId.startDate
        }),
        ...(selectedCalendarEventId.endDate && {
          endDate: selectedCalendarEventId.endDate
        }),
        taskEditorId: selectedTaskEditorId
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

  private updateMessageListUIV2(response) {
    this.isError = false;
    if (response?.tasks) {
      this.statisticService.setStatisticTotalTask({
        type: this.queryParams[EMessageQueryType.MESSAGE_STATUS],
        value: response.totalTask
      });
    }
    const isStopProcess = this.processListMessage(response);
    if (isStopProcess) {
      this.sharedMessageViewService.setIsShowSelect(
        this.messageList.length > 0
      );
      this.inboxService.setIsAllFiltersDisabled(false);
    }
  }

  private handleSetIsMessageIdsEmpty() {
    if (!this.messageList?.length) {
      this.smsMessageConversationIdSetService.setIsMessageIdsEmpty(true);
      return;
    }
    const focusMessageIndex = this.getFocusMessageIndex(this.messageList);
    this.smsMessageConversationIdSetService.setIsMessageIdsEmpty(
      focusMessageIndex === -1
    );
  }

  private getFocusMessageIndex(messages: TaskItem[]) {
    const messageStatus =
      this.activatedRoute.queryParamMap[EMessageQueryType.MESSAGE_STATUS];
    const taskId = this.queryTaskId;
    switch (messageStatus) {
      case TaskStatusType.draft:
        const conversationId = this.queryConversationId;
        return messages.findIndex(
          (message) =>
            message.id === taskId && message.conversationId === conversationId
        );
      default:
        return messages.findIndex((message) => message.id === taskId);
    }
  }

  private processListMessage(response: {
    tasks: TaskItem[];
    currentPage: number;
  }) {
    const conversationIndex = this.getFocusMessageIndex(response.tasks);
    if (
      conversationIndex >= 0 &&
      response.currentPage > 0 &&
      response.tasks?.length < LIMIT_TASK_LIST
    ) {
      this.onScrollToTop();
      return false;
    }
    this.handleSetIsMessageIdsEmpty();
    return true;
  }
  private subscribeFilterInboxList() {
    this.inboxToolbarService.filterInboxList$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((rs) => {
          if (!rs) {
            this.messageList = this.handleMapMessageList(this.messageList);
            return of(null);
          }
          return this.inboxToolbarService.inboxItem$.pipe(
            takeUntil(this.destroy$)
          );
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (!rs) return;
        this.messageList = [...this.messageList].filter(
          (it) => !rs.some((r) => r?.conversationId === it?.conversationId)
        );
        this.inboxToolbarService.setFilterInboxList(null);
        this.inboxToolbarService.setInboxItem([]);
      });

    this.inboxToolbarService.handleInboxItemSelection$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ id, conversationId, isReset }) => {
          if (conversationId && this.activeMsgList.length <= 1) {
            this.activeMsgList = [conversationId];
          }
          this.handleNavigateMessageDetail({
            taskId: id,
            conversationId,
            isScratchDraft: false,
            isReset
          });
        }
      });
  }

  private subscribeFilterMessageList() {
    this.inboxService.conversationSuccess$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (!rs) return;
        this.messageList = [...this.messageList].filter(
          (it) => !rs.some((r) => r.id === it?.conversations[0]?.id)
        );
      });
  }

  private subscribeConversationAction() {
    this.headerService.conversationAction$
      .pipe(takeUntil(this.destroy$))
      .subscribe((conversationAction) => {
        const messageToChange = this.messageList.find(
          (message) =>
            message.id === conversationAction.taskId &&
            (conversationAction.conversationId &&
            message.status !== TaskStatusType.draft
              ? message.conversationId === conversationAction.conversationId
              : true)
        );
        const allowMenuChangeAction =
          conversationAction?.isTriggeredFromToolbar || messageToChange;
        if (!allowMenuChangeAction) return;
        const {
          option,
          isTriggeredFromRightPanel,
          isTriggeredFromToolbar,
          messageIds,
          conversationIds
        } = conversationAction;

        this.handleMenuChange({
          message: messageToChange,
          option: option as EMessageMenuOption,
          isTriggeredFromRightPanel,
          isTriggeredFromToolbar,
          messageIds,
          conversationIds
        });
      });
  }

  private subscribeSeenConversationSocket() {
    // Note: handle read/ unread of message
    this.websocketService.onSocketSeenConversation
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
        const { isSeen } = res;
        const conversations = this.getConversations(res);
        if (
          conversations.every((converstaion) =>
            this.smsMessageConversationIdSetService.has(
              converstaion.conversationId
            )
          )
        ) {
          if (res?.userId && res?.userId === this.currentUser.id) {
            return;
          }

          conversations.forEach((converstaion) => {
            this.updateCurrentTask(EMessageProperty.IS_SEEN, isSeen);
            this.updateMessageList(
              EMessageProperty.IS_SEEN,
              isSeen,
              converstaion.taskId,
              converstaion.conversationId
            );
            this.inboxToolbarService.updateInboxItem(
              [converstaion.taskId],
              EMessageProperty.IS_SEEN,
              isSeen
            );
          });
        }
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

  updateCurrentTask(
    propertyToUpdate: string,
    propertyValue: boolean | string | IParticipant[]
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
  }

  updateMessageList(
    propertyToUpdate: string,
    propertyValue,
    taskId: string,
    conversationId: string,
    newConversation?: PreviewConversation
  ) {
    this.messageList = this.messageList.map((msg) => {
      if (msg.id === taskId && msg.conversationId === conversationId) {
        return {
          ...msg,
          conversations: msg.conversations.map((it) => ({
            ...it,
            [propertyToUpdate]: propertyValue,
            ...(newConversation || {})
          }))
        };
      }
      return msg;
    });
  }

  subscribeMessageSocket() {
    this.websocketService.onSocketMessage
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (res) =>
            res.type === SocketType.newMessages &&
            res &&
            res.companyId === this.companyId &&
            res.mailBoxId === this.currentMailboxId
        )
      )
      .subscribe((res) => this.handleCreateNewSmsMessageSocket(res));

    this.websocketService.onSocketMessage
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (
          res &&
          res.companyId === this.companyId &&
          res.type !== SocketType.newMessages
        ) {
          this.dataMessageSocket = res;
          switch (res.type) {
            case SocketType.assignTask:
              this.handleAssignMessage(res);
              break;
            case SocketType.changeStatusTask:
              this.handleChangeStatusMessageRealtime(res);
              break;
          }
        }
      });

    this.websocketService.onSocketSend
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        filter((res) => {
          return !(
            !res ||
            ((res.isResolveConversation ||
              res.messageType === CONVERSATION_STATUS.RESOLVED) &&
              !this.router.url?.includes(ERouterLinkInbox.MSG_COMPLETED))
          );
        })
      )
      .subscribe((res) => {
        const taskIndex = this.messageList.findIndex(
          (task) =>
            task.id === res.taskId && task.conversationId === res.conversationId
        );
        const task = { ...this.messageList[taskIndex] };

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
        }

        // update message in conversation
        this.handleReceivedDataForConversations(res, task, taskIndex);

        this.inboxSidebarService.refreshStatisticsUnreadTask(
          this.currentMailboxId
        );
      });

    this.websocketService.onSocketChangeConversationProperty
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        const taskIndex = this.messageList.findIndex(
          (task) =>
            task.id === res.taskId && task.conversationId === res.conversationId
        );
        const task = { ...this.messageList[taskIndex] };
        this.handleReceivedDataForConversations(res, task, taskIndex);
      });
  }

  handleCreateNewSmsMessageSocket(data) {
    if (
      data.conversationType !== EConversationType.SMS ||
      !data?.taskIds ||
      this.queryParams[EInboxFilterSelected.SEARCH] ||
      !!this.queryParams[EInboxFilterSelected.ASSIGNED_TO]?.length ||
      !!this.queryParams[EInboxFilterSelected.PROPERTY_MANAGER_ID]?.length
    ) {
      return;
    }

    this.fetchAndDispatchSmsMessages(data, true);

    if (this.statusMailBox !== EMailBoxStatus.SYNCING)
      this.inboxSidebarService.refreshStatisticsUnreadTask(
        this.currentMailboxId
      );
  }

  private fetchAndDispatchSmsMessages(data, newFetching = false) {
    const payload = this.smsMessageListService.mapPayloadSmsMessageList(
      this.queryParams,
      false,
      {
        queryParams: {
          ...this.queryParams,
          taskId: newFetching ? null : data?.taskId || null
        },
        mailboxId: data.mailBoxId
      }
    );
    this.dispatchZone(smsMessagePageActions.payloadChange({ payload }));
  }

  private dispatchZone(action: Action) {
    this.ngZone.run(() => this.store.dispatch(action));
  }

  private handleReceivedDataForConversations(
    res: SocketSendData | ISocketChangeConversationProperty,
    task: TaskItem,
    taskIndex: number
  ) {
    if (
      !task ||
      !task.conversations ||
      !task.conversations.length ||
      task.conversations?.[0]?.isAppMessageLog ||
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
    const currentUrlTaskId =
      this.activatedRoute.snapshot.queryParams?.['taskId'];
    const currentUrlConversationId =
      this.activatedRoute.snapshot.queryParams?.['conversationId'];

    if (res.messageType?.toUpperCase() === EMessageType.defaultText) {
      conversation = {
        ...conversation,
        message: res.message
      };
    }

    if (
      res.messageType === EMessageType.changeProperty ||
      ((res as SocketSendData)?.conversationType === EConversationType.SMS &&
        (res as SocketSendData).isDraft)
    ) {
      task = this.mapSmsIndexProperty(res?.propertyId, task);
    }

    if (res.type === SocketType.send) {
      task.messageDate = res?.messageDate || task.messageDate;
    }

    conversation = this.updateConversationFromMessage(
      conversation,
      res,
      isAfterDeleteDraft,
      this.currentConversation
    );
    this.handleTotalMessage(conversation, res);

    task.conversations = task.conversations.map((item) => {
      if (item.id === conversation.id) return conversation;
      else return item;
    });

    this.messageList[taskIndex] = cloneDeep(task);
    const sortMsgList = this.taskService.sortListDescByConversation(
      this.messageList,
      this.isDraftFolder
    );

    const clonedMessage = cloneDeep(this.messageList);
    clonedMessage[taskIndex] = cloneDeep(task);
    this.messageList = clonedMessage;
    if (res.taskId === this.taskService.currentTask$.value?.id) {
      this.updateCurrentTask('messageDate', res.messageDate);

      if (res.participants) {
        this.updateCurrentTask(
          'participants',
          res.participants as IParticipant[]
        );
      }
    }

    this.messageList = [...sortMsgList];

    if (
      !this.isPreventScrollToTop &&
      this.infiniteScrollIndex.nativeElement?.scrollTop &&
      res.taskId === currentUrlTaskId &&
      res.conversationId === currentUrlConversationId &&
      res.messageType === 'text'
    ) {
      this.renderer.setProperty(
        this.infiniteScrollIndex.nativeElement,
        'scrollTop',
        0
      );
    }
    if (this.isPreventScrollToTop) {
      this.isPreventScrollToTop = false;
    }
  }

  mapSmsIndexProperty(propertyId: string, task: TaskItem) {
    const tempTask = cloneDeep(task);
    const newProperty = this.listProperty?.find(
      (item) => item.id === propertyId
    );

    const temporaryProperty = {
      shortenStreetline: null,
      streetline: null,
      status: null
    };

    tempTask.property = {
      ...task.property,
      ...(newProperty || temporaryProperty),
      isTemporary: !newProperty
    };
    tempTask.conversations[0].isTemporaryProperty = !newProperty;
    tempTask.propertyStatus = newProperty?.status as EPropertyStatus;

    return tempTask;
  }

  private handleTotalMessage(conversation, res) {
    this.socketSendData = res;
    conversation.totalMessages =
      res.totalMessages ?? conversation.totalMessages;
  }

  private updateConversationFromMessage(
    conversation,
    res,
    isAfterDeleteDraft = false,
    currentConversation
  ) {
    return {
      ...conversation,
      options: res.options || conversation.options,
      messageDate:
        [
          EMessageType.changeProperty,
          EMessageType.syncConversation,
          EMessageType.agentJoin
        ].includes(res.messageType) ||
        (res.isDraft && !this.isDraftFolder)
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
          ].includes(res.messageComeFrom) ||
          currentConversation?.id === res?.conversationId
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
      isLastMessageDraft:
        typeof res?.isLastMessageDraft === 'boolean'
          ? res?.isLastMessageDraft
          : conversation?.isLastMessageDraft || false,
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
      participants: res.participants
        ? res.participants
        : conversation.participants,
      title: res.title || res.title === '' ? res.title : conversation.title,
      attachmentCount: res.attachmentCount ?? conversation.attachmentCount
    };
  }

  private isObjectNull(obj) {
    return Object.values(obj).some((x) => x !== null && x !== '');
  }

  private subscribeSocketPmJoinConverstation() {
    // Note: handle PM Join Conversation of message
    this.websocketService.onSocketPmJoinConversation
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { taskId, conversationId, isPmJoined } = res || {};
        this.updateMessageList(
          'isPmJoined',
          isPmJoined,
          taskId,
          conversationId
        );
      });
  }

  private subscribeSetup() {
    this.inboxToolbarService.inboxItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.inboxList = (rs ?? []) as TaskItem[];
        const initialValue = new Map<string, boolean>();
        this.selectMessageIdMap = Array.isArray(rs)
          ? (rs as TaskItem[]).reduce((map, message) => {
              if (message?.conversationId) {
                map.set(message.conversationId, true);
              }
              return map;
            }, initialValue)
          : initialValue;
        this._messageList = this.handleMapMessageList(
          this._messageList,
          this.selectMessageIdMap
        );
      });

    this.userService
      .getSelectedUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => (this.currentUser = rs));

    this.inboxService
      .getSyncMailBoxStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.statusMailBox = res));
  }

  subscribeSyncStatusMessageList() {
    const currentListByCRM$ = this.isRmEnvironment
      ? this.syncResolveMessageService.getListConversationStatus()
      : this.syncMessagePropertyTreeService.listConversationStatus;
    currentListByCRM$
      .pipe(takeUntil(this.destroy$))
      .subscribe((listMessageSyncStatus) => {
        if (!listMessageSyncStatus) return;
        this.messageList = this.messageList?.map((message) => {
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

  handleAssignMessage(res: SocketMessage) {
    const message = res as TaskItem;
    const isUnassignedPM =
      this.isFocusView &&
      message.assignToAgents.every((agent) => {
        return agent.id !== this.currentUser.id;
      }) &&
      this.messageList.some((item) => item.id === message.id);
    const currentUrlTaskId =
      this.activatedRoute.snapshot.queryParams?.['taskId'];
    if (isUnassignedPM && message.id !== currentUrlTaskId) {
      this.removeMessage(message);
      this.statisticService.updateStatisticTotalTask(
        this.queryParams[EMessageQueryType.MESSAGE_STATUS],
        -1
      );
      this.handleCheckShowSelect();
      this.inboxToolbarService.setInboxItem([]);
    }
    this.inboxSidebarService.refreshStatisticsUnreadTask(this.currentMailboxId);
  }

  handleChangeStatusMessageRealtime(data) {
    const { status } = this.queryParams;
    if (status !== data.newStatus) {
      this.removeMessagesByConversationId(
        data?.conversationIds || [data.conversationId]
      );
    }
    const isSameMailbox = this.currentMailboxId === data.mailBoxId;
    if (!isSameMailbox || (!data?.taskIds?.length && !data?.taskId)) return;
    const payload = this.getPayloadListSms(data);
    const taskIds = data.taskIds ?? [data?.taskId];
    this.smsMessageApiService
      .getNewSMSMessages(payload, taskIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res?.tasks?.length) return;
        this.handleReplaceAndPushMessageToList(res);
        this.setIsShowSelectMsg();
        this.handleSetIsMessageIdsEmpty();
      });
  }

  handleReplaceAndPushMessageToList(res) {
    this.messageList = this.pushAndReplaceMessages(
      this.messageList,
      res.tasks.map((item) => ({
        ...item,
        messageDate: item.conversations?.[0]?.messageDate
      }))
    );
  }

  setIsShowSelectMsg() {
    const hasMessages = !!this.messageList?.length;
    const isSelectVisible = this.sharedMessageViewService.isShowSelectValue;

    this.sharedMessageViewService.setIsShowSelect(
      hasMessages && !isSelectVisible
    );
  }

  getPayloadListSms(data) {
    return this.smsMessageListService.mapPayloadSmsMessageList(
      this.queryParams,
      false,
      {
        queryParams: {
          ...this.queryParams,
          taskId: data?.taskId || null
        },
        mailboxId: data.mailBoxId
      }
    );
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
        clonedMessages.unshift(message);
      }
    }
    return clonedMessages;
  }

  removeMessagesByConversationId(conversationIds: string[]) {
    conversationIds.forEach((conversationId) => {
      if (this.smsMessageConversationIdSetService.has(conversationId)) {
        this.smsMessageConversationIdSetService.delete(conversationId);
        this.messageList = this.messageList.filter(
          (message) => message.conversationId !== conversationId
        );
        this.handleSetIsMessageIdsEmpty();
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

  openFirstMessageItem() {
    if (
      this.queryTaskId &&
      this.queryConversationId &&
      !this.messageList.some(
        (item) =>
          item.id === this.queryTaskId &&
          item.conversationId === this.queryConversationId
      ) &&
      this.messageList?.[0].id
    ) {
      const message = this.messageList.find(
        (item) =>
          item?.id === this.queryTaskId &&
          item?.conversationId === this.queryConversationId
      );
      this.conversationService.triggerAppMessageItem$.next(message);
      this.queryTaskId = this.messageList[0].id;
      this.router.navigate([], {
        queryParams: {
          taskId: this.queryTaskId
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  handleCheckShowSelect() {
    this.sharedMessageViewService.setIsShowSelect(this.messageList.length > 0);
  }

  scrollToElement(
    position: number,
    block: ScrollLogicalPosition = 'center',
    inline: ScrollLogicalPosition = 'start',
    behavior: ScrollBehavior = 'smooth'
  ): void {
    this.scrollTimeOut = setTimeout(() => {
      const scrollElement = this.infiniteScrollView?.nativeElement;
      const targetElement = scrollElement?.children?.[position];
      if (!targetElement) {
        return;
      }
      targetElement.scrollIntoView({
        block,
        inline,
        behavior
      });
    }, 200);
  }

  onScrollToTop() {
    if (this.showSpinnerTop) return;
    this.store.dispatch(smsMessagePageActions.prevPage());
  }

  onScrollToBottom() {
    if (this.showSpinnerBottom || this.messageList?.length >= this.totalMessage)
      return;
    this.store.dispatch(smsMessagePageActions.nextPage());
  }

  handleMapMessageList(
    messages: TaskItem[],
    selectedIds?: Map<string, boolean>
  ): TaskItem[] {
    if (!selectedIds) return messages ?? [];
    return messages.map((message) => ({
      ...message,
      isSelected: Boolean(selectedIds.get(message?.conversationId))
    }));
  }

  handleMenuChange(event: {
    message: TaskItem;
    option: EMessageMenuOption;
    isTriggeredFromRightPanel?: boolean;
    isTriggeredFromToolbar?: boolean;
    messageIds?: string[];
    conversationIds?: string[];
  }) {
    const { message, option, isTriggeredFromToolbar } = event;
    switch (option) {
      case EMessageMenuOption.RESOLVE:
        if (!isTriggeredFromToolbar) {
          this.confirmResolveSms = true;
          this.currentMessage = message;
        }
        break;

      case EMessageMenuOption.READ:
        this.handleMarkAsUnread(message, EMessageMenuOption.READ);
        break;
      case EMessageMenuOption.UNREAD:
        this.handleMarkAsUnread(message, EMessageMenuOption.UNREAD);
        break;

      case EMessageMenuOption.UN_FLAG:
      case EMessageMenuOption.FLAG:
        this.handleFlagUrgent(message, option);
        break;

      case EMessageMenuOption.SAVE_TO_RENT_MANAGER:
        this.handleSaveToRm(message);
        break;

      case EMessageMenuOption.SAVE_TO_PROPERTY_TREE:
        this.handleSaveToPT(message);
        break;
      case EMessageMenuOption.DOWNLOAD_AS_PDF:
        this.handleSaveToPT(message, true);
        break;
    }
  }

  handleCancelModal() {
    this.confirmResolveSms = false;
  }

  handleConfirmResolveSms() {
    this.smsMessageMenuService.handleResolveMessage(
      this.currentMessage,
      () => this.handleMessageResolveSuccess(this.currentMessage),
      this.currentConversation
    );
    this.confirmResolveSms = false;
  }

  handleClose() {
    this.isShowPopupAddToTask = false;
  }

  handleMessageResolveSuccess(message: TaskItem) {
    const currentUrlConversationId =
      this.activatedRoute.snapshot.queryParams?.['conversationId'];
    this.removeMessage(message, true);
    this.statisticService.updateStatisticTotalTask(
      this.queryParams[EMessageQueryType.MESSAGE_STATUS],
      -1
    );

    this.conversationService.handleMessageActionTriggered();
    if (message.conversationId === currentUrlConversationId) {
      this.handleSetIsMessageIdsEmpty();
      this.handleCheckShowSelect();
      this.inboxToolbarService.setInboxItem([]);
    }
  }

  private handleMarkAsUnread(message: TaskItem, option: EMessageMenuOption) {
    this.currentMarkUnreadMsgId = message.id;
    this.smsMessageMenuService.handleMessageAction(
      message,
      option === EMessageMenuOption.UNREAD
        ? EConversationAction.MARK_AS_UNREAD
        : EConversationAction.MARK_AS_READ,
      (res: IMarkAsUnreadResponse) => {
        if (option === EMessageMenuOption.READ) {
          this.inboxSidebarService.refreshStatisticsUnreadTask(
            this.currentMailboxId
          );
          this.inboxService.setChangeUnreadData({
            isReadMessage: true,
            previousMessageId: null,
            currentMessageId: null
          });
        }
        this.updateConversationsProperty(
          message,
          EMessageProperty.IS_SEEN,
          res?.isSeen
        );
      }
    );
  }

  private handleFlagUrgent(message: TaskItem, option: EMessageMenuOption) {
    this.smsMessageMenuService.handleMessageAction(
      message,
      EConversationAction.UPDATE_FLAG_URGENT,
      (res: IFlagUrgentMessageResponse) =>
        this.updateConversationsProperty(
          message,
          EMessageProperty.IS_URGENT,
          res?.isUrgent
        )
    );
  }

  private handleSaveToRm(message: TaskItem) {
    const messageResolve = [message];
    this.handleSaveToRmDropdownMenu(messageResolve);
  }

  handleSaveToRmDropdownMenu(messageResolve) {
    if (!messageResolve) return;
    this.syncResolveMessageService.triggerSyncResolveMessage$.next({
      action: EActionSyncResolveMessage.SAVE_TO_RM_DROPDOWN_MENU,
      messageResolve
    });
  }

  handleSaveToPT(message, isDownloadPDFOption = false) {
    if (!message) return;
    this.syncMessagePropertyTreeService.setTriggerSyncMessagePT(
      [message],
      isDownloadPDFOption
    );
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  handleShowWarningMsg(text: string) {
    this.errorMessage = text;
    this.isShowModalWarning = true;
    return;
  }

  removeMessage(message: TaskItem, resolveFunc = false) {
    if (this.queryParams['status'] === TaskStatusType.draft && !resolveFunc)
      return;
    this.messageList = this.messageList.filter(
      (item) => item.conversationId !== message?.conversationId
    );
    this.smsMessageConversationIdSetService.delete(message?.conversationId);
    const currentUrlConversationId =
      this.activatedRoute.snapshot.queryParams?.['conversationId'];
    if (currentUrlConversationId === message?.conversationId) {
      this.router.navigate([], {
        queryParams: {
          taskId: null,
          conversationId: null,
          fromScratch: null
        },
        queryParamsHandling: 'merge'
      });
    }
    this.handleSetIsMessageIdsEmpty();
  }

  updateConversationsProperty(
    message: TaskItem,
    propertyToUpdate: EMessageProperty,
    propertyValue: boolean
  ) {
    const updateConversation =
      this.taskService.currentTask$.value?.conversations?.find(
        (item) => item.id === message.conversationId
      );

    updateConversation &&
      (updateConversation[propertyToUpdate] = propertyValue);

    if (this.taskService.currentTask$.value?.conversations)
      this.taskService.currentTask$.next({
        ...this.taskService.currentTask$.value,
        conversations: [...this.taskService.currentTask$.value?.conversations]
      });
    this.messageList = this.messageList.map((e) =>
      e.id === message.id &&
      (message.conversationId
        ? message.conversationId === e.conversationId
        : true)
        ? {
            ...e,
            conversations: message.conversations.map((conversation) => ({
              ...conversation,
              [propertyToUpdate]: propertyValue
            }))
          }
        : e
    );
  }

  resetSelectedMessage() {
    this.conversationService.selectedConversation.next(null);
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
  }

  handleToastByStatus(status, messageIds?: string[], tasks?: TaskItem[]) {
    this.toastService.clear();

    if (messageIds.length > 1) {
      switch (status) {
        case TaskStatusType.inprogress:
          this.toastService.success(`${messageIds.length} messages reopened`);
          break;
        case TaskStatusType.completed:
          this.toastService.success(`${messageIds.length} messages resolved`);
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

  handleActiveMessage(message: TaskItem) {
    this.messageList = this.messageList.map((messageItem) => {
      if (
        messageItem.id === message.id &&
        messageItem.conversationId === message.conversationId
      ) {
        return {
          ...messageItem,
          conversations: messageItem.conversations.map((conversation) => ({
            ...conversation,
            isSeen: true
          }))
        };
      }
      return messageItem;
    });
    this.conversationService.triggerAppMessageItem$.next(message);
  }

  public get disableDragging() {
    return this.isConsole;
  }

  trackByMessage(_: number, message: TaskItem) {
    return message?.conversationId;
  }

  setItem(messageId?: string, conversationId?: string) {
    this.queryTaskId = messageId;
    this.queryConversationId = conversationId;
  }

  resetRightClickSelectedState() {
    this.nzContextMenuService.close();
    this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
    this.sharedMessageViewService.setRightClickSelectedMessageId('');
  }

  subscribeMailboxSettings() {
    combineLatest([
      this.mailboxSettingService.mailBoxId$,
      this.websocketService.onSocketUpdatePermissionMailBox
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([mailBoxId, socket]) => {
        if (socket.data?.id === mailBoxId) {
          this.teamMembersInMailBox = socket.data?.teamMembers;
        }
      });
  }

  handleSelectedMsg(event) {
    if (this.startIndex === -1) {
      this.startIndex = this.messageList.findIndex(
        (item) =>
          item.id === this.queryTaskId &&
          item?.conversationId === this.queryConversationId
      );
    }
    const isIndexSms = this.router.url.includes('inbox/sms-messages');

    this.activeMsgList = selectedItems(
      event.isKeepShiftCtr,
      this.startIndex,
      event.lastIndex,
      this.activeMsgList,
      this.messageList,
      isIndexSms
    );
  }

  handleAddSelectedMsg(event) {
    const res = addItem(
      event.currentMsgId,
      event.currentMsgIndex,
      this.activeMsgList
    );
    if (res) {
      this.activeMsgList = res.activeItems;
      this.startIndex = res._startIndex;
    }
  }

  handleRemoveActiveMsg(currentMsgId?: string) {
    const { activeItems, _startIndex } = removeActiveItem(
      this.activeMsgList,
      this.startIndex,
      currentMsgId
    );
    this.activeMsgList = activeItems;
    this.startIndex = _startIndex;
  }

  handleNavigateNextMessage() {
    this.handleNavigateMessage(SiblingEnum.nextElementSibling);
  }

  handleNavigatePreMessage() {
    this.handleNavigateMessage(SiblingEnum.previousElementSibling, true);
  }

  handleNavigateMessage(type, navigatePreMessage: boolean = false) {
    const dataSet = this.autoScrollService.findSiblingElement(
      this.infiniteScrollView.nativeElement,
      {
        taskId: this.queryTaskId,
        conversationId: this.queryConversationId,
        type
      }
    );
    this.updateQueryParameters(dataSet);

    this.autoScrollService.scrollToElementSmoothly(dataSet.targetElement, {
      navigatePreMessage,
      delay: 300,
      delayCallback: 300,
      callback: () =>
        this.handleNavigateMessageDetail({
          ...dataSet
        })
    });
  }

  private updateQueryParameters(dataSet) {
    if (dataSet?.conversationId && dataSet?.taskId) {
      this.queryConversationId = dataSet.conversationId;
      this.queryTaskId = dataSet.taskId;
      this.cdr.markForCheck();
    }
  }

  handleNavigateMessageDetail(data: {
    taskId: string;
    conversationId: string;
    isScratchDraft?: boolean;
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
        queryParams: {
          taskId: data.taskId,
          conversationId: data.conversationId,
          appMessageCreateType: data.isScratchDraft
            ? EAppMessageCreateType.NewAppMessage
            : null
        },
        queryParamsHandling: 'merge'
      })
      .then(() => {
        this.messageTaskLoadingService.onLoading();
        this.taskService.triggerOpenMessageDetail.next(data.taskId);
        this.smsMessageConversationIdSetService.setIsMessageIdsEmpty(false);
        isReset && this.taskService.setSelectedConversationList([]);
      });
  }

  subscribeMarkReadAndUnread() {
    this.conversationService.conversationChangeAction
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ({
          taskId,
          propertyToUpdate,
          propertyValue,
          conversationId
        }: IConversationAction) => {
          const message = this.messageList.find(
            (m) => m.id === taskId && m.conversationId === conversationId
          );
          this.updateConversationsProperty(
            message,
            propertyToUpdate,
            propertyValue
          );
        }
      );
  }

  subscribeInboxItem() {
    combineLatest([
      this.inboxToolbarService.filterInboxList$,
      this.inboxToolbarService.inboxItem$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([filterInboxList, inboxItem]) => {
        if (
          !inboxItem?.length &&
          !filterInboxList &&
          !!this.activeMsgList?.length
        ) {
          this.handleRemoveActiveMsg();
        }
      });
  }

  ngOnDestroy() {
    this.store.dispatch(smsMessagePageActions.exitPage());
    this.smsMessageConversationIdSetService.clear();
    this.messageTaskLoadingService.stopFullLoading();
    this.refreshMessageSubject$.complete();
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.scrollTimeOut);
  }
}
