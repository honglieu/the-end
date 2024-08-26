import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, Subject, of, tap } from 'rxjs';
import { catchError, filter, pluck, takeUntil } from 'rxjs/operators';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { TransferActionLinkProp } from '@shared/types/action-link.interface';
import {
  ConversationItem,
  ICreateNewConversationApp,
  IListConversationConfirmProperties,
  IRemoveAppMessagePayload,
  LastUser,
  NavigateOutConversation,
  PhotoSendMain,
  SearchAddressFromUsers,
  UserConversation
} from '@shared/types/conversation.interface';
import { conversations, email } from 'src/environments/environment';
import { EAddOn } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import {
  IConversationAction,
  IconsSync
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { LeaseRenewalRequestButtonAction } from '@shared/enum/lease-renewal-Request.enum';
import { MaintenanceJobStatus } from '@shared/enum/maintenanceJobStatus.enum';
import { EMessageType } from '@shared/enum/messageType.enum';
import { PetRequestButtonAction } from '@shared/enum/petRequest.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { EInvoiceTaskType } from '@shared/enum/share.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import { ETrudiType } from '@shared/enum/trudi';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { Invoice } from '@shared/types/invoice.interface';
import {
  CreateNewTaskUnHappyResponse,
  IMessage
} from '@shared/types/message.interface';
import { ReiFormData } from '@shared/types/rei-form.interface';
import { NewTaskOptions, TaskItem } from '@shared/types/task.interface';
import {
  IMarkAsUnreadDataResponse,
  Intents,
  LeaseRenewalRequestTrudiResponse,
  LeasingRequestTrudiResponse,
  PetRequestTrudiResponse,
  TrudiResponse
} from '@shared/types/trudi.interface';
import { SupplierSendedQuote } from '@shared/types/users-supplier.interface';
import { ApiService } from './api.service';
import {
  CONVERSATION_ASSIGNED_TO,
  CONVERSATION_STATUS,
  trudiUserId
} from './constants';
import { LoadingService } from './loading.service';
import { PropertiesService } from './properties.service';
import { TaskService } from './task.service';
import { UserService } from './user.service';
import { EmailProvider, SyncAttachmentType } from '@shared/enum/inbox.enum';
import { SocketType } from '@shared/enum/socket.enum';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { IUserParticipant } from '@shared/types/user.interface';
import { SharedService } from './shared.service';
import { Store } from '@ngrx/store';
import { conversationPageActions } from '@core/store/conversation/actions/conversation.actions';
import { EConversationStatusTab } from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';
import { UserConversationOption } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ITempConversation } from '@/app/dashboard/modules/inbox/interfaces/conversation.interface';
import { IAppTriggerSendMsgEvent } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/app-compose-message.component';
import { appMessageActions } from '@core/store/app-message/actions/app-message.actions';
import { HelperService } from './helper.service';

export enum MessageStatus {
  open = 'OPEN',
  resolved = 'RESOLVED',
  schedule = 'SCHEDULE',
  archived = 'ARCHIVED',
  locked = 'LOCKED',
  reopen = 'REOPEN',
  agent_expectation = 'AGENT_EXPECTATION',
  all = 'ALL'
}

export enum EReloadConversationSource {
  SendMessage = 'SendMessage'
}

