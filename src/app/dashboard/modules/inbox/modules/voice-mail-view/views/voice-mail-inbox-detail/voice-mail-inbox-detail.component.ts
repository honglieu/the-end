import {
  AfterViewChecked,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  afterRender
} from '@angular/core';
import {
  Observable,
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  finalize,
  of,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import {
  IActionItem,
  IGroupedVoicemailMessages,
  IHistoryListResponse,
  MenuOption,
  VoiceMailMessage,
  VoiceMailQueryType
} from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { ConversationService } from '@services/conversation.service';
import { TaskItem } from '@shared/types/task.interface';
import { SHORT_ISO_DATE, SYNC_PT_FAIL, trudiUserId } from '@services/constants';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { FormControl, FormGroup } from '@angular/forms';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { PropertiesService } from '@services/properties.service';
import { TypeConversationPropertyPayload } from '@shared/types/property.interface';
import { ToastrService } from 'ngx-toastr';
import {
  EDataE2EConversation,
  EDataE2EReassignModal
} from '@shared/enum/E2E.enum';
import { VoiceMailMenuService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail-menu.service';
import { SharedService } from '@services/shared.service';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { whiteListInMsgDetail } from '@shared/constants/outside-white-list.constant';
import { ETypePage } from '@/app/user/utils/user.enum';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import {
  PreviewConversation,
  UserConversation
} from '@shared/types/conversation.interface';
import { CompanyService } from '@services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';
import {
  EMessageType,
  EPropertyStatus,
  ESyncToRmStatus,
  ETriggeredBy,
  SocketType
} from '@shared/enum';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { IMessage } from '@shared/types/message.interface';
import {
  MESSAGE_MOVING_TO_TASK,
  MOVE_MESSAGE_FAIL
} from '@services/messages.constants';
import { RxWebsocketService } from '@services/rx-websocket.service';
import {
  ISocketAssignContact,
  ISocketSecondaryContact
} from '@shared/types/socket.interface';
import { IUserParticipant } from '@shared/types/user.interface';
import { Store } from '@ngrx/store';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { voiceMailDetailApiActions } from '@core/store/voice-mail-detail/actions/voice-mail-detail-api.actions';
import {
  selectMessages,
  selectFetching,
  selectTask
} from '@core/store/voice-mail-detail';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SyncMessagePropertyTreeService } from '@services/sync-message-property-tree.service';
import { TaskService } from '@services/task.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { TitleCasePipe } from '@angular/common';
import { EConversationStatus } from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';
import {
  EBehaviorScroll,
  ICompany,
  IGroupedMessage,
  SocketMessage,
  sortSuggestedProperties
} from '@/app/shared';
import { VoiceMailApiService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail-api.service';
import { isValidMessageForMarkerNewForYou } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/utils/function';
import { TaskApiService } from '@/app/dashboard/modules/task-page/services/task-api.service';
import { EJoinConversationOpenFrom } from '@/app/dashboard/modules/inbox/components/join-conversation/join-conversation.component';

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
  selector: 'voice-mail-inbox-detail',
  templateUrl: './voice-mail-inbox-detail.component.html',
  styleUrls: ['./voice-mail-inbox-detail.component.scss'],
  providers: [TitleCasePipe],
  encapsulation: ViewEncapsulation.None
})
export class VoicemailInboxDetailComponent
  implements AfterViewChecked, OnInit, OnDestroy
{
  @ViewChild('headerSection') headerSection: ElementRef;
  @ViewChild('messageSection') messageSection: ElementRef;

  initialState = {
    isThreeDotMenuVisible: false,
    isAddVoicemailToTaskModalVisible: false,
    isShowReassignPropertyModal: false,
    isPropertyUpdating: false,
    isShowModalAddNote: false,
    isShowModalPeople: false,
    isExpandProperty: false
  };
  headerContact: {
    title: string;
    role: string;
  };
  listMessages: IMessage[] = [];
  groupedMessages: IGroupedVoicemailMessages[];
  actionItemList: IActionItem[] = [];
  currentTask: TaskItem;
  currentConversation: UserConversation;
  currentParams: Params;
  listPropertyAllStatus: UserPropertyInPeople[] = [];
  voicemailDetailState = { ...this.initialState };
  formSelectProperty: FormGroup;
  isConsole: boolean = false;
  currentDataUserProfile: UserProperty;
  isReadMsg: boolean = false;
  isUrgent: boolean = false;
  isUserProfileDrawerVisible: boolean = false;
  isContactVerifiedOTP: boolean = false;
  screenWidth: number;
  showHeaderContactTooltip: boolean = false;
  isLoading: boolean = false;
  crmSystemId: string;
  isRmEnvironment: boolean = false;
  toolTipProperty: string;
  isFetchingOlderMessages: boolean = false;
  isFetchingNewerMessages: boolean = false;
  isViewMostRecentButtonVisible: boolean = false;
  lastReadMessageId: string = null;
  visiblePropertyProfile = false;
  isArchiveMailbox: boolean = false;
  isShowModalConfirmProperties: boolean = false;
  isActionSyncConversationToRM: boolean = false;
  conversationNotMove = {};
  currentMailboxId: string;
  selectedPropertyId: string = '';
  EButtonType = EButtonType;
  EButtonTask = EButtonTask;
  taskType = TaskType;
  disabledDownloadPDF: boolean = false;
  heightMessageSession: number = 0;
  scrollBottomTimeOut: NodeJS.Timeout = null;
  msgScrollTimer: NodeJS.Timeout = null;
  initialScrollDone: boolean = false;
  fetching: boolean = false;
  canLoadOldMessages: boolean = true;
  canLoadNewMessages: boolean = true;
  messageSectionHeight: number;
  isLoadingDetail: boolean = false;
  oldestMessageTime: string = null;
  mostRecentMessageTime: string = null;
  isViewMostRecent: boolean = false;
  public isLoadingDetailHeader = false;

  readonly SYNC_TYPE = ESyncToRmStatus;
  readonly SYNC_PT_FAIL = SYNC_PT_FAIL;
  readonly EDataE2EReassignModal = EDataE2EReassignModal;
  readonly TaskStatusType = TaskStatusType;
  readonly MenuOption = MenuOption;
  readonly whiteListMsgDetail = [...whiteListInMsgDetail];
  readonly EPropertyStatus = EPropertyStatus;
  readonly ETypePage = ETypePage;
  readonly EDataE2EConversation = EDataE2EConversation;
  readonly ESyncToRmStatus = ESyncToRmStatus;
  readonly EConversationStatus = EConversationStatus;
  readonly EBehaviorScroll = EBehaviorScroll;
  readonly EJoinConversationOpenFrom = EJoinConversationOpenFrom;

  private prevVoicemailConversationId: string;
  private prevVoicemailTaskId: string;
  private timeOut1: NodeJS.Timeout = null;
  private destroy$ = new Subject<void>();
  private fetchHistory$ = new Subject<IFetchHistorySubject>();
  private currentCompany: ICompany = null;
  private tabChange: boolean = false;
  private countSocketSend: number = 0;
  private eventChangeTab: (e: Event) => void;
  private eventChangeListenerBound: boolean = false;

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

  get isSyncSuccess(): boolean {
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

  get isSyncInprogress(): boolean {
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

  get propertyIdFormControl() {
    return this.formSelectProperty.get('propertyId');
  }

  get scrolledDown(): boolean {
    if (!this.messageSectionElement) return false;
    const scrollPosition =
      this.messageSectionElement.scrollHeight -
      this.messageSectionElement.clientHeight;
    return this.messageSectionElement.scrollTop + 50 >= scrollPosition;
  }

  constructor(
    public readonly voicemailInboxService: VoiceMailService,
    public readonly inboxService: InboxService,
    public readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
    private readonly conversationService: ConversationService,
    private readonly propertiesService: PropertiesService,
    private readonly voiceMailMenuService: VoiceMailMenuService,
    private readonly toastrService: ToastrService,
    private readonly sharedService: SharedService,
    private readonly contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private readonly userProfileDrawerService: UserProfileDrawerService,
    private readonly companyService: CompanyService,
    private readonly agencyService: AgencyService,
    private readonly toastCustomService: ToastCustomService,
    private readonly websocketService: RxWebsocketService,
    private readonly store: Store,
    private readonly ngZone: NgZone,
    private readonly agencyDateFormatService: AgencyDateFormatService,
    private readonly syncMessagePropertyTreeService: SyncMessagePropertyTreeService,
    private readonly taskService: TaskService,
    private readonly voiceMailApiService: VoiceMailApiService,
    private readonly elementRef: ElementRef,
    private readonly taskApiService: TaskApiService
  ) {
    this.screenWidth = window.innerWidth;
    this.showHeaderContactTooltip = this.screenWidth <= 1440;
    this.isConsole = this.sharedService.isConsoleUsers();

    afterRender(() => {
      this.heightMessageSession =
        this.messageSection?.nativeElement?.offsetHeight;
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.screenWidth = event.target.innerWidth;
    this.showHeaderContactTooltip = this.screenWidth <= 1440;
  }

  ngAfterViewChecked(): void {
    if (
      !this.initialScrollDone &&
      this.messageSectionElement &&
      !this.fetching
    ) {
      if (this.lastReadMessageId) {
        this.scrollToMessage(this.lastReadMessageId, 1000);
      } else {
        this.scrollToBottom(EBehaviorScroll.SMOOTH);
        this.canLoadNewMessages = false;
      }
      this.initialScrollDone = true;
      this.messageSectionHeight = this.messageSectionElement?.offsetHeight;
    }
  }

  ngOnInit(): void {
    this.fetchInitialData();
    this.onStoreChange();
    this.buildReassignPropertyForm();
    this.subscribeListProperties();
    this.subscribeCurrentVoicemailData();
    this.subscribeIsShowDrawerViewUserProfile();
    this.getCurrentCompany();
    this.subscribeSocketEvents(
      this.websocketService.onSocketDeleteSecondaryContact.pipe(
        tap(this.participantChange.bind(this))
      )
    );
    this.subscribeFetchHistory();
    this.subscribeSocketMessage();
    this.subscribeSocketEvents(this.websocketService.onSocketAssignContact);
    this.subscribeArchivedMailboxStatus();
    this.subscribeCurrentTask();
    this.subscribeFetchingState();
    this.subscribeReloadVoicemailDetail();
    this.subscribeEventChangeTab();
    this.subscribeLoadingDetailHeader();
  }

  subscribeLoadingDetailHeader() {
    this.sharedService.getLoadingDetailHeader().subscribe((res) => {
      this.isLoadingDetailHeader = res;
    });
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

  private subscribeReloadVoicemailDetail(): void {
    this.voicemailInboxService.reloadVoicemailDetail$
      .pipe(
        switchMap(() => {
          if (this.currentTask) {
            return forkJoin({
              task: this.taskApiService.getTaskById(this.currentTask.id),
              history: this.voiceMailApiService.getVoiceMailHistory(
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
          voiceMailDetailApiActions.updateVoicemailTask({
            task
          })
        );
        this.store.dispatch(
          voiceMailDetailApiActions.updateVoicemailMessages({
            messages: [...updatedMessages, ...newMessages]
          })
        );
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
            // this.changeStatusTaskHandler(res);
            break;
          case SocketType.newMessages:
            this.fetchNewMessagesHandler(res);
            break;
          default:
            break;
        }
      });
  }

  private fetchNewMessagesHandler(res: SocketMessage): void {
    const isCurrentCv =
      this.currentConversation &&
      res?.conversationId === this.currentConversation?.id;
    if (isCurrentCv && this.tabChange) {
      this.countSocketSend += 1;
    }
    this.voicemailInboxService.setReloadVoicemailDetail();
    this.fetchHistory$.next({
      isViewMostRecent: true,
      direction: 'down',
      triggeredBy: ETriggeredBy.SOCKET_EVENT,
      options: {
        useMaster: true
      }
    });
  }

  private subscribeFetchHistory(): void {
    this.fetchHistory$
      .pipe(
        switchMap(({ isViewMostRecent, direction, triggeredBy, options }) => {
          const before = direction === 'down' ? null : this.oldestMessageTime;
          const after =
            direction === 'down' ? this.mostRecentMessageTime : null;
          return this.voiceMailApiService
            .getVoiceMailHistory(
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
              voiceMailDetailApiActions.updateVoicemailMessages({
                messages: updatedMessages
              })
            );
            if (!isViewMostRecent) {
              this.maintainScrollPosition();
            }
            if (response.list.length < 20) {
              if (direction === 'down') {
                this.canLoadNewMessages = response.list.length > 0;
                this.isViewMostRecent = false;
              } else {
                this.canLoadOldMessages = response.list.length > 0;
              }
            }
          } else {
            if (direction === 'down') {
              this.canLoadNewMessages = response.list.length > 0;
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

  private setLastReadMessageInList(responseList: IMessage[]): boolean {
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
    responseList: IMessage[],
    listMessages: IMessage[],
    direction: 'up' | 'down'
  ): IMessage[] {
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

  viewMostRecentMessagesHandler(behavior: EBehaviorScroll): void {
    this.isViewMostRecentButtonVisible = false;
    this.isViewMostRecent = true;
    this.scrollToBottom(behavior);
  }

  private subscribeFetchingState(): void {
    this.store
      .select(selectFetching)
      .pipe(takeUntil(this.destroy$))
      .subscribe((fetching) => {
        this.fetching = fetching;
      });
  }

  private scrollToMessage(messageId: string, timer: number): void {
    if (this.msgScrollTimer) {
      clearTimeout(this.msgScrollTimer);
    }
    this.msgScrollTimer = setTimeout(() => {
      const messageElement = this.elementRef.nativeElement.querySelector(
        `#message-${messageId}`
      ) as HTMLElement;
      if (!messageElement) return;
      messageElement.scrollIntoView({
        behavior: 'smooth'
      });
    }, timer);
  }

  private scrollToBottom(behavior?: EBehaviorScroll): void {
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

  private subscribeArchivedMailboxStatus() {
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isArchived) => {
        this.isArchiveMailbox = isArchived;
      });
  }

  private subscribeCurrentTask() {
    this.taskService.currentTask$
      .pipe(takeUntil(this.destroy$), filter(Boolean))
      .subscribe((res) => {
        this.selectedPropertyId = res.property.id;
      });
  }

  private participantChange(res) {
    if (res) {
      const participantChange = [...res.participants].find(
        (p: IUserParticipant) => p.userId === res?.newUserId
      ) as IUserParticipant;
      this.conversationService.setParticipantChanged({
        ...participantChange,
        oldUserId: res?.userId,
        isReassign: true
      });
    }
  }

  private subscribeSocketEvents(
    socketObservable: Observable<ISocketAssignContact | ISocketSecondaryContact>
  ) {
    socketObservable
      .pipe(
        distinctUntilChanged(),
        filter(
          (socket) => socket.conversationId === this.currentConversation?.id
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res) {
          this.voicemailInboxService.setReloadVoicemailDetail();
        }
      });
  }

  private buildReassignPropertyForm() {
    this.formSelectProperty = new FormGroup({
      propertyId: new FormControl(null)
    });
  }

  private subscribeListProperties(): void {
    combineLatest({
      suggestedPropertyIds: combineLatest([
        this.voicemailInboxService.currentVoicemailTask$,
        this.userProfileDrawerService.trigerRefreshListProperty$
      ]).pipe(
        distinctUntilChanged(([prevTask, _], [currTask, currTrigger]) => {
          // Compare only the conversation id to determine if it has changed
          return (
            prevTask?.conversations[0]?.id === currTask?.conversations[0]?.id &&
            prevTask?.conversations[0]?.userId ===
              currTask?.conversations[0]?.userId &&
            !currTrigger
          );
        }),
        switchMap(([task, _]) => {
          const conversationId = task?.conversations[0]?.id;
          return conversationId
            ? this.conversationService.getSuggestedProperty(conversationId)
            : of([]);
        })
      ),
      propertiesList: this.propertiesService.listPropertyAllStatus
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.listPropertyAllStatus = sortSuggestedProperties(data);
        },
        error: () => {}
      });
  }

  private subscribeCurrentVoicemailData() {
    this.voicemailInboxService.currentVoicemailTask$
      .pipe(
        takeUntil(this.destroy$),
        filter((currentTask) => !!currentTask)
      )
      .subscribe((currentTask) => {
        this.isReadMsg = currentTask.conversations.every((msg) => msg.isSeen);
        this.isUrgent = currentTask.conversations.every((msg) => msg.isUrgent);
        this.currentTask = currentTask;
      });

    this.voicemailInboxService.currentVoicemailConversation$
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentConversation) => {
        this.currentConversation = {
          ...currentConversation,
          syncStatus:
            currentConversation?.syncStatus ||
            currentConversation?.conversationSyncDocumentStatus
        };
        this.toolTipProperty = this.propertiesService.getTooltipPropertyStatus({
          propertyStatus: currentConversation?.propertyStatus,
          type: currentConversation?.propertyType
        });

        if (this.currentConversation) {
          const currentParticipant = this.currentConversation.participants?.[0];
          if (
            currentParticipant &&
            !!this.currentConversation.fromPhoneNumber
          ) {
            this.headerContact = {
              title: this.contactTitleByConversationPropertyPipe.transform(
                currentParticipant,
                {
                  isNoPropertyConversation:
                    this.currentConversation.isTemporaryProperty,
                  isMatchingPropertyWithConversation:
                    currentParticipant.propertyId ===
                    this.currentConversation.propertyId,
                  skipClientName: true,
                  showOnlyName: true
                }
              ),
              role: this.contactTitleByConversationPropertyPipe.transform(
                currentParticipant,
                {
                  isNoPropertyConversation:
                    this.currentConversation.isTemporaryProperty,
                  isMatchingPropertyWithConversation:
                    currentParticipant.propertyId ===
                    this.currentConversation.propertyId,
                  showOnlyRole: true,
                  showCrmStatus: true,
                  showPrimaryText: true
                }
              )
            };
          } else {
            this.headerContact = {
              title: 'Unknown',
              role: ''
            };
          }
        }
        this.sharedService.setLoadingDetailHeader(false);
      });
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentMailboxId) => {
        this.currentMailboxId = currentMailboxId;
      });
    this.handleSyncStatusMessage();
    this.syncMessagePropertyTreeService.isSyncToPT$
      .pipe(takeUntil(this.destroy$), filter(Boolean))
      .subscribe(() => {
        this.handleSyncStatusMessage();
      });
  }

  handleSyncStatusMessage() {
    this.syncMessagePropertyTreeService.listConversationStatus
      .pipe(takeUntil(this.destroy$))
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
          this.currentConversation.downloadingPDFFile = downloadingPDFFile;
          this.currentConversation.updatedSyncAt =
            this.currentConversation.updatedSyncAt || timestamp;
          this.disabledDownloadPDF =
            this.syncMessagePropertyTreeService.checkToEnableDownloadPDFOption(
              this.isArchiveMailbox,
              this.isConsole,
              this.currentConversation?.downloadingPDFFile
            );
        }
      });
  }

  selectedPropertyInDetail(propertyId) {
    this.selectedPropertyId = propertyId;
  }

  handleCancelConfirmProperties(value) {
    this.isShowModalConfirmProperties = value;
  }

  handleConfirmProperties() {
    this.syncConversationToCRM();
  }

  private dispatchZone(taskId, conversationId) {
    this.ngZone.run(() =>
      this.store.dispatch(
        voiceMailDetailApiActions.setCurrentVoiceMail({
          taskId,
          conversationId
        })
      )
    );
  }

  private subscribeIsShowDrawerViewUserProfile() {
    combineLatest([
      this.userProfileDrawerService.isUserProfileDrawerVisible$,
      this.userProfileDrawerService.dataUser$
    ])
      .pipe(takeUntil(this.destroy$), distinctUntilChanged(), debounceTime(300))
      .subscribe(([isShow, dataUser]) => {
        this.isUserProfileDrawerVisible = isShow;
        this.currentDataUserProfile = dataUser;
      });
  }

  private onStoreChange() {
    const task$ = combineLatest({
      store: this.store.select(selectTask)
    }).pipe(
      tap(({ store }) => {
        if (!store) return;
        const currentConversation = store.conversations[0];
        this.voicemailInboxService.setCurrentVoicemailConversation(
          currentConversation as UserConversation
        );
        this.voicemailInboxService.setCurrentVoicemailTask(store);
      })
    );
    const messages$ = this.store.select(selectMessages).pipe(
      tap((messages) => {
        this.listMessages = this.sortVoicemailDetailMessages(messages).filter(
          (msg) => ![EMessageType.endSessionVoicemail].includes(msg.messageType)
        );
        this.lastReadMessageId = this.listMessages.find(
          (msg) => msg.isLastReadMessage
        )?.id;
        this.oldestMessageTime = this.listMessages[0]?.createdAt;
        this.mostRecentMessageTime =
          this.listMessages[this.listMessages.length - 1]?.createdAt;
        this.groupedMessages = this.groupMessagesByDate(this.listMessages);
      })
    );
    const fetching$ = this.store.select(selectFetching);

    combineLatest({
      fetching: fetching$,
      task: task$,
      messages: messages$
    })
      .pipe(
        takeUntil(this.destroy$),
        filter(({ fetching }) => !fetching)
      )
      .subscribe(() => {
        this.isLoadingDetail = !this.groupedMessages.length;
      });
  }

  private groupMessagesByDate(listMessages: IMessage[]): IGroupedMessage[] {
    return Object.values(
      listMessages.reduce((acc, message) => {
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

  private fetchInitialData() {
    this.activatedRoute.queryParams
      .pipe(
        switchMap((params) => {
          this.currentParams = params;
          const voicemailTaskId =
            params[VoiceMailQueryType.TASK_ID] ||
            this.activatedRoute.snapshot.paramMap.get(
              VoiceMailQueryType.TASK_ID
            );
          const voicemailConversationId =
            params[VoiceMailQueryType.CONVERSATION_ID];
          if (
            (voicemailConversationId &&
              voicemailConversationId !== this.prevVoicemailConversationId) ||
            (voicemailTaskId &&
              voicemailConversationId !== this.prevVoicemailTaskId)
          ) {
            this.scrollToBottom(EBehaviorScroll.AUTO);
            this.isLoadingDetail = true;
            this.prevVoicemailConversationId = voicemailConversationId;
            this.prevVoicemailTaskId = voicemailTaskId;
            this.resetData();
            this.dispatchZone(voicemailTaskId, voicemailConversationId);
          }
          return of({});
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private sortVoicemailDetailMessages(listMessages: IMessage[]) {
    let sortedVoicemailMessages = listMessages.map((messageItem) => {
      if (messageItem.messageType.toUpperCase() === EMessageType.defaultText) {
        return {
          ...messageItem,
          message:
            typeof messageItem.message === 'string'
              ? [
                  {
                    type: messageItem.messageType,
                    value: messageItem.message
                  }
                ]
              : messageItem.message,
          senderType: messageItem.userId === trudiUserId ? 'trudi' : 'user'
        };
      }
      return messageItem;
    });
    sortedVoicemailMessages = sortedVoicemailMessages.sort((a, b) => {
      const messageDateA = new Date(a.createdAt).getTime();
      const messageDateB = new Date(b.createdAt).getTime();
      return messageDateA - messageDateB;
    });
    return sortedVoicemailMessages as IMessage[];
  }

  updateVoicemailDetailState(key: string, value: boolean) {
    if (this.isConsole) return;
    this.voicemailDetailState = {
      ...this.voicemailDetailState,
      [key]: value
    };
  }

  handleCloseModal() {
    this.updateVoicemailDetailState('isReassigningProperty', false);
    this.updateVoicemailDetailState('isShowReassignPropertyModal', false);
    this.propertyIdFormControl.setValue(null);
  }

  resetVoicemailDetailStatae() {
    this.voicemailDetailState = { ...this.initialState };
  }

  openReassignPropertyPopup() {
    if (this.isConsole) return;
    const currentConversationPropertyId = this.currentConversation?.propertyId;
    if (this.checkIsHasPropertyOnMessageDetail(currentConversationPropertyId)) {
      this.propertyIdFormControl.setValue(currentConversationPropertyId);
    }
    this.updateVoicemailDetailState('isShowReassignPropertyModal', true);
  }

  handleConfirmUpdateProperty() {
    this.updateVoicemailDetailState('isReassigningProperty', true);
    const { id, isTemporary } = this.currentTask?.property || {};

    if (
      this.propertyIdFormControl.value === id ||
      (!this.propertyIdFormControl.value && isTemporary) ||
      (!this.propertyIdFormControl.value &&
        !this.checkIsHasPropertyOnMessageDetail(id))
    ) {
      this.updateVoicemailDetailState('isReassigningProperty', false);
      this.updateVoicemailDetailState('isShowReassignPropertyModal', false);
      this.propertyIdFormControl.setValue(null);
      return;
    }

    const bodyChangeConversationProperty: TypeConversationPropertyPayload = {
      conversationId: this.currentConversation.id,
      newPropertyId: this.propertyIdFormControl.value
    };

    this.propertiesService
      .updateConversationProperty(bodyChangeConversationProperty)
      .pipe(
        finalize(() =>
          this.updateVoicemailDetailState('isReassigningProperty', false)
        )
      )
      .subscribe((res) => {
        if (res) {
          this.toastrService.success(
            'The conversation property has been changed'
          );
          this.voicemailInboxService.setReloadVoicemailDetail();
        }
        this.updateVoicemailDetailState('isShowReassignPropertyModal', false);
        this.propertyIdFormControl.setValue(null);
      });
  }

  private checkIsHasPropertyOnMessageDetail(propertyId: string) {
    return this.listPropertyAllStatus.find((item) => item.id === propertyId);
  }

  saveMessageToCRM(e, type) {
    if (
      this.currentConversation?.syncStatus === this.SYNC_TYPE.INPROGRESS ||
      this.isArchiveMailbox ||
      this.isConsole
    ) {
      e.stopPropagation();
      return;
    }

    this.syncMessagePropertyTreeService.setIsSyncToPT(true);

    const isTemporaryProperty =
      this.taskService.currentTask$.value?.property?.isTemporary;
    if (isTemporaryProperty && type !== MenuOption.DOWNLOAD_AS_PDF) {
      this.conversationNotMove = {
        listConversationNotMove: [this.currentConversation]
      };
      this.isShowModalConfirmProperties = true;
      return;
    }
    this.syncConversationToCRM();
  }

  syncConversationToCRM() {
    const conversationSyncing = {
      conversationIds: [this.currentConversation?.id],
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

    this.syncMessagePropertyTreeService.setListConversationStatus(
      conversationSyncing
    );

    this.syncMessagePropertyTreeService.setTriggerExportHistoryAction(
      exportPayload
    );
  }

  handleMenu(option: MenuOption, field: string) {
    this.isLoading = ![
      MenuOption.SAVE_TO_PROPERTY_TREE,
      MenuOption.DOWNLOAD_AS_PDF
    ].includes(option);
    this.updateVoicemailDetailState('isThreeDotMenuVisible', false);
    if (option === MenuOption.MOVE_TO_INBOX) {
      this.toastrService.show(
        MESSAGE_MOVING_TO_TASK,
        '',
        {
          disableTimeOut: false
        },
        'toast-syncing-custom'
      );
    }

    if (option === MenuOption.SAVE_TO_PROPERTY_TREE) {
      this.saveMessageToCRM(event, option);
    }
    this.voiceMailMenuService
      .handleMenuChange({
        message: this.currentTask,
        option,
        conversationId:
          this.currentParams[VoiceMailQueryType.CONVERSATION_ID] ||
          this.currentConversation?.id
      })
      .then((value) => {
        this.updateCurrentTask(field, value);
        this.handleMenuSuccess(option);
        this.isLoading = false;
      })
      .catch(() => {
        this.handleMenuError(option);
      });
  }

  private updateCurrentTask(field: string, value) {
    if (field) {
      this.voicemailInboxService.setCurrentVoicemailTask({
        ...this.currentTask,
        conversations: this.currentTask.conversations.map((item) => {
          if (item.id === this.currentConversation?.id) {
            return {
              ...item,
              [field]: value[field]
            };
          }
          return item;
        })
      });
      this.voicemailInboxService.setMenuRightClick({
        taskId: this.currentTask.id,
        conversationId: this.currentConversation?.id,
        field,
        value
      });
    }
  }

  private handleMenuSuccess(option: MenuOption) {
    switch (option) {
      case MenuOption.REOPEN:
      case MenuOption.RESOLVE:
        this.openToast(this.currentTask, option);
        break;
      default:
    }
  }

  private handleMenuError(option) {
    switch (option) {
      case MenuOption.MOVE_TO_INBOX:
        this.isLoading = false;
        this.toastrService.clear();
        this.toastrService.error(MOVE_MESSAGE_FAIL);
        break;

      default:
    }
  }

  openToast(item: VoiceMailMessage, option: MenuOption) {
    const conversation =
      item.conversations.find(
        (conversation) => conversation.id === this.currentConversation?.id
      ) || item.conversations[0];

    const dataForToast = {
      conversationId: conversation.id,
      taskId: conversation.taskId,
      isShowToast: true,
      type: SocketType.changeStatusTask,
      mailBoxId: item.mailBoxId,
      taskType: TaskType.MESSAGE,
      status:
        option === MenuOption.REOPEN
          ? TaskStatusType.inprogress
          : TaskStatusType.resolved,
      pushToAssignedUserIds: [],
      conversationType: conversation.conversationType
    };

    this.toastCustomService.openToastCustom(
      dataForToast,
      true,
      EToastCustomType.SUCCESS_WITH_VIEW_BTN
    );
  }

  checkScroll(): void {
    let conversationHeaderHeight =
      this.headerSection?.nativeElement?.clientHeight;
    const timestamps = document.querySelectorAll('.wrap-order-day');
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

  messageTrackBy(index: number) {
    return index;
  }

  dateTrackby(_: number, message) {
    return message.timeStamp;
  }

  handleOpenProfileDrawer(event: MouseEvent) {
    event.stopPropagation();
    const userId = this.currentConversation?.userId;
    const currentDataUserProfile = this.currentConversation?.participants.find(
      (p) => p.userId === userId
    );
    const dataUser = {
      ...(currentDataUserProfile || this.currentConversation),
      conversationType: this.currentConversation.conversationType,
      fromPhoneNumber: this.currentConversation.fromPhoneNumber,
      isBlockNumber: !this.currentConversation.fromPhoneNumber
    };

    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }

  handleClickOutsideUserProfileDrawer(): void {
    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      false,
      null
    );
  }

  private resetData() {
    this.voicemailInboxService.setCurrentVoicemailTask(null);
    this.voicemailInboxService.setCurrentVoicemailConversation(null);
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
    clearTimeout(this.timeOut1);
  }

  getCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs) {
          this.currentCompany = rs;
          this.crmSystemId = rs?.CRM;
          this.isRmEnvironment = this.agencyService.isRentManagerCRM(rs);
        }
      });
  }

  showModalPeople() {
    if (
      this.currentConversation?.propertyStatus === EPropertyStatus.deleted ||
      !this.currentConversation.streetline
    )
      return;
    let isExistedStreetLine;
    const { shortenStreetline, streetline } = this.currentTask?.property || {};
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
      this.updateVoicemailDetailState('isShowModalPeople', true);
    }
  }

  openPropertyProfileHandler(): void {
    this.visiblePropertyProfile = true;
  }

  triggerCurrentConversation(value) {
    this.currentConversation = {
      ...this.currentConversation,
      ...value
    };
    this.currentTask = {
      ...this.currentTask,
      conversations: [this.currentConversation as PreviewConversation]
    };
  }

  ngOnDestroy(): void {
    this.store.dispatch(voiceMailDetailApiActions.exitTaskDetail());
    clearTimeout(this.timeOut1);
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
