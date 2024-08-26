import {
  messagePageActions,
  selectAllMessage,
  selectFetchingMessage,
  selectFetchingMoreMessage,
  selectListMessageError,
  selectMessagePayload,
  selectTotalMessage
} from '@core/store/message';
import { messageActions } from '@core/store/message/actions/message.actions';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { ReminderMessageService } from '@/app/task-detail/services/reminder-message.service';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
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
import { Store } from '@ngrx/store';
import { cloneDeep, isEqual } from 'lodash-es';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { ToastrService } from 'ngx-toastr';
import {
  combineLatest,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  first,
  lastValueFrom,
  map,
  mergeMap,
  of,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs';
import {
  EActionSyncResolveMessage,
  EInboxFilterSelected,
  EMessageQueryType,
  IConversationAction,
  IFlagUrgentMessageResponse,
  IMarkAsUnreadResponse,
  IMessageQueryParams
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import {
  addItem,
  removeActiveItem,
  selectedItems
} from '@/app/dashboard/modules/inbox/utils/msg-task';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { StatisticService } from '@/app/dashboard/services/statistic.service';
import { UserService } from '@/app/dashboard/services/user.service';
import {
  DEBOUNCE_DASHBOARD_TIME,
  LIMIT_TASK_LIST
} from '@/app/dashboard/utils/constants';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { UserConversationOption } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { CompanyService } from '@services/company.service';
import {
  CONVERSATION_STATUS,
  DEBOUNCE_SOCKET_TIME,
  ErrorMessages,
  TIME_FORMAT
} from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { DeliveryFailedMessageStorageService } from '@services/deliveryFailedMessageStorage.service';
import { FilesService } from '@services/files.service';
import { HeaderService } from '@services/header.service';
import { LoadingService } from '@services/loading.service';
import {
  CAN_NOT_MOVE,
  MESSAGE_MOVING_TO_TASK,
  MESSAGES_MOVING_TO_TASK,
  MOVE_MESSAGE_FAIL,
  MOVE_MESSAGE_TO_FOlDER
} from '@services/messages.constants';
import { PropertiesService } from '@services/properties.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { SharedService } from '@services/shared.service';
import { SyncResolveMessageService } from '@services/sync-resolve-message.service';
import { TaskService } from '@services/task.service';
import { CreateTaskByCateOpenFrom } from '@/app/share-pop-up/create-new-task-pop-up/components/create-task-by-category/create-task-by-category.component';
import { CreateNewTaskPopUpService } from '@/app/share-pop-up/create-new-task-pop-up/services/create-new-task-pop-up.service';
import { EMessageStatusFilter } from '@shared/components/filter-by-status/filter-status-box/filter-status-box.component';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { EMailBoxStatus } from '@shared/enum/inbox.enum';
import {
  EConversationAction,
  EMessageComeFromType,
  EMessageProperty,
  EMessageType
} from '@shared/enum/messageType.enum';
import { ESendMessageType } from '@shared/enum/send-message-type.enum';
import { SocketType } from '@shared/enum/socket.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  EPropertyStatus,
  GroupType,
  UserTypeEnum
} from '@shared/enum/user.enum';
import { ISelectedCalendarEventId } from '@shared/types/calendar.interface';
import {
  IListConversationConfirmProperties,
  IListConvertMultipleTask,
  PreviewConversation
} from '@shared/types/conversation.interface';
import { EFileOrigin } from '@shared/types/file.interface';
import {
  ISocketChangeConversationProperty,
  ISocketMessageToTask,
  ISocketMoveMessageToFolder,
  ISocketUpdateMsgFolder,
  SocketMessage,
  SocketSendData,
  SyncPropertyDocumentStatus
} from '@shared/types/socket.interface';
import {
  TaskItem,
  TaskItemDropdown,
  TaskListMove
} from '@shared/types/task.interface';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import {
  CurrentUser,
  IUserParticipant,
  UserPropInSelectPeople
} from '@shared/types/user.interface';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import {
  EToastCustomType,
  EToastSocketTitle
} from '@/app/toast-custom/toastCustomType';
import { checkScheduleMsgCount } from '@/app/trudi-send-msg/utils/helper-functions';
import { ETaskQueryParams } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/inbox-sidebar.component';
import {
  EPopupMoveMessToTaskState,
  ERouterLinkInbox
} from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { EFolderType } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { InboxExpandService } from '@/app/dashboard/modules/inbox/services/inbox-expand.service';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { InboxSidebarService } from '@/app/dashboard/modules/inbox/services/inbox-sidebar.service';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { hasMessageFilter } from '@/app/dashboard/modules/inbox/utils/function';
import { IMailFolderQueryParams } from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { EPopupConversionTask } from '@/app/dashboard/modules/inbox/modules/message-list-view/enum/message.enum';
import { EMessageMenuOption } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { MessageApiService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-api.service';
import { MessageIdSetService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-id-set.service';
import { MessageMenuService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-menu.service';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';
import { MessageViewRowComponent } from '@/app/dashboard/modules/inbox/modules/message-list-view/components/message-view-row/message-view-row.component';
import { TaskDragDropService } from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import {
  AutoScrollService,
  SiblingEnum
} from '@/app/dashboard/modules/inbox/services/auto-scroll.service';
import { LAST_MSG_TYPE_EXCLUDED } from '@/app/dashboard/modules/inbox/constants/constants';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';

@Component({
  selector: 'message-view-list',
  templateUrl: './message-view-list.component.html',
  styleUrls: ['./message-view-list.component.scss'],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
@DestroyDecorator
export class MessageViewListComponent implements OnInit, OnDestroy {
  @ViewChildren(MessageViewRowComponent)
  queryList: QueryList<MessageViewRowComponent>;

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
      messageActions.setAll({
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
  public activeMobileApp: boolean;
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
  public dataFormat: string;
  public hasFilter: boolean = false;
  private lastPage = false;
  public isDraftFolder = false;
  public listProperty: UserPropertyInPeople[] = [];
  public socketSendData: SocketSendData;
  private lastMessageTypeExcluded = LAST_MSG_TYPE_EXCLUDED;

  private movingMessages: TaskItem[];
  public targetFolderName: string;
  public taskFolders = {};
  public dataConvert: IListConversationConfirmProperties[];
  public isShowConfirmProperty: boolean = false;
  public confirmPropertyData: IListConvertMultipleTask;
  public showBackBtn: boolean = false;
  public currentDraggingToFolderName: string = '';
  public showMessageInTask: boolean = false;

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
  private currentMessage: TaskItem;
  private currentUser: CurrentUser;
  private currentTotalCount: number;
  private currentMailboxId: string;
  private teamMembersInMailBox: number;
  private statusMailBox: EMailBoxStatus;
  private datePipe: DatePipe;
  private isMoving: boolean = false;
  public shouldAutoScrollToMessage: boolean = true;
  private conversationScheduleIdNeedToSkip: string;

  private get loadingMore() {
    return this.showSpinnerTop || this.showSpinnerBottom;
  }

  private set loadingMore(value: boolean) {
    this.showSpinnerTop = value;
    this.showSpinnerBottom = value;
  }

  //#endregion

  public listMessage$ = combineLatest({
    fetching: this.store.select(selectFetchingMessage),
    error: this.store.select(selectListMessageError),
    message: this.store.select(selectAllMessage),
    totalMessage: this.store.select(selectTotalMessage)
  }).pipe(
    takeUntil(this.destroy$),
    filter(Boolean),
    map(({ fetching, error, message, totalMessage }) => {
      return {
        fetching,
        error,
        message,
        totalMessage,
        isDraft: this.router.url.includes(ERouterLinkInbox.MSG_DRAFT)
      };
    })
  );

  constructor(
    private readonly messageApiService: MessageApiService,
    private readonly agencyService: AgencyService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly statisticService: StatisticService,
    private readonly router: Router,
    private readonly inboxToolbarService: InboxToolbarService,
    private readonly websocketService: RxWebsocketService,
    private readonly taskService: TaskService,
    private readonly conversationService: ConversationService,
    private readonly messageMenuService: MessageMenuService,
    private readonly messageIdSetService: MessageIdSetService,
    private readonly toastService: ToastrService,
    private readonly userService: UserService,
    private readonly inboxSidebarService: InboxSidebarService,
    private readonly inboxExpandService: InboxExpandService,
    private readonly inboxFilterService: InboxFilterService,
    private readonly filesService: FilesService,
    private readonly agencyDateFormatService: AgencyDateFormatService,
    private readonly taskDragDropService: TaskDragDropService,
    private readonly cdr: ChangeDetectorRef,
    private readonly deliveryFailedMessageStorageService: DeliveryFailedMessageStorageService,
    private readonly headerService: HeaderService,
    private readonly emailApiService: EmailApiService,
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
    private readonly createNewTaskPopUpService: CreateNewTaskPopUpService,
    private readonly companyService: CompanyService,
    private readonly store: Store,
    public readonly inboxService: InboxService,
    private readonly reminderMessageService: ReminderMessageService,
    private readonly autoScrollService: AutoScrollService,
    private syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    public taskDetailService: TaskDetailService,
    public conversationSummaryService: ConverationSummaryService
  ) {}

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

  ngOnInit(): void {
    this.store.dispatch(messagePageActions.enterPage());
    this.isConsole = this.sharedService.isConsoleUsers();
    this.onStoreChange();
    this.refreshMessageSubject$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged(isEqual))
      .subscribe((rs) => {
        this.store.dispatch(
          messagePageActions.payloadChange({ payload: rs['payload'] })
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
    this.subscribeSyncAttachmentMailClient();
    this.subscribeMailboxSettings();
    this.subscribeInboxItem();
    this.onMessageScheduled();
    this.subscribeToggleMoveConversationSate();

    // handle socket
    this.subscribeToSocketMoveEmailFolder();
    this.subscribeSyncStatusMessageList();
    this.subscribeSocketMessageToTask();
    this.subscribeMoveMessageSocket();
    this.subscribeMovedMessages();
    this.subscribeConversationAction();
    this.subscribeMessageSocket();
    this.subscribeSeenConversationSocket();
    this.subscribeSocketSyncMailboxProgress();
    this.subscribeSkeletonMessage();
    this.subscribeToSocketUpdateMsgFolder();
    this.subscribeDeleteDraft();
    this.subscribeDeleteSecondaryEmail();
    this.subscribeSocketAssignContact();
    this.subscribeMarkReadAndUnread();
    this.subscribeReminderGoToMessage();
    this.subscribeToSocketMoveEmailStatus();
    this.subscribeToSocketDeleteConversation();
    this.subscribeUpdateCountTicketConSocket();
  }

  private onStoreChange() {
    const messages$ = this.store.select(selectAllMessage);
    const payload$ = this.store.select(selectMessagePayload);
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

    combineLatest([messages$, total$, payload$, fetchingMore$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([messages, total, payload]) => {
        const response = {
          tasks: messages,
          currentPage: payload.page,
          totalTask: total
        };
        this._messageList = this.handleMapMessageList(
          messages,
          this.selectMessageIdMap
        );
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

  subscribeReminderGoToMessage() {
    this.reminderMessageService.triggerGoToMessage$
      .pipe(takeUntil(this.destroy$), delay(100))
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
          showMessageInTask
        ]) => {
          this.updateStateValues(
            selectedInboxType,
            selectedPortfolio,
            selectedStatus,
            selectedAgency,
            selectedTaskEditorId,
            selectedCalendarEventId,
            showMessageInTask
          );

          this.queryParams = { ...queryParams };

          // NOTE: handle back message (task) list when we click on sidebar inbox item (in case filter)
          this.updateQueryParamsForBackNavigation(
            queryParams,
            selectedAgency,
            selectedPortfolio,
            selectedStatus,
            selectedTaskEditorId,
            selectedCalendarEventId,
            showMessageInTask
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
                selectedStatus,
                showMessageInTask
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
      this.inboxFilterService.showMessageInTask$,
      this.mailboxSettingService.mailboxSetting$,
      this.inboxService.importEmailId$,
      this.userService.getUserDetail()
    ]).pipe(
      debounceTime(50),
      distinctUntilChanged((previous, current) => isEqual(previous, current)),
      filter(() => this.router.url.includes('inbox/messages')),
      filter((response) => {
        const queryParams = response[0];
        const inboxType = response[2];
        const currentUser = response[11];
        return this.navigateWithDefaultParams(
          queryParams,
          currentUser,
          inboxType,
          response[1]
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
          showMessageInTask,
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
            importEmailId,
            showMessageInTask
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
    importEmailId: string,
    showMessageInTask: boolean
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

    const isStatusShowInTaskChange =
      this.showMessageInTask !== showMessageInTask;

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
      isTimeStampDifferent ||
      isStatusShowInTaskChange
    );
  }

  private updateStateValues(
    selectedInboxType: GroupType,
    selectedPortfolio: string[],
    selectedStatus: string[],
    selectedAgency: string[],
    selectedTaskEditorId: string[],
    selectedCalendarEventId: ISelectedCalendarEventId,
    showMessageInTask: boolean
  ) {
    this.selectedInboxType = selectedInboxType;
    this.selectedPortfolio = cloneDeep(selectedPortfolio);
    this.selectedStatus = cloneDeep(selectedStatus);
    this.selectedAgency = cloneDeep(selectedAgency);
    this.selectedTaskEditorId = cloneDeep(selectedTaskEditorId);
    this.selectedCalendarEventId = cloneDeep(selectedCalendarEventId);
    this.messageIdSetService.clear();
    this.showMessageInTask = showMessageInTask;
  }

  private navigateWithDefaultParams(
    queryParams: Params,
    currentUser: CurrentUser,
    selectedInboxType: GroupType,
    mailBoxId: string
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
      !queryParams[EMessageQueryType.MESSAGE_STATUS] ||
      !queryParams[EMessageQueryType.MAILBOX_ID]
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

    if (shouldNavigate) {
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: {
          ...(this.queryParams ?? {}),
          ...activatedQueryParams,
          ...defaultQueryParams,
          mailBoxId
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
    selectedCalendarEventId: ISelectedCalendarEventId,
    showMessageInTask: boolean
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
        taskEditorId: selectedTaskEditorId,
        showMessageInTask:
          queryParams['showMessageInTask'] || showMessageInTask ? true : null
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

  private subscribeToSocketDeleteConversation() {
    this.websocketService.onSocketDeleteLinkedConversation
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && res.mailBoxId === this.currentMailboxId) {
          const conversationId = res.conversationId;
          const msgRemoving = this.messageList.find(
            (message) => message.conversationId === conversationId
          );
          if (msgRemoving) {
            this.removeMessage(msgRemoving);
          }
        }
      });
  }

  private subscribeToSocketMoveEmailStatus() {
    this.websocketService.onSocketMoveEmailStatus
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

  private subscribeToSocketMoveEmailFolder() {
    this.websocketService.onSocketMoveMessageToFolder
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.listSuccess?.length) {
          const idMessageRemoved = res?.listSuccess.map(
            (item) => item?.conversationId
          );
          if (!res.isRemoveFromTask)
            this.handleMovedEmailFolder(idMessageRemoved, res);
          res?.listSuccess?.forEach((item) => {
            this.messageIdSetService.delete(item?.conversationId);
          });
          const isNewMessageSubFolder =
            res?.newStatus === TaskStatusType.inprogress &&
            res?.newLabel?.id ===
              this.queryParams[EMessageQueryType.EXTERNAL_ID];
          if (
            res?.newStatus ===
              this.queryParams[EMessageQueryType.MESSAGE_STATUS] ||
            isNewMessageSubFolder
          ) {
            this.fetchAndMergeNewMessages(
              isNewMessageSubFolder ? res : this.dataMessageSocket
            );
            if (this.statusMailBox !== EMailBoxStatus.SYNCING)
              this.inboxSidebarService.refreshStatisticsUnreadTask(
                this.currentMailboxId
              );
          }
        }
      });
  }

  private subscribeSocketMessageToTask() {
    this.websocketService.onSocketMessageToTask
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: ISocketMessageToTask) => {
        if (!data) return;
        const socketStatus = data?.status;
        const socketConversationId = data?.conversationId;
        const { status } = this.activatedRoute.snapshot.queryParams;
        if (socketStatus === status) {
          const matchedTask = this.messageList.find(
            (message) => message.conversations?.[0]?.id === socketConversationId
          );
          if (!matchedTask) {
            return;
          }
          matchedTask.taskId = data?.newTaskId;
          matchedTask.conversationId = data?.conversationId;
          const showMessageInTask =
            this.queryParams['showMessageInTask'] || this.showMessageInTask;
          if (showMessageInTask) {
            this.handleMapMessageMoveToTask(matchedTask);
          } else {
            this.removeMessage(matchedTask);
          }
        }
      });
  }
  private handleMapMessageMoveToTask(message: TaskItem) {
    this.messageList = this.messageList.map((item) => {
      if (message?.conversationId === item?.conversations?.[0]?.id) {
        return {
          ...item,
          isMessageInTask: true,
          taskType: TaskType.TASK,
          id: message?.taskId || item?.taskId,
          conversationId: message?.conversationId
        };
      }
      return item;
    });
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

      this.messageList = this.messageList.map((item) => {
        if (
          socketData.conversationInTaskId !== item?.conversations[0].id ||
          !dataNeedUpdate
        ) {
          return item;
        }
        return {
          ...item,
          isMessageInTask: false,
          taskType: TaskType.MESSAGE,
          id: dataNeedUpdate.taskId || item.taskId,
          conversationId: dataNeedUpdate.conversationId,
          conversations: mapConversations(item.conversations)
        };
      });

      const currentTask = this.taskService.currentTask$.value;
      if (
        currentTask?.conversations.some(
          (item) => socketData.conversationInTaskId === item.id
        )
      ) {
        this.taskService.currentTask$.next({
          ...currentTask,
          taskType: TaskType.MESSAGE,
          id: dataNeedUpdate.taskId || currentTask.id,
          conversations: mapConversations(currentTask.conversations)
        });
      }

      if (
        this.router.url.includes(ERouterLinkInbox.MSG_INPROGRESS) &&
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
      this.messageList = this.messageList.filter(
        (item) => !conversationIds?.includes(item?.conversations[0].id)
      );
      this.handleSetIsMessageIdsEmpty();
    }
    this.conversationService.handleMessageActionTriggered();
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
      const messageIndex = this.getFocusMessageIndex(this.messageList);
      if (this.inboxService.justNavigateToMessageItem && messageIndex >= 0) {
        this.scrollToElement(messageIndex, 'start');
      }
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
        clonedMessages.push(message);
      }
    }
    return clonedMessages;
  }

  private handleGetMessageError() {
    this.offMultiLoading();
    this.inboxService.setIsAllFiltersDisabled(false);
    this.showSpinnerTop = false;
    this.isError = true;
  }

  private offMultiLoading() {
    this.messageTaskLoadingService.stopLoadingMessage();
    this.messageTaskLoadingService.stopLoading();
    this.loadingService.stopLoading();
  }

  private handleSetIsMessageIdsEmpty() {
    if (!this.messageList?.length) {
      this.messageIdSetService.setIsMessageIdsEmpty(true);
      return;
    }
    const focusMessageIndex = this.getFocusMessageIndex(this.messageList);
    this.messageIdSetService.setIsMessageIdsEmpty(focusMessageIndex === -1);
  }

  /**
   * get the index of the message that needs to be focused
   * @param messages list of messages
   * @returns index of the message that needs to be focused
   */
  private getFocusMessageIndex(messages: TaskItem[]) {
    const messageStatus =
      this.activatedRoute.queryParamMap[EMessageQueryType.MESSAGE_STATUS];
    const taskId = this.activatedRoute.snapshot.queryParams['taskId'];
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

  private subscribeMoveMessageSocket() {
    this.websocketService.onSocketMoveConversations
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          if (res.mailBoxId !== this.currentMailboxId) {
            return;
          }
          this.handleMovedMessages(res.conversationIds);
        }
      });
  }

  private subscribeMovedMessages() {
    this.inboxService.movedMessages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          const conversationIds = res?.map((item) => {
            if (item?.conversations) {
              return item?.conversations[0]?.id;
            }
            return item?.conversation?.id;
          });
          this.handleMovedMessages(conversationIds);
        }
      });
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
          (it) => !rs.some((r) => r.conversationId === it.conversationId)
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
          this._handleNavigateMessageDetail({
            taskId: id,
            conversationId,
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
        if (!this.queryParams['showMessageInTask'] || !this.showMessageInTask) {
          this.messageList = [...this.messageList].filter(
            (it) => !rs.some((r) => r.id === it?.conversations[0]?.id)
          );
        }
      });
  }

  private subscribeConversationAction() {
    this.headerService.conversationAction$
      .pipe(takeUntil(this.destroy$))
      .subscribe((conversationAction) => {
        const messageToChange = this.messageList.find(
          (message) =>
            message.id === conversationAction.taskId &&
            (conversationAction.conversationId
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
        filter(({ mailBoxId }) => mailBoxId === this.currentMailboxId)
      )
      .subscribe((res) => {
        const {
          isSeen,
          taskId,
          taskType,
          conversationId,
          isBulkSeen,
          conversations,
          userId
        } = res;
        let listMessageUpdate = [...this.messageList];
        if (isBulkSeen) {
          conversations.forEach((conversation) => {
            if (
              [TaskType.MESSAGE, TaskType.TASK].includes(
                conversation.taskType as TaskType
              ) &&
              this.messageIdSetService.has(conversation.conversationId)
            ) {
              if (userId && userId === this.currentUser.id) {
                return;
              }
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
          this.messageList = listMessageUpdate;
          this.updateCurrentTask(EMessageProperty.IS_SEEN, isSeen);
        } else {
          if (
            [TaskType.MESSAGE, TaskType.TASK].includes(taskType as TaskType) &&
            this.messageIdSetService.has(conversationId)
          ) {
            if (res?.userId && res?.userId === this.currentUser.id) {
              return;
            }
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
        this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
          this.currentMailboxId
        );
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
    propertyValue,
    taskId: string,
    conversationId: string
  ) {
    let listMessageUpdate = [...this.messageList];
    listMessageUpdate = listMessageUpdate.map((msg) => {
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
    this.messageList = listMessageUpdate;
  }

  subscribeDeleteDraft() {
    this.websocketService.onSocketDeleteDraft
      .pipe(delay(500), takeUntil(this.destroy$))
      .subscribe((res) => {
        if (
          this.router.url?.includes(ERouterLinkInbox.MSG_DRAFT) &&
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

        let conversation = task?.conversations?.[0] ?? {};
        conversation = {
          ...conversation,
          participants: res.participants
        };
        if (task?.conversations) {
          task.conversations = task.conversations.map((item) => {
            if (item.id === conversation.id) return conversation;
            else return item;
          });
        } else {
          task.conversations = [];
        }

        const clonedMessage = cloneDeep(this.messageList);
        clonedMessage[taskIndex] = cloneDeep(task);
        this.messageList = clonedMessage;

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
        filter((res) => res && res.companyId === this.companyId),
        tap((res) => (this.dataMessageSocket = res))
      )
      .subscribe((res) => {
        this.handleCreateNewMessagesRealTime(res);
        this.inboxService.triggerEventUpdateFoldersMsgCountByMailBoxId.next(
          res?.mailBoxId
        );
      });
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
            case SocketType.messageToTask:
              this.handleConvertMessageToTaskRealtime(res);
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
      this.router.url?.includes(ERouterLinkInbox.MSG_DRAFT) && index !== -1;

    if (isDraftPage) {
      this.store.dispatch(
        messageActions.removeMessage({
          conversationId: conversationId,
          tokenProperty: {
            mailBoxId: this.currentMailboxId,
            status: TaskStatusType.draft,
            type: this.queryParams['inboxType']
          }
        })
      );
      this.messageList = this.messageList.filter(
        (task) => task.conversationId !== conversationId
      );
      this.handleSetIsMessageIdsEmpty();

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
            conversationId: null
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
    let conversation = task.conversations[0];
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
      (conversation.isScratchDraft && (res as SocketSendData).isDraft)
    ) {
      const newProperty = this.listProperty.find(
        (item) => item.id === res.propertyId
      ) || {
        shortenStreetline: null,
        streetline: null,
        status: null
      };

      task.property = {
        ...task.property,
        ...newProperty,
        isTemporary: !newProperty
      };
      task.propertyStatus = newProperty?.status as EPropertyStatus;
    }

    conversation = this.updateConversationFromMessage(conversation, res);

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

    if (res.taskId === this.taskService.currentTask$.value?.id) {
      this.updateCurrentTask('messageDate', res.messageDate);

      if (res.participants) {
        this.updateCurrentTask(
          'participants',
          res.participants as IUserParticipant[]
        );
      }
    }

    if (
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
  }

  private handleTotalMessage(conversation, res) {
    this.socketSendData = res;
    conversation.totalMessages =
      res.totalMessages ?? conversation.totalMessages;
  }

  private updateConversationFromMessage(conversation, res) {
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
      isLastMessageDraft: res?.isLastMessageDraft || false,
      textContent:
        !!res.bulkMessageId ||
        this.lastMessageTypeExcluded.includes(res.messageType as EMessageType)
          ? conversation.textContent
          : res.textContent,
      updatedAt: [
        EMessageType.changeProperty,
        EMessageType.syncConversation
      ].includes(res.messageType)
        ? conversation.messageDate
        : res.messageDate,
      lastMessageType: res.messageType as EMessageType,
      participants:
        res.messageType === EMessageType.file ||
        (res?.isLastMessageDraft && !this.isDraftFolder)
          ? conversation.participants
          : res.participants || conversation.participants,
      title: res.title || res.title === '' ? res.title : conversation.title,
      attachmentCount: res.attachmentCount ?? conversation.attachmentCount
    };
  }

  private isObjectNull(obj) {
    return Object.values(obj).some((x) => x !== null && x !== '');
  }

  private handleMovedMessages(conversationIds: string[]) {
    let tempListMessage = [];
    const messageWithMatchedConversation = this.messageList.filter((message) =>
      conversationIds?.includes(message?.conversations[0]?.id)
    );
    const messageIds = messageWithMatchedConversation.map(
      (message) => message?.id
    );

    tempListMessage = this.messageList?.filter(
      (item) => !conversationIds?.includes(item?.conversations[0]?.id)
    );

    this.conversationService.handleMessageActionTriggered();

    tempListMessage = this.messageList.filter(
      (messageItem) => !messageIds.includes(messageItem.id)
    );

    this.messageList = [...tempListMessage];
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
      : this.router.url?.includes(ERouterLinkInbox.MSG_DRAFT)
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
      if (this.messageIdSetService.has(conversationId)) {
        this.messageIdSetService.delete(conversationId);
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

  handleConvertMessageToTaskRealtime(data) {
    if (this.messageIdSetService.has(data.conversationId)) {
      this.messageIdSetService.delete(data.conversationId);
      this.messageList = this.messageList.filter(
        (message) => message.conversationId !== data.conversationId
      );
      this.handleSetIsMessageIdsEmpty();
      this.handleCheckShowSelect();
    }
  }

  private fetchAndMergeNewMessages(data) {
    const payload = this.mapPayloadMessageList(
      this.queryParams,
      this.teamMembersInMailBox <= 1,
      { showMessageInTask: this.queryParams['showMessageInTask'] }
    );
    if (!data?.taskIds && !data?.taskId) return;
    this.messageApiService
      .getNewMessages(payload, data.taskIds ?? [data?.taskId])
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.tasks) {
          this.messageList = this.pushAndReplaceMessages(
            this.messageList,
            res.tasks
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

  handleCheckMessageIdsEntry() {
    this.messageIdSetService.setIsMessageIdsEmpty(
      this.messageList?.length === 0
    );
  }

  scrollToElement(
    position: number,
    block: ScrollLogicalPosition = 'center',
    inline: ScrollLogicalPosition = 'nearest'
  ): void {
    this.scrollTimeOut = setTimeout(() => {
      const scrollElement = this.infiniteScrollView?.nativeElement;
      const targetElement = scrollElement?.children?.[position];
      if (!targetElement) {
        return;
      }

      this.inboxService.justNavigateToMessageItem = false;
      targetElement.scrollIntoView({
        block,
        inline,
        behavior: 'smooth'
      });
    }, 200);
  }

  onScrollToTop() {
    if (this.showSpinnerTop) return;
    this.store.dispatch(messagePageActions.prevPage());
  }

  onScrollToBottom() {
    if (this.showSpinnerBottom) return;
    this.store.dispatch(messagePageActions.nextPage());
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
    isDraftMessageWithoutConversation?: boolean;
  }) {
    const {
      message,
      option,
      isTriggeredFromRightPanel,
      isTriggeredFromToolbar,
      conversationIds,
      isDraftMessageWithoutConversation
    } = event;
    const handleActionFromToolbarIfNeeded = (option?: EMessageMenuOption) => {
      if (isTriggeredFromToolbar) {
        this.handleActionFromToolbar(option, conversationIds);
        return true;
      }
      return false;
    };

    switch (option) {
      case EMessageMenuOption.CREATE_NEW_TASK:
        this.messageMenuService.handleCreateNewTask(message);
        break;

      case EMessageMenuOption.FORWARD:
        this.handleForwardMessage(message);
        break;

      case EMessageMenuOption.REOPEN:
        if (handleActionFromToolbarIfNeeded()) return;

        if (!isTriggeredFromRightPanel) {
          this.messageMenuService.handleReOpenMessage(message, () => {
            this.handleReopenCallback(message);
            this.handleSetIsMessageIdsEmpty();
            this.handleCheckShowSelect();
          });
          return;
        }
        this.handleReopenCallback(message);
        this.handleSetIsMessageIdsEmpty();
        break;

      case EMessageMenuOption.DELETE:
        if (handleActionFromToolbarIfNeeded(option)) return;
        if (isDraftMessageWithoutConversation) {
          this.conversationService
            .deleteDraftMsg({
              draftMessageId: message.conversations[0].draftMessageId,
              taskId: message.conversations[0].taskId,
              conversationId: message.conversationId,
              isFromDraftFolder: this.router.url?.includes(
                ERouterLinkInbox.MSG_DRAFT
              )
            })
            .subscribe(() => {
              this.handleMessageDeletionSuccess(
                message,
                isDraftMessageWithoutConversation
              );
            });
          return;
        }
        if (checkScheduleMsgCount(message.conversations)) {
          this.handleShowWarningMsg(ErrorMessages.DELETE_CONVERSATION);
          return;
        }
        this.messageMenuService
          .handleDeleteMessage(message)
          .pipe(takeUntil(this.destroy$))
          .subscribe(
            (res) => res && this.handleMessageDeletionSuccess(message)
          );
        break;

      case EMessageMenuOption.RESOLVE:
        if (handleActionFromToolbarIfNeeded()) return;
        if (checkScheduleMsgCount(message.conversations)) {
          this.handleShowWarningMsg(ErrorMessages.RESOLVE_CONVERSATION);
          return;
        }
        this.messageMenuService.handleResolveMessage(message, () =>
          this.handleMessageResolveSuccess(message)
        );
        break;
      case EMessageMenuOption.REPORT_SPAM:
        this.handleReportSpam(message);
        this.currentMessage = message;
        break;
      case EMessageMenuOption.MOVE_TO_TASK:
      case EMessageMenuOption.MOVE_TO_FOLDER:
        this.handleMove(message, option);
        this.currentMessage = message;
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
      case EMessageMenuOption.CONVERT_MULTIPLE_TO_TASK:
        if (handleActionFromToolbarIfNeeded()) return;
        break;

      case EMessageMenuOption.SEND_AND_RESOLVE:
        if (handleActionFromToolbarIfNeeded()) return;
        this.removeMessage(message);
        this.inboxSidebarService.refreshStatisticsUnreadTask(
          this.currentMailboxId
        );
        break;
      case EMessageMenuOption.DOWNLOAD_AS_PDF:
        this.handleSaveToPT(message, true);
        break;

      case EMessageMenuOption.REMOVE_FROM_TASK:
        this.handleRemoveFromTask(message);
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
    }
  }

  private handleMessageDeletionSuccess(
    message: TaskItem,
    isDraftMessageWithoutConversation?: boolean
  ) {
    this.removeMessage(message);
    this.statisticService.updateStatisticTotalTask(
      this.queryParams[EMessageQueryType.MESSAGE_STATUS],
      -1
    );
    const dataForToast = {
      conversationId: message?.conversationId,
      taskId: message?.id,
      isShowToast: true,
      type: SocketType.changeStatusTask,
      mailBoxId: this.currentMailboxId,
      taskType: TaskType.MESSAGE,
      status: TaskStatusType.deleted,
      pushToAssignedUserIds: []
    };
    if (!isDraftMessageWithoutConversation) {
      this.toastCustomService.openToastCustom(
        dataForToast,
        true,
        message.status === TaskStatusType.draft
          ? null
          : EToastCustomType.SUCCESS_WITH_VIEW_BTN
      );
    }
    this.conversationService.handleMessageActionTriggered();
    const currentUrlConversationId =
      this.activatedRoute.snapshot.queryParams?.['conversationId'];
    if (message.conversationId === currentUrlConversationId) {
      this.handleSetIsMessageIdsEmpty();
      this.handleCheckShowSelect();
      this.inboxToolbarService.setInboxItem([]);
    }
  }

  private handleMove(message: TaskItem, option: EMessageMenuOption) {
    this.currentMessage = message;
    switch (option) {
      case EMessageMenuOption.MOVE_TO_TASK:
        this.handleMoveToTask(message);
        break;
      case EMessageMenuOption.MOVE_TO_FOLDER:
        this.handleMoveToEmail(message);
        break;
    }
  }

  private handleMarkAsUnread(message: TaskItem, option: EMessageMenuOption) {
    this.currentMarkUnreadMsgId = message.id;
    this.messageMenuService.handleMessageAction(
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
    this.messageMenuService.handleMessageAction(
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
      case EMessageMenuOption.DELETE:
        this.messageList = this.messageList.map((item) => {
          if (conversationIds.includes(item?.conversationId)) {
            return { ...item, isDeleting: true };
          }
          return item;
        });
        break;

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

  // ? TODO: change flow BE
  async handleForwardMessage(message: TaskItem) {
    const { id, conversations } = message;
    const firstConversaiton = conversations?.[0] || ({} as PreviewConversation);
    this.taskId = id;
    // loading download attachment
    this.isSyncedAttachment =
      firstConversaiton.attachmentCount < 1 ||
      firstConversaiton.isSyncedAttachment;
    this.threadId = firstConversaiton.threadId;
    this.sharedMessageViewService.setPrefillCreateTaskData(message);
    await this._getAttachmentFiles(id);
    await this._getCallFiles(id);
    this.handlePopupState({ isShowForwardConversation: true });
  }

  private async _getAttachmentFiles(id: string) {
    const response = await lastValueFrom(
      this.filesService.getAttacmentsByTask(id)
    );
    this.filesService.setAttachmentFilesDocument(response);
  }

  private async _getCallFiles(id: string) {
    const files = await lastValueFrom(
      this.filesService.getConversationCallDocuments(id)
    );
    this.agencyDateFormatService.dateFormatPipe$
      .pipe(take(1))
      .subscribe((format) => {
        let callFiles: Array<Document> = [];
        if (Array.isArray(files)) {
          callFiles = files
            .map((file) => {
              file.fileTypeDot = this.filesService.getFileTypeDot(file.name);
              file.thumbnail = this.filesService.getThumbnail(file);
              file.syncPTStatus ||= SyncPropertyDocumentStatus.FAILED;
              if (file.fileOrigin === EFileOrigin.voice_mail) {
                file.name = `Voicemail - ${this.datePipe.transform(
                  file.createdAt,
                  `${TIME_FORMAT} ${format}`
                )}`;
              }
              return file;
            })
            .sort(
              (firstFile, secondFile) =>
                new Date(secondFile?.createdAt).getTime() -
                new Date(firstFile?.createdAt).getTime()
            );
        }
        this.filesService.setCallFiles(callFiles);
      });
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
      labelId: queryParams[EInboxFilterSelected.EXTERNAL_ID],
      timestamp: queryParams[EMessageQueryType.TIME_STAMP],
      showMessageInTask: state?.showMessageInTask
    } as IMessageQueryParams;
  }

  handleShowWarningMsg(text: string) {
    this.errorMessage = text;
    this.isShowModalWarning = true;
    return;
  }

  handleMoveToTask(message: TaskItem, isNewMessage = true) {
    this.taskService.selectedTaskToMove.next(null);
    this.moveConversationState = true;
    if (isNewMessage) {
      this.currentPropertyId = message.property.id;
      this.isUnHappyPath = message.isUnHappyPath;
      this.targetConversationId = message.conversations[0].id;
      this.sharedMessageViewService.setPrefillCreateTaskData(message);
    }
  }

  subscribeToggleMoveConversationSate() {
    this.taskService.triggerToggleMoveConversationSate
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.currentPopupConversionTask = null;
        if (res.isOpenByDragDrop) {
          this.handleOpenMoveToTask(res.isOpenByDragDrop);
        } else {
          this.moveConversationState = res.singleMessage;
        }
      });
  }

  stopMoveToTask() {
    this.taskService.triggerToggleMoveConversationSate.next({
      singleMessage: false,
      multipleMessages: false
    });
    this.currentPopupConversionTask = null;
    this.moveConversationState = false;
    this.taskList = null;
  }

  removeMessage(message: TaskItem) {
    this.messageList = this.messageList.filter(
      (item) => item.conversationId !== message?.conversationId
    );
    this.messageIdSetService.delete(message?.conversationId);
    const currentUrlConversationId =
      this.activatedRoute.snapshot.queryParams?.['conversationId'];
    if (currentUrlConversationId === message?.conversationId) {
      this.router.navigate([], {
        queryParams: { taskId: null, conversationId: null },
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

  dragMovedHandler(event: CdkDragMove) {
    this.currentDraggingToFolderName =
      this.inboxExpandService.getFolderNameWhenDragging(event.pointerPosition);
    this.inboxExpandService.expandSubMenu(event.pointerPosition);
    if (this.sharedMessageViewService.isRightClickDropdownVisibleValue) {
      this.resetRightClickSelectedState();
    }
  }

  handleDropSelectedMessageToFolder(folderData, messages: TaskItem[]) {
    switch (folderData.folderType) {
      case EFolderType.TASKS:
        this.folderUid = folderData.folderUid;
        this.inboxService.createTaskByMoveToTaskDragDrop.next({
          folderId: this.folderUid,
          isDragDrop: true
        });
        this.targetFolderName = this.taskFolders[this.folderUid].name;
        this.movingMessages = messages;
        this.currentPopupConversionTask = EPopupConversionTask.SELECT_OPTION;
        break;
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
          conversationIds: messages.map((m) => m.conversationId),
          mailBoxId: this.currentMailboxId,
          currentStatus: this.queryParams[EMessageQueryType.MESSAGE_STATUS],
          newLabelId: folderData.internalId
        });
        break;
    }
  }

  handleDropMessageToFolder($event) {
    this.inboxExpandService.handleCollapseFolder();
    let elmDrop = this.taskDragDropService.getRootElement(
      $event.dropPoint,
      'drop_task--folder'
    );

    if (!elmDrop || this.isMoving) return;

    const folderData = {
      folderMailBoxId: elmDrop?.getAttribute('folder-mailbox-id'),
      folderUid: elmDrop?.getAttribute('folder-uid'),
      folderType: elmDrop?.getAttribute('folder-type'),
      folderStatus: elmDrop?.getAttribute('folder-status') as TaskStatusType,
      ...JSON.parse(elmDrop?.getAttribute('folder-data'))
    };

    if (this.isSelectedMove) {
      this.handleDropSelectedMessageToFolder(folderData, $event.item.data);
      return;
    }

    const message: TaskItem = $event.item.data;
    switch (folderData.folderType) {
      case EFolderType.TASKS:
        this.folderUid = folderData.folderUid;
        this.inboxService.createTaskByMoveToTaskDragDrop.next({
          folderId: this.folderUid,
          isDragDrop: true
        });
        this.currentMessage = message;
        this.currentPopupConversionTask = EPopupConversionTask.SELECT_OPTION;
        break;
      case EFolderType.MORE:
      case EFolderType.EMAIL:
        if (
          folderData.folderMailBoxId !== message.mailBoxId ||
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
        if (
          !folderData?.moveAble ||
          folderData.folderMailBoxId !== message.mailBoxId
        ) {
          this.toastService.clear();
          this.toastService.success(CAN_NOT_MOVE);
          return;
        }
        const payload = {
          conversationIds: [message.conversations[0].id],
          mailBoxId: this.currentMailboxId,
          currentStatus: message.status,
          newLabelId: folderData.internalId
        };
        this.handleMoveToMailFolder(payload);
        break;
    }
  }

  handleMoveToMessageFolder(data: TaskItem[], status: TaskStatusType) {
    if (
      this.queryParams[EMessageQueryType.MESSAGE_STATUS] ===
        TaskStatusType.deleted &&
      status === TaskStatusType.completed
    ) {
      this.toastService.clear();
      this.toastService.success(CAN_NOT_MOVE);
      return;
    }

    this.isMoving = true;
    const conversationIds = data.map((m) => m.conversationId);
    const tasksData = data.map((item) => ({
      id: item.id,
      conversationId: item.conversationId || item.conversations?.[0]?.id,
      taskType: item.taskType
    }));
    this.toastService.show(
      conversationIds.length > 1
        ? MESSAGES_MOVING_TO_TASK
        : MESSAGE_MOVING_TO_TASK,
      '',
      { disableTimeOut: false },
      'toast-syncing-custom'
    );

    this.taskService
      .changeTaskStatusMultiple(tasksData, status)
      .pipe(
        tap(() => {
          this.handleToastByStatus(status, conversationIds, data);
          this.taskService.removeTasks$.next(conversationIds);
          this.messageList = this.messageList.filter(
            (item) => !conversationIds.includes(item.conversationId)
          );
          this.handleSetIsMessageIdsEmpty();
          this.resetSelectedMessage();
          this.isMoving = false;
        }),
        mergeMap(() => this.statisticService.statisticTotalTask$),
        first()
      )
      .subscribe({
        next: () => {
          this.statisticService.updateStatisticTotalTask(
            this.queryParams[ETaskQueryParams.TASKTYPEID] ||
              this.queryParams[EMessageQueryType.MESSAGE_STATUS],
            -conversationIds.length
          );
        },
        error: () => {
          this.handleMoveError();
        }
      });
  }

  handleMoveToMailFolder(payload: IMailFolderQueryParams) {
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

  handleMoveError() {
    this.isMoving = false;
    this.toastService.clear();
    this.toastService.error(MOVE_MESSAGE_FAIL);
  }

  handleBackPopupCreateTask() {
    this.currentPopupConversionTask = EPopupConversionTask.SELECT_OPTION;
  }

  stopProcessCreateNewTask() {
    this.sharedMessageViewService.setPrefillCreateTaskData(null);
  }

  handleConvertToTaskSuccess(value) {
    this.inboxService.onBulkCreateTaskSuccess$.next(value);
    if (value.length === 1) {
      const dataForToast = {
        taskId: value[0].taskId,
        isShowToast: true,
        type: SocketType.messageToTask,
        targetFolderName: this.targetFolderName,
        mailBoxId: this.currentMailboxId,
        taskType: TaskType.TASK,
        pushToAssignedUserIds: []
      };
      this.toastCustomService.openToastCustom(
        dataForToast,
        true,
        EToastCustomType.SUCCESS_WITH_VIEW_BTN
      );
    } else {
      this.toastService.success(
        `${value.length} messages moved to ${this.targetFolderName} folder`
      );
    }
    this.currentPopupConversionTask = null;
    this.inboxToolbarService.setInboxItem([]);
    this.inboxToolbarService.setListToolbarConfig([]);
    this.inboxService.isBackToModalConvertToTask.next(false);
  }

  handleOpenConvertToTask() {
    if (this.isSelectedMove) {
      this.openFrom = CreateTaskByCateOpenFrom.CREATE_MULTIPLE_TASK;
      this.conversationService
        .convertMultipleTask({
          conversationIds: this.movingMessages.map((m) => m.conversationId)
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: IListConvertMultipleTask) => {
          if (res) {
            this.currentPopupConversionTask = EPopupConversionTask.CREATE_TASK;
            this.dataConvert = res?.listConversationMove.concat(
              res?.listConversationNotMove
            );
            this.confirmPropertyData = res;
          }
        });
    } else {
      this.sharedMessageViewService.setPrefillCreateTaskData(
        this.currentMessage
      );
      const conversation = this.currentMessage.conversations[0];
      this.createNewTaskPopUpService.setFocusedConversation(conversation);
      let selectedCategoryID = conversation?.categoryId;
      if (conversation?.trudiResponse) {
        this.conversationService.superHappyPathTrudiResponse.next(
          conversation?.trudiResponse
        );
      }
      const propertyId = this.messageMenuService.checkToShowAllProperty(
        this.currentMessage
      )
        ? ''
        : this.currentMessage.property?.id;

      this.propertiesService
        .getAgencyProperty(conversation.userId, propertyId)
        .subscribe((activeProperty) => {
          this.openFrom = CreateTaskByCateOpenFrom.MESSAGE;
          this.currentPopupConversionTask = EPopupConversionTask.CREATE_TASK;
          this.activeProperty = activeProperty;
          this.categoryID = selectedCategoryID;
          this.taskNameList = this.taskService.createTaskNameList();
        });
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

  get subtitleMoveToTask() {
    return `${this.movingMessages?.length}  ${
      this.movingMessages?.length > 1
        ? ' messages selected'
        : ' message selected'
    }`;
  }

  handleBulkCreateTasks() {
    this.openFrom = CreateTaskByCateOpenFrom.CREATE_BULK_MULTIPLE_TASK;
    const listConversationId = this.taskService.listconversationId.getValue();
    const payload = { conversationIds: listConversationId };

    this.conversationService
      .convertMultipleTask(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: IListConvertMultipleTask) => {
        if (res) {
          this.dataConvert = res?.listConversationMove.concat(
            res?.listConversationNotMove
          );
          this.currentPopupConversionTask = EPopupConversionTask.CREATE_TASK;
          this.showBackBtn = false;
        }
      });
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
  }

  public get disableDragging() {
    return this.isConsole;
  }

  handleMoveToEmail(message: TaskItem) {
    if (!message) {
      return;
    }
    this.conversationService.selectedConversation.next(
      message.conversations[0]
    );
    this.inboxService.setPopupMoveToTaskState(
      EPopupMoveMessToTaskState.MOVE_MESSAGE_TO_EMAIL_FOLDER
    );
  }

  handleReportSpam(message: TaskItem) {
    if (!message) {
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
      conversationIds: [message.conversations[0].id],
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

  handleBackPopupMoveTask() {
    this.currentPopupConversionTask = EPopupConversionTask.SELECT_OPTION;
  }

  stopMoveToTaskFolder() {
    this.currentPopupConversionTask = null;
  }

  handleOpenMoveToTask(
    openByTriggerToggleMoveConversationSate: boolean = false
  ) {
    if (this.isSelectedMove && !openByTriggerToggleMoveConversationSate) {
      this.inboxService.setPopupMoveToTaskState(
        EPopupMoveMessToTaskState.MOVE_MESSAGE_TO_TASK
      );
      this.inboxService.setMoveToFolderId(this.folderUid);
      this.currentPopupConversionTask = null;
    } else {
      this.isUnHappyPath = this.currentMessage?.isUnHappyPath;
      this.targetConversationId = this.currentMessage.conversations[0].id;
      this.currentPropertyId = this.currentMessage.property.isTemporary
        ? null
        : this.currentMessage.property.id;
      this.sharedMessageViewService.setPrefillCreateTaskData(
        this.currentMessage
      );
      this.currentPopupConversionTask = EPopupConversionTask.MOVE_TASK;
    }
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
    this.shouldAutoScrollToMessage = false;
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

  subscribeSyncAttachmentMailClient() {
    this.websocketService.onSyncAttachmentMailClient
      .pipe(
        takeUntil(this.destroy$),
        filter((res) => res?.mailBoxId === this?.currentMailboxId),
        distinctUntilChanged((prev, cur) =>
          isEqual(prev.threadIds, cur.threadIds)
        )
      )
      .subscribe((res) => {
        if (!Array.isArray(res.threadIds)) return;
        for (const task of this.messageList) {
          if (this.skipTask(task.id)) continue;
          if (
            task?.conversations?.[0] &&
            res.threadIds.includes(task.conversations[0].threadId)
          ) {
            task.conversations[0].isSyncedAttachment = true;
          }
        }
      });
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
        (item) => item.conversationId === this.queryConversationId
      );
    }
    const isIndexEmail = this.router.url.includes('inbox/messages');
    this.activeMsgList = selectedItems(
      event.isKeepShiftCtr,
      this.startIndex,
      event.lastIndex,
      this.activeMsgList,
      this.messageList,
      isIndexEmail
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
    this.navigateMessage(SiblingEnum.nextElementSibling);
  }

  handleNavigatePreMessage() {
    this.navigateMessage(SiblingEnum.previousElementSibling, true);
  }

  navigateMessage(type, navigatePreMessage: boolean = false) {
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
      callback: () => this._handleNavigateMessageDetail(dataSet)
    });
  }

  private updateQueryParameters(dataSet) {
    if (dataSet?.conversationId && dataSet?.taskId) {
      this.queryConversationId = dataSet.conversationId;
      this.queryTaskId = dataSet.taskId;
      this.cdr.markForCheck();
    }
  }

  private _handleNavigateMessageDetail(data: {
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
        queryParams: {
          taskId,
          conversationId
        },
        queryParamsHandling: 'merge'
      })
      .then(() => {
        this.messageTaskLoadingService.onLoading();
        this.taskService.triggerOpenMessageDetail.next(taskId);
        this.messageIdSetService.setIsMessageIdsEmpty(false);
        isReset && this.taskService.setSelectedConversationList([]);
      });
  }

  subscribeSocketSyncMailboxProgress() {
    this.websocketService.onSocketSyncMailboxProgress
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        filter((res) => res?.mailBoxId === this.currentMailboxId)
      )
      .subscribe((res) => {
        if (res) {
          this.lastPage = false;
        }
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

  private subscribeToSocketUpdateMsgFolder() {
    this.websocketService.onSocketUpdateMsgFolder
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: ISocketUpdateMsgFolder) => {
        if (!data) return;
        const msgAddedInbox = data.messagesAddedInbox;
        const msgDeleteInbox = data.messagesDeletedInbox;
        const isInbox =
          this.queryParams[EMessageQueryType.MESSAGE_STATUS] ===
          TaskStatusType.inprogress;
        if (msgAddedInbox?.length > 0 && isInbox) {
          const payload = { taskIds: msgAddedInbox };
          this.fetchAndMergeNewMessages(payload);
        }
        if (msgDeleteInbox?.length > 0 && isInbox) {
          const messageRemove = this.messageList.find(
            (item) => msgDeleteInbox.includes(item.conversationId) // check socket email provider
          );
          if (messageRemove) {
            this.removeMessage(messageRemove);
          }
        }
      });
  }

  private handleRemoveFromTask(message: TaskItem) {
    const conversation = message?.conversations?.[0];
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
      .deleteConversationFromTaskHandler(conversation?.id)
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
        const isSkip =
          this.conversationScheduleIdNeedToSkip &&
          (response.conversationId === this.conversationScheduleIdNeedToSkip ||
            response.conversationIds?.includes(
              this.conversationScheduleIdNeedToSkip
            ));

        if (isSkip) {
          this.conversationScheduleIdNeedToSkip = null;
          return;
        }
        let clonedMessage = cloneDeep(this.messageList) ?? [];
        const { type } = response;
        if (
          type === SocketType.newScheduleJob &&
          response.conversationIds?.length
        ) {
          response.conversationIds.forEach((conversationId) => {
            const message = clonedMessage.find((message) =>
              message?.conversations?.some((con) => con.id === conversationId)
            );
            const conversation = message?.conversations?.find(
              (con) => con.id === conversationId
            );
            if (!conversation) {
              return;
            }
            if (!Number.isInteger(conversation?.scheduleMessageCount)) {
              conversation.scheduleMessageCount = 0;
            }
            conversation.scheduleMessageCount++;
          });
        } else {
          const messageFound = clonedMessage.find(
            (message) =>
              message.id === response.taskId ||
              response.conversationId === message?.conversations?.[0]?.id ||
              response.conversationIds?.includes(
                message?.conversations?.[0]?.id
              )
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
                clonedMessage = clonedMessage.filter(
                  (message) =>
                    message.id !== response.taskId &&
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
              break;
          }
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

  ngOnDestroy() {
    this.store.dispatch(messagePageActions.exitPage());
    this.messageIdSetService.clear();
    this.messageTaskLoadingService.stopFullLoading();
    this.refreshMessageSubject$.complete();
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.scrollTimeOut);
    this.conversationService.trudiResponseConversation.next(null);
    this.inboxService.justNavigateToMessageItem = false;
  }
}