const status = MessageStatus;

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private listConversationMsg$: BehaviorSubject<{
    value: TaskItem[];
    type: string;
  }> = new BehaviorSubject<{ value: TaskItem[]; type: '' }>({
    value: [],
    type: ''
  });
  public updateStatusMaintenanceRequest: BehaviorSubject<any> =
    new BehaviorSubject(null);
  public noResetSync: BehaviorSubject<any> = new BehaviorSubject(null);
  public trudiResponseConversation: BehaviorSubject<UserConversation> =
    new BehaviorSubject(null);
  public trudiResponseType: BehaviorSubject<string> = new BehaviorSubject(null);
  // TODO: select conversation from store
  public currentConversation: BehaviorSubject<any> = new BehaviorSubject({});
  // TODO: select conversation from store
  public currentConversationId: BehaviorSubject<string> = new BehaviorSubject(
    null
  );
  public previousConversation$: BehaviorSubject<UserConversationOption> =
    new BehaviorSubject(null);
  public selectedConversation: BehaviorSubject<any> = new BehaviorSubject(null);
  public conversationList: BehaviorSubject<any> = new BehaviorSubject({});
  public sendStatusSync: BehaviorSubject<any> = new BehaviorSubject({});
  public reOpenConversation: BehaviorSubject<any> = new BehaviorSubject({});
  public updatedConversationList: BehaviorSubject<any> = new BehaviorSubject(
    []
  );
  public updatedConversation: BehaviorSubject<{
    conversationId: string;
    status: string;
  }> = new BehaviorSubject(null);
  public joinConversation = new BehaviorSubject<{
    conversationId: string;
    conversationStatus: string;
    messageStatus?: string;
  }>(null);
  public joinConversation$ = this.joinConversation.asObservable();
  public reloadConversationList: BehaviorSubject<
    boolean | EReloadConversationSource
  > = new BehaviorSubject(false);

  private reloadConversationDetail: Subject<string> = new Subject();

  public isDisplayTypingBlock: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public onConversationStatusChange = new BehaviorSubject<{
    status: string;
    topic: string;
    assignedTo: string;
  }>(null);
  public changeConversationStatus = new BehaviorSubject<{
    id: MessageStatus;
    text: MessageStatus;
  }>(null);
  public changeConversationLock = new BehaviorSubject<boolean>(false);
  public markCurrentConversationBS =
    new BehaviorSubject<IMarkAsUnreadDataResponse>(null);
  public changeConversationLock$ = this.changeConversationLock.asObservable();
  public updateConversationStatus$ = new BehaviorSubject<{
    status: string;
    option: string;
    user: LastUser;
    addMessageToHistory?: boolean;
  }>(null);
  public listConversationByTask: BehaviorSubject<UserConversation[]> =
    new BehaviorSubject<UserConversation[]>([]);
  public statusSyncInvoice: BehaviorSubject<SyncMaintenanceType> =
    new BehaviorSubject(null);
  public isActivePopupInvoiceFail: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public activeOptionsID$: BehaviorSubject<string> = new BehaviorSubject('');
  public savedNextTimeData: BehaviorSubject<
    | TrudiResponse
    | PetRequestTrudiResponse
    | LeaseRenewalRequestTrudiResponse
    | LeasingRequestTrudiResponse
  > = new BehaviorSubject(null);
  public reloadAppointmentCardData: BehaviorSubject<{
    categoryId: string;
    propertyId: string;
  }> = new BehaviorSubject(null);
  public conversationChangeAction = new Subject<IConversationAction>();
  public currentTabConversation = new BehaviorSubject<EConversationStatusTab>(
    EConversationStatusTab.OPEN
  );
  // for app-chat loading
  private afterSetConversationsSource$ = new Subject();
  public afterSetConversations$ =
    this.afterSetConversationsSource$.asObservable();

  private afterGetConversationsSource$ = new Subject();
  public afterGetConversations$ =
    this.afterGetConversationsSource$.asObservable();

  public messagesSentViaEmail = new BehaviorSubject<IMessage[]>(null);
  public messagesSentViaEmail$ = this.messagesSentViaEmail.asObservable();
  public currentStatus: MessageStatus;
  public currentTopic: string;
  public currentAssignedTo: string;
  private unsubscribe = new Subject<void>();
  public conversationSearch = new BehaviorSubject<string>(null);
  public searchAddressFromUser = new BehaviorSubject<SearchAddressFromUsers>({
    propertyAddress: '',
    propertyId: ''
  });
  public listOfConversation: ConversationItem['list'];
  private navigateOutConversation =
    new BehaviorSubject<NavigateOutConversation>({
      value: '',
      blockRedirect: false
    });
  public actionLinkTransfer = new BehaviorSubject<TransferActionLinkProp>(null);
  public readonly actionLinkTransfer$ = this.actionLinkTransfer.asObservable();
  public actionLinkList = new BehaviorSubject<TransferActionLinkProp[]>([]);
  public _actionLinkList: TransferActionLinkProp[] = [];
  public isLoading$ = new BehaviorSubject(false);
  public isDeletedTask: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public selectedCategoryId: BehaviorSubject<string> = new BehaviorSubject(
    null
  );
  public newTrudiResponseSuggestion: BehaviorSubject<TrudiResponse> =
    new BehaviorSubject(null);
  public superHappyPathTrudiResponse: BehaviorSubject<TrudiResponse> =
    new BehaviorSubject(null);
  public unHappyPathTrudiResponse: BehaviorSubject<TrudiResponse> =
    new BehaviorSubject(null);
  public currentAgencyId: string;
  public currentMailBoxId: string;
  private messageActionTriggered = new Subject<void>();
  public messageActionTriggered$ = this.messageActionTriggered.asObservable();
  private readonly _messages$ = new BehaviorSubject<
    {
      isLoading: boolean;
      conversationId: string;
      messages: IMessage[];
    }[]
  >(null);

  private participantChanged$ = new Subject<IUserParticipant>();
  public isShowModalWarrningSchedule = new Subject();
  readonly SYNC_STATUS = SyncMaintenanceType;
  readonly ICON_SYNC = IconsSync;

  public readonly messages$ = this._messages$.asObservable();
  private isConsole: boolean = false;
  public triggerAppMessageItem$ = new BehaviorSubject<TaskItem>(null);
  private triggerCreateConversationApp =
    new Subject<ICreateNewConversationApp>();
  private selectedAppMessageTicketId = new BehaviorSubject<string>('');
  public triggerGoToAppMessage$: Subject<boolean> = new Subject<boolean>();
  public triggerDeleteFromInline = new Subject();
  public tempConversations = new BehaviorSubject<ITempConversation[]>([]);
  public triggerSendMessage = new Subject<IAppTriggerSendMsgEvent>();
  public triggerRemoveScratchTicket = new Subject();
  public triggerLoadingHeaderConversation = new Subject();

  constructor(
    private apiService: ApiService,
    private propertyService: PropertiesService,
    private router: Router,
    public userService: UserService,
    private taskService: TaskService,
    private loadingService: LoadingService,
    private toastService: ToastrService,
    private inboxService: InboxService,
    private toastCustomService: ToastCustomService,
    private sharedService: SharedService,
    private store: Store,
    private helper: HelperService
  ) {
    this.currentStatus = status.open;
    this.currentAssignedTo = CONVERSATION_ASSIGNED_TO.AGENT;
    this.currentTopic = 'ALL';
    this.actionLinkList.subscribe((n) => {
      if (n.length === 0) {
        this._actionLinkList = [];
      }
    });
    this.actionLinkTransfer$.subscribe((al) => {
      if (al) {
        const duplicate = this.checkActionLinkExists(al.id);
        !duplicate && (this._actionLinkList = [...this._actionLinkList, al]);
        this.actionLinkList.next(this._actionLinkList);
      }
    });
    this.getCurrentProperty(false);
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(filter((mailBoxId) => !!mailBoxId))
      .subscribe((mailBoxId) => {
        this.currentMailBoxId = mailBoxId;
      });
    this.isConsole = this.sharedService.isConsoleUsers();
  }

  public handleMessageActionTriggered() {
    this.messageActionTriggered.next();
  }

  getEmailSignature() {
    return this.apiService.getAPI(conversations, `get-email-signature`);
  }

  markAsRead(conversationId: string, propertyId: string, userId: string) {
    return this.apiService.post(conversations + 'mark-as-read-mobile', {
      conversationId,
      propertyId,
      date: new Date(),
      userId
    });
  }

  getMessageByStatus(status: string, message: string): string {
    switch (status) {
      case 'REOPEN':
        return 'Re-opened';
      case 'RESOLVED':
        return 'Resolved';
      case 'AGENT_JOIN':
        return 'joined the conversation';
      default:
        return message;
    }
  }

  getConversationType(
    conversationStatus: string,
    inviteStatus: string,
    crmStatus?: string,
    secondaryEmail?: string
  ): EConversationType {
    if (crmStatus === 'ACTIVE' && secondaryEmail) {
      return EConversationType.nonApp;
    }

    if (conversationStatus === CONVERSATION_STATUS.LOCKED) {
      return EConversationType.locked;
    }
    if (
      inviteStatus !== 'ACTIVE' &&
      [
        CONVERSATION_STATUS.RESOLVED,
        CONVERSATION_STATUS.OPEN,
        CONVERSATION_STATUS.REOPEN,
        CONVERSATION_STATUS.AGENT_EXPECTATION,
        CONVERSATION_STATUS.SCHEDULE
      ].includes(conversationStatus)
    ) {
      return EConversationType.nonApp;
    }

    if (
      conversationStatus === CONVERSATION_STATUS.RESOLVED ||
      conversationStatus === CONVERSATION_STATUS.SOLVED
    ) {
      return EConversationType.resolved;
    }
    if (
      conversationStatus !== CONVERSATION_STATUS.LOCKED &&
      conversationStatus !== CONVERSATION_STATUS.RESOLVED &&
      inviteStatus === 'ACTIVE'
    ) {
      return EConversationType.open;
    }
    return EConversationType.open;
  }

  getSyncStatusIcon(syncStatus: string): string {
    switch (syncStatus) {
      case this.SYNC_STATUS.COMPLETED:
      case this.SYNC_STATUS.SUCCESS:
        return this.ICON_SYNC.SYNC_SUCCESS;
      case this.SYNC_STATUS.FAILED:
        return this.ICON_SYNC.SYNC_FAIL;
      case this.SYNC_STATUS.INPROGRESS:
      case this.SYNC_STATUS.PENDING:
        return this.ICON_SYNC.SYNCING;
      default:
        return '';
    }
  }

  setListOfConversation(listOfConversation) {
    this.listOfConversation = listOfConversation;
  }

  checkActionLinkExists(currentLinkId: string): boolean {
    return !!this._actionLinkList.find((e) => e.id === currentLinkId);
  }

  onNavigateOutConversation(signal: NavigateOutConversation): void {
    this.navigateOutConversation.next(signal);
  }

  onReOpenConversation(status: string): void {
    this.reOpenConversation.next(status);
  }

  resetSearchAddressFromUsers(): void {
    this.searchAddressFromUser.next({ propertyAddress: '', propertyId: '' });
  }

  resetConversationState(): void {
    this.navigateOutConversation.next({
      value: '',
      blockRedirect: false
    });
  }

  resetConversationList(): void {
    this.conversationList.next([]);
    this.updatedConversationList.next([]);
  }

  checkConversationLock(lockState: boolean): void {
    this.changeConversationLock.next(lockState);
  }

  public getCurrentProperty(isUpdate: boolean) {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.unsubscribe = new Subject<void>();
  }

  public updateStatus(
    conversationStatus: string,
    conversationId: string,
    isSendFromEmail = false,
    summaryText?: string
  ) {
    const body = {
      status: conversationStatus,
      conversationId,
      summary: summaryText || null,
      isSendFromEmail,
      mailBoxId: this.currentMailBoxId
    };
    return this.apiService
      .putAPI(conversations, 'change-conversation-status-send', body)
      .pipe(takeUntil(this.unsubscribe));
  }

  resetCurrentPropertyId() {
    this.propertyService.currentPropertyId.next('');
  }

  public beforeEachGetConversation(conversationId: string) {
    const currentMessages = this._messages$.getValue() || [];
    const conversation = currentMessages.find(
      (message) => message.conversationId == conversationId
    );
    if (conversation) {
      conversation.isLoading = false;
      this._messages$.next(currentMessages);
    } else {
      this._messages$.next([
        ...currentMessages,
        {
          isLoading: false,
          messages: [],
          conversationId
        }
      ]);
    }
  }

  public afterEachGetConversation(conversationId: string, data: any) {
    const newMessages = this._messages$.getValue()?.map((message) => {
      if (message.conversationId == conversationId) {
        message.isLoading = false;
        message.messages = data;
      }
      return message;
    });
    this._messages$.next(newMessages);
  }

  getHistoryOfConversation(
    conversationId: string,
    pageIndex: number,
    isRead: boolean = true
  ) {
    return this.apiService.getAPI(
      conversations,
      `history/${conversationId}/${pageIndex}?isRead=${isRead}`
    );
  }

  getHistoryOfConversationV2(
    conversationId: string,
    isRead: boolean = true,
    before: string = null,
    after: string = null,
    isViewMostRecent: boolean = false,
    useMaster: boolean = false,
    messageId?: string
  ) {
    let queryString = `v2/history/${conversationId}?isRead=${
      !this.isConsole && isRead
    }&isViewMostRecent=${isViewMostRecent}`;
    if (after && !before) queryString += `&after=${after}`;
    if (before && !after) queryString += `&before=${before}`;
    if (useMaster) queryString += `&useMaster=${useMaster}`;
    if (messageId) queryString += `&messageId=${messageId}`;
    return this.apiService.getAPI(conversations, queryString);
  }

  getConversationByAppUser({
    propertyId,
    userId,
    mailBoxId,
    userPropertyId
  }: {
    propertyId: string;
    userId: string;
    mailBoxId: string;
    userPropertyId: string;
  }) {
    return this.apiService.getAPI(
      conversations,
      `conversation-by-app-user/${propertyId}/${userId}/${mailBoxId}/${userPropertyId}`
    );
  }

  getAllHistoryOfConvesationV2(conversationId: string) {
    return this.apiService.getAPI(
      conversations,
      `v2/history/${conversationId}/all`
    );
  }

  getHistoryOfConversationWithTrudi(
    conversationId: string,
    pageIndex: number,
    isRead: boolean = true,
    isConversationWithTrudi: boolean = true
  ) {
    return this.apiService.getAPI(
      conversations,
      `history/${conversationId}/${pageIndex}?isRead=${isRead}&isConversationWithTrudi=${isConversationWithTrudi}`
    );
  }

  sortData(conversationList, isDraftTab?: boolean) {
    return (
      conversationList &&
      conversationList.sort(
        (c1, c2) =>
          Math.round(
            new Date(
              isDraftTab
                ? c2.lastTimeMessage || c2.lastMessageDraft?.createdAt
                : c2.messageDate
            ).getTime() / 1000
          ) -
          Math.round(
            new Date(
              isDraftTab
                ? c1.lastTimeMessage || c1.lastMessageDraft?.createdAt
                : c1.messageDate
            ).getTime() / 1000
          )
      )
    );
  }

  getListOfConversationsByTaskId(
    taskId: string,
    isRead: boolean = false,
    useMaster: boolean = false
  ) {
    const taskIdQuery = taskId || this.taskService.currentTaskId$.getValue();
    const useMasterQuery = useMaster ? `&useMaster=${useMaster}` : '';
    return this.apiService
      .getAPI(
        conversations,
        `list-of-conversations-by-task?taskId=${taskIdQuery}${useMasterQuery}`
      )
      .pipe(
        tap((val) => !isRead && this.listConversationByTask.next(val)),
        tap((val) => !isRead && this.afterGetConversationsSource$.next(val))
      );
  }

  navigateToFirstOfNextConversation(
    conversationId: string,
    isTaskType?: boolean
  ) {
    if (conversationId !== this.currentConversation.value?.id) {
      return;
    }
    const currentConversationList = this.listConversationByTask.value;
    const currentIndex = currentConversationList.findIndex(
      (el) => el.id === conversationId
    );
    if (currentIndex > -1) {
      let conversationIdToMove =
        currentConversationList[currentIndex + 1]?.id ||
        currentConversationList[0]?.id;
      // clear conversationId param if there is no more conversation in the task
      conversationIdToMove =
        conversationIdToMove === conversationId ? null : conversationIdToMove;
      this.router.navigate(
        [
          'dashboard',
          'inbox',
          'detail',
          this.taskService.currentTask$.value?.id
        ],
        {
          queryParams: {
            conversationId: conversationIdToMove
          }
        }
      );
    } else {
      if (isTaskType) {
        this.router.navigate([
          'dashboard',
          'inbox',
          'detail',
          this.taskService.currentTask$.value?.id
        ]);
      }
    }
  }

  setCurrentConversationId(value: string) {
    this.currentConversationId.next(value);
    this.store.dispatch(
      conversationPageActions.loadConversationState({ id: value })
    );
    this.store.dispatch(
      conversationPageActions.setCurrentConversationId({ id: value })
    );
  }

  // Note: This function will be called when opening a conversation
  // And it will be called when the conversation is updated
  // TODO: move the update conversation flow into a separate function
  openConversation(conversation: UserConversation, trudiResponse) {
    const isDeletedTask =
      this.taskService.currentTask$.value?.status === TaskStatusType.deleted;
    this.isDeletedTask.next(isDeletedTask);
    trudiResponse && (trudiResponse.notReCallTaskDetailApi = true);
    this.trudiResponseConversation.next(conversation);
    this.setCurrentConversation(conversation);
    this.afterSetConversationsSource$.next(conversation);
    this.triggerAppMessageItem$.next(conversation as unknown as TaskItem);
    if (!conversation?.id) return;

    // workaround to prevent multiple navigation to the same conversation
    // check if current conversation is the same as the one in the url
    // TODO: refactor the header-conversation component to prevent calls openConversation
    if (
      this.router.url.includes(conversation.id) &&
      this.router.url.includes(conversation.taskId)
    ) {
      return;
    }

    const queryParams = {
      conversationId: conversation.id,
      taskId: conversation.taskId,
      conversationType: conversation.conversationType,
      appMessageCreateType: null
    };

    setTimeout(() => {
      this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
    }, 0);
  }

  setCurrentConversation(conversation: UserConversation) {
    conversation = conversation ? conversation : null;
    this.currentConversation.next(conversation);
    this.currentConversationId.next(conversation?.id);
    if (!conversation || !conversation.id || this.isConsole) return;
    this.store.dispatch(
      conversationPageActions.setCurrentConversationId({
        id: conversation?.id || null
      })
    );

    conversation.isUnreadIndicator = false;
    conversation.isRead = true;
    conversation.isSeen = true;
  }

  setUpdatedConversation(conversationId: string, status: string) {
    this.updatedConversation.next({ conversationId, status });
  }

  setNewTab(tab: MessageStatus) {
    this.loadingService.onLoading();
    this.trudiResponseConversation.next(null);
    this.currentConversation.next({});
    this.currentStatus = tab;
  }

  applySearch(search) {
    this.conversationSearch.next(search);
  }

  agentJoined() {
    const conversation = this.currentConversation.getValue();
    return !!conversation?.isAgentJoined;
  }

  sendTyingSocketByCallingAPI(conversationId: string, userId: string, params) {
    return this.apiService.postAPI(conversations, 'client-typing', {
      conversationId,
      userId,
      params
    });
  }

  agentJoinToConversation(conversationId: string, propertyId: string) {
    return this.apiService.postAPI(
      conversations,
      'agent-join-to-conversation',
      { conversationId, propertyId }
    );
  }

  getTrudiResponse(
    categoryId: string,
    conversationId: string
  ): Observable<TrudiResponse> {
    return this.apiService.getAPI(
      conversations,
      `un-happy/get-trudi-response?categoryId=${categoryId}&conversationId=${conversationId}`
    );
  }

  getTrudiIntents(
    text: string,
    conversationId: string,
    userId: string,
    propertyId: string
  ): Observable<Intents[]> {
    return this.apiService.postAPI(conversations, 'un-happy/get-intents', {
      conversationId,
      text,
      userId,
      propertyId
    });
  }

  exportHistoryConversation(
    userPropertyId: string,
    clientTimeZone: string
  ): Observable<any[]> {
    return this.apiService.postAPI(
      conversations,
      `export-conversation/${userPropertyId}?clientTimeZone=${clientTimeZone}`,
      {}
    );
  }

  confirmTrudiResponse(
    categoryId: string,
    conversationId: string
  ): Observable<TrudiResponse> {
    return this.apiService.postAPI(
      conversations,
      'un-happy/confirm-trudi-response',
      {
        categoryId,
        conversationId
      }
    );
  }

  confirmTrudiContact(
    conversationId: string,
    taskId: string,
    userPropertyId: string,
    agencyId: string,
    email?: string,
    phoneNumber?: string,
    oldUserId?: string,
    isSuggested: boolean = false,
    channelUserId?: string,
    requireCreateSecondContact?: boolean
  ): Observable<TrudiResponse> {
    return this.apiService.postAPI(
      conversations,
      'un-happy/confirm-contact-user',
      {
        conversationId,
        taskId,
        userPropertyId,
        agencyId,
        email,
        phoneNumber,
        oldUserId,
        isSuggested,
        channelUserId,
        requireCreateSecondContact
      }
    );
  }

  confirmTrudiSupplierOrOtherContact(
    userId: string,
    taskId: string,
    conversationId: string,
    email?: string,
    phoneNumber?: string,
    oldUserId?: string,
    isSuggested: boolean = false,
    channelUserId?: string,
    requireCreateSecondContact?: boolean
  ) {
    return this.apiService.postAPI(
      conversations,
      'un-happy/confirm-supplier-or-other-contact',
      {
        userId,
        taskId,
        conversationId,
        email,
        phoneNumber,
        oldUserId,
        isSuggested,
        channelUserId,
        requireCreateSecondContact
      }
    );
  }

  confirmTrudiPM(
    userId: string,
    taskId: string,
    conversationId: string,
    email?: string,
    phoneNumber?: string,
    oldUserId?: string,
    isSuggested: boolean = false
  ) {
    return this.apiService.postAPI(
      conversations,
      'un-happy/confirm-pm-contact',
      {
        userId,
        taskId,
        conversationId,
        email,
        phoneNumber,
        oldUserId,
        isSuggested
      }
    );
  }

  confirmTrudiPropertyContact(
    conversationId: string,
    taskId: string,
    propertyId: string,
    agencyId: string,
    email?: string,
    phoneNumber?: string
  ) {
    return this.apiService.postAPI(conversations, 'un-happy/confirm-property', {
      conversationId,
      taskId,
      propertyId,
      agencyId,
      email,
      phoneNumber
    });
  }

  confirmTrudiTaskType(
    conversationId: string,
    taskId: string,
    taskNameId: string,
    isSendSimilarEnquiry = false
  ) {
    return this.apiService.postAPI(conversations, 'un-happy/confirm-task', {
      taskId,
      conversationId,
      taskNameId,
      isSendSimilarEnquiry
    });
  }

  /**
   * @deprecated
   */
  createNewTaskUnHappyPath(
    taskId: string,
    categoryId: string,
    conversationId: string
  ): Observable<CreateNewTaskUnHappyResponse> {
    return this.apiService.postAPI(conversations, 'un-happy/create-new-task', {
      taskId,
      categoryId,
      conversationId
    });
  }

  isTrudiControlConversation(conversation) {
    return (
      conversation.status === status.locked ||
      conversation.status === status.agent_expectation
    );
  }

  changeTicketButtonStatus(
    conversationId: string,
    action:
      | ForwardButtonAction
      | PetRequestButtonAction
      | LeaseRenewalRequestButtonAction,
    stepIndex: number,
    status: TrudiButtonEnumStatus
  ) {
    return this.apiService.postAPI(
      conversations,
      'pm-portal/change-ticket-button-status',
      {
        conversationId,
        action,
        stepIndex,
        status
      }
    );
  }

  completedTrudiResponseStep(conversationId: string, step: number) {
    return this.apiService.postAPI(
      conversations,
      'pm-portal/completed-trudi-response-step',
      {
        conversationId,
        step
      }
    );
  }

  currentUserChangeConversationStatus(
    status: EMessageType,
    addMessageToHistory = true
  ) {
    const currentUser = this.userService.userInfo$.getValue();
    const user = {
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      isUserPropetyTree: currentUser.idUserPropetyTree ? true : false,
      avatar: currentUser.googleAvatar,
      id: currentUser.id,
      type: currentUser.type,
      status
    };

    this.updateConversationStatus$.next({
      status,
      option: '',
      user,
      addMessageToHistory
    });
  }

  trudiChangeConversationStatus(
    status: EMessageType,
    addMessageToHistory = true
  ) {
    const user: LastUser = {
      firstName: 'Trudi',
      status: 'status',
      isUserPropetyTree: false,
      lastName: '',
      avatar: 'assets/icon/trudi-logo.svg',
      id: trudiUserId,
      type: 'trudi'
    };

    this.updateConversationStatus$.next({
      status,
      option: '',
      user,
      addMessageToHistory
    });
  }

  completedButtonStep(
    conversationId: string,
    action: ForwardButtonAction,
    step: number
  ) {
    return this.apiService.postAPI(
      conversations,
      'pm-portal/completed-button',
      {
        conversationId,
        action,
        step
      }
    );
  }

  getFilesSupplierReply(taskId: string) {
    return this.apiService.getAPI(
      conversations,
      `pm-portal/get-files-supplier-reply?taskId=${taskId}`
    );
  }

  editTicketNote(body) {
    return this.apiService.postAPI(
      conversations,
      'pm-portal/edit-ticket-note',
      body
    );
  }

  getListSupplierSendedQuote(
    taskId: string
  ): Observable<SupplierSendedQuote[]> {
    return this.apiService.getAPI(
      conversations,
      `pm-portal/list-supplier-sended-quote?taskId=${taskId}`
    );
  }

  getSupplierCreateWorkOrder(taskId: string): Observable<SupplierSendedQuote> {
    return this.apiService.getAPI(
      conversations,
      `pm-portal/get-supplier-create-work-order?taskId=${taskId}`
    );
  }

  sendMaintenanceJob(
    propertyId: string,
    agencyId: string,
    taskId: string,
    summary: string,
    description: string,
    photos: PhotoSendMain[]
  ) {
    return this.apiService.postAPI(
      conversations,
      'pm-portal/create-pt-maintenance',
      {
        propertyId,
        agencyId,
        taskId,
        summary,
        description,
        photos
      }
    );
  }

  sendMaintenanceJobV2(
    propertyId: string,
    agencyId: string,
    taskId: string,
    summary: string,
    description: string
  ) {
    return this.apiService.postAPI(
      conversations,
      'pm-portal/create-pt-maintenance',
      {
        propertyId,
        agencyId,
        taskId,
        summary,
        description
      }
    );
  }

  changeMaintenanceJobPT(
    taskId: string,
    status: MaintenanceJobStatus,
    agencyId: string
  ) {
    return this.apiService.postAPI(
      conversations,
      'pm-portal/change-pt-maintenance-status',
      {
        taskId,
        status,
        agencyId
      }
    );
  }

  sendUsersQuoteLandlord(body) {
    return this.apiService.postAPI(
      conversations,
      'pm-portal/update-forward-landlord-maintenance',
      body
    );
  }

  getListLandlordConversationByTask(taskId: string) {
    return this.apiService.getAPI(
      conversations,
      `pm-portal/get-list-conversation-landlord?taskId=${taskId}`
    );
  }

  handleError(err) {
    console.log(err);
    const errorMessage = err.error?.message?.message || err.error?.message;
    if (!errorMessage) {
      return;
    }
    this.toastService.error(errorMessage);
  }

  getInvoice(taskId) {
    return this.apiService
      .getData<Invoice>(
        conversations + `pm-portal/get-invoice?taskId=${taskId}`
      )
      .pipe(
        catchError((err) => {
          this.handleError(err);
          return this.apiService._errorHandler(err);
        }),
        pluck('body')
      );
  }

  createInvoice(body) {
    return this.apiService.postAPI(
      conversations,
      'pm-portal/create-pt-invoice',
      body
    );
  }

  getTrudiResponseSaved(conversationId: string, trudiResponseType: string) {
    if (
      ([ETrudiType.ticket, ETrudiType.q_a] as string[]).includes(
        trudiResponseType
      )
    ) {
      return this.apiService.getAPI(
        conversations,
        `get-trudi-response-saved?conversationId=${conversationId}&trudiResponseType=${trudiResponseType}`
      );
    }
    return of({});
  }

  deleteConversation(conversationId: string) {
    return this.apiService
      .postAPI(conversations, 'delete-conversation/' + conversationId, {})
      .pipe(
        tap((el) => {
          if (el && (el?.conversationId || el?.id)) {
            const dataForToast = {
              conversationId: el.conversationId || el.id,
              taskId: el.id,
              isShowToast: true,
              type: el?.isHide
                ? SocketType.moveToFolder
                : SocketType.changeStatusTask,
              mailBoxId: el.mailBoxId,
              taskType: TaskType.MESSAGE,
              status:
                el?.isHide && el?.provider === EmailProvider.OUTLOOK
                  ? TaskStatusType.deleteTaskSpamOutlook
                  : el?.isHide && el?.provider === EmailProvider.GMAIL
                  ? TaskStatusType.deleteTaskSpam
                  : TaskStatusType.deleted,
              pushToAssignedUserIds: [],
              threadId: el?.isHide ? el?.threadId : '',
              mailFolderId: el?.isHide ? el?.spamLabel?.externalId : '',
              folderName: el?.isHide ? el?.spamLabel?.name : ''
            };
            this.toastCustomService.openToastCustom(
              dataForToast,
              true,
              EToastCustomType.SUCCESS_WITH_VIEW_BTN,
              false
            );
          }
        })
      );
  }

  deleteConversationV2(conversationId: string) {
    return this.apiService.postAPI(
      conversations,
      'delete-conversation/' + conversationId,
      {}
    );
  }

  saveTrudiResponseForNextTime(body: {
    conversationId: string;
    trudiResponse: {
      text: string;
      stepIndex: number;
      buttonIndex?: number;
      trudiResponseType: ETrudiType | string;
      optionIndex?: number;
      action?: PetRequestButtonAction;
    };
  }) {
    return this.apiService.postAPI(
      conversations,
      'save-trudi-response-for-next-time',
      body
    );
  }

  getSavedNextTimeData() {
    const trudiConv = this.trudiResponseConversation?.getValue();
    this.getTrudiResponseSaved(
      trudiConv.id,
      trudiConv.trudiResponse?.type
    ).subscribe({
      next: (res) => {
        if (!res || !Object.keys(res).length) return;
        this.savedNextTimeData.next(res);
      },
      error: (err) => {
        this.savedNextTimeData.next(null);
      }
    });
  }

  convertToTask(
    conversationId: string,
    categoryId: string,
    taskNameId: string,
    propertyId: string,
    assignedUserIds: string[],
    options?: NewTaskOptions,
    isCreateBlankTask?: boolean,
    taskNameTitle?: string,
    taskFolderId?: string,
    indexTitle: string = '',
    taskTitle: string = ''
  ) {
    return this.apiService.postAPI(conversations, 'un-happy/convert-task', {
      conversationId,
      categoryId,
      taskNameId,
      propertyId,
      assignedUserIds,
      options,
      taskFolderId,
      isCreateBlankTask,
      taskNameTitle,
      indexTitle,
      taskTitle
    });
  }
  convertMultipleToTask({
    sessionId,
    propertyId,
    listConversation,
    taskNameId,
    assignedUserIds,
    options,
    taskTitle = '',
    indexTitle = '',
    taskFolderId,
    totalAgain,
    isConvertToMultipleTask
  }: {
    sessionId: string;
    propertyId: string;
    listConversation: IListConversationConfirmProperties[];
    taskNameId: string;
    assignedUserIds: string[];
    options;
    taskTitle: string;
    indexTitle: string;
    taskFolderId: string;
    totalAgain?: number;
    isConvertToMultipleTask?: boolean;
  }) {
    return this.apiService.postAPI(conversations, 'convert-multiple-task', {
      sessionId,
      propertyId,
      listConversation,
      taskNameId,
      assignedUserIds,
      options,
      taskTitle,
      indexTitle,
      taskFolderId,
      totalAgain,
      isConvertToMultipleTask
    });
  }

  updateReiFormInfor(
    taskId: string,
    action: string,
    reiFormInfor: ReiFormData
  ): Observable<any> {
    const body = {
      taskId,
      stepIndex: 0,
      action,
      reiFormInfor
    };
    return this.apiService.postAPI(
      conversations,
      'pet-request/update-rei-form-info',
      body
    );
  }

  getListDefaultObject() {
    return this.apiService.getAPI(conversations, 'get-list-default-object');
  }

  getReminderSetting() {
    return this.apiService.getAPI(conversations, `reminder/get-setting`);
  }

  saveReminderSetting(body) {
    return this.apiService.postAPI(
      conversations,
      `reminder/save-setting`,
      body
    );
  }

  checkIsSendFromEmail(conversationId: string) {
    const listConversation = this.listConversationByTask.getValue();
    const targetConversation = listConversation.find(
      (conv) => conv.id === conversationId
    );
    if (!targetConversation) return true;
    return (
      this.getConversationType(
        targetConversation.status,
        targetConversation.inviteStatus,
        targetConversation.crmStatus,
        targetConversation.secondaryEmail
      ) === EConversationType.nonApp
    );
  }

  sendBulkMessageEvent(body) {
    return this.apiService.postAPI(
      conversations,
      '/send-bulk-message-with-event',
      body
    );
  }

  isSupplierOrOtherContactRaiseMsg(): boolean {
    const { unhappyStatus, conversations } =
      this.taskService.currentTask$.value || {};
    const ESupplierOrOther = [
      EConfirmContactType.SUPPLIER,
      EConfirmContactType.OTHER
    ];
    return (
      ESupplierOrOther.includes(unhappyStatus?.confirmContactType) &&
      ESupplierOrOther.includes(
        conversations?.[0]?.startMessageBy as EConfirmContactType
      )
    );
  }

  getPayloadSyncPT() {
    return {
      taskId: this.taskService.currentTask$.value?.id,
      agencyId:
        this.taskService.currentTask$.value?.agencyId ||
        this.agencyIdFromLocalStorage,
      propertyId: this.propertyService.currentPropertyId.value,
      invoiceTaskType: EInvoiceTaskType.MAINTENANCE
    };
  }

  syncInvoiceToPT() {
    const payload = this.getPayloadSyncPT();
    return this.apiService.postAPI(
      conversations,
      'maintenance-request/sync-invoice',
      payload
    );
  }
  sendRequestChangeEmail(body) {
    return this.apiService.postAPI(conversations, 'request-change-email', body);
  }
  get agencyIdFromLocalStorage() {
    return localStorage.getItem('agencyId') || null;
  }

  updateFlagUrgent(conversationId: string) {
    return this.apiService.putAPI(
      conversations,
      `change-flag-urgent-conversation`,
      {
        conversationId
      }
    );
  }

  markAsReadConversation(conversationId: string, mailBoxId: string) {
    return this.apiService.postAPI(email, `mailbox/mark-read-message`, {
      conversationId,
      mailBoxId
    });
  }

  markAsReadMultiConversation(conversationIds: string[], mailBoxId: string) {
    return this.apiService.postAPI(email, `mailbox/mark-read-messages`, {
      conversationIds,
      mailBoxId
    });
  }

  markAsUnread(conversationId: string) {
    return this.apiService.putAPI(
      conversations,
      `mark-as-unread/${conversationId}`
    );
  }

  markAsUnreadMultiConversation(conversationIds: string[], mailBoxId: string) {
    return this.apiService.postAPI(conversations, `mark-as-unread-messages`, {
      conversationIds,
      mailBoxId
    });
  }

  sendMailRequestFeature(feature: EAddOn, mailboxId: string) {
    return this.apiService.postAPI(conversations, 'send-mail-request-feature', {
      feature,
      mailboxId
    });
  }

  convertMultipleTask(payload: { conversationIds: string[] }) {
    return this.apiService.postAPI(
      conversations,
      'convert-multiple-task/check-conversation',
      payload
    );
  }

  syncAttachment(payload: {
    type: SyncAttachmentType;
    threadIds: string[];
    mailBoxId: string;
  }) {
    payload.threadIds?.length > 0 &&
      (payload.threadIds = [...new Set(payload.threadIds)]);
    if (payload.threadIds?.length < 1) {
      return of();
    }
    return this.apiService
      .postAPI(conversations, 'mailbox/sync-attachment', payload)
      .subscribe();
  }

  setParticipantChanged(value: IUserParticipant) {
    this.participantChanged$.next(value);
  }

  getParticipantChanged() {
    return this.participantChanged$.asObservable();
  }

  deleteDraftMsg(payload: {
    taskId: string;
    conversationId: string;
    draftMessageId?: string;
    isFromDraftFolder: boolean;
    isDeleteQueue?: boolean;
  }) {
    return this.apiService.deleteAPI(conversations, 'delete-draft', payload);
  }

  markAsUnreadMessage(body: { messageId: string; isRead: boolean }) {
    return this.apiService.postAPI(
      conversations,
      'change-reading-status-single-message',
      body
    );
  }

  changeMessageReadStatus(body: { messageId: string; isMarkUnRead: boolean }) {
    return this.apiService.putAPI(conversations, 'message/read-status', body);
  }

  notifyReloadConversationDetail(conversationId: string) {
    this.reloadConversationDetail.next(conversationId);
  }

  getReloadConversationDetail() {
    return this.reloadConversationDetail.asObservable();
  }

  createConversationApp(conversationId, ticketId, taskId?) {
    return this.apiService.postAPI(conversations, 'create-conversation-app', {
      conversationId,
      ticketId,
      taskId
    });
  }

  deleteConversationApp(payload: {
    conversationId: string;
    draftMessageId?: string;
  }) {
    return this.apiService.postAPI(
      conversations,
      'delete-linked-conversation-app',
      payload
    );
  }

  public getCreateConversationApp() {
    return this.triggerCreateConversationApp.asObservable();
  }

  public setCreateConversationApp(value: ICreateNewConversationApp) {
    this.triggerCreateConversationApp.next(value);
  }

  get selectedAppMessageTicketId$() {
    return this.selectedAppMessageTicketId.asObservable();
  }

  public setSelectedAppMessageTicketId(ticketId: string) {
    this.selectedAppMessageTicketId.next(ticketId);
  }

  removeAppMessage(payload: IRemoveAppMessagePayload) {
    return this.apiService.postAPI(
      conversations,
      'remove-app-message',
      payload
    );
  }

  filterTempConversations(callback: (item: ITempConversation) => void, action) {
    if (!action) {
      throw new Error('filterTempConversations must be action');
    }
    this.tempConversations.next([
      ...this.tempConversations.value.filter(callback)
    ]);
  }

  pushTempConversation(tempConversationId: string, action: string) {
    if (!action) {
      throw new Error('pushTempConversation must be action');
    }
    this.tempConversations.next([
      ...this.tempConversations.value,
      {
        id: tempConversationId
      }
    ]);
  }

  resetTempConversations(action: string) {
    if (!action) {
      throw new Error('resetTempConversations must be action');
    }
    this.tempConversations.next([]);
  }

  hasTempConversation(id: string) {
    return this.tempConversations?.value?.some((item) => item.id === id);
  }

  deleteConversationFromTaskHandler(conversationId: string) {
    return this.apiService.deleteAPI(
      conversations,
      `delete-conversation-from-task/${conversationId}`
    );
  }

  setLoadingNewMsg(
    conversationId: string,
    createdAt: string,
    isNewCompose: boolean = false
  ) {
    const tempConversation = {
      id: conversationId,
      isLoading: true,
      isNewCompose,
      createdAt,
      messageDate: createdAt,
      conversationId,
      conversations: [
        {
          id: conversationId,
          messageDate: createdAt
        }
      ]
    };
    if (this.helper.isInboxDetail) {
      this.triggerLoadingHeaderConversation.next(tempConversation);
      return;
    }
    this.store.dispatch(
      appMessageActions.setLoadingMessage(tempConversation as any)
    );
  }

  removeLoadingNewMsg(conversationId: string) {
    if (this.helper.isInboxDetail) return;
    this.store.dispatch(
      appMessageActions.removeLoadingMessage({
        conversationId
      })
    );
  }

  dispatchTempMessage(message) {
    message?.id &&
      this.store.dispatch(
        appMessageActions.setTempMessage({
          ...message,
          messageDate: message.conversations?.[0]?.messageDate
        })
      );
  }

  getSuggestedProperty(conversationId: string) {
    return this.apiService.getAPI(
      conversations,
      `get-suggested-property?conversationId=${conversationId}`
    );
  }

  pmJoinConversation(conversationId: string) {
    return this.apiService.postAPI(conversations, 'pm-join-conversation', {
      conversationId: conversationId
    });
  }
}
