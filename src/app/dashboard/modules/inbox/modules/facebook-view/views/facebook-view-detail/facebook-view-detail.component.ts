import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { EDataE2EReassignModal } from '@/app/shared/enum/E2E.enum';
import {
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  forkJoin,
  lastValueFrom,
  map,
  of,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import {
  EMessageType,
  EPropertyStatus,
  SocketType,
  TaskStatusType
} from '@/app/shared/enum';
import { CompanyService } from '@/app/services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ETypePage } from '@/app/user/utils/user.enum';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { UserProperty } from '@/app/shared/types/users-by-property.interface';
import { SharedService } from '@services/shared.service';
import { whiteListInMsgDetail } from '@/app/shared/constants/outside-white-list.constant';
import {
  EConversationStatus,
  FacebookQueryType,
  IFacebookMessage,
  IHeaderContact,
  IHistoryListResponse,
  MenuOption
} from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  DEBOUNCE_SOCKET_TIME,
  SHORT_ISO_DATE,
  SYNC_PT_FAIL
} from '@/app/services/constants';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { EMessageMenuOption } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import {
  EBehaviorScroll,
  isScrolledIntoView
} from '@/app/shared/utils/helper-functions';
import { facebookDetailApiActions } from '@/app/core/store/facebook-detail/actions/facebook-detail-api.actions';
import { Store } from '@ngrx/store';
import {
  selectFetching,
  selectMessages,
  selectTask
} from '@/app/core/store/facebook-detail';
import { FacebookService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook.service';
import {
  CurrentUser,
  FileCarousel,
  HandleInitAISummaryContent,
  ICompany,
  IFile,
  IGroupedMessage,
  IUserParticipant,
  PreviewConversation,
  SendOption,
  SocketMessage,
  TaskItem,
  UserConversation
} from '@/app/shared';
import { ToastrService } from 'ngx-toastr';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { RxWebsocketService } from '@/app/services/rx-websocket.service';
import { FacebookApiService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook-api.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import {
  ESentMsgEvent,
  ISendMsgPayload
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  IMessengerTriggerSendMsgEvent,
  MessengerInlineEditorComponent
} from '@/app/dashboard/modules/inbox/modules/facebook-view/components/messenger-inline-editor/messenger-inline-editor.component';
import { ConversationService } from '@/app/services/conversation.service';
import { ReplyMessageService } from '@/app/services/reply-message.service';
import { FacebookViewDetailHeaderComponent } from '@/app/dashboard/modules/inbox/modules/facebook-view/components/facebook-view-detail-header/facebook-view-detail-header.component';
import { AppChatUtil } from '@/app/task-detail/modules/app-chat/app-chat-util';
import { UserService } from '@/app/services/user.service';
import { ETriggeredBy } from '@/app/shared/enum';
import { EUserSendType } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.enum';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import { isValidMessageForMarkerNewForYou } from '@/app/dashboard/modules/inbox/modules/facebook-view/utils/function';
import { TaskService } from '@/app/services/task.service';
import { PropertiesService } from '@/app/services/properties.service';
import { ChatGptService, EBoxMessageType, FilesService } from '@/app/services';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { AppChatService } from '@/app/task-detail/modules/app-chat/app-chat.service';

const defaultConfigs = {
  'header.hideSelectProperty': true,
  'header.title': null,
  'header.showDropdown': false,
  'body.prefillReceivers': false,
  'body.tinyEditor.isShowDynamicFieldFunction': true,
  'footer.buttons.nextTitle': 'Send',
  'footer.buttons.showBackBtn': false,
  'footer.buttons.disableSendBtn': false,
  'otherConfigs.isCreateMessageType': false,
  'otherConfigs.createMessageFrom': ECreateMessageFrom.MESSENGER,
  'inputs.rawMsg': '',
  'inputs.openFrom': '',
  'inputs.listOfFiles': [],
  'inputs.selectedTasksForPrefill': null,
  'inputs.isForwardDocument': false,
  'inputs.isMessengerMessage': true
};

interface IFetchHistorySubject {
  isViewMostRecent: boolean;
  direction: 'up' | 'down';
  triggeredBy: ETriggeredBy;
  options?: Partial<{
    messageId: string;
    callback: () => void;
    useMaster: boolean;
  }>;
}

@Component({
  selector: 'facebook-view-detail',
  templateUrl: './facebook-view-detail.component.html',
  styleUrl: './facebook-view-detail.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class FacebookViewDetailComponent
  implements OnInit, AfterViewChecked, OnChanges, OnDestroy
{
  @ViewChild('headerSection', { static: false })
  headerSection: FacebookViewDetailHeaderComponent;
  @ViewChild('messageSection') messageSection: ElementRef;
  @ViewChild('composeMessage')
  inlineMessageEditorRef: MessengerInlineEditorComponent;
  @Input() currentSyncStatus: {
    status: string;
    conversationSyncDocumentAt: string;
  };
  @Input() isLoadingIndex: boolean;

  isPropertyProfileVisible: boolean = false;
  isUserProfileDrawerVisible: boolean = false;
  isViewMostRecentButtonVisible: boolean = false;
  isViewMostRecent: boolean = false;
  isRmEnvironment: boolean = false;
  isConsole: boolean = false;
  isUserVerified: boolean = true;
  isFetchingOlderMessages: boolean = false;
  isFetchingNewerMessages: boolean = false;
  initialScrollDone: boolean = false;
  showHeaderContactTooltip: boolean = false;
  isLoadingDetail: boolean = false;
  canLoadOldMessages: boolean = true;
  canLoadNewMessages: boolean = true;
  lastReadMessageId: string;
  formSelectProperty: FormGroup;
  currentDataUserProfile: UserProperty;
  currentParams: Params;
  toolTipProperty: string = '';
  crmSystemId: string = '';
  prevFacebookConversationId: string = '';
  prevFacebookTaskId: string = '';
  listMessages: IFacebookMessage[] = [];
  scrollBottomTimeOut: NodeJS.Timeout = null;
  oldestMessageTime = null;
  mostRecentMessageTime = null;
  enableAIReply: boolean = false;
  currentConversation: PreviewConversation;
  currentTask: TaskItem;
  groupedMessages: IGroupedMessage[] = [];
  headerContact: IHeaderContact;
  messengerConversationConfigs = defaultConfigs;
  currentMailboxId: string;
  messageSectionHeight: number;
  fetching: boolean = false;
  isArchivedMailbox: boolean = false;
  readonly EDataE2EReassignModal = EDataE2EReassignModal;
  readonly EPropertyStatus = EPropertyStatus;
  readonly ETypePage = ETypePage;
  readonly EConversationStatus = EConversationStatus;
  readonly EMessageMenuOption = EMessageMenuOption;
  readonly MenuOption = MenuOption;
  readonly whiteListMsgDetail = [...whiteListInMsgDetail];
  readonly SYNC_PT_FAIL = SYNC_PT_FAIL;
  readonly EBehaviorScroll = EBehaviorScroll;
  private destroy$ = new Subject<void>();
  private fetchHistory$ = new Subject<IFetchHistorySubject>();
  private currentCompany: ICompany = null;
  private currentUser: CurrentUser = null;
  private cacheBodyMessages: Map<string, ISendMsgPayload> = new Map();
  private listTempId: Map<string, string> = new Map();
  public isDisabledJoinButton: boolean = false;
  private tabChange: boolean = false;
  private countSocketSend: number = 0;
  private eventChangeTab: (e: Event) => void;
  private eventChangeListenerBound: boolean = false;
  public showJoinConversationButton: boolean = true;

  constructor(
    private readonly router: Router,
    private readonly renderer: Renderer2,
    private readonly elr: ElementRef,
    private readonly store: Store,
    private readonly ngZone: NgZone,
    private readonly toastrService: ToastrService,
    private readonly facebookService: FacebookService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly sharedService: SharedService,
    private readonly companyService: CompanyService,
    private readonly agencyService: AgencyService,
    private readonly agencyDateFormatService: AgencyDateFormatService,
    private readonly userProfileDrawerService: UserProfileDrawerService,
    private readonly inboxService: InboxService,
    private readonly websocketService: RxWebsocketService,
    private readonly facebookApiService: FacebookApiService,
    private readonly conversationService: ConversationService,
    private readonly replyMessageService: ReplyMessageService,
    private readonly userService: UserService,
    private readonly taskApiService: TaskApiService,
    private readonly taskService: TaskService,
    private readonly chatGptService: ChatGptService,
    private readonly propertyService: PropertiesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastCustomService: ToastCustomService,
    private readonly appChatService: AppChatService,
    private readonly filesService: FilesService
  ) {
    this.isConsole = this.sharedService.isConsoleUsers();
  }

  ngOnInit(): void {
    this.getCurrentMailboxId();
    this.onTriggerScrollToElement();
    this.fetchInitialData();
    this.onStoreChange();
    this.buildReassignPropertyForm();
    this.getCurrentCompany();
    this.getCurrentUser();
    this.subscribeToSocketQueue();
    this.subscribeToMenuClicks();
    this.subscribeIsShowDrawerViewUserProfile();
    this.subscribeReloadFacebookDetail();
    this.subscribeFetchHistory();
    this.subscribeSocketSend();
    this.subscribeMailboxStatus();
    this.subscribeSocketMessage();
    this.subscribeSocketMarkRead();
    this.subscribeSocketDeleteSecondaryContact();
    this.subscribeSocketAssignContact();
    this.subscribeFetchingState();
    this.subscribeLoadingChangeMenuAction();
    this.subscribeChatGptOnGenerate();
    this.subscribeSocketPmJoinConverstation();
    this.subscribeNewTicket();
    this.subscribeSocketReactionMessage();
    this.subscribeEventChangeTab();
  }

  subscribeEventChangeTab() {
    this.eventChangeTab = (e: CustomEvent) => {
      if (document.visibilityState === 'visible') {
        this.tabChange = false;
      } else {
        this.tabChange = true;
        this.countSocketSend = 0;
      }
    };
    if (!this.eventChangeListenerBound) {
      window.document.addEventListener(
        'visibilitychange',
        this.eventChangeTab,
        false
      );
      this.eventChangeListenerBound = true;
    }
  }

  ngAfterViewChecked(): void {
    if (
      !this.initialScrollDone &&
      this.messageSectionElement &&
      !this.fetching
    ) {
      if (this.lastReadMessageId) {
        this.scrollToMessage(this.lastReadMessageId, false, 1000);
      } else {
        this.scrollToBottom(EBehaviorScroll.SMOOTH);
        this.canLoadNewMessages = false;
      }
      this.initialScrollDone = true;
      this.messageSectionHeight = this.messageSectionElement?.offsetHeight;
      this.cdr.detectChanges();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentSyncStatus']) {
      if (!this.currentTask) return;
      const conversation = this.currentTask.conversations[0];
      const { status, conversationSyncDocumentAt } = this.currentSyncStatus;
      if (!status) {
        this.store.dispatch(
          facebookDetailApiActions.updateFacebookTask({
            task: { ...this.currentTask }
          })
        );
        return;
      }
      conversation.syncStatus = status;
      conversation.conversationSyncDocumentStatus = status;
      conversation.conversationSyncDocumentAt = conversationSyncDocumentAt;
      this.store.dispatch(
        facebookDetailApiActions.updateFacebookTask({
          task: { ...this.currentTask }
        })
      );
    }
  }

  get messageSectionElement(): HTMLElement {
    return this.messageSection?.nativeElement;
  }

  get hasScroll(): boolean {
    return (
      this.messageSectionElement &&
      this.messageSectionElement.scrollHeight >
        this.messageSectionElement.clientHeight
    );
  }

  get scrolledDown(): boolean {
    if (!this.messageSectionElement) return false;
    const scrollPosition =
      this.messageSectionElement.scrollHeight -
      this.messageSectionElement.clientHeight;
    return this.messageSectionElement.scrollTop + 50 >= scrollPosition;
  }

  get propertyIdFormControl(): AbstractControl<string> {
    return this.formSelectProperty.get('propertyId');
  }

  subscribeChatGptOnGenerate() {
    this.chatGptService.onGenerate
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (!data) return;
        this.AIgenerateReply(
          data.show,
          data.isTellAIToGenerate,
          data.messageId
        );
      });
  }

  async AIgenerateReply(
    show: boolean,
    isTellAIToGenerate: boolean,
    messageId: string
  ) {
    try {
      const matchedMessage = this.listMessages.find(
        (msg) => msg.id === messageId
      );
      const listMessages: any = matchedMessage
        ? [matchedMessage]
        : this.listMessages;
      const data = await lastValueFrom(
        this.chatGptService.generateReply(
          listMessages,
          this.companyService.currentCompanyId() || '',
          show,
          isTellAIToGenerate,
          messageId,
          this.currentConversation?.lastSessionId,
          true
        )
      );
      const content = !!messageId ? data?.content : data?.content?.content;
      if (!content) return;
      const lines = this.chatGptService.processContentAI(content);
      const paragraphs = lines.map(
        (line: string) => `<p>${line || '&nbsp;'}</p>`
      );
      const outputHTML = paragraphs.join('');
      const initAISummaryContent = HandleInitAISummaryContent(outputHTML);
      if (show) {
        this.chatGptService.replyContent.next(initAISummaryContent);
        this.chatGptService.replyFrom.next(EBoxMessageType.INLINE_MESSAGE);
        this.chatGptService.onGenerated.next({
          type: EBoxMessageType.INLINE_MESSAGE,
          status: true
        });
      }
    } catch (_error) {
      console.debug(_error, '_error');
      this.toastrService.error('Unable to create message');
    }
  }

  private subscribeFetchingState(): void {
    this.store
      .select(selectFetching)
      .pipe(takeUntil(this.destroy$))
      .subscribe((fetching) => {
        this.fetching = fetching;
      });
  }

  private subscribeLoadingChangeMenuAction() {
    this.inboxService.isLoadingDetail
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.isLoadingDetail = res;
      });
  }

  private subscribeSocketAssignContact() {
    this.websocketService.onSocketAssignContact
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (contact) =>
            contact.taskId === this.currentTask?.id &&
            contact.conversationId === this.currentConversation?.id &&
            contact.participants?.length > 0
        )
      )
      .subscribe((res) => {
        this.facebookService.setReloadFacebookDetail();
      });
  }

  triggerUpdateConversation(value) {
    if (value?.id !== this.currentConversation?.id) return;
    this.currentConversation = { ...this.currentConversation, ...value };
    this.currentTask = {
      ...this.currentTask,
      conversations: [this.currentConversation]
    };
  }

  private subscribeSocketDeleteSecondaryContact() {
    this.websocketService.onSocketDeleteSecondaryContact
      .pipe(
        takeUntil(this.destroy$),
        filter(
          (contact) =>
            contact.taskId === this.currentTask?.id &&
            contact.conversationId === this.currentConversation?.id &&
            contact.participants?.length > 0
        )
      )
      .subscribe((res) => {
        const newParticipant = res.participants.find(
          (participant) => participant.isTemporary
        );
        newParticipant &&
          this.conversationService.setParticipantChanged(
            newParticipant as IUserParticipant
          );
        this.facebookService.setReloadFacebookDetail();
      });
  }

  private highlightElement(element: HTMLElement): void {
    this.renderer.addClass(element, 'message-highlighted');
    setTimeout(() => {
      this.renderer.removeClass(element, 'message-highlighted');
    }, 1000);
  }

  msgScrollTimer: NodeJS.Timeout = null;
  private scrollToMessage(
    messageId: string,
    highlightMessage: boolean,
    timer: number
  ): void {
    if (this.msgScrollTimer) {
      clearTimeout(this.msgScrollTimer);
    }
    this.msgScrollTimer = setTimeout(() => {
      const messageElement = this.elr.nativeElement.querySelector(
        `#message-${messageId}`
      ) as HTMLElement;
      if (!messageElement) return;
      const HEADER_HEIGHT = 81;
      if (
        highlightMessage &&
        isScrolledIntoView(messageElement, HEADER_HEIGHT)
      ) {
        this.highlightElement(messageElement);
        return;
      }
      messageElement.scrollIntoView({
        behavior: 'smooth'
      });
      highlightMessage && this.highlightElement(messageElement);
    }, timer);
  }

  private onTriggerScrollToElement(): void {
    this.replyMessageService.triggerScrollToElement
      .pipe(takeUntil(this.destroy$))
      .subscribe((messageId) => {
        if (this.listMessages.some((msg) => msg.id === messageId)) {
          this.scrollToMessage(messageId, true, 10);
        } else {
          this.fetchHistory$.next({
            isViewMostRecent: false,
            direction: 'up',
            triggeredBy: ETriggeredBy.SCROLL_EVENT,
            options: {
              messageId,
              callback: () => this.scrollToMessage(messageId, true, 10)
            }
          });
        }
      });
  }

  private getCurrentMailboxId(): void {
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentMailboxId) => {
        this.currentMailboxId = currentMailboxId;
      });
  }

  private getCurrentUser(): void {
    this.userService.userInfo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
      });
  }

  private subscribeMailboxStatus(): void {
    combineLatest([
      this.inboxService.getIsDisconnectedMailbox(),
      this.inboxService.isArchiveMailbox$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([isArchiveMailbox, isDisconnectedMailbox]) => {
        this.isArchivedMailbox = isArchiveMailbox;
        this.messengerConversationConfigs['footer.buttons.disableSendBtn'] = [
          isArchiveMailbox,
          isDisconnectedMailbox
        ].includes(true);
      });
  }

  private subscribeSocketSend(): void {
    this.websocketService.onSocketSend
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        filter((res) => {
          const isCurrentCv =
            this.currentConversation &&
            res?.conversationId === this.currentConversation?.id;
          if (isCurrentCv && this.tabChange) {
            this.countSocketSend += 1;
          }
          return (
            isCurrentCv &&
            (res?.userId !== this.currentUser?.id ||
              res?.messageType === EMessageType.syncConversation)
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        data?.['messages']?.forEach((item) => {
          this.listTempId.set(item.tempId, item.id);
        });
        this.fetchHistory$.next({
          isViewMostRecent: true,
          direction: 'down',
          triggeredBy: ETriggeredBy.SOCKET_EVENT,
          options: {
            useMaster: true,
            callback: () => {
              if (!this.isViewMostRecentButtonVisible || !this.hasScroll) {
                this.scrollToBottom(EBehaviorScroll.SMOOTH);
              }
            }
          }
        });
      });
  }

  private subscribeSocketMessage(): void {
    this.websocketService.onSocketMessage
      .pipe(
        debounceTime(100),
        filter(
          (res) =>
            this.currentConversation &&
            res &&
            res.companyId === this.currentCompany?.id &&
            res.mailBoxId === this.currentMailboxId &&
            (res.taskIds?.includes(this.currentTask?.id) ||
              res.taskId === this.currentTask?.id)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        switch (res.type) {
          case SocketType.changeStatusTask:
            this.changeStatusTaskHandler(res);
            break;
          case SocketType.newMessages:
            this.fetchNewMessagesHandler(res);
            break;
          default:
            break;
        }
      });
  }

  private subscribeSocketMarkRead() {
    this.websocketService.onSocketMarkRead
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && res.conversationId === this.currentConversation?.id) {
          this.listMessages = this.listMessages.map((msg) =>
            msg.isRead
              ? msg
              : {
                  ...msg,
                  isRead: true
                }
          );
          this.store.dispatch(
            facebookDetailApiActions.updateFacebookMessages({
              messages: this.listMessages
            })
          );
        }
      });
  }

  private changeStatusTaskHandler(res: SocketMessage): void {
    if (
      res.isAutoReopen &&
      res.fromUserId === this.currentUser?.id &&
      res.newStatus === TaskStatusType.inprogress
    ) {
      this.facebookService.setReloadFacebookDetail();
      this.router.navigate(['dashboard/inbox/facebook-messages', 'all'], {
        queryParams: {
          status: TaskStatusType.inprogress,
          conversationId: this.currentConversation?.id
        },
        queryParamsHandling: 'merge'
      });
      this.toastrService.success('Message reopened');
    }
  }

  private fetchNewMessagesHandler(res: SocketMessage): void {
    if (res.isAutoReopenedByPM) return;
    if (res.isDetectedContact && !this.currentConversation.isDetectedContact) {
      this.facebookService.setReloadFacebookDetail();
    }
    this.fetchHistory$.next({
      isViewMostRecent: true,
      direction: 'down',
      triggeredBy: ETriggeredBy.SOCKET_EVENT,
      options: {
        useMaster: true,
        callback: () => {
          if (!this.isViewMostRecentButtonVisible || !this.hasScroll) {
            this.scrollToBottom(EBehaviorScroll.SMOOTH);
          }
        }
      }
    });
  }

  private dispatchZone(taskId: string, conversationId: string): void {
    this.ngZone.run(() =>
      this.store.dispatch(
        facebookDetailApiActions.setCurrentFacebookDetail({
          taskId,
          conversationId
        })
      )
    );
  }

  private handleNewConv(task: TaskItem) {
    if (this.currentConversation?.id === task?.conversations?.[0].id) {
      return;
    }
    this.replyMessageService.triggerReply.next(null);
  }

  private onStoreChange(): void {
    const task$ = combineLatest({
      store: this.store.select(selectTask)
    }).pipe(
      tap(({ store }) => {
        if (!store) return;
        this.handleNewConv(store);
        this.facebookService.setCurrentFacebookTask(store);
        this.currentTask = store;
        this.propertyService.currentPropertyId.next(store?.property?.id);
        this.taskService.currentTask$.next(store);
        this.currentConversation = {
          ...this.currentTask.conversations[0],
          syncStatus: this.currentSyncStatus?.status
        };
        this.conversationService.setCurrentConversation({
          ...this.currentConversation,
          isTemporaryProperty: this.currentTask.property?.isTemporary
        } as UserConversation);
        if (this.currentConversation) {
          this.messengerConversationConfigs['serviceData.conversationService'] =
            {
              currentConversation: this.currentConversation
            };
          this.isUserVerified =
            this.currentConversation?.isPmJoined &&
            this.currentConversation?.lastPmJoined?.id === this.currentUser.id;
          if (this.isUserVerified) {
            this.showJoinConversationButton = true;
          }
        }
      })
    );

    const messages$ = this.store.select(selectMessages).pipe(
      filter((messages) => !!messages.length),
      tap((messages) => {
        this.listMessages = this.mapReactionForMessageFile(messages)
          .filter(
            (msg) =>
              (msg.isSending ||
                !!msg.message?.trim() ||
                (!msg.message?.trim() &&
                  msg.messageType?.toUpperCase() !==
                    EMessageType.defaultText) ||
                this.isHasBulkMessageImage(msg, messages)) &&
              !msg.isDraft
          )
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        this.lastReadMessageId = this.listMessages.find(
          (msg) => msg.isLastReadMessage
        )?.id;
        this.oldestMessageTime = this.listMessages[0]?.createdAt;
        this.mostRecentMessageTime =
          this.listMessages[this.listMessages.length - 1]?.createdAt;
        this.enableAIReply =
          this.listMessages[this.listMessages.length - 1]?.userSendType ===
          EUserSendType.USER;
        const messagesWithFiles = this.groupMessageViaEmail(this.listMessages);
        this.groupedMessages = this.groupMessagesByDate(messagesWithFiles);
      })
    );

    combineLatest({
      task: task$,
      messages: messages$
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isLoadingDetail = !this.groupedMessages.length;
      });
  }

  isHasBulkMessageImage(
    message: IFacebookMessage,
    listMessages: IFacebookMessage[]
  ): boolean {
    const listBulkMessage = listMessages.filter(
      (msg) => msg.bulkMessageId === message.id
    );
    if (listBulkMessage.length <= 1) return false;
    return listBulkMessage.every(
      (msg) =>
        msg.file &&
        this.filesService.getFileTypeSlash(msg.file?.fileType?.name) === 'photo'
    );
  }
  groupMessageViaEmail(messages: IFacebookMessage[]) {
    let messageList = [...messages];
    let messageListObj = messageList.reduce((acc, curr) => {
      let parentMess = messageList.find((one) => one.id === curr.bulkMessageId);
      let isCurrBulkMessage = curr.bulkMessageId;
      if (!parentMess) {
        curr.bulkMessageId = null;
      }
      let listBulkMessage = messageList.filter(
        (item) => curr.id === item.bulkMessageId
      );
      let isGroup = listBulkMessage.every(
        (msg) =>
          msg.file &&
          this.filesService.getFileTypeSlash(msg.file?.fileType?.name) ===
            'photo'
      );
      if (!isGroup) {
        curr.bulkMessageId = null;
      }
      parentMess = {
        ...parentMess,
        files: {
          fileList: [],
          mediaList: [],
          unSupportedList: []
        }
      };
      if (curr.bulkMessageId) {
        if (parentMess?.files && acc.size === 0) {
          let prefillAttachments = {
            files: {
              fileList: [],
              mediaList: [],
              unSupportedList: []
            }
          };
          this.appChatService.mapFileMessageToMessage(prefillAttachments, curr);
          parentMess.files = {
            fileList: [
              ...parentMess.files.fileList,
              ...prefillAttachments.files.fileList
            ],
            mediaList: [
              ...parentMess.files.mediaList,
              ...prefillAttachments.files.mediaList
            ],
            unSupportedList: [
              ...parentMess.files.unSupportedList,
              ...prefillAttachments.files.unSupportedList
            ]
          };
        }
        return acc;
      }
      curr.bulkMessageId = isCurrBulkMessage;
      let fileList = messageList.filter(
        (item) => curr.id === item.bulkMessageId
      );
      curr = {
        ...curr,
        files: {
          fileList: [],
          mediaList: [],
          unSupportedList: []
        }
      };

      fileList.forEach((one) => {
        this.appChatService.mapFileMessageToMessage(curr, one);
      });

      acc.set(curr.id, curr);
      return acc;
    }, new Map());
    const result: IFacebookMessage[] = Array.from(messageListObj.values());
    return result;
  }

  private subscribeReloadFacebookDetail(): void {
    this.facebookService.reloadFacebookDetail$
      .pipe(
        switchMap(() => {
          if (this.currentTask) {
            return forkJoin({
              task: this.taskApiService.getTaskById(this.currentTask.id),
              history: this.facebookApiService.getMessengerHistory(
                this.currentConversation?.id,
                false,
                null,
                this.oldestMessageTime,
                true
              )
            });
          }
          return of({});
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res: { task: TaskItem; history: IHistoryListResponse }) => {
        const { task, history } = res || {};
        const updatedMessages = this.listMessages.map((message) => {
          const updatedMessage = history?.list?.find(
            (updatedMessage) => updatedMessage.id === message.id
          );
          return updatedMessage
            ? { ...updatedMessage, isLastReadMessage: false }
            : message;
        });
        const mostRecentMessageTime = Math.max(
          ...this.listMessages.map((message) =>
            new Date(message.createdAt).getTime()
          )
        );
        const newMessages = history?.list?.filter(
          (message) =>
            new Date(message.createdAt).getTime() > mostRecentMessageTime
        );
        this.store.dispatch(
          facebookDetailApiActions.updateFacebookTask({
            task
          })
        );
        this.store.dispatch(
          facebookDetailApiActions.updateFacebookMessages({
            messages: [...updatedMessages, ...newMessages]
          })
        );
      });
  }

  public handleResizeInlineMsg(value): void {
    // const currentDetailWrapperHeight =
    //   Number(this.heightDetailWrapper?.replace('px', '')) || 0;
    // const linkedConversationAppLogHeight = this.currentConversation
    //   ?.linkedConversationAppLog
    //   ? LINKED_CONVERSATION_HEIGHT
    //   : 0;
    // const currentInlineHeight =
    //   currentDetailWrapperHeight - this.chatHeaderHeight;
    // if (+currentInlineHeight !== value) {
    //   this.heightDetailWrapper = `calc(100% - ${
    //     value + this.chatHeaderHeight + linkedConversationAppLogHeight
    //   }px)`;
    //   this.cdr.markForCheck();
    // }
  }

  private subscribeFetchHistory(): void {
    this.fetchHistory$
      .pipe(
        switchMap(({ isViewMostRecent, direction, triggeredBy, options }) => {
          const before = direction === 'down' ? null : this.oldestMessageTime;
          const lastTime = new Date(
            new Date(this.mostRecentMessageTime).getTime() - 30000
          );
          const after = direction === 'down' ? lastTime.toISOString() : null;
          return this.facebookApiService
            .getMessengerHistory(
              this.currentConversation?.id,
              direction === 'down',
              before,
              after,
              isViewMostRecent,
              !!options?.useMaster,
              options?.messageId
            )
            .pipe(
              map((response) => ({
                response,
                isViewMostRecent,
                direction,
                triggeredBy,
                options
              }))
            );
        }),
        filter((response) => !!response),
        takeUntil(this.destroy$)
      )
      .subscribe(
        (data: {
          response: IHistoryListResponse;
          isViewMostRecent: boolean;
          direction: 'up' | 'down';
          triggeredBy: ETriggeredBy;
          options: {
            messageId?: string;
            callback?: () => void;
          };
        }) => {
          const {
            response,
            isViewMostRecent,
            direction,
            triggeredBy,
            options
          } = data || {};
          if (response.list.length > 0) {
            const listMessage = response.list.filter((one) => !one.isDraft);
            if (
              isViewMostRecent &&
              !this.scrolledDown &&
              [ETriggeredBy.SOCKET_EVENT].includes(triggeredBy)
            ) {
              this.isViewMostRecentButtonVisible = true;
              if (!this.listMessages.some((msg) => msg.isLastReadMessage)) {
                if (!this.setLastReadMessageInList(listMessage)) {
                  this.listMessages[
                    this.listMessages.length - 1
                  ].isLastReadMessage = true;
                }
              }
            }
            let updatedMessages = this.mergeHistoryMessages(
              listMessage,
              this.listMessages,
              direction
            );
            if (
              this.tabChange &&
              [ETriggeredBy.SOCKET_EVENT].includes(triggeredBy)
            ) {
              const index = listMessage.length - this.countSocketSend;
              if (listMessage.length > 0 && index >= 0 && listMessage[index]) {
                listMessage[index].isLastReadMessage = true;
              }
            }
            this.store.dispatch(
              facebookDetailApiActions.updateFacebookMessages({
                messages: updatedMessages
              })
            );
            if (!isViewMostRecent) {
              this.maintainScrollPosition();
            }
            if (response.list.length < 20) {
              if (direction === 'down') {
                this.canLoadNewMessages =
                  response.list.length > 0 &&
                  AppChatUtil.checkCanLoadNewMessage(
                    this.mostRecentMessageTime,
                    response.list
                  );
                this.isViewMostRecent = false;
              } else {
                this.canLoadOldMessages = response.list.length > 0;
              }
            }
          } else {
            if (direction === 'down') {
              this.canLoadNewMessages =
                response.list.length > 0 &&
                AppChatUtil.checkCanLoadNewMessage(
                  this.mostRecentMessageTime,
                  response.list
                );
              this.isViewMostRecent = false;
            } else {
              this.canLoadOldMessages = response.list.length > 0;
            }
          }
          if (direction === 'down') {
            this.isFetchingNewerMessages = false;
          } else {
            this.isFetchingOlderMessages = false;
          }
          if (options?.callback) {
            options.callback();
          }
        }
      );
  }

  private setLastReadMessageInList(responseList: IFacebookMessage[]): boolean {
    const allInvalidForMarkerNewForYou = responseList.every(
      (msg) => !isValidMessageForMarkerNewForYou(msg)
    );
    if (allInvalidForMarkerNewForYou) {
      return true;
    }
    for (let i = 0; i < responseList.length; i++) {
      if (isValidMessageForMarkerNewForYou(responseList[i])) {
        if (i > 0) {
          this.listMessages = this.listMessages.map((msg) => ({
            ...msg,
            isLastReadMessage: false
          }));
          responseList[i - 1].isLastReadMessage = true;
          return true;
        } else {
          return false;
        }
      }
    }
    return false;
  }

  private mergeHistoryMessages(
    responseList: IFacebookMessage[],
    listMessages: IFacebookMessage[],
    direction: 'up' | 'down'
  ): IFacebookMessage[] {
    const messageMap = new Map();
    listMessages.forEach((message) => {
      messageMap.set(message.id, message);
    });
    responseList.forEach((message) => {
      messageMap.set(message.id, message);
    });
    const updatedMessagesArray = Array.from(messageMap.values());
    const updatedMessages =
      direction === 'up'
        ? [
            ...responseList,
            ...updatedMessagesArray.filter(
              (msg) => !responseList.find((resMsg) => resMsg.id === msg.id)
            )
          ]
        : [
            ...updatedMessagesArray.filter(
              (msg) => !responseList.find((resMsg) => resMsg.id === msg.id)
            ),
            ...responseList
          ];
    return updatedMessages;
  }

  private fetchInitialData(): void {
    this.activatedRoute.queryParams
      .pipe(
        switchMap((params) => {
          this.currentParams = params;
          const facebookTaskId =
            params[FacebookQueryType.TASK_ID] ||
            this.activatedRoute.snapshot.paramMap.get(
              FacebookQueryType.TASK_ID
            );
          const facebookConversationId =
            params[FacebookQueryType.CONVERSATION_ID];
          if (
            (facebookConversationId &&
              facebookConversationId !== this.prevFacebookConversationId) ||
            (facebookTaskId && facebookTaskId !== this.prevFacebookTaskId)
          ) {
            this.scrollToBottom(EBehaviorScroll.AUTO);
            this.isLoadingDetail = true;
            this.prevFacebookConversationId = facebookConversationId;
            this.prevFacebookTaskId = facebookTaskId;
            this.resetData();
            this.dispatchZone(facebookTaskId, facebookConversationId);
          }
          return of({});
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private groupMessagesByDate(
    listMessages: IFacebookMessage[]
  ): IGroupedMessage[] {
    return Object.values(
      listMessages.reduce((acc, message) => {
        if (this.listTempId.has(message.id)) {
          // handle case socket send before API new message response success
          message.id = this.listTempId.get(message.id);
        }
        const date: string = this.agencyDateFormatService
          .agencyDayJs(message?.createdAt)
          .format(SHORT_ISO_DATE);
        if (!acc[date]) {
          acc[date] = {
            timestamp: date,
            messages: [message]
          };
        } else {
          acc[date].messages.push(message);
        }
        return acc;
      }, {})
    );
  }

  private getCurrentCompany(): void {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.currentCompany = rs;
        if (rs) {
          this.crmSystemId = rs?.CRM;
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(rs);
        }
      });
  }

  private subscribeIsShowDrawerViewUserProfile(): void {
    combineLatest([
      this.userProfileDrawerService.isUserProfileDrawerVisible$,
      this.userProfileDrawerService.dataUser$
    ])
      .pipe(distinctUntilChanged(), debounceTime(300), takeUntil(this.destroy$))
      .subscribe(([isShow, dataUser]) => {
        this.isUserProfileDrawerVisible = isShow;
        this.currentDataUserProfile = {
          isUserVerified:
            this.currentConversation?.isPmJoined &&
            this.currentConversation?.lastPmJoined?.id === this.currentUser.id,
          taskId: this.currentTask?.id,
          conversationId: this.currentConversation?.id,
          ...dataUser
        } as UserProperty & { conversationId: string };
      });
  }

  private buildReassignPropertyForm(): void {
    this.formSelectProperty = new FormGroup({
      propertyId: new FormControl(null)
    });
  }

  private maintainScrollPosition(): void {
    const container = this.messageSectionElement;
    const currentScrollHeight = container.scrollHeight;
    const currentScrollTop = container.scrollTop;

    requestAnimationFrame(() => {
      const newScrollHeight = container.scrollHeight;
      const scrollOffset = newScrollHeight - currentScrollHeight;
      container.scrollTop = currentScrollTop + scrollOffset;
    });
  }

  private resetData(): void {
    this.currentConversation = null;
    this.currentTask = null;
    this.groupedMessages = [];
    this.initialScrollDone = false;
    this.oldestMessageTime = null;
    this.mostRecentMessageTime = null;
    this.canLoadOldMessages = true;
    this.canLoadNewMessages = true;
    this.lastReadMessageId = null;
    this.isViewMostRecentButtonVisible = false;
    this.isViewMostRecent = false;
    this.listTempId.clear();
    this.cacheBodyMessages.clear();
  }

  viewMostRecentMessagesHandler(behavior: EBehaviorScroll): void {
    this.isViewMostRecentButtonVisible = false;
    this.isViewMostRecent = true;
    this.scrollToBottom(behavior);
  }

  scrollToBottom(behavior?: EBehaviorScroll): void {
    if (this.scrollBottomTimeOut) {
      clearTimeout(this.scrollBottomTimeOut);
    }

    this.scrollBottomTimeOut = setTimeout(() => {
      if (this.messageSection) {
        this.messageSectionElement.scrollTo({
          top: this.messageSectionElement.scrollHeight,
          behavior: behavior || EBehaviorScroll.AUTO
        });
      }
    }, 0);
  }

  onScrolled(direction: 'up' | 'down'): void {
    if (direction === 'up') {
      if (
        this.canLoadOldMessages &&
        this.oldestMessageTime !== null &&
        this.initialScrollDone
      ) {
        this.isFetchingOlderMessages = true;
        this.fetchHistory$.next({
          isViewMostRecent: false,
          direction,
          triggeredBy: ETriggeredBy.SCROLL_EVENT
        });
      }
    } else {
      this.isViewMostRecentButtonVisible = false;
      if (
        (this.isViewMostRecent || this.canLoadNewMessages) &&
        this.mostRecentMessageTime !== null &&
        this.initialScrollDone
      ) {
        this.isFetchingNewerMessages = true;
        this.fetchHistory$.next({
          isViewMostRecent: false || this.isViewMostRecent,
          direction,
          triggeredBy: ETriggeredBy.SCROLL_EVENT
        });
      }
    }
  }

  checkRemoveTimestampHorizontalLine(): void {
    let conversationHeaderHeight =
      this.headerSection.headerElementRef?.nativeElement?.clientHeight;
    const timestamps =
      this.elr.nativeElement.querySelectorAll('.wrap-order-day');
    const distanceConversationToHeader = 100;
    if (timestamps) {
      timestamps.forEach((el) => {
        const yCoordinates = el.getBoundingClientRect().y;
        if (
          yCoordinates >= conversationHeaderHeight &&
          yCoordinates <=
            conversationHeaderHeight + distanceConversationToHeader &&
          this.messageSection?.nativeElement?.scrollTop !== 0
        ) {
          el.classList.add('wrap-timestamp');
        } else {
          el.classList.remove('wrap-timestamp');
        }
      });
    }
  }

  clickOutsideUserProfileDrawerHandler(): void {
    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      false,
      null
    );
  }

  openPropertyDrawerHandler(event): void {
    this.isPropertyProfileVisible = event;
  }

  openProfileDrawerHandler(event: MouseEvent): void {
    event.stopPropagation();
    const userId = this.currentConversation?.userId;
    const currentDataUserProfile = this.currentConversation?.participants.find(
      (p) => p.userId === userId
    );

    const {
      createdFrom,
      emailVerified,
      email,
      channelUserId,
      name,
      propertyId,
      conversationType
    } = this.currentConversation;

    const dataUser = {
      ...(currentDataUserProfile || this.currentConversation),
      createdFrom,
      emailVerified,
      name,
      conversationPropertyId: propertyId,
      isTemporaryProperty: this.currentTask.property?.isTemporary,
      email: emailVerified ?? email,
      channelUserId,
      conversationType
    };

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }

  onResendTheMessage(id: string): void {
    const body = this.cacheBodyMessages.get(id);
    const message = this.listMessages.find((msg) => msg.id === id);
    message.isSending = true;
    message.isError = false;
    this.inlineMessageEditorRef.handleSendMsg(
      {
        typeBtn: SendOption.Resend,
        value: '',
        isTrudi: false
      },
      body
    );
  }

  handleSending(event: IMessengerTriggerSendMsgEvent): void {
    const messages = AppChatUtil.genMessageTemp(event, {
      currentUser: this.currentUser,
      currentCompany: this.currentCompany,
      cacheBodyMessages: this.cacheBodyMessages,
      agencyFacebookAvatar: this.currentConversation?.page?.avatar
    });
    this.lastReadMessageId = null;
    this.listMessages = this.mergeHistoryMessages(
      messages,
      this.listMessages,
      'down'
    ).map((msg) => ({
      ...msg,
      isLastReadMessage: false
    }));
    this.groupedMessages = this.groupMessagesByDate(this.listMessages);
    this.scrollToBottom(EBehaviorScroll.SMOOTH);
  }

  handleOnSendMsg(event: IMessengerTriggerSendMsgEvent): void {
    if (event.sendOption === SendOption.SendResolve) {
      this.conversationService.openConversation(null, null);
      this.currentConversation = {};
      return;
    }

    this.enableAIReply = false;
    switch (event.event) {
      case ESentMsgEvent.SENDING:
        this.handleSending(event);
        break;
      case ESentMsgEvent.SUCCESS:
        const {
          conversation,
          message,
          fileMessages = []
        } = (event?.['data'] as any) || {};
        const conversationId = conversation?.id;
        if (this.currentConversation?.id !== conversationId) return;
        const updateMessageStatus = (msg) => {
          const found = this.listMessages.find((m) => m.id === msg.tempId);
          if (!found) return;
          found.isSending = false;
          found.id = msg.id;
          found.createdAt = msg.createdAt;
        };
        updateMessageStatus(message);
        fileMessages?.forEach(updateMessageStatus);
        this.fetchHistory$.next({
          isViewMostRecent: true,
          direction: 'down',
          triggeredBy: ETriggeredBy.MANUAL_EVENT
        });
        break;
      case ESentMsgEvent.ERR:
        this.handleSendError(event);
        break;
    }
  }

  handleSendError(event: IMessengerTriggerSendMsgEvent): void {
    this.conversationService.removeLoadingNewMsg(event.tempConversationId);
    this.conversationService.filterTempConversations(
      (item) => item.id !== event.tempConversationId,
      'handleSendError'
    );
    const { tempIds } = event;
    tempIds?.forEach((id) => {
      const msgIndex = this.listMessages.findIndex((msg) => msg.id === id);
      if (msgIndex === -1) return;
      const message = this.listMessages[msgIndex];
      message.isSending = false;
      message.isError = true;
      this.listMessages[msgIndex] = { ...message };
      this.groupedMessages = this.groupMessagesByDate(this.listMessages);
    });
  }

  private updateTaskConversations(
    conversationId: string,
    updateFn: (conversation) => any
  ) {
    const updatedConversations = this.currentTask.conversations.map(
      (conversation) =>
        conversation.id === conversationId
          ? updateFn(conversation)
          : conversation
    );

    this.dispatchUpdatedTask(updatedConversations);
  }

  private isTaskAndConversationValid(
    taskId: string,
    conversationId: string
  ): boolean {
    return (
      this.currentTask?.id === taskId &&
      this.currentTask?.conversations.some(
        (conversation) => conversation.id === conversationId
      )
    );
  }

  private subscribeToSocketQueue() {
    this.facebookService.socketExtenalQueue
      .pipe(
        debounceTime(500),
        filter((socket) => {
          const data = socket.get(this.currentTask?.id);
          return this.isTaskAndConversationValid(
            data?.taskId,
            data?.conversationId
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        const { conversationId, field, value } = data.get(this.currentTask.id);
        this.updateTaskConversations(conversationId, (conversation) => ({
          ...conversation,
          [field]: value
        }));
      });
  }

  private subscribeToMenuClicks() {
    this.facebookService.menuRightClick$
      .pipe(
        debounceTime(500),
        filter((data) => {
          const { option, taskId, conversationId } = data;
          return (
            [MenuOption.UN_FLAG, MenuOption.FLAG].includes(option) &&
            this.isTaskAndConversationValid(taskId, conversationId)
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ conversationId, field, value }) => {
        this.updateTaskConversations(conversationId, (conversation) => ({
          ...conversation,
          [field]: value[field]
        }));
      });
  }

  private dispatchUpdatedTask(updatedConversations: any[]) {
    this.store.dispatch(
      facebookDetailApiActions.updateFacebookTask({
        task: { ...this.currentTask, conversations: updatedConversations }
      })
    );
  }

  private subscribeSocketPmJoinConverstation() {
    // Note: handle PM Join Conversation of message
    this.websocketService.onSocketPmJoinConversation
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        const { userId, conversationId, isPmJoined } = res;
        if (
          conversationId === this.currentConversation.id &&
          this.currentUser.id === userId &&
          isPmJoined
        ) {
          this.isDisabledJoinButton = false;
        }
      });
  }

  private subscribeNewTicket() {
    this.websocketService.onSocketNewTicket
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (this.currentConversation.id === res.conversationId) {
          this.currentConversation = {
            ...this.currentConversation,
            isHasTicketSession: true
          };
        }
        this.cdr.detectChanges();
      });
  }

  handleJoinConversation() {
    if (this.isDisabledJoinButton) return;
    this.isDisabledJoinButton = true;
    this.conversationService
      .pmJoinConversation(this.currentConversation.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.facebookService.setReloadFacebookDetail();
          this.showJoinConversationButton = false;
        },
        error: (error) => {
          this.toastCustomService.handleShowToastAddItemToTask(
            'Failed to join conversation'
          );
          this.isDisabledJoinButton = false;
        }
      });
  }

  private mapReactionForMessageFile(listMessage: IFacebookMessage[]) {
    const listMessageFile = listMessage.filter(
      (msg) => msg.messageType === EMessageType.file
    );
    listMessageFile.forEach((message) => {
      if (!message.bulkMessageId) return;
      const parentMessage = listMessage.find(
        (msg) => msg.id === message.bulkMessageId
      );
      if (!parentMessage) return;
      message.reaction = parentMessage.reaction;
    });
    return listMessage;
  }

  subscribeSocketReactionMessage() {
    this.websocketService.onSocketMessageReaction
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.conversationId === this.currentConversation.id) {
          const bulkMessageId = this.listMessages.find(
            (msg) => msg.id === res.messageId
          )?.bulkMessageId;
          const newMessages = this.listMessages.map((msg) => {
            if (
              msg.id === res.messageId ||
              msg.id === bulkMessageId ||
              msg.bulkMessageId === res.messageId
            ) {
              return {
                ...msg,
                reaction: {
                  action: res?.action,
                  emoji: res?.emoji,
                  mid: res?.mid,
                  timestamp: res?.timestamp,
                  reaction: res?.reaction
                }
              };
            } else {
              return msg;
            }
          });
          this.listMessages = this.mapReactionForMessageFile(newMessages);
          const messagesWithFiles = this.groupMessageViaEmail(
            this.listMessages
          );
          this.groupedMessages = this.groupMessagesByDate(messagesWithFiles);
        }
      });
  }

  ngOnDestroy(): void {
    clearTimeout(this.msgScrollTimer);
    this.resetData();
    this.store.dispatch(facebookDetailApiActions.exitTaskDetail());
    this.facebookService.setCurrentFacebookTask(null);
    this.taskService.currentTask$.next(null);
    this.destroy$.next();
    this.destroy$.complete();
    if (this.eventChangeTab) {
      window.document.removeEventListener(
        'visibilitychange',
        this.eventChangeTab,
        false
      );
      this.eventChangeListenerBound = false;
    }
  }
}
