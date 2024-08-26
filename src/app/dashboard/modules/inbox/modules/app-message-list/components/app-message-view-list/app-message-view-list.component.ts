import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren
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
  map
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
import { CONVERSATION_STATUS, ErrorMessages } from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { LoadingService } from '@services/loading.service';
import { MOVE_MESSAGE_TO_FOlDER } from '@services/messages.constants';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { TaskService } from '@services/task.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
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
import { CurrentUser, IUserParticipant } from '@shared/types/user.interface';
import {
  checkScheduleMsgCount,
  getUserFromParticipants
} from '@/app/trudi-send-msg/utils/helper-functions';
import { isEqual, cloneDeep } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import { UserPropInSelectPeople } from '@shared/types/user.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { PropertiesService } from '@services/properties.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { AppMessageViewItemComponent } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-message-item/app-message-item.component';
import { MessageConversationIdSetService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/message-id-set.service';
import { EMessageStatusFilter } from '@shared/components/filter-by-status/filter-status-box/filter-status-box.component';
import {
  EAppMessageCreateType,
  EPopupConversionTask
} from '@/app/dashboard/modules/inbox/modules/app-message-list/enum/message.enum';
import { DeliveryFailedMessageStorageService } from '@services/deliveryFailedMessageStorage.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { HeaderService } from '@services/header.service';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/message-task-loading.service';
import { ISelectedCalendarEventId } from '@shared/types/calendar.interface';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { UserConversationOption } from '@/app/mailbox-setting/utils/out-of-office.interface';
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
import { ESendMessageType } from '@shared/enum/send-message-type.enum';
import {
  IListConversationConfirmProperties,
  IListConvertMultipleTask
} from '@shared/types/conversation.interface';
import { CompanyService } from '@services/company.service';
import { Store } from '@ngrx/store';
import {
  appMessagePageActions,
  selectAllAppMessage,
  selectFetchingMessage,
  selectFetchingMoreMessage,
  selectMessagePayload,
  selectTotalMessage
} from '@core/store/app-message';
import { appMessageActions } from '@core/store/app-message/actions/app-message.actions';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { AppMessageApiService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-api.service';
import { AppMessageMenuService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-menu.service';
import { AppMessageListService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-list.service';
import { EConversationType, ETrudiType } from '@shared/enum';
import { IParticipant as IParticipantConversation } from '@shared/types/conversation.interface';
import { AppMessageLoadingService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-loading.service';
import { ITempConversation } from '@/app/dashboard/modules/inbox/interfaces/conversation.interface';
import { IAppTriggerSendMsgEvent } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/app-compose-message.component';
import {
  ESentMsgEvent,
  ISendMsgResponseV2
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  AutoScrollService,
  SiblingEnum
} from '@/app/dashboard/modules/inbox/services/auto-scroll.service';
import { HelperService } from '@services/helper.service';
import { EConversationStatus } from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';
import { LAST_MSG_TYPE_EXCLUDED } from '@/app/dashboard/modules/inbox/constants/constants';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';

@Component({
  selector: 'app-message-view-list',
  templateUrl: './app-message-view-list.component.html',
  styleUrls: ['./app-message-view-list.component.scss'],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
@DestroyDecorator
export class AppMessageViewListComponent implements OnInit, OnDestroy {
  @Input() activeMobileApp: boolean;
  @ViewChildren(AppMessageViewItemComponent)
  queryList: QueryList<AppMessageViewItemComponent>;

  @ViewChild('infiniteScrollView')
  infiniteScrollView: ElementRef<HTMLElement>;
  @ViewChild('infiniteScrollIndex')
  infiniteScrollIndex: ElementRef<HTMLElement>;

  public readonly viewDetailMode = EViewDetailMode;
  public readonly messagesStatusType = TaskStatusType;
  public readonly mailBoxStatus = EMailBoxStatus;
  private _messageList: TaskItem[] = [];
  private selectMessageIdMap: Map<string, boolean> = new Map();

  // setter for messageList dispatch
  public set messageList(value: TaskItem[]) {
    this.store.dispatch(
      appMessageActions.setAll({
        messages: value
      })
    );
  }
  // getter for messageList
  get messageList() {
    return this._messageList;
  }

  public isLoading: boolean = false;
  public moveConversationState = false;
  public taskList: TaskListMove[];
  public isUnHappyPath = false;
  public isShowAddressMoveConversation = false;
  public popupModalPosition = ModalPopupPosition;
  public conversationForward: UserConversationOption;
  public targetConversationId: string;
  public hasInboxContentMargin = false;
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

  // after a message is auto focused, this flag should be false
  public isShowLine: boolean = false;
  public isDistinctScroll: boolean = false;
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
  get isSelectedMove() {
    return this.inboxToolbarService.hasItem;
  }
  //#region private property
  private readonly destroy$ = new Subject<void>();
  private readonly refreshMessageSubject$ = new Subject();
  private pageLimit = LIMIT_TASK_LIST;
  private scrollTimeOut: NodeJS.Timeout = null;
  private queryParams: Params = {};
  private payloadMessage = {} as IMessageQueryParams;
  private companyId: string;
  private currentUser: CurrentUser;
  private currentTotalCount: number;
  private currentMailboxId: string;
  private teamMembersInMailBox: number;
  private statusMailBox: EMailBoxStatus;
  private datePipe: DatePipe;
  private shouldAutoScrollToMessage: boolean = true;
  private conversationScheduleIdNeedToSkip: string;
  private get loadingMore() {
    return this.showSpinnerTop || this.showSpinnerBottom;
  }
  private set loadingMore(value: boolean) {
    this.showSpinnerTop = value;
    this.showSpinnerBottom = value;
  }
  private isPreventScrollToTop: boolean = false;
  public countSelected: number = 0;
  public isHiddenMessageTypeCallFile = false;
  public isAppMessageLog = false;
  //#endregion
  public totalMessage = 0;

  public tempConversations: ITempConversation[] = [];
  public TaskType = TaskType;
  private isResolving: boolean = false;
  private isReopening: boolean = false;

  constructor(
    private readonly appMessageApiService: AppMessageApiService,
    private readonly agencyService: AgencyService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly statisticService: StatisticService,
    private readonly router: Router,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly websocketService: RxWebsocketService,
    private readonly taskService: TaskService,
    private readonly conversationService: ConversationService,
    private readonly appMessageMenuService: AppMessageMenuService,
    private readonly messageConversationIdSetService: MessageConversationIdSetService,
    private readonly toastService: ToastrService,
    private readonly userService: UserService,
    private readonly inboxSidebarService: InboxSidebarService,
    private readonly inboxFilterService: InboxFilterService,
    private readonly agencyDateFormatService: AgencyDateFormatService,
    private readonly cdr: ChangeDetectorRef,
    private readonly deliveryFailedMessageStorageService: DeliveryFailedMessageStorageService,
    private readonly headerService: HeaderService,
    private readonly syncResolveMessageService: SyncResolveMessageService,
    private readonly sharedMessageViewService: SharedMessageViewService,
    private readonly messageTaskLoadingService: MessageTaskLoadingService,
    private readonly renderer: Renderer2,
    private readonly mailboxSettingService: MailboxSettingService,
    private readonly propertiesService: PropertiesService,
    private readonly loadingService: LoadingService,
    private readonly nzContextMenuService: NzContextMenuService,
    private readonly elementRef: ElementRef,
    private readonly sharedService: SharedService,
    private readonly toastCustomService: ToastCustomService,
    private readonly companyService: CompanyService,
    private readonly store: Store,
    public readonly inboxService: InboxService,
    private readonly autoScrollService: AutoScrollService,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private appMessageListService: AppMessageListService,
    private appMessageLoadingService: AppMessageLoadingService,
    private route: ActivatedRoute,
    private helperService: HelperService,
    private conversationSummaryService: ConverationSummaryService
  ) {}

  get isCreateNewMessage() {
    return this.appMessageListService.isCreateNewMessage$;
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

  onTempConversations() {
    this.conversationService.tempConversations
      .pipe(takeUntil(this.destroy$))
      .subscribe((conversations) => {
        this.tempConversations = conversations;
        this.cdr.markForCheck();
      });
  }

  onTriggerSendMessage() {
    this.conversationService.triggerSendMessage
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.handleCreateNewMsg(event);
      });
  }

  ngOnInit(): void {
    this.onTempConversations();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.onStoreChange();
    this.refreshMessageSubject$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged(isEqual))
      .subscribe((rs) => {
        this.store.dispatch(
          appMessagePageActions.payloadChange({ payload: rs['payload'] })
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

    this.onQueryAndFilterChanged();
    this.subscribeFilterInboxList();
    this.subscribeFilterMessageList();
    this.subscribeSetup();
    this.subscribeCurrentCompany();
    this.subscribeMailboxSettings();
    this.subscribeInboxItem();
    this.onMessageScheduled();
    this.onTriggerSendMessage();
    this.triggerCreateConversationApp();
    // handle socket
    this.subscribeSyncStatusMessageList();
    this.subscribeConversationAction();
    this.subscribeMessageSocket();
    this.subscribeSeenConversationSocket();
    this.subscribeSkeletonMessage();
    this.subscribeDeleteDraft();
    this.subscribeDeleteSecondaryEmail();
    this.subscribeSocketAssignContact();
    this.subscribeMarkReadAndUnread();
    this.subscribeGoToAppMessage();
    this.subscribeUpdateCountTicket();
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
    this.inboxService.isOpenPopupAddToTaskBySingleMessage
      .pipe(takeUntil(this.destroy$))
      .subscribe((isVisible) => {
        this.isShowPopupAddToTask = isVisible;
      });
    this.getAppMessageLog();
  }

  private subscribeSocketPmJoinConverstation() {
    // Note: handle PM Join Conversation of message
    this.websocketService.onSocketPmJoinConversation
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { taskId, conversationId, isPmJoined } = res;
        this.updateMessageList(
          'isPmJoined',
          isPmJoined,
          taskId,
          conversationId
        );
      });
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

  handleCreateNewMsg(event: IAppTriggerSendMsgEvent) {
    if (event.event !== ESentMsgEvent.SUCCESS) return;
    const data = event.data as ISendMsgResponseV2;
    const { task, conversation } = data;
    this.conversationService.setCreateConversationApp({
      taskId: task.id,
      conversationId: conversation.id,
      taskStatus: task.status,
      createFromScratch: true,
      callback: (data) => {
        this.conversationService.removeLoadingNewMsg(event.tempConversationId);
        this.conversationService.filterTempConversations(
          (item) => item.id !== event.tempConversationId,
          'APP_MESSAGE_VIEW_LIST'
        );
        if (
          this.activatedRoute.snapshot.queryParams['appMessageCreateType'] !==
          EAppMessageCreateType.NewAppMessageDone
        ) {
          return;
        }

        const queryParams = {
          conversationId: data.conversationId,
          taskId: data.taskId,
          appMessageCreateType: null
        };
        if (data.taskStatus !== TaskStatusType.completed) {
          queryParams['status'] = data.taskStatus || null;
          queryParams['fromScratch'] = true;
        } else {
          queryParams['status'] = TaskStatusType.inprogress;
          queryParams['fromScratch'] = null;
        }
        this.router.navigate(['/dashboard/inbox/app-messages'], {
          queryParams,
          queryParamsHandling: 'merge'
        });
      }
    });
  }

  getAppMessageLog() {
    this.conversationService.triggerAppMessageItem$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.isAppMessageLog =
          res?.conversations?.[0]?.isAppMessageLog || res?.isAppMessageLog;
      });
  }

  subscribeGoToAppMessage() {
    this.conversationService.triggerGoToAppMessage$
      .pipe(takeUntil(this.destroy$), delay(200))
      .subscribe(() => {
        const messageIndex = this.messageList?.findIndex(
          (item) => item.id === this.queryTaskId
        );
        if (messageIndex >= 0) {
          this.scrollToElement(messageIndex, 'start');
          return;
        } else {
          this.shouldAutoScrollToMessage = true;
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
    const messages$ = this.store.select(selectAllAppMessage).pipe(
      tap((messages) => {
        this._messageList = this.handleMapMessageList(
          messages,
          this.selectMessageIdMap
        );
        this.cdr.markForCheck();
      })
    );
    const payload$ = this.store.select(selectMessagePayload);
    const fetching$ = this.store
      .select(selectFetchingMessage)
      .pipe(
        tap(
          (fetching) =>
            this.isLoading !== fetching && (this.isLoading = fetching)
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
    this.websocketService.onSocketAssignContact
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (this.messageList?.some((message) => message.id === res.taskId)) {
          this.messageList = this.messageList.map((message) => {
            if (message.id === res?.taskId) {
              return {
                ...message,
                conversations: [
                  {
                    ...message.conversations[0],
                    participants: res.participants
                  }
                ]
              };
            }
            return message;
          });
        }
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

          // NOTE: handle back message (task) list when we click on sidebar inbox item (in case filter)
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
            this.payloadMessage = this.mapPayloadMessageList(
              this.queryParams,
              this.teamMembersInMailBox <= 1,
              {
                selectedInboxType,
                selectedPortfolio,
                selectedAgency,
                selectedStatus
              }
            );

            this.handleSetIsMessageIdsEmpty();
            this.inboxService.setImportEmailId(null);
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
      filter(() => this.router.url.includes('inbox/app-messages')),
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
          importEmailId,
          ,
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
    this.messageConversationIdSetService.clear();
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

  private handleSetIsMessageIdsEmpty() {
    if (!this.messageList?.length) {
      this.messageConversationIdSetService.setIsMessageIdsEmpty(true);
      return;
    }
    const focusMessageIndex = this.getFocusMessageIndex(this.messageList);
    this.messageConversationIdSetService.setIsMessageIdsEmpty(
      focusMessageIndex === -1
    );
  }

  /**
   * get the index of the message that needs to be focused
   * @param messages list of messages
   * @returns index of the message that needs to be focused
   */
  private getFocusMessageIndex(messages: TaskItem[]) {
    const messageStatus =
      this.activatedRoute.queryParamMap[EMessageQueryType.MESSAGE_STATUS];
    const taskId = this.queryTaskId;
    switch (messageStatus) {
      case TaskStatusType.draft:
        const conversationId = this.queryConversationId;
        // the messageId is not unique in the draft folder, so we need to check both messageId and conversationId
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
    // if current page is not the first page and the messages's length is less than the limit
    // mean that we have reached the last page,
    // so we need to load previous page to make the list scrollable
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
        this.handleMenuChange({
          message: messageToChange,
          option: conversationAction.option as EMessageMenuOption,
          isTriggeredFromRightPanel: Boolean(
            conversationAction.isTriggeredFromRightPanel
          ),
          isTriggeredFromToolbar: Boolean(
            conversationAction.isTriggeredFromToolbar
          ),
          messageIds: conversationAction.messageIds,
          conversationIds: conversationAction.conversationIds
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
        const { isSeen, conversations, isBulkSeen, taskId, conversationId } =
          res;
        if (res?.userId && res?.userId === this.currentUser.id) {
          return;
        }
        if (isBulkSeen) {
          let listMessageUpdate = [...this.messageList];
          conversations.forEach((conversation) => {
            if (
              this.messageConversationIdSetService.has(
                conversation.conversationId
              )
            ) {
              listMessageUpdate = listMessageUpdate.map((msg) => {
                if (
                  msg.id === conversation.taskId &&
                  msg.conversationId === conversation.conversationId
                ) {
                  return {
                    ...msg,
                    conversations: msg.conversations.map((it) => ({
                      ...it,
                      [EMessageProperty.IS_SEEN]: isSeen
                    }))
                  };
                }
                return msg;
              });
              this.inboxToolbarService.updateInboxItem(
                [conversation.taskId],
                EMessageProperty.IS_SEEN,
                isSeen
              );
            }
          });
          this.updateCurrentTask(EMessageProperty.IS_SEEN, isSeen);
          this.messageList = listMessageUpdate;
        } else {
          if (this.messageConversationIdSetService.has(conversationId)) {
            this.updateCurrentTask(EMessageProperty.IS_SEEN, isSeen);
            this.updateMessageList(
              EMessageProperty.IS_SEEN,
              isSeen,
              taskId,
              conversationId
            );
            this.inboxToolbarService.updateInboxItem(
              [taskId],
              EMessageProperty.IS_SEEN,
              isSeen
            );
          }
        }
      });
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
  }

  updateMessageList(
    propertyToUpdate: string,
    propertyValue: boolean | number,
    taskId: string,
    conversationId: string
  ) {
    this.messageList = this.messageList.map((msg) => {
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

  subscribeDeleteDraft() {
    this.websocketService.onSocketDeleteDraft
      .pipe(delay(500), takeUntil(this.destroy$))
      .subscribe((res) => {
        if (
          this.router.url?.includes(ERouterLinkInbox.APP_MESSAGES_DRAFT) &&
          !res.hasRemainingDraft
        ) {
          this.removeConversationDraft(res?.taskId, res?.conversationId);
          return;
        }

        const taskIndex = this.messageList.findIndex(
          (task) =>
            task.id === res.taskId && task.conversationId === res.conversationId
        );
        const task = { ...this.messageList[taskIndex] };

        this.handleReceivedDataForConversations(res, task, taskIndex);
      });
  }

  subscribeDeleteSecondaryEmail() {
    this.websocketService.onSocketDeleteSecondaryContact
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const taskIndex = this.messageList.findIndex(
          (task) => task.id === res.taskId
        );
        const task = { ...this.messageList[taskIndex] };

        let conversation = task.conversations?.[0];
        conversation = {
          ...conversation,
          participants: res.participants
        };
        task.conversations = task.conversations.map((item) => {
          if (item.id === conversation.id) return conversation;
          else return item;
        });

        this.messageList[taskIndex] = cloneDeep(task);

        if (
          res.participants &&
          this.activatedRoute.snapshot.queryParams['taskId'] === res.taskId
        ) {
          this.updateCurrentTask(
            'participants',
            res.participants as IUserParticipant[]
          );
          this.taskService.reloadTaskDetail.next(true);
        }
      });
  }

  subscribeMessageSocket() {
    this.websocketService.onSocketMessage
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res.type === SocketType.newMessages),
        debounceTime(1000),
        filter(
          (res) =>
            res &&
            res.companyId === this.companyId &&
            res.mailBoxId === this.currentMailboxId &&
            this.queryParams[EMessageQueryType.MESSAGE_STATUS] !==
              TaskStatusType.draft
        ),
        tap((res) => (this.dataMessageSocket = res))
      )
      .subscribe((res) => this.handleCreateNewMessagesRealTime(res));
    this.websocketService.onSocketMessage
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (
          (res.isAutoReopen && res.fromUserId === this.currentUser?.id) ||
          res.isAutoReopenedByPM
        )
          return;
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

    this.websocketService.onSocketVoiceCall
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        if (res.taskId) {
          const taskIndex = this.messageList.findIndex(
            (task) =>
              task.id === res.taskId &&
              (res?.conversationId
                ? res.conversationId === task.conversationId
                : true)
          );
          const task = { ...this.messageList[taskIndex] };

          if (task && task.conversations && task.conversations.length) {
            this.handleReceivedDataForConversations(res, task, taskIndex);
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

        // remove message from draft page
        if (
          !res.isDraft &&
          this.isDraftFolder &&
          !this.lastMessageTypeExcluded.includes(
            res.messageType as EMessageType
          )
        ) {
          this.removeConversationDraft(task.id, task.conversationId);
          return;
        }

        const currentTask = this.taskService.currentTask$.value;
        const newAgents = res?.assignToAgents?.[0];
        if (
          newAgents &&
          currentTask &&
          !currentTask.assignToAgents?.find(
            (agent) => agent.id === newAgents.id
          ) &&
          currentTask?.id === res.taskId
        ) {
          this.taskService.currentTask$.next({
            ...currentTask,
            assignToAgents: [...currentTask.assignToAgents, newAgents]
          });
        }

        if (res.messageType === ETrudiType.ticket) {
          this.messageList.forEach((item) => {
            if (item.conversationId === res.conversationId) {
              item.conversations[0].isHasTicketSession = true;
            }
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

        // update message in conversation
        this.handleReceivedDataForConversations(res, task, taskIndex);
      });
  }

  private removeConversationDraft(
    taskId: string,
    conversationId: string
  ): boolean {
    const index = this.messageList.findIndex(
      (task) => task.id === taskId && task.conversationId === conversationId
    );
    const isDraftPage =
      this.router.url?.includes(ERouterLinkInbox.APP_MESSAGES_DRAFT) &&
      index !== -1;

    if (isDraftPage) {
      this.messageList = this.messageList.filter(
        (task) => task.id !== taskId || task.conversationId !== conversationId
      );
      this.handleSetIsMessageIdsEmpty();
      this.cdr.markForCheck();

      if (
        this.activatedRoute?.snapshot?.queryParams?.[
          EInboxFilterSelected.TASK_ID
        ] === taskId &&
        conversationId ===
          this.activatedRoute?.snapshot?.queryParams?.[
            EInboxFilterSelected.CONVERSATION_ID
          ]
      ) {
        this.router.navigate([], {
          queryParams: {
            taskId: null,
            conversationId: null,
            appMessageCreateType: null
          },
          queryParamsHandling: 'merge'
        });
      }
    }

    return isDraftPage;
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
      ((res as SocketSendData)?.conversationType === EConversationType.APP &&
        (res as SocketSendData).isDraft)
    ) {
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

    this.messageList = [...sortMsgList];
    if (task.id === this.taskService.currentTask$.value?.id) {
      res.messageDate && this.updateCurrentTask('messageDate', res.messageDate);

      res.participants &&
        this.updateCurrentTask(
          'participants',
          res.participants as IUserParticipant[]
        );
    }

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

  private handleTotalMessage(conversation, res) {
    this.socketSendData = res;
    conversation.totalMessages =
      res.totalMessages ?? conversation.totalMessages;
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
        ].includes(res.messageType) ||
        (res.isDraft && !this.isDraftFolder)
          ? conversation.messageDate
          : res?.messageDate || conversation.messageDate,
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
      isUrgent:
        this.getUrgentTicket(res) || res?.isUrgent || conversation.isUrgent,
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
      participants: res.participants
        ? res.participants
        : conversation.participants,
      title: res.title || res.title === '' ? res.title : conversation.title,
      attachmentCount: res.attachmentCount ?? conversation.attachmentCount,
      countUnreadTicket: this.getCountUnreadTicket(res, conversation)
    };
  }

  private getUrgentTicket(res) {
    if (res?.messageType !== 'ticket') return null;
    let option;
    try {
      option = JSON.parse(res.options);
    } catch (error) {
      option = {};
    }

    return option?.response?.payload?.ticket?.isUrgent || false;
  }

  private getCountUnreadTicket(res, conversation) {
    if (res?.messageType !== 'ticket') return conversation.countUnreadTicket;

    return conversation.countUnreadTicket + 1;
  }

  private isObjectNull(obj) {
    return Object.values(obj).some((x) => x !== null && x !== '');
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

    this.statisticService.statisticTotalTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) this.currentTotalCount = res;
      });

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
      message?.assignToAgents?.every((agent) => {
        return agent.id !== this.currentUser.id;
      }) &&
      this.messageList.some((item) => item.id === message.id);
    const currentUrlTaskId =
      this.activatedRoute.snapshot.queryParams?.['taskId'];
    if (message.id === currentUrlTaskId) {
      this.taskService.currentTask$.next(message);
    }
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

  handleCreateNewMessagesRealTime(data) {
    // TODO: handle apply filter
    if (
      this.queryParams[EInboxFilterSelected.SEARCH] ||
      !!this.queryParams[EInboxFilterSelected.ASSIGNED_TO]?.length ||
      !!this.queryParams[EInboxFilterSelected.PROPERTY_MANAGER_ID]?.length
    ) {
      return;
    }

    const status = data.isResolveConversation
      ? TaskStatusType.completed
      : this.router.url?.includes(ERouterLinkInbox.APP_MESSAGES_DRAFT)
      ? TaskStatusType.draft
      : TaskStatusType.inprogress;

    if (status === this.queryParams[EMessageQueryType.MESSAGE_STATUS]) {
      this.conversationScheduleIdNeedToSkip = data?.conversationIds?.[0];
      this.fetchAndMergeNewMessages(data);
      if (this.statusMailBox !== EMailBoxStatus.SYNCING)
        this.inboxSidebarService.refreshStatisticsUnreadTask(
          this.currentMailboxId
        );
    }
  }

  handleChangeStatusMessageRealtime(data) {
    const { status } = this.queryParams;

    if (status !== TaskStatusType.draft && status !== data.newStatus) {
      this.removeMessagesByConversationId(
        data?.conversationIds || [data.conversationId]
      );
    }

    if (this.currentMailboxId === data.mailBoxId) {
      this.fetchAndMergeNewMessages(data);
    }
  }

  removeMessagesByConversationId(conversationIds: string[]) {
    conversationIds.forEach((conversationId) => {
      if (this.messageConversationIdSetService.has(conversationId)) {
        this.messageConversationIdSetService.delete(conversationId);
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

  private fetchAndMergeNewMessages(data, isCreateNewConversation = false) {
    let payload = this.mapPayloadMessageList(
      this.queryParams,
      this.teamMembersInMailBox <= 1
    );
    if (isCreateNewConversation) {
      payload = { ...payload, status: TaskStatusType.draft };
    } else {
      this.isPreventScrollToTop = true;
    }
    if (!data?.taskIds && !data?.taskId) return;
    const getMessagePayload = data.taskIds ?? [data?.taskId];
    this.appMessageApiService
      .getNewAppMessages(payload, getMessagePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.tasks) {
          this.messageList = this.pushAndReplaceMessages(
            this.messageList,
            res.tasks.map((item) => ({
              ...item,
              messageDate: item.conversations?.[0]?.messageDate
            }))
          );
          this.statisticService.updateStatisticTotalTask(
            this.queryParams[EMessageQueryType.MESSAGE_STATUS],
            +Number(res?.totalTask)
          );
          if (
            !!this.messageList?.length &&
            !this.sharedMessageViewService.isShowSelectValue
          ) {
            this.sharedMessageViewService.setIsShowSelect(true);
          }
          this.handleSetIsMessageIdsEmpty();
          this.navigateNewScheduleMsg(data);
          if (isCreateNewConversation) {
            if (data.callback) {
              this.conversationService.dispatchTempMessage(res.tasks[0]);
              data.callback(data);
            } else {
              this.router
                .navigate([], {
                  queryParams: {
                    conversationId: data.conversationId,
                    taskId: data.taskId,
                    appMessageCreateType: null,
                    status: data.taskStatus || null
                  },
                  queryParamsHandling: 'merge'
                })
                .then(() => {});
            }
            this.appMessageListService.triggerSaveDraftFirstReply.next(true); // trigger draft save
            this.appMessageListService.triggerAutoGenChatGpt$.next(true);
          }
        }
      });
  }

  private fetchAndMergeScratchMessage(data) {
    let payload = this.mapPayloadMessageList(
      this.queryParams,
      this.teamMembersInMailBox <= 1
    );
    payload = {
      ...payload,
      status: data.taskStatus
    };
    if (!data?.taskIds && !data?.taskId) return;
    const getMessagePayload = data.taskIds ?? [data?.taskId];
    this.appMessageApiService
      .getNewAppMessages(payload, getMessagePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.tasks) {
          if (
            data.taskStatus ===
            this.queryParams[EMessageQueryType.MESSAGE_STATUS]
          ) {
            this.messageList = this.pushAndReplaceMessages(
              this.messageList,
              res.tasks
            );
          }
          this.conversationService.triggerGoToAppMessage$.next(true);
          this.statisticService.updateStatisticTotalTask(
            this.queryParams[EMessageQueryType.MESSAGE_STATUS],
            +Number(res?.totalTask)
          );
          if (
            !!this.messageList?.length &&
            !this.sharedMessageViewService.isShowSelectValue
          ) {
            this.sharedMessageViewService.setIsShowSelect(true);
          }
          this.handleSetIsMessageIdsEmpty();
          const statusLinkMap = {
            [TaskStatusType.inprogress]: 'all',
            [TaskStatusType.draft]: 'draft',
            [TaskStatusType.completed]: TaskStatusType.resolved.toLowerCase()
          };
          const status = statusLinkMap[data.taskStatus];
          if (data.callback) {
            data.callback(data);
          } else {
            this.router
              .navigate(['/dashboard/inbox/app-messages', status], {
                queryParams: {
                  conversationId: data.conversationId,
                  taskId: data.taskId,
                  appMessageCreateType: null,
                  status: data.taskStatus || null
                },
                relativeTo: this.route,
                queryParamsHandling: 'merge'
              })
              .then(() => {});
          }
        }
      });
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
    this.store.dispatch(appMessagePageActions.prevPage());
  }

  onScrollToBottom() {
    if (this.showSpinnerBottom) return;
    this.store.dispatch(appMessagePageActions.nextPage());
  }

  handleRemove(messageId?: string) {
    if (messageId && messageId !== this.currentMarkUnreadMsgId) {
      this.messageList = [...this.messageList].filter(
        (it) => it.id !== messageId
      );
      this.statisticService.setStatisticTotalTask({
        type: this.queryParams[EMessageQueryType.MESSAGE_STATUS],
        value: this.currentTotalCount ? this.currentTotalCount - 1 : 0
      });
    }
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
    const {
      message,
      option,
      isTriggeredFromRightPanel,
      isTriggeredFromToolbar,
      conversationIds
    } = event;
    const handleActionFromToolbarIfNeeded = (option?: EMessageMenuOption) => {
      if (isTriggeredFromToolbar) {
        this.handleActionFromToolbar(option, conversationIds);
        return true;
      }
      return false;
    };
    switch (option) {
      case EMessageMenuOption.REOPEN:
        if (handleActionFromToolbarIfNeeded()) return;

        if (!isTriggeredFromRightPanel) {
          if (!this.isReopening) {
            this.isReopening = true;
            this.appMessageMenuService.handleReOpenMessage(
              message,
              () => {
                this.handleReopenCallback(message);
                this.handleSetIsMessageIdsEmpty();
                this.handleCheckShowSelect();
              },
              (status: boolean) => (this.isReopening = status)
            );
          }

          return;
        }
        this.handleReopenCallback(message);
        this.handleSetIsMessageIdsEmpty();
        break;

      case EMessageMenuOption.RESOLVE:
        if (handleActionFromToolbarIfNeeded()) return;
        if (checkScheduleMsgCount(message.conversations)) {
          this.handleShowWarningMsg(ErrorMessages.RESOLVE_CONVERSATION);
          return;
        }
        if (this.isResolving) return;
        this.isResolving = true;
        this.appMessageMenuService.handleResolveMessage(
          message,
          () => {
            this.handleMessageResolveSuccess(message);
          },
          (status: boolean) => (this.isResolving = status)
        );
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

      default:
        break;
    }
  }

  private handleReopenCallback(message: TaskItem) {
    this.removeMessage(message);
    this.conversationService.handleMessageActionTriggered();
    this.statisticService.updateStatisticTotalTask(
      this.queryParams[EMessageQueryType.MESSAGE_STATUS],
      -1
    );
  }
  handleClose() {
    this.isShowPopupAddToTask = false;
  }
  handleMessageResolveSuccess(message: TaskItem) {
    const currentUrlConversationId =
      this.activatedRoute.snapshot.queryParams?.['conversationId'];
    this.removeMessage(message);
    this.statisticService.updateStatisticTotalTask(
      this.queryParams[EMessageQueryType.MESSAGE_STATUS],
      -1
    );

    this.conversationService.handleMessageActionTriggered();
    if (message.conversationId === currentUrlConversationId) {
      this.handleSetIsMessageIdsEmpty();
      this.handleCheckShowSelect();
      this.inboxToolbarService.setInboxItem([]);
      this.conversationService.reloadConversationList.next(true);
      this.loadingService.stopLoading();
    }
  }

  private handleMarkAsUnread(message: TaskItem, option: EMessageMenuOption) {
    this.currentMarkUnreadMsgId = message.id;
    this.appMessageMenuService.handleMessageAction(
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
    this.appMessageMenuService.handleMessageAction(
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

  handleActionFromToolbar(
    option: EMessageMenuOption,
    conversationIds: string[]
  ) {
    switch (option) {
      default:
        this.messageList = this.messageList.filter(
          (messageItem) =>
            !conversationIds.includes(messageItem?.conversationId)
        );
        break;
    }

    this.handleSetIsMessageIdsEmpty();
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

  getFirstMessDiffAgentJoin(listSortMessage) {
    return listSortMessage.find(
      (mess) => mess.messageType !== EMessageType.agentJoin
    );
  }

  mapPayloadMessageList(
    queryParams: Params,
    ignoreParams: boolean = false,
    state?: any
  ): IMessageQueryParams {
    const isConsole = this.sharedService.isConsoleUsers();
    const type = isConsole
      ? TaskStatusType.team_task
      : state?.selectedInboxType || queryParams[EMessageQueryType.INBOX_TYPE];
    const status = queryParams[EMessageQueryType.MESSAGE_STATUS];

    const assignedTo =
      !ignoreParams && type === GroupType.TEAM_TASK
        ? state?.selectedAgency?.length > 0
          ? state.selectedAgency
          : queryParams[EInboxFilterSelected.ASSIGNED_TO] || ''
        : [];

    const queryMessageStatus =
      state?.selectedStatus?.length > 0
        ? state.selectedStatus
        : queryParams[EInboxFilterSelected.MESSAGE_STATUS];
    const messageStatus = Array.isArray(queryMessageStatus)
      ? queryMessageStatus
      : queryMessageStatus
      ? [queryMessageStatus]
      : [];

    const taskDeliveryFailIds = (
      messageStatus.includes(EMessageStatusFilter.DELIVERY_FAILED)
        ? this.deliveryFailedMessageStorageService.getDeliveryFailedMessageTaskIds()
        : []
    ) as string[];

    const propertyManagerId =
      state?.selectedPortfolio?.length > 0
        ? state.selectedPortfolio
        : queryParams[EInboxFilterSelected.PROPERTY_MANAGER_ID];

    const currentTaskId = this.isValidUUID(
      queryParams[EInboxFilterSelected.TASK_ID]
    )
      ? queryParams[EInboxFilterSelected.TASK_ID]
      : null;

    return {
      type,
      status,
      page: 0,
      pageLimit: this.pageLimit,
      search: queryParams[EInboxFilterSelected.SEARCH],
      assignedTo,
      currentTaskId,
      messageStatus,
      taskDeliveryFailIds,
      propertyManagerId,
      mailBoxId: this.currentMailboxId,
      isLoading: true,
      labelId: queryParams[EInboxFilterSelected.EXTERNAL_ID]
    } as IMessageQueryParams;
  }

  handleShowWarningMsg(text: string) {
    this.errorMessage = text;
    this.isShowModalWarning = true;
    return;
  }

  removeMessage(
    message: TaskItem,
    isDraftEmailMessageWithoutConversation?: boolean
  ) {
    if (
      this.queryParams['status'] === TaskStatusType.draft &&
      !isDraftEmailMessageWithoutConversation
    )
      return;
    this.messageList = this.messageList.filter(
      (item) => item.conversationId !== message?.conversationId
    );
    this.messageConversationIdSetService.delete(message?.conversationId);
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

  dragMovedHandler(event: CdkDragMove) {}

  handleDropSelectedMessageToFolder(folderData, messages: TaskItem[]) {}

  handleDropMessageToFolder($event) {}

  resetSelectedMessage() {
    this.conversationService.selectedConversation.next(null);
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setFilterInboxList(false);
    this.sharedMessageViewService.setIsSelectingMode(false);
  }

  handleToastByStatus(status, messageIds?: string[], tasks?: TaskItem[]) {
    this.toastService.clear();

    const isValidStatus = [
      TaskStatusType.inprogress,
      TaskStatusType.completed
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

  handleConfirmProperty() {
    this.taskService
      .getListConfirmProperties()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.dataConvert = res?.listConversationMove.concat(
          res?.listConversationNotMove.filter((item) => item.isChecked)
        );
      });
    this.currentPopupConversionTask = EPopupConversionTask.CREATE_TASK;
  }

  onCancelConfirmProperty(e) {
    this.isShowConfirmProperty = e;
  }

  handleActiveMessage(message: TaskItem) {
    // NOTE: handle mark as read when open message
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

  handleCancelPopup() {
    this.sharedMessageViewService.setPrefillCreateTaskData(null);
    this.currentPopupConversionTask = null;
    this.inboxService.setPopupMoveToTaskState(null);
    this.taskService.selectedTaskToMove.next(null);
  }

  trackByMessage(_: number, message: TaskItem) {
    return message?.conversationId + message.conversations?.[0]?.textContent;
  }

  setItem(messageId?: string, conversationId?: string) {
    this.queryTaskId = messageId;
    this.queryConversationId = conversationId;
    this.appMessageLoadingService.setCreateMessageLoading(null);
  }

  resetRightClickSelectedState() {
    this.nzContextMenuService.close();
    this.sharedMessageViewService.setIsRightClickDropdownVisible(false);
    this.sharedMessageViewService.setRightClickSelectedMessageId('');
  }

  skipTask(taskId: string): boolean {
    const taskOpenForward =
      this.sharedMessageViewService.prefillCreateTaskDataValue;
    if (taskId === taskOpenForward?.id) {
      return true;
    }
    return false;
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

  subscribeInboxItem() {
    combineLatest([
      this.inboxToolbarService.filterInboxList$,
      this.inboxToolbarService.inboxItem$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([filterInboxList, inboxItem]) => {
        if (
          inboxItem.length === 0 &&
          !filterInboxList &&
          this.activeMsgList.length > 0
        ) {
          this.handleRemoveActiveMsg();
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
    const isIndexApp = this.router.url.includes('inbox/app-messages');

    this.activeMsgList = selectedItems(
      event.isKeepShiftCtr,
      this.startIndex,
      event.lastIndex,
      this.activeMsgList,
      this.messageList,
      isIndexApp
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
    const message = this.messageList?.find(
      (item) =>
        item.id === dataSet.taskId &&
        item.conversationId === dataSet.conversationId
    );
    const isScratchDraft = message?.conversations?.[0]?.isScratchDraft;

    if (isScratchDraft) {
      this.handlePrefillDataAppMessage(message);
    }

    this.updateQueryParameters(dataSet);

    this.autoScrollService.scrollToElementSmoothly(dataSet.targetElement, {
      navigatePreMessage,
      delay: 300,
      delayCallback: 300,
      callback: () =>
        this.handleNavigateMessageDetail({
          ...dataSet,
          isScratchDraft
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
        this.messageConversationIdSetService.setIsMessageIdsEmpty(false);
        isReset && this.taskService.setSelectedConversationList([]);
      });
  }

  handlePrefillDataAppMessage(messageItem: TaskItem) {
    const appUser = getUserFromParticipants(
      messageItem.conversations[0].participants as IParticipantConversation[]
    )?.[0];
    const isDraftMessage = messageItem.conversations[0].isDraft;
    this.appMessageListService.setPreFillCreateNewMessage({
      receivers: appUser
        ? [
            {
              ...appUser,
              id: appUser.userId,
              type: isDraftMessage ? appUser.userPropertyType : appUser.type,
              isAppUser: true,
              streetline:
                messageItem.property.shortenStreetline ||
                messageItem.property.streetline
            }
          ]
        : [],
      title:
        messageItem.conversations?.[0]?.title ||
        messageItem.conversations?.[0]?.categoryName,
      draftMessageId:
        messageItem.conversations?.[0]?.draftMessageId ||
        messageItem.conversations?.[0]?.id
    });
  }

  subscribeSkeletonMessage() {
    this.inboxService
      .getSkeletonMessage()
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((res) => {
        // this.isSkeleton = res;
      });
  }

  private onMessageScheduled() {
    const decrease = (value: number) => (value > 0 ? value - 1 : 0);
    this.websocketService.onSocketJob
      .pipe(
        filter(
          (response) =>
            Boolean(response) && response?.action === ESendMessageType.SCHEDULE
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        const {
          type,
          isFromCreateMessage,
          conversationId,
          conversationIds,
          taskId
        } = response;
        if (type === SocketType.newScheduleJob) {
          this.fetchAndMergeNewMessages(response, isFromCreateMessage);
        }
        const isSkip =
          this.conversationScheduleIdNeedToSkip &&
          (conversationId === this.conversationScheduleIdNeedToSkip ||
            conversationIds?.includes(this.conversationScheduleIdNeedToSkip));
        if (isSkip) {
          this.conversationScheduleIdNeedToSkip = null;
          return;
        }
        const clonedMessage = cloneDeep(this.messageList) ?? [];
        const messageFound = clonedMessage.find(
          (message) =>
            message.id === taskId ||
            conversationId === message?.conversations?.[0]?.id ||
            conversationIds?.includes(message?.conversations?.[0]?.id)
        );

        // the message have one conversation only, so we just need to get first conversation
        const conversation = messageFound?.conversations?.[0];

        if (!conversation) {
          return;
        }

        if (!Number.isInteger(conversation?.scheduleMessageCount)) {
          conversation.scheduleMessageCount = 0;
        }

        if (!type) return;
        switch (type) {
          case SocketType.newScheduleJob:
            conversation.scheduleMessageCount++;
            break;
          case SocketType.removedJob:
            if (!conversation.totalMessages) {
              this.messageList = clonedMessage.filter(
                (message) =>
                  message.id !== taskId &&
                  message.conversationId !== response.conversationId
              );
            } else {
              conversation.scheduleMessageCount = decrease(
                conversation.scheduleMessageCount
              );
            }
            break;
          case SocketType.forceCompleteJob:
          case SocketType.completeJob:
            conversation.scheduleMessageCount = decrease(
              conversation.scheduleMessageCount
            );
            const queryParams = this.activatedRoute.snapshot.queryParams;
            if (queryParams['conversationId'] === conversationId) {
              if (this.router?.url.includes('inbox/app-messages/resolved')) {
                this.router.navigate(['dashboard/inbox/app-messages', 'all'], {
                  queryParams: {
                    status: TaskStatusType.inprogress,
                    conversationId: conversationId
                  },
                  queryParamsHandling: 'merge'
                });
                this.toastService.success('App message reopened');
              } else if (
                this.helperService.isInboxDetail &&
                queryParams['tab'] === EConversationStatus.resolved &&
                queryParams['conversationType'] === EConversationType.APP
              ) {
                this.router.navigate(
                  ['/dashboard', 'inbox', 'detail', queryParams['taskId']],
                  {
                    queryParams: {
                      tab: EConversationStatus.open,
                      conversationId: conversationId,
                      pendingSelectFirst: true
                    },
                    queryParamsHandling: 'merge'
                  }
                );
                this.toastService.success('App message reopened');
              }
            }
            break;
        }
        this.messageList = clonedMessage;
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

  private isValidUUID(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );
  }

  triggerCreateConversationApp() {
    this.conversationService
      .getCreateConversationApp()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data.createFromScratch) {
          this.fetchAndMergeScratchMessage(data);
          return;
        }
        if (
          this.activatedRoute.snapshot.queryParams['status'] !==
          TaskStatusType.inprogress
        ) {
          let payload = this.mapPayloadMessageList(
            this.queryParams,
            this.teamMembersInMailBox <= 1
          );
          payload = { ...payload, status: TaskStatusType.draft };
          this.appMessageApiService
            .getNewAppMessages(payload, [data?.taskId])
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
              if (res.tasks?.length) {
                this.conversationService.dispatchTempMessage(res.tasks[0]);
                this.router.navigate(['/dashboard/inbox/app-messages/all'], {
                  queryParams: {
                    conversationId: data?.conversationId,
                    taskId: data?.taskId,
                    status: TaskStatusType.inprogress
                  },
                  queryParamsHandling: 'merge'
                });
                this.appMessageListService.triggerSaveDraftFirstReply.next(
                  true
                );
                this.appMessageListService.triggerAutoGenChatGpt$.next(true);
              }
            });
          return;
        }
        this.fetchAndMergeNewMessages(data, true);
      });
  }

  navigateNewScheduleMsg(data) {
    if (
      !data?.taskId ||
      !this.conversationService.hasTempConversation(data.taskId)
    ) {
      return;
    }
    this.conversationService.filterTempConversations(
      (item) => item.id !== data.taskId,
      'APP_MESSAGE_VIEW_LIST'
    );
    if (
      this.activatedRoute.snapshot.queryParams['appMessageCreateType'] !==
      EAppMessageCreateType.NewAppMessageDone
    ) {
      return;
    }
    this.router.navigate(['/dashboard/inbox/app-messages'], {
      queryParams: {
        conversationId: data.conversationId,
        taskId: data.taskId,
        status: data.taskStatus || null,
        fromScratch: true,
        appMessageCreateType: null
      },
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy() {
    this.store.dispatch(appMessagePageActions.exitPage());
    this.messageConversationIdSetService.clear();
    this.messageTaskLoadingService.stopFullLoading();
    this.refreshMessageSubject$.complete();
    this.appMessageLoadingService.setCreateMessageLoading(null);
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.scrollTimeOut);
    this.conversationService.resetTempConversations('APP_MESSAGE_VIEW_LIST');
    this.conversationService.trudiResponseConversation.next(null);
  }
}
