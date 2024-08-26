import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  Self,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Params, Router } from '@angular/router';
import { isEqual } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import {
  Observable,
  Subject,
  Subscription,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  finalize,
  fromEvent,
  lastValueFrom,
  map,
  merge,
  of,
  pairwise,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { IListDynamic } from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { ApiService } from '@services/api.service';
import { ChatGptService, EBoxMessageType } from '@services/chatGpt.service';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  CONVERSATION_STATUS,
  DEBOUNCE_SOCKET_TIME,
  DEFAULT_TEXT_MESS_HEIGHT,
  FILE_VALID_TYPE,
  PHONE_PREFIXES,
  SYNC_PT_FAIL,
  SYNC_PT_SUCCESSFULLY,
  listCalendarTypeDot,
  listVideoTypeDot
} from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { DragDropFilesService } from '@services/drag-drop.service';
import { FilesService } from '@services/files.service';
import { FirebaseService } from '@services/firebase.service';
import { HeaderService } from '@services/header.service';
import { LoadingService } from '@services/loading.service';
import { MessageService } from '@services/message.service';
import { ASSIGN_TO_MESSAGE } from '@services/messages.constants';
import { NotificationService } from '@services/notification.service';
import { PopupService } from '@services/popup.service';
import { PropertiesService } from '@services/properties.service';
import { ReiFormService } from '@services/rei-form.service';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { sendOptionLabel } from '@shared/components/tiny-editor/send-option-control/send-option-control.component';
import { SendOption } from '@shared/components/tiny-editor/tiny-editor.component';
import { TrudiAddContactCardService } from '@shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { ECreatedFrom, EMessageType } from '@shared/enum/messageType.enum';
import { EOptionType } from '@shared/enum/optionType.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  EInviteStatus,
  ERecognitionStatus,
  EUserDetailStatus,
  EUserPropertyType
} from '@shared/enum/user.enum';
import {
  HandleInitAISummaryContent,
  displayName,
  findLastItemMsgTypeTextOrTicket,
  getActionLinkImgSrc
} from '@shared/feature/function.feature';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import { CategoryUser } from '@shared/types/action-link.interface';
import {
  IParticipant,
  LastUser,
  UserConversation
} from '@shared/types/conversation.interface';
import { FileCarousel } from '@shared/types/file.interface';
import { FileMessage, IMessage } from '@shared/types/message.interface';

import { Property } from '@shared/types/property.interface';
import { AgentFileProp } from '@shared/types/user-file.interface';
import { CurrentUser, IUserParticipant } from '@shared/types/user.interface';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import {
  ESentMsgEvent,
  ISendMsgPayload,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { conversations } from 'src/environments/environment';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { ICompany } from '@shared/types/company.interface';
import { CompanyService } from '@services/company.service';
import { Store } from '@ngrx/store';
import {
  conversationActions,
  conversationPageActions
} from '@core/store/conversation/actions/conversation.actions';
import {
  selectAllConversationMessagesInternal,
  selectConversationById,
  selectCurrentConversationId
} from '@core/store/conversation';
import { TaskItem } from '@shared/types/task.interface';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import {
  EMessageDetailProperty,
  MessageDetailPipe
} from '@/app/dashboard/modules/inbox/modules/app-message-list/pipes/message-detail.pipe';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { mapEmailMetadata } from '@/app/task-detail/modules/app-chat/components/button-action/utils/functions';
import { MessageLoadingService } from '@/app/task-detail/services/message-loading.service';
import { AppChatUtil } from '@/app/task-detail/modules/app-chat/app-chat-util';
import { AppChatService } from '@/app/task-detail/modules/app-chat/app-chat.service';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { ETypePage } from '@/app/user/utils/user.enum';
import { whiteListInMsgDetail } from '@shared/constants/outside-white-list.constant';
import {
  ComposeEditorType,
  IAppTriggerSendMsgEvent
} from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/app-compose-message.component';
import { IAppMessageActionItem } from '@/app/dashboard/modules/inbox/modules/app-message-list/interfaces/message.interface';

const videoPattern = new RegExp(listVideoTypeDot.join('|'), 'gi');

import uuid4 from 'uuid4';
import { TaskHelper } from '@/app/task-detail/utils/task.helper';
import { HelperService } from '@services/helper.service';
import { ERouterHiddenSidebar } from '@/app/dashboard/shared/types/sidebar.interface';
import { appMessageActions } from '@core/store/app-message/actions/app-message.actions';
import { EConversationStatus } from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';
import { SmsMessageApiService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms.message.api.services';
import { SmsMessageListService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message.services';
import { SmsMessageConversationIdSetService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message-id-set.service';
import { SmsComposeMessageComponent } from '@/app/dashboard/modules/inbox/modules/sms-view/components/sms-compose-message/sms-compose-message.component';
import { ESmsMessageDetailPopup } from '@/app/dashboard/modules/inbox/modules/sms-view/utils/sms.enum';
import { SyncPropertyDocumentStatus } from '@/app/shared';
import { EJoinConversationOpenFrom } from '@/app/dashboard/modules/inbox/components/join-conversation/join-conversation.component';

enum MessageType {
  text = 'text',
  url = 'url'
}

enum EBehaviorScroll {
  SMOOTH = 'smooth',
  AUTO = 'auto'
}

@Component({
  selector: 'sms-message-detail-list',
  templateUrl: './sms-message-detail-list.component.html',
  styleUrl: './sms-message-detail-list.component.scss',
  providers: [
    TrudiSendMsgFormService,
    TrudiSendMsgService,
    LoadingService,
    ChatGptService,
    MessageDetailPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmsMessageDetailListComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  @ViewChild('scrollDown', { static: false }) private scrollDown: ElementRef;
  @ViewChild('redLineNew', { static: false }) private redLineNew: ElementRef;
  @ViewChild('boxChat') private boxChat: ElementRef<HTMLDivElement>;
  @ViewChild('textareaContainer') textareaContainer: ElementRef;
  @ViewChild('todoList', { static: true }) todoList:
    | string
    | CdkDropList
    | (string | CdkDropList);
  @ViewChild('composeMessage') composeMessageRef: SmsComposeMessageComponent;
  @ViewChild('chatHeader') chatHeader: ElementRef<HTMLDivElement>;

  public readonly ComposeEditorType = ComposeEditorType;
  public readonly ESmsMessageDetailPopup = ESmsMessageDetailPopup;
  public readonly EOptionType = EOptionType;
  public readonly EInviteStatus = EInviteStatus;
  public readonly EUserDetailStatus = EUserDetailStatus;
  public readonly messageType = MessageType;
  public readonly messagesType = EMessageType;
  public readonly EConversationType = EConversationType;
  public readonly ModalPopupPosition = ModalPopupPosition;
  public readonly ERecognitionStatus = ERecognitionStatus;
  public readonly EJoinConversationOpenFrom = EJoinConversationOpenFrom;
  public readonly JoinConversationDisabledTooltipText =
    'Cannot join until customer email is verified';

  private destroy$ = new Subject<void>();
  private _currentProperty: Property;
  private totalMsgRendered = 0;
  public allMessageRender = false;
  public popupState: ESmsMessageDetailPopup = null;
  public EConversationStatus = EConversationStatus;

  private _groupMessage = [];
  firstEmitConversation: any;
  isFetchingOlderMessages: boolean = false;
  isFetchingNewerMessages: boolean = false;
  public currentPMJoined: boolean = false;
  public isDisabledJoinButton: boolean = false;
  public pmJoinningConversation: boolean = false;
  public set groupMessage(value) {
    this._groupMessage = value.map((group) => ({
      ...group,
      messages: group.messages.map((message) => ({
        ...message,
        isUserFromSms: this.checkUserFromSms(message),
        trackByMessageId: message?.languageCode
          ? `${message.id}_${message?.languageCode}`
          : message.id
      }))
    }));
    const conversationId = value?.[0]?.messages[0]?.conversationId;
    if (conversationId) {
      this.store.dispatch(
        conversationActions.setGroupMessage({
          id: conversationId,
          groupMessage: value
        })
      );
    }
  }
  public get groupMessage() {
    return this._groupMessage;
  }

  private _currentConversation: UserConversation | any;
  public get currentConversation() {
    return this._currentConversation;
  }
  public set currentConversation(value) {
    this._currentConversation = value ?? {};

    if (value?.scheduleMessageCount > 0 || value?.isDraft) {
      this.allMessageRender = true;
    }
    if (value?.id) {
      this.store.dispatch(
        conversationActions.setCurrentConversation({
          id: value.id,
          conversation: value
        })
      );
    }
  }

  public currentConversationId: string;
  public listOfConversationCategory: any = [];
  public listOfTicketCategory: any = [];
  public fullCategoryList: CategoryUser[] = [];
  public isFirstJoined = true;

  //File
  public selectedFiles = [];
  public initialIndex: number;
  public arrayImageCarousel: FileCarousel[] = [];
  public arrayImageCarousel2: FileCarousel[] = [];
  public connectedChild: string | CdkDropList | (string | CdkDropList)[];
  public currentRoleDrop = '';
  public fileList: AgentFileProp[] = [];

  //Timeout
  public scrollBottomTimeOut: NodeJS.Timeout = null;
  public scrollRedlineTimeOut: NodeJS.Timeout = null;

  public viewSyncFile: boolean = false;
  public isRmEnvironment: boolean = false;
  private isFirstLoad = true;

  public isReadMessage: boolean = false;
  public notificationId: string = '';
  public isResetFile = false;
  public fileSelected;
  public isCarousel: boolean = false;
  public isShowToast: boolean = false;
  public defaultText: string = '';
  public isShowTrudiSendMsg: boolean = false;
  public isDisconnected: boolean = false;
  public contentText: string = '';
  public filterArrayMsg = [
    EMessageType.solved,
    EMessageType.agentJoin,
    EMessageType.file,
    EMessageType.buttons,
    EMessageType.url,
    EMessageType.ticket,
    EMessageType.startSession,
    EMessageType.endSession
  ];
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
    'otherConfigs.createMessageFrom': ECreateMessageFrom.APP_MESSAGE,
    'inputs.rawMsg': '',
    'inputs.openFrom': '',
    'inputs.listOfFiles': [],
    'inputs.selectedTasksForPrefill': null,
    'inputs.isForwardDocument': false,
    'inputs.isAppMessage': false
  };
  attachmentTextEditorConfigs = {
    'footer.buttons.showBackBtn': false
  };
  public conversationStatus = CONVERSATION_STATUS;
  public currentAgencyId: string;
  public paragraph: object = { rows: 0 };
  public imageDetailUrl = '';
  public currentCompany: ICompany;
  public isArchiveMailbox: boolean;
  public isDisconnectMailbox: boolean;
  private getConversationSubscriber: Subscription = new Subscription();
  private eventChangeQuoteSizeHandler: (e: Event) => void;

  public listDynamicFieldData: IListDynamic[] = [];
  public listParamMissingData: string[] = [];
  public rawMsg: string;
  public isRmEvironment: boolean = false;
  public areaCode: string;
  public maxWidthSmallEditor: number = 1450;
  public attachmentLoadKey: string = uuid4();
  public threadId: string = null;

  public lastMessagesTypeText;

  showScrollToBottomButton = null;
  EBehaviorScroll = EBehaviorScroll;
  isBeforeUpdated: boolean = false;
  isAfterUpdated: boolean = false;
  isViewMostRecent: boolean = false;
  isFirstLoadScrollDownContainerEl: boolean = true;
  isFirstLoadRedLineNewEl: boolean = null;
  isHideRedLineNew: boolean = false;
  currentConversationIdClone: string;
  currentTaskId: string;
  currentUser: CurrentUser = null;
  EViewDetailMode = EViewDetailMode;
  isShowSidebarRight: boolean = false;
  isLoadingHistoryConversation: boolean = false;
  readonly FILE_VALID_TYPE = FILE_VALID_TYPE;
  isConsole: boolean;
  currentBtnOption = SendOption.Send;
  currentSelectViaOption = sendOptionLabel.EMAIL;
  public prefillToCcBccReceiversList;
  public headerLeftHeight: number = 0;
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
  private isFirstReadMessage = true;
  private isFirstLoadHistory = true;
  public lastReadMessageId: string;
  public shouldSkipRender: boolean;
  public currentTask: TaskItem;
  public listTicket: IAppMessageActionItem[] = [];
  private loadingTicket$: Subject<boolean> = new Subject();
  public loadingTicket: boolean = false;
  private currentMailBoxId: string;
  readonly ETypePage = ETypePage;
  public readonly whiteListMsgDetail = [...whiteListInMsgDetail];
  public currentDataUserProfile: UserProperty;
  public isUserProfileDrawerVisible: boolean = false;
  private markedForRefresh: boolean = true;
  public heightDetailWrapper: string = 'calc(100% - 234px)';

  public lastReadMessageIndex: number = -1;
  public isInboxDetail: boolean;

  private cacheBodyMessages: Map<string, ISendMsgPayload> = new Map();
  private listTempId: Map<string, string> = new Map();
  public queryParams: Params = {};
  public composeType: ComposeEditorType = ComposeEditorType.REPLY;
  public hiddenLinkedTask = ERouterHiddenSidebar;
  public isNewConversationState: boolean = false;
  public showLinkedTask: boolean = false;

  public isAnyLoading$: Observable<boolean> = new Observable();
  public loading: boolean = false;
  private listAction$ = new Subject<IAppMessageActionItem[]>();
  private getHistoryOfConversationV2Sub = new Subscription();
  private chatGptSubscription = new Subscription();

  public loadingCreateScratch: boolean = false;
  private tempConversationId: string = null;
  private _listofmessages: any[];
  public userVerified: boolean = false;
  public emailVerified: string = '';
  public messageSectionHeight: number;
  private tabChange: boolean = false;
  private countSocketSend: number = 0;
  private eventChangeTab: (e: Event) => void;
  private eventChangeListenerBound: boolean = false;

  constructor(
    private propertyService: PropertiesService,
    private apiService: ApiService,
    private messageService: MessageService,
    public conversationService: ConversationService,
    public userService: UserService,
    private websocketService: RxWebsocketService,
    private agentUserService: AgentUserService,
    private filesService: FilesService,
    public dropService: DragDropFilesService,
    public sharedService: SharedService,
    private readonly elr: ElementRef,
    public taskService: TaskService,
    private headerService: HeaderService,
    @Self() private loadingService: LoadingService,
    private toastrService: ToastrService,
    public firebaseService: FirebaseService,
    public notificationService: NotificationService,
    private fileService: FilesService,
    private chatGptService: ChatGptService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgService: TrudiSendMsgService,
    private agencyDashboardService: AgencyDashboardService,
    private router: Router,
    private reiFormService: ReiFormService,
    private routineInspectionService: RoutineInspectionService,
    public inboxService: InboxService,
    private messageLoadingService: MessageLoadingService,
    private uploadFromCRMService: UploadFromCRMService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private cdr: ChangeDetectorRef,
    private titleCasePipe: TrudiTitleCasePipe,
    private messageDetailPipe: MessageDetailPipe,
    public messageTaskLoadingService: MessageTaskLoadingService,
    private toastCustomService: ToastCustomService,
    private companyService: CompanyService,
    private inboxToolbarService: InboxToolbarService,
    private store: Store,
    private messageFlowService: MessageFlowService,
    private appChatService: AppChatService,
    private sharedMessageViewService: SharedMessageViewService,
    private userProfileDrawerService: UserProfileDrawerService,
    private smsMessageApiService: SmsMessageApiService,
    private smsMessageListService: SmsMessageListService,
    private ngZone: NgZone,
    private helper: HelperService,
    private smsMessageConversationIdSetService: SmsMessageConversationIdSetService,
    private popupService: PopupService
  ) {}

  get scrollDownContainerEl() {
    return this.scrollDown?.nativeElement;
  }

  get createdTimeOfLastMsg(): string {
    if (!this.listofmessages.length) return null;
    let tempMessageTime = this.listofmessages.find(
      (item) => item.isTemp
    )?.createdAt;
    if (tempMessageTime) {
      let givenTime = new Date(tempMessageTime);
      givenTime.setMinutes(givenTime.getMinutes() - 15);
      tempMessageTime = givenTime.toISOString();
    }
    let dateMessage = tempMessageTime
      ? tempMessageTime
      : this.listofmessages[this.listofmessages.length - 1].createdAt;

    let fileList = dateMessage?.files;

    let dateFile;
    let dateCreated = dateMessage;
    if (fileList) {
      const listFileOfMessage = [
        ...(fileList['fileList'] || []),
        ...(fileList['mediaList'] || []),
        ...(fileList['unSupportedList'] || [])
      ];
      dateFile = listFileOfMessage.sort(AppChatUtil.compareDates)?.[
        listFileOfMessage.length - 1
      ]?.createdAt;
    }
    if (dateFile) {
      dateCreated =
        new Date(dateMessage).getTime() > new Date(dateFile).getTime()
          ? dateMessage
          : dateFile;
    }
    return AppChatUtil.formatDateString(dateCreated) as string;
  }

  get createdTimeOfFirstMsg(): string {
    if (!this.listofmessages.length) return null;
    return AppChatUtil.formatDateString(
      this.listofmessages[0].createdAt
    ) as string;
  }

  get isHasNewMessage() {
    if (!this.listofmessages.length) return false;
    return this.listofmessages.some(
      (item, index) => item.isLastReadMessage && this.listofmessages[index + 1]
    );
  }

  get isHasScroll() {
    return (
      this.scrollDownContainerEl?.scrollHeight >
      this.scrollDownContainerEl?.clientHeight
    );
  }

  public get currentProperty() {
    return this._currentProperty;
  }

  public set currentProperty(value) {
    this._currentProperty = value;
    if (this.currentConversationId) {
      this.store.dispatch(
        conversationActions.setCurrentProperty({
          id: this.currentConversationId,
          property: value
        })
      );
    }
  }

  get listofmessages(): any[] {
    return this._listofmessages;
  }

  set listofmessages(value: any[]) {
    this._listofmessages = value.map((message, index) => ({
      ...message,
      originIndex: index,
      isUserFromSms: this.checkUserFromSms(message)
    }));
    this.chatGptService.listMsgInCurrentConversation = value;
    // TODO: remove this hot fix after fix the rendering issue
    setTimeout(() => {
      const firstMessage = value && value[0];
      if (firstMessage && firstMessage.conversationId) {
        const conversationId = firstMessage.conversationId;
        this.store.dispatch(
          conversationActions.setAllConversationMessages({
            conversations: value,
            id: conversationId
          })
        );
      }
    }, 0);
  }

  get sendMsgPopupState() {
    return this.trudiSendMsgService.getPopupState();
  }
  get contactCardPopupState() {
    return this.trudiAddContactCardService.getPopupState();
  }
  get uploadFileFromCRMPopupState() {
    return this.uploadFromCRMService.getPopupState();
  }
  get listReiForm() {
    return this.trudiSendMsgService.getListFilesReiForm();
  }
  get sendMsgForm(): FormGroup {
    return this.trudiSendMsgFormService.sendMsgForm;
  }
  get selectedReceivers(): AbstractControl {
    return this.sendMsgForm?.get('selectedReceivers');
  }
  get selectedContactCard() {
    return this.trudiAddContactCardService.getSelectedContactCard();
  }
  get selectedFilesFromCMS() {
    return this.uploadFromCRMService.getSelectedFiles();
  }

  get isConversationStartByVoicemail() {
    return this.listofmessages.some((item) => item.isSendFromVoiceMail);
  }

  ngOnInit() {
    this.onPairwiseConversation();
    this.onTempConversations();
    this.setupLoadingObservables();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.destroy$),
        filter((mailBoxId) => !!mailBoxId)
      )
      .subscribe((mailBoxId) => {
        this.currentMailBoxId = mailBoxId;
      });
    this.subscribeStore();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.taskService
      .getHeaderLeftHeight()
      .pipe(takeUntil(this.destroy$))
      .subscribe((headerLeftHeight) => {
        this.headerLeftHeight = headerLeftHeight;
      });

    combineLatest([
      this.inboxService.getIsDisconnectedMailbox(),
      this.inboxService.isArchiveMailbox$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([isArchiveMailbox, isDisconnectedMailbox]) => {
        this.createNewConversationConfigs['footer.buttons.disableSendBtn'] = [
          isArchiveMailbox,
          isDisconnectedMailbox
        ].includes(true);
      });

    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDisconnected) => {
        this.isDisconnected = isDisconnected;
      });

    this.messageTaskLoadingService.isLoading$
      .pipe(
        filter((isLoading) => isLoading),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isShowSidebarRight = false;
      });

    this.dropService.handleConnect({
      element: this.todoList,
      unsubscribe: this.destroy$,
      connectedElement: this.connectedChild,
      type: 'parent'
    });
    this.conversationCategory();
    this.buildSendMessageForm();
    this.subscribeChangeParticipants();

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isShow) => {
        this.isArchiveMailbox = isShow;
      });
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isShow) => {
        this.isDisconnectMailbox = isShow;
      });

    this.conversationService.updateConversationStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.updateConversationStatus(
            res.status,
            res.option,
            res.user,
            res.addMessageToHistory
          );
        }
      });

    this.subscribeCurrentConversation();
    this.getListAction();
    this.subscribeTriggerAction();
    this.propertyService.newCurrentProperty
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.currentProperty = res || null;
      });
    this.messageService.getMessagesSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.messages?.length) {
          this.currentConversation = {
            ...this.currentConversation,
            status: res.messages[0].status
          };
          const sortedMessages = res.messages.reverse();
          sortedMessages.forEach((element) => {
            element.message = AppChatUtil.parseMessageToObject(
              element.message,
              this.messageType
            );
            const replaceIndex = this.listofmessages.findIndex(
              (el) => el.id === element.id
            );
            if (replaceIndex !== -1) {
              this.listofmessages[replaceIndex] = element;
            } else {
              this.listofmessages.push(element);
              this.scrollToBottom();
            }
          });
        }
      });
    if (!localStorage.getItem('listTicketCategories')) {
      this.apiService
        .getAPI(conversations, 'get-ticket-categories')
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.listOfTicketCategory = res;
          localStorage.setItem('listTicketCategories', JSON.stringify(res));
        });
    } else {
      this.listOfTicketCategory = JSON.parse(
        localStorage.getItem('listTicketCategories')
      );
    }
    localStorage.setItem('remoteName', '');
    this.conversationService.isDisplayTypingBlock
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && this.isScrolledDown()) {
          this.scrollToBottom();
        }
      });

    this.getFiles();
    this.subscribeViewDetailFile();
    this.subscribeIsShowDrawerViewUserProfile();

    this.websocketService.onSocketMarkRead
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((res) => {
        try {
          const data = res;
          if (data && data.conversationId === this.currentConversation.id) {
            this.listofmessages = this.listofmessages.map((msg) =>
              msg.isRead
                ? msg
                : {
                    ...msg,
                    seenDate: new Date(),
                    isRead: true
                  }
            );
            this.groupMessage = this.appChatService.groupMessagesByDate(
              this.listofmessages
            );
            this.cdr.markForCheck();
          }
        } catch (e) {
          console.log(e);
        }
      });
    this.subscribeCurrentTask();
    this.subscribeCloseAllModal();
    this.subscribeCurrentCompany();
    this.checkRedLineMessage();
    this.triggerConversationId();
    this.subscribeLastReadMessageIndex();
    this.subscribeSocketSend();
    this.subscribeSocketAssignContact();
    this.subscribeSocketSyncPropertyDocumentToPT();
    this.subscribeSocketTranscriptCompleted();
    this.isInboxDetail = this.helper.isInboxDetail;
    this.subscribeEventChangeTab();
    this.subscribeSocketPmJoinConverstation();
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

  checkUserFromSms(message) {
    if (!message) return false;
    const { userType, type, recognitionStatus, userId } = message;
    const userFromSms = this.currentConversation?.participants?.find(
      (item) => item.userId === this.currentConversation?.userId
    );
    const isUserType = [
      EUserPropertyType.SUPPLIER,
      EUserPropertyType.OTHER,
      EUserPropertyType.USER
    ].includes((type || userType) as EUserPropertyType);
    const isRecognizeUser = recognitionStatus;
    const isPMAndTrudi = [
      EUserPropertyType.LEAD,
      EUserPropertyType.AGENT
    ].includes(userType);
    return (
      (isRecognizeUser || isUserType || userId === userFromSms?.userId) &&
      !isPMAndTrudi
    );
  }

  ngAfterViewChecked() {
    if (
      this.scrollDownContainerEl &&
      this.isFirstLoadScrollDownContainerEl &&
      this.isHasScroll &&
      this.listofmessages?.length
    ) {
      if (!this.isHasNewMessage) {
        this.scrollToBottom(EBehaviorScroll.AUTO);
      } else {
        this.scrollRedLineNewToView();
        if (this.showScrollToBottomButton === null)
          this.showScrollToBottomButton = !this.isScrolledDown();
      }
      this.onEventScrollDown();
      this.isFirstLoadScrollDownContainerEl = false;
    }

    if (this.isFirstLoadRedLineNewEl && this.isHasScroll) {
      if (!this.isHasNewMessage && !this.redLineNew?.nativeElement) {
        this.scrollToBottom(EBehaviorScroll.AUTO);
      } else {
        this.scrollRedLineNewToView();
      }

      this.isFirstLoadRedLineNewEl = false;
    }
    this.messageSectionHeight = this.scrollDownContainerEl?.offsetHeight;
  }

  public checkScroll(): void {
    const conversationHeaderHeight =
      this.elr?.nativeElement.querySelector('#app-chat-header')?.clientHeight;

    const timeStamps =
      this.elr?.nativeElement.querySelectorAll('.wrap-order-day');
    const distanceConversationToHeader = 83;
    timeStamps.forEach((el) => {
      const yCoordinates = el.getBoundingClientRect().y;
      if (
        yCoordinates >= conversationHeaderHeight &&
        yCoordinates <= conversationHeaderHeight + distanceConversationToHeader
      ) {
        el.classList.add('wrap-timeStamp');
      } else {
        el.classList.remove('wrap-timeStamp');
      }
    });
    if (!this.scrollDownContainerEl) return;

    if (this.isScrolledDown() && this.showScrollToBottomButton === true) {
      this.showScrollToBottomButton = false;
    }
  }

  private isScrolledDown(): boolean {
    if (!this.scrollDownContainerEl) return false;
    const scrollPosition =
      this.scrollDownContainerEl.scrollHeight -
      this.scrollDownContainerEl.clientHeight;
    return this.scrollDownContainerEl.scrollTop + 80 >= scrollPosition;
  }

  scrollDownSubscription: Subscription;
  private onEventScrollDown() {
    if (this.scrollDownSubscription) {
      this.scrollDownSubscription.unsubscribe();
    }
    fromEvent(this.scrollDownContainerEl, 'scroll')
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkScroll();
        if (this.isScrolledDown()) {
          this.loadHistory(
            this.currentConversation.id,
            false,
            null,
            this.createdTimeOfLastMsg,
            'down'
          );
        }
      });
  }

  public handleResizeInlineMsg(value) {
    const currentDetailWrapperHeight =
      Number(this.heightDetailWrapper?.replace('px', '')) || 0;
    const currentInlineHeight =
      currentDetailWrapperHeight - this.chatHeader?.nativeElement?.offsetHeight;
    if (+currentInlineHeight !== value) {
      this.heightDetailWrapper = `calc(100% - ${this.chatHeader.nativeElement.offsetHeight}px)`;
      this.cdr.markForCheck();
    }
  }

  setPopupState(popup: ESmsMessageDetailPopup) {
    this.popupState = popup;
  }

  subscribeStore() {
    this.store
      .select(selectCurrentConversationId)
      .pipe(
        filter((conversation) => !!conversation),
        distinctUntilChanged(),
        tap((conversationId) => {
          this.currentConversationId = conversationId;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.store
      .select(selectCurrentConversationId)
      .pipe(
        filter((id) => !!id),
        switchMap((id) => this.store.select(selectConversationById(id))),
        filter((conversation) => !!conversation),
        distinctUntilChanged((prev, curr) => prev?.id === curr?.id),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (state) => {
          this.currentConversationId = state.id;
          if (state?.groupMessage) {
            this._groupMessage = state?.groupMessage;
          }
          if (state?.actionDetail) {
            this.listAction$.next(state.actionDetail);
          }

          if (state?.entities) {
            const listAllMessage = selectAllConversationMessagesInternal(state);
            this._listofmessages = listAllMessage?.filter(
              (one) => !one.isDraft
            );

            const listOfMessageTypeText = this.listofmessages.filter(
              (message) => message.messageType === EMessageType.defaultText
            );
            const index = listOfMessageTypeText.findIndex(
              (message) => message.isLastReadMessage === true
            );
            this.lastReadMessageId =
              index >= 0
                ? listOfMessageTypeText[index + 1] &&
                  listOfMessageTypeText[index + 1].id
                : null;
            this.lastMessagesTypeText = findLastItemMsgTypeTextOrTicket(
              this.listofmessages
            );
            this._groupMessage = this.appChatService.groupMessagesByDate(
              this.listofmessages
            );
          }

          if (state?.currentConversation) {
            this.currentConversation = state?.currentConversation;
            this.createNewConversationConfigs[
              'serviceData.conversationService'
            ] = {
              currentConversation: this._currentConversation
            };
          }

          if (state?.currentProperty) {
            this.currentProperty = state?.currentProperty;
          }

          if (this.currentConversation && this.groupMessage?.length) {
            this.loadingService.stopLoading();
            this.messageTaskLoadingService.stopFullLoading();
            this.messageLoadingService.setLoading(false);
          }
          this.cdr.markForCheck();
        },
        error: (err) => console.error(err)
      });
  }

  private setupLoadingObservables(): void {
    combineLatest([
      this.loadingService.isLoading$,
      this.messageTaskLoadingService.isLoadingMessage$,
      this.messageTaskLoadingService.isLoading$,
      this.loadingTicket$
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(
          ([isLoading, isLoadingMessage, isLoadingService, loadingTicket]) => {
            if (this.loadingTicket !== loadingTicket) {
              this.loadingTicket = loadingTicket;
            }
            return (
              (!this.queryParams['fromScratch'] && isLoading) ||
              isLoadingMessage ||
              isLoadingService
            );
          }
        ),
        tap((isLoading) => {
          if (this.loading !== isLoading) {
            this.loading = isLoading;
            this.cdr.markForCheck();
          }
        })
      )
      .subscribe();
  }

  onTempConversations() {
    this.conversationService.tempConversations
      .pipe(takeUntil(this.destroy$))
      .subscribe((conversations) => {
        if (!this.tempConversationId) {
          this.loadingCreateScratch = false;
          this.cdr.markForCheck();
          return;
        }
        const showLoading = conversations.some(
          (item) => item.id === this.tempConversationId
        );
        if (showLoading) {
          this.loadingCreateScratch = showLoading;
          this.cdr.markForCheck();
        }
      });
  }

  subscribeSocketTranscriptCompleted() {
    this.websocketService.onSocketTranscriptCompleted
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        const { id, mediaLink, size } = data?.propertyDocument || {};
        this.listofmessages = this.listofmessages.map((message) => {
          if (message?.file?.id === id) {
            return {
              ...message,
              file: {
                ...message.file,
                mediaLink,
                size
              }
            };
          }
          return message;
        });
        this.groupMessage = this.appChatService.groupMessagesByDate(
          this.listofmessages
        );
        this.cdr.markForCheck();
      });
  }

  subscribeLastReadMessageIndex() {
    this.appChatService.lastReadMessageIndex$
      .pipe(takeUntil(this.destroy$))
      .subscribe((index) => {
        this.lastReadMessageIndex = index;
      });
  }

  subscribeSocketSend() {
    this.websocketService.onSocketSend
      .pipe(
        filter((data) => data.conversationId === this.currentConversation.id),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.getHistoryConversation(this.currentConversation);
        if (
          this.tabChange &&
          data.conversationId === this.currentConversation.id
        ) {
          this.countSocketSend += 1;
          this.listofmessages[
            this.listofmessages.length - this.countSocketSend
          ].isLastReadMessage = true;
          this.cdr.markForCheck();
        }
      });
  }

  private subscribeSocketAssignContact() {
    merge(
      this.websocketService.onSocketDeleteSecondaryContact,
      this.websocketService.onSocketAssignContact
    )
      .pipe(
        filter((data) => data?.conversationId === this.currentConversationId),
        tap(() => {
          this.conversationService.reloadConversationList.next(true);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((assignContact) => {
        const participant =
          assignContact.participants.find(
            (item) => item.userId === assignContact.newUserId
          ) || assignContact.participants[0];
        if (!participant?.userId) return;
        this.currentConversation = {
          ...this.currentConversation,
          participants: assignContact.participants,
          userId: participant?.userId
        };
        assignContact?.participants?.[0] &&
          this.conversationService.setParticipantChanged(
            participant as IUserParticipant
          );
        this.mapUserIdForSmsMessage(participant?.userId);
      });
  }

  subscribeSocketSyncPropertyDocumentToPT() {
    this.websocketService.onSocketNotifySyncPropertyDocumentToPT
      .pipe(
        filter((dataSync) => dataSync?.companyId === this.currentCompany.id),
        takeUntil(this.destroy$)
      )
      .subscribe((dataSync) => {
        const syncStatus =
          dataSync.status === SyncPropertyDocumentStatus.SUCCESS
            ? SYNC_PT_SUCCESSFULLY
            : SYNC_PT_FAIL;
        const toastType =
          dataSync.status === SyncPropertyDocumentStatus.SUCCESS
            ? 'success'
            : 'error';
        this.showToast(syncStatus, toastType);
        this.popupService.isResetFile$.next(true);
      });
  }

  mapUserIdForSmsMessage(id: string) {
    const mapIdFunction = (message) => ({
      ...message,
      userId: message?.isUserFromSms ? id : message.userId
    });
    this.listofmessages = this.listofmessages.map(mapIdFunction);
    this.groupMessage = this.groupMessage.map((group) => ({
      ...group,
      messages: group.messages.map(mapIdFunction)
    }));
    this.cdr.markForCheck();
  }

  triggerConversationId() {
    this.inboxService.triggerConversationId$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((conversationId) => {
          return this.getActionDetail(conversationId);
        })
      )
      .subscribe((rs) => {
        this.listAction$.next(rs);
      });
  }

  changeConversationStatus(
    status: string,
    options?: string,
    user?: LastUser
  ): any {
    this.loadingService.onLoading();
    this.filesService.fileList.next([]);
    this.conversationService.actionLinkList.next([]);
    this.sharedService.textContainerHeight.next(DEFAULT_TEXT_MESS_HEIGHT);

    this.sharedMessageViewService.setMessageToReOpen({
      currentConversation: this.currentConversation,
      currentMailBoxId: this.currentMailBoxId,
      isAppMessage: true
    });
  }

  updatedStatusHeader(status: TaskStatusType) {
    const updatedStatusHeader = {
      ...this.headerService.headerState$.value,
      currentTask: {
        ...this.headerService.headerState$.value?.currentTask,
        status: status
      },
      currentStatus: status
    };
    this.headerService.headerState$.next(updatedStatusHeader);
  }

  resetHistory(key?: string) {
    if (TaskHelper.isCreateAppMsg(this.router.url, false)) {
      this.getHistoryOfConversationV2Sub?.unsubscribe();
      this.getConversationSubscriber?.unsubscribe();
    }

    this.loadingService.onLoading();

    this.isViewMostRecent = false;
    this.isFirstLoad = true;
    this.isFirstLoadScrollDownContainerEl = true;
    this.isFirstLoadRedLineNewEl = null;
    this.isBeforeUpdated = false;
    this.isAfterUpdated = false;
    this.markedForRefresh = true;
    this.isHideRedLineNew = false;
    this.showScrollToBottomButton = null;
    this.currentConversationId = null;
    this._listofmessages = [];
    this._groupMessage = [];
    this.isFirstLoadHistory = true;
    this.chatGptSubscription?.unsubscribe();
    this.isLoadingHistoryConversation = false;
    this.totalMsgRendered = 0;
    this.listTempId.clear();
    this.cacheBodyMessages.clear();
    this.tempConversationId = null;
    if (key && !this.isNewConversationState) {
      this.allMessageRender = false;
    }
    this.loadingCreateScratch = false;
    this.isUserProfileDrawerVisible = false;
  }

  private subscribeCurrentConversation() {
    this.loadingService.onLoading();

    const currentConversation$ =
      this.conversationService.currentConversation.pipe(
        takeUntil(this.destroy$)
      );

    currentConversation$
      .pipe(
        filter((conversation) => conversation?.id),
        distinctUntilKeyChanged('id')
      )
      .subscribe((conversation) => {
        this.resetHistory(conversation.id);
        if (this.isFirstLoadHistory) {
          this.getListTicket(conversation.id);
        }
      });

    currentConversation$.subscribe((res) => {
      if (
        isEqual(
          {
            ...this.currentConversation,
            isRead: true,
            isUnreadIndicator: false
          },
          { ...res, isRead: true, isUnreadIndicator: false }
        ) &&
        !this.markedForRefresh
      ) {
        return;
      }

      this.markedForRefresh = false;
      this.threadId = res?.threadId;
      this.currentConversationId = res?.id;
      this.currentConversation = res;

      this.userVerified = res?.isDetectedContact;
      this.emailVerified = res?.emailVerified;
      this.currentPMJoined =
        res?.isPmJoined && res?.lastPmJoined?.id === this.currentUser?.id;
      const smsUser =
        this.smsMessageListService.getUserRaiseMsgFromParticipants(res);
      this.isDisabledJoinButton =
        !this.emailVerified &&
        !this.userVerified &&
        smsUser?.recognitionStatus === ERecognitionStatus.UNRECOGNIZED;

      this.createNewConversationConfigs = {
        ...this.createNewConversationConfigs
      };

      let composeMsgHeight = 150;
      if (this.composeMessageRef) {
        composeMsgHeight = this.composeMessageRef.contentHeight;
      }
      this.heightDetailWrapper = `calc(100% - ${
        composeMsgHeight + (this.chatHeader?.nativeElement?.offsetHeight || 0)
      }px - ${this.currentConversation?.linkedConversationAppLog ? 33 : 0}px)`;

      if (
        res &&
        JSON.stringify(res) !== '{}' &&
        (res.length || Object.keys(res).length)
      ) {
        this.currentTaskId = res.taskId;
        this.currentRoleDrop = res.userId;
        this.filesService.onFileDragging([this.currentRoleDrop]);
      }
      if (res?.id) {
        if (
          this.currentConversationIdClone &&
          this.currentConversationIdClone !== res.id
        ) {
          this.isViewMostRecent = false;
          this.isFirstLoadScrollDownContainerEl = true;
          this.isFirstLoadRedLineNewEl = null;
          this.isBeforeUpdated = false;
          this.isAfterUpdated = false;
          this.isHideRedLineNew = false;
          this.showScrollToBottomButton = null;
          this._listofmessages = [];
        }

        this.currentConversationIdClone = res.id;
        if (
          this.currentConversation &&
          this.currentConversation.id === res.id
        ) {
          this.getHistoryConversation(res);
          return;
        } else {
          this.isFirstJoined = true;
        }
      } else {
        this._listofmessages = [];
        this.groupMessage = [];
      }
    });

    // after call api, if conversation was null, off loading
    this.conversationService.afterGetConversations$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.conversationService?.afterSetConversations$)
      )
      .subscribe((conversations) => {
        if (!conversations) {
          this.loadingService?.stopLoading();
          this.messageTaskLoadingService?.stopLoading();
        }
      });
  }

  // fix
  buildSendMessageForm() {
    combineLatest([
      this.userService.userInfo$,
      this.conversationService.currentConversation,
      this.companyService.getCurrentCompany(),
      this.propertyService.peopleList
    ])
      .pipe(
        takeUntil(this.destroy$),
        filter(([user, curentConversation, currentCompany]) =>
          Boolean((user && curentConversation) || (user && currentCompany))
        )
      )
      .subscribe(([user, currentConversation, currentCompany, peopleList]) => {
        const { id, lastName, googleAvatar, firstName, title } = user;
        this.currentUser = user;
        const sender = {
          avatar: googleAvatar,
          id: id,
          index: 1,
          name: firstName + ' ' + lastName,
          title: title
        };
        this.isRmEnvironment =
          this.agencyDashboardService.isRentManagerCRM(currentCompany);
        const customConversationRole = this.messageDetailPipe.transform(
          { conversations: [currentConversation] } as TaskItem,
          EMessageDetailProperty.ROLE,
          this.isRmEnvironment
        );
        const receiver = {
          firstName: currentConversation?.firstName,
          lastName: currentConversation?.lastName,
          type: this.titleCasePipe.transform(customConversationRole)
        };
        this.trudiDynamicParameterService.setDynamicFieldRecipientForInline(
          receiver,
          currentConversation?.propertyType
        );
        this.trudiDynamicParameterService.setDynamicParamaterPmInline(sender);
        const resetKeys = new Set([
          'owner_name',
          'tenancy_name',
          'tenancy_id',
          'tenant_name',
          'tenant_id',
          'lease_start',
          'lease_end',
          '$rent_amount',
          '$effective_rent_arrears_amount',
          'lease_period',
          'period_type',
          'rent_period',
          'due_day',
          'tenant_charge'
        ]);
        this.trudiDynamicParameterService.resetDynamicParametersInline(
          resetKeys
        );
        const tenancy = peopleList?.tenancies?.find((p) =>
          p?.userProperties?.some((item) =>
            item.user.id.includes(currentConversation?.userId)
          )
        );
        if (
          currentConversation?.propertyType?.includes(
            EUserPropertyType.OWNER
          ) ||
          currentConversation?.propertyType?.includes(
            EUserPropertyType.LANDLORD
          )
        ) {
          this.trudiDynamicParameterService.setDynamicParametersLandlordInline(
            currentConversation?.fullName ||
              displayName(
                currentConversation?.firstName,
                currentConversation?.lastName
              )
          );
        } else if (
          currentConversation?.propertyType?.includes(
            EUserPropertyType.TENANCY
          ) ||
          currentConversation?.propertyType?.includes(EUserPropertyType.TENANT)
        ) {
          this.trudiDynamicParameterService.setDynamicParametersTenancyInline(
            tenancy
          );
          this.trudiDynamicParameterService.setDynamicParametersTenancyNameInline(
            tenancy?.name
          );
        }
      });
  }

  private subscribeSocketPmJoinConverstation() {
    // Note: handle PM Join Conversation of message
    this.websocketService.onSocketPmJoinConversation
      .pipe(
        filter(
          (res) =>
            res &&
            res.conversationId === this.currentConversation?.id &&
            res.userId === this.currentUser?.id &&
            res.isPmJoined
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pmJoinningConversation = false;
      });
  }

  subscribeCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.currentCompany = res;
        this.isRmEnvironment =
          this.agencyDashboardService.isRentManagerCRM(res);
        this.areaCode = this.isRmEnvironment
          ? PHONE_PREFIXES.US[0]
          : PHONE_PREFIXES.AU[0];
      });
  }

  showToast = (message: string, type: 'success' | 'error') => {
    if (typeof this.toastrService[type] == 'function') {
      this.toastrService[type](message);
    }
  };

  subscribeCloseAllModal() {
    this.agentUserService
      .getIsCloseAllModal()
      .pipe(takeUntil(this.destroy$))
      .subscribe((el) => {
        if (el === true) {
          this.selectedFiles = [];
        }
      });
  }

  subscribeCurrentTask() {
    this.taskService.currentTask$
      .pipe(
        filter((task) => Boolean(task)),
        takeUntil(this.destroy$)
      )
      .subscribe((currentTask) => {
        this.currentTask = currentTask;
      });
  }

  subscribeViewDetailFile() {
    this.filesService.viewDetailFile
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res && res.state) {
          this.arrayImageCarousel2 = res.attachments.map((item) => {
            return {
              ...item,
              fileTypeName: item.mediaLink?.match(videoPattern)
                ? 'video/quicktime'
                : 'image/jpeg'
            };
          });
          this.viewSyncFile = true;
          this.initialIndex = res.id;
          this.setPopupState(ESmsMessageDetailPopup.Carousel);
          this.filesService.viewDetailFile.next(null);
        }
      });
  }

  subscribeIsShowDrawerViewUserProfile() {
    combineLatest([
      this.userProfileDrawerService.isUserProfileDrawerVisible$,
      this.userProfileDrawerService.dataUser$
    ])
      .pipe(takeUntil(this.destroy$), distinctUntilChanged(), debounceTime(300))
      .subscribe(([isShow, dataUser]) => {
        this.currentDataUserProfile = {
          isUserVerified: this.currentConversation?.isDetectedContact,
          ...dataUser
        };
        this.isUserProfileDrawerVisible = isShow;
        this.cdr.markForCheck();
      });
  }

  handleClickOutsideUserProfileDrawer(): void {
    if (!this.isUserProfileDrawerVisible) return;
    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      false,
      null
    );
  }

  getHistoryConversation(data: UserConversation) {
    this.currentConversation = { ...data };
    this.setTriggerCountTicket(data);
    const isUpdate =
      Boolean(this.listofmessages?.length) ||
      Boolean(this.groupMessage?.length);
    if (
      data.lastUser?.firstName !== data.firstName ||
      this.isScrolledDown() ||
      this.isFirstLoadRedLineNewEl === null
    ) {
      this.maintainRequest(data.id, isUpdate);
    } else {
      this.isAfterUpdated = false;
      this.isHideRedLineNew = false;
      if (!this.isScrolledDown()) this.showScrollToBottomButton = true;
    }
  }

  setTriggerCountTicket(data) {
    this.smsMessageListService.setTriggerCountTicketConversation({
      taskId: data?.taskId,
      countUnreadTicket: this.currentConversation.countUnreadTicket,
      conversationId: data?.id
    });
  }

  getFiles(): void {
    this.filesService.fileList
      .pipe(takeUntil(this.destroy$))
      .subscribe((fl) => {
        this.fileList = fl;
        this.fileList = this.fileList.map((item) => {
          if (!item.fileType || !item.fileType.icon) return item;
          item.isPdf = item.fileType.icon.includes('pdf');
          item.isVideo = item.fileType.icon.includes('video');
          item.isImage = item.fileType.icon.includes('image');
          return item;
        });
      });
  }

  getActionLinkInfo(categoryId: string): CategoryUser {
    return getActionLinkImgSrc(categoryId, this.fullCategoryList);
  }

  drop(event: CdkDragDrop<AgentFileProp[]>) {
    if (event.item) {
      this.fileService.dragDropFile.next(event);
    }
  }

  removeOneItemFromList(list: any[], index: number): void {
    list.splice(index, 1);
  }

  handleRemoveScratchTicket(conversation: UserConversation) {
    if (!conversation?.['isScratchTicket'] || /draft/gi.test(this.router.url)) {
      return;
    }
    this.smsMessageConversationIdSetService.delete(conversation?.id);
    if (this.helper.isInboxDetail) {
      this.conversationService.triggerRemoveScratchTicket.next(true);
    } else {
      this.store.dispatch(
        appMessageActions.removeTempMessage({
          conversationId: conversation.id
        })
      );
    }
  }

  onPairwiseConversation() {
    this.conversationService.currentConversation
      .pipe(
        tap((res) => {
          if (!this.firstEmitConversation && res) {
            this.firstEmitConversation = true;
          }
        }),
        pairwise(),
        takeUntil(this.destroy$)
      )
      .subscribe(([previousValue, current]) => {
        if (previousValue?.id !== current?.id) {
          this.handleRemoveScratchTicket(previousValue);
        }
      });
  }

  ngOnDestroy() {
    this.handleRemoveScratchTicket(this.currentConversation);
    this.smsMessageListService.setPreFillCreateNewMessage(null);
    this.ngZone.run(() => {
      this.store.dispatch(
        conversationPageActions.exitPage({ id: this.currentConversationId })
      );
    });
    this.destroy$.next();
    this.destroy$.complete();
    this.fileService.dragDropFile.next(null);
    this.chatGptService.reset();
    this.trudiSendMsgService.setListFilesReiFormEmpty();
    this.routineInspectionService.triggerSyncRoutineInSpection(null);
    clearTimeout(this.scrollBottomTimeOut);
    clearTimeout(this.scrollRedlineTimeOut);
    this.messageService.setImageDetail(null);
    if (this.eventChangeQuoteSizeHandler) {
      window.document.removeEventListener(
        'eventChangeQuoteSize',
        this.eventChangeQuoteSizeHandler,
        false
      );
    }
    if (this.eventChangeTab) {
      window.document.removeEventListener(
        'visibilitychange',
        this.eventChangeTab,
        false
      );
      this.eventChangeListenerBound = false;
    }
  }

  reopenConversationInCompletedTask(task: TaskItem) {
    this.taskService.currentTaskId$.next(task.id);
    this.taskService.currentTask$.next({
      ...task,
      status: task.status
    });
  }

  updateConversationStatus(
    status: string,
    options?: string,
    user?: LastUser,
    canAddMessageToHistory = true
  ) {
    this.currentConversation = {
      ...this.currentConversation,
      status,
      lastUser: user || this.currentConversation.lastUser
    };
    // if agent hasn't joined, socket will not be sent -> update message manually
    if (canAddMessageToHistory) {
      const tempMessage: IMessage = {
        ...this.listofmessages[0],
        messageType: status as EMessageType,
        options: options && JSON.parse(options)
      };
      this.listofmessages = [...this.listofmessages, tempMessage];
      this.scrollToBottom();
    }
    this.setMsgAfterChangeStatus(status);
  }

  setMsgAfterChangeStatus(status: string) {
    this.conversationService.setUpdatedConversation(
      this.currentConversation.id,
      status
    );
  }

  private scrollRedLineNewToView() {
    if (!this.redLineNew?.nativeElement) return;

    if (this.scrollRedlineTimeOut) {
      clearTimeout(this.scrollRedlineTimeOut);
    }

    this.scrollRedlineTimeOut = setTimeout(() => {
      this.redLineNew?.nativeElement.scrollIntoView({
        behavior: EBehaviorScroll.AUTO,
        block: 'start'
      });
      this.showScrollToBottomButton = !this.isScrolledDown();
    }, 0);
  }

  scrollToBottom(behavior?: EBehaviorScroll): void {
    if (this.boxChat?.nativeElement) {
      this.boxChat.nativeElement.style.background = '#fff';
    }

    if (this.scrollBottomTimeOut) {
      clearTimeout(this.scrollBottomTimeOut);
    }

    this.scrollBottomTimeOut = setTimeout(() => {
      if (this.scrollDown) {
        const messages =
          this.scrollDown?.nativeElement?.querySelectorAll('.message');
        const lastMessage =
          messages?.length > 0 ? messages[messages?.length - 1] : null;
        if (lastMessage && !this.isViewMostRecent) {
          if (!this.listofmessages.some((m) => m.isLastReadMessage)) {
            this.showScrollToBottomButton = null;
          }
          lastMessage.scrollIntoView({
            behavior: behavior || EBehaviorScroll.AUTO
          });
        } else {
          this.scrollDown.nativeElement.scrollTo({
            top: this.scrollDown.nativeElement.scrollHeight,
            behavior: behavior || EBehaviorScroll.AUTO
          });
        }
      }
    }, 0);
  }

  handleViewMostRecent(behavior: EBehaviorScroll) {
    this.isViewMostRecent = true;
    this.scrollToBottom(behavior);
  }

  uniqueArrayMessage(array: IMessage[]) {
    if (!array?.length) return [];
    const newArr = array.reduce((acc, item) => {
      if (this.listTempId.has(item.id)) {
        // handle case socket send before API new message response success
        item.id = this.listTempId.get(item.id);
      }
      if (!acc[item.id] || (acc[item.id]?.isTemp && !item['isTemp'])) {
        acc[item.id] = item;
      }
      return acc;
    }, {});
    return Object.values(newArr);
  }

  private checkRedLineMessage() {
    this.inboxService.changeUnreadData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((changeUnreadData) => {
        this.isFirstReadMessage = !changeUnreadData;
        if (!changeUnreadData) return;
        const previousMessageId = changeUnreadData.previousMessageId;
        const isReadMessage = changeUnreadData.isReadMessage;
        if (previousMessageId) {
          if (!isReadMessage) {
            this.appChatService.mapUnreadMessage(
              this.listofmessages,
              this.groupMessage,
              previousMessageId,
              true
            );
            this.isHideRedLineNew = false;
          } else {
            this.appChatService.mapUnreadMessage(
              this.listofmessages,
              this.groupMessage,
              previousMessageId,
              false,
              true
            );
          }
        } else {
          this.appChatService.mapUnreadMessage(
            this.listofmessages,
            this.groupMessage,
            null,
            false
          );
          this.isHideRedLineNew = true;
        }
        this.cdr.markForCheck();
      });
  }

  private updateIsLastReadMessage(messages: IMessage[]) {
    if (this.currentConversation?.lastUser?.id === this.currentUser?.id) {
      this.listofmessages = messages.map((item, index) => {
        return {
          ...item,
          isLastReadMessage: messages.length - 1 === index
        };
      });
      this.isHideRedLineNew = true;
      this.scrollToBottom(EBehaviorScroll.SMOOTH);
    }
  }

  checkReturnApiHistory(before, after) {
    return (
      (this.isBeforeUpdated && this.isAfterUpdated) ||
      (before && this.isBeforeUpdated) ||
      (after && this.isAfterUpdated) ||
      (!before && !after) ||
      this.isLoadingHistoryConversation
    );
  }

  loadHistory(
    conversationId: string,
    isUpdate: boolean,
    before: string = null,
    after: string = null,
    direction?: 'up' | 'down'
  ) {
    if (this.checkReturnApiHistory(before, after)) return;
    this.isLoadingHistoryConversation = true;
    if (this.getHistoryOfConversationV2Sub) {
      this.getHistoryOfConversationV2Sub.unsubscribe();
    }
    this.isFetchingOlderMessages = direction === 'up';
    this.isFetchingNewerMessages = direction === 'down';
    this.getHistoryOfConversationV2Sub = this.conversationService
      .getHistoryOfConversationV2(
        conversationId,
        !!after,
        before,
        after,
        !before || this.isViewMostRecent
      )
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged(),
        finalize(() => {
          if (!isUpdate) {
            this.loadingService.stopLoading();
            this.messageTaskLoadingService.stopLoading();
            this.messageLoadingService.setLoading(false);
          }
        })
      )
      .subscribe({
        next: (res) => {
          if (direction === 'up') this.isFetchingOlderMessages = false;
          if (direction === 'down') this.isFetchingNewerMessages = false;
          // change conversation not handle when after history get done
          if (conversationId !== this.currentConversationId) {
            this.isLoadingHistoryConversation = false;
            return;
          }
          this.isFirstJoined = !res.hasPMJoin;
          if (res && res.list.length) {
            const sortedData = [];
            res.list = this.groupMessageViaEmail(res.list);
            res.list
              .reverse()
              .filter((element) => this.filterMsg(element))
              .forEach((element, idx) => {
                this.mapHistoryChatMessage(element);
                sortedData.push(element);
              });
            if (after) {
              this.listofmessages = [...this.listofmessages, ...sortedData];
              this.updateIsLastReadMessage(this.listofmessages);
              this.scrollToBottom(EBehaviorScroll.SMOOTH);
            } else {
              this.listofmessages = [...sortedData, ...this.listofmessages];
            }
          } else if (res.list) {
            if (before) this.isBeforeUpdated = true;
            if (after) this.isAfterUpdated = true;
            this.cdr?.markForCheck();
          }
          if (isUpdate) {
            this.maintainScrollPosition();
          }
          this.mapMessageProperties();
          if (this.isFirstLoadRedLineNewEl === null)
            this.isFirstLoadRedLineNewEl = true;

          this.isLoadingHistoryConversation = false;
          this.isFetchingOlderMessages = false;
        },
        error: () => {
          this.loadingService.stopLoading();
          this.isLoadingHistoryConversation = false;
          this.isFetchingOlderMessages = false;
        }
      });
  }

  mapHistoryChatMessage(message: IMessage): void {
    if (
      message.messageType === EMessageType.agentJoin &&
      this.currentConversation?.createdFrom === ECreatedFrom.WEB &&
      this.currentConversation?.isAppUser
    ) {
      message.messageType = EMessageType.agentStart;
    }
    if (message.message) {
      message.message = AppChatUtil.parseMessageToObject(
        message.message,
        this.messageType
      );
    }
  }

  maintainRequest(
    conversationId: string,
    isUpdate?: boolean,
    setNewMessagesCb?: (conversationList) => void
  ) {
    if (!isUpdate && !this.queryParams['fromScratch']) {
      this.loadingService.onLoading();
    }

    if (conversationId != null) {
      let timeAfter: string | null =
        this.isFirstLoadScrollDownContainerEl &&
        this.listofmessages.length === 0
          ? null
          : this.createdTimeOfLastMsg;
      if (this.isFirstLoad) {
        timeAfter = null;
        this.isFirstLoad = false;
      }

      const _isViewMostRecent: boolean = !this.isFirstLoadScrollDownContainerEl;

      this.getConversationSubscriber?.unsubscribe();
      this.getConversationSubscriber = this.conversationService
        .getHistoryOfConversationV2(
          conversationId,
          true,
          null,
          timeAfter,
          _isViewMostRecent
        )
        .pipe(
          takeUntil(this.destroy$),
          distinctUntilChanged(),
          finalize(() => {
            if (!isUpdate && !this.shouldSkipRender) {
              this.loadingService.stopLoading();
              this.messageLoadingService.setLoading(false);
              this.getConversationSubscriber = null;
            }
          }),
          tap(() =>
            this.conversationService.beforeEachGetConversation(conversationId)
          )
        )
        .subscribe({
          next: (res) => {
            this.prefillToCcBccReceiversList = res?.list[0]?.emailMetadata;
            // skip render UI when need to call another API
            this.shouldSkipRender =
              res.list.length < res.pageSize &&
              this.isFirstLoadHistory &&
              !this.checkReturnApiHistory(res.list?.[0]?.createdAt, undefined);
            this.onGetConversation(res, isUpdate, this.shouldSkipRender);
            if (this.isFirstLoadHistory) {
              this.subscribeChatGptOnGenerate();
              this.isFirstLoadHistory = false;
            }
            if (res.list.length < res.pageSize) {
              if (!this.isHasNewMessage && !this.isFirstReadMessage) {
                this.isHideRedLineNew = true;
              }
              const createdTimeOfFirstMsg =
                this.createdTimeOfFirstMsg || res.list?.[0]?.createdAt;
              this.loadHistory(
                this.currentConversation.id,
                null,
                createdTimeOfFirstMsg
              );
            } else {
              if (this.isFirstLoadRedLineNewEl === null)
                this.isFirstLoadRedLineNewEl = true;
            }
            this.messageTaskLoadingService.stopLoading();
          },
          error: () => {
            this.loadingService.stopLoading();
            this.messageTaskLoadingService.stopLoading();
          }
        });
    } else {
      this.loadingService.stopLoading();
      this.messageTaskLoadingService.stopLoading();
    }

    this.markReadNotiDesktop();
  }

  private onGetConversation(
    conversations,
    isUpdate,
    isSkipRender = false,
    setNewMessagesCb?: (conversationList) => void
  ) {
    this.isFirstJoined = !conversations?.hasPMJoin;
    if (
      (this.currentConversation?.crmStatus,
      this.currentConversation && conversations?.list?.length)
    ) {
      const messages = [];
      conversations.list = this.groupMessageViaEmail(conversations.list);
      conversations.list
        .reverse()
        .filter((element) => this.filterMsg(element))
        .forEach((element, idx) => {
          this.mapHistoryChatMessage(element);
          messages.push({
            ...element,
            isSending: false
          });
        });
      if (!this.listofmessages?.length) {
        if (this.isFirstLoadHistory) {
          this.listofmessages = [...this.listofmessages, ...messages];
        }
        this.listofmessages = this.listofmessages.sort(
          AppChatUtil.compareDates
        );
        if (!this.isFirstLoadRedLineNewEl && !this.isHasNewMessage) {
          this.scrollToBottom();
        }
      }

      if (conversations.list.length) {
        let conversationList = conversations.list;
        const listMessageFromCache = this.isFirstLoadHistory
          ? []
          : this.listofmessages;

        if (setNewMessagesCb) {
          setNewMessagesCb(conversationList);
        } else {
          this.listofmessages = [...conversationList, ...listMessageFromCache];
        }

        this.conversationService.afterEachGetConversation(
          this.currentConversation.id,
          this.listofmessages
        );

        this.listofmessages = this.listofmessages.sort(
          AppChatUtil.compareDates
        );

        if (
          this.isHasScroll &&
          this.isScrolledDown() &&
          this.listofmessages.length &&
          !this.isFirstLoadRedLineNewEl
        )
          this.scrollToBottom();
      }

      isUpdate &&
        !this.isFirstLoadHistory &&
        this.updateIsLastReadMessage(this.listofmessages);
    }

    this.mapMessageProperties(isSkipRender);

    if (this.taskService.hasRescheduleRequest$.getValue()) {
      this.taskService.hasRescheduleRequest$.next(false);
      return;
    }
  }

  markReadNotiDesktop() {
    this.firebaseService.notificationId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.notificationId = res;
          this.removeNotiUnseen();
        }
      });
  }

  removeNotiUnseen() {
    this.notificationService
      .markNotificationAsRead(this.notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
    this.notificationService.removeNotiFromUnseenList(this.notificationId);
    this.notificationService
      .getListNotification(0, null)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        this.notificationService.currentAllPage$.next(rs.currentPage);
        this.notificationService.currentAllTotalPage$.next(rs.totalPages);
      });
  }

  groupMessageViaEmail(messages: IMessage[]) {
    let messageList = [...messages];
    const allMessages = [...messages, ...this.listofmessages];
    let messageListObj = messageList.reduce((acc, curr) => {
      let parentMess = allMessages.find((one) => one.id === curr.bulkMessageId);
      if (curr.bulkMessageId && parentMess?.isSendFromEmail) {
        if (parentMess.files && acc.size === 0) {
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
      let fileList = messageList.filter(
        (item) => curr.id === item.bulkMessageId
      );
      curr = {
        ...curr,
        actionlinks: [],
        files: {
          fileList: [],
          mediaList: [],
          unSupportedList: []
        }
      };

      fileList.forEach((one) => {
        if (one.messageType === EMessageType.actionLink) {
          curr.actionlinks.push({
            ...curr.actionLink,
            messageId: curr.id
          });
        }
        this.appChatService.mapFileMessageToMessage(curr, one);
      });

      acc.set(curr.id, curr);
      return acc;
    }, new Map());
    const result: IMessage[] = Array.from(messageListObj.values());
    return result;
  }

  filterMsg(msg) {
    if (msg?.options?.type === 'RESCHEDULE_REQUEST') {
      return true;
    }
    return (
      (msg.message && msg.message?.trim().length) ||
      this.filterArrayMsg.includes(msg.messageType.toUpperCase()) ||
      msg.isSendFromEmail
    );
  }

  onCloseSendActionLink(e) {
    e && this.setPopupState(null);
  }

  checkIsAgentJoined() {
    if (!this.conversationService.agentJoined() && this.isFirstJoined) {
      this.isFirstJoined = false;
      return true;
    }
    return false;
  }

  addCurrentUserToParticipantList() {
    this.currentConversation.participants.push({
      ...this.currentConversation.participants[0],
      userId: this.userService.userInfo$.getValue().id
    });
  }

  manageCarouselState(event) {
    this.viewSyncFile = false;
    if (event.state) {
      this.filesService
        .getFileListInConversation(this.currentConversation.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: FileCarousel[]) => {
          if (res && res.length) {
            this.arrayImageCarousel = res
              .map((el) => ({
                ...el,
                propertyId: this.currentConversation?.propertyId,
                propertyStreetline: this.currentConversation?.streetline,
                isTemporaryProperty:
                  this.currentConversation?.isTemporaryProperty,
                fileType: this.filesService.getFileTypeDot(el.fileName),
                extension: this.fileService.getFileExtensionWithoutDot(
                  el.fileName || el.name
                ),
                isUnsupportedFile: !ACCEPT_ONLY_SUPPORTED_FILE.includes(
                  this.filesService.getFileExtensionWithoutDot(
                    el.fileName || el.name
                  )
                )
              }))
              .filter((el) => {
                return !listCalendarTypeDot
                  .map((item) => item?.replace(/\./g, ''))
                  .includes(el?.extension);
              });
            this.initialIndex = this.arrayImageCarousel.findIndex(
              (el) => el.propertyDocumentId === event.imageId
            );
            if (this.initialIndex === -1) {
              const fileDownload = res?.find(
                (item) => item?.propertyDocumentId === event?.imageId
              );
              this.fileService.downloadResource(
                fileDownload?.mediaLink,
                fileDownload?.fileName || fileDownload?.name
              );
            } else {
              this.setPopupState(
                event.state ? ESmsMessageDetailPopup.Carousel : null
              );
              this.isCarousel = event.state;
            }
          }
        });
    } else {
      this.setPopupState(event.state ? ESmsMessageDetailPopup.Carousel : null);
      this.isCarousel = event.state;
      this.initialIndex = null;
    }
  }

  resetFile(): void {
    this.fileList = [];
    this.filesService.fileList.next([]);
    this.conversationService.actionLinkList.next([]);
  }
  resetContactCard(): void {
    this.trudiSendMsgFormService.setSelectedContactCard([]);
  }

  confirmCreateLinkReiForm(taskId: string) {
    const formIdsArr = this.reiFormService.createReiFormLink$.value.outSide.map(
      (value) => value.formDetail.id.toString()
    );
    const formIds = [...new Set(formIdsArr)];
    if (this.sendMsgPopupState.addReiFormOutside) {
      this.reiFormService
        .confirmCreateLinkReiForm(formIds, taskId)
        .subscribe((reiFormLinks) => {
          if (reiFormLinks) {
            this.reiFormService.clearReiFormLinkOutside();
            reiFormLinks.forEach((reiFormLink) => {
              if (reiFormLink.formDetail.isCompleted) {
                this.filesService.reloadAttachments.next(true);
              }
            });
          }
        });
    }
  }

  conversationCategory() {
    this.fullCategoryList =
      JSON.parse(localStorage.getItem('listCategoryTypes')) || [];
    if (this.fullCategoryList) {
      this.listOfConversationCategory = this.fullCategoryList;
    }
  }

  openForwardMessageModal(data: { file: FileMessage; type: string }) {
    this.setStateTrudiSendMsg(data?.file);
  }

  getSelectedFile(event) {
    const checkExistFile = this.selectedFiles.some(
      (file) => Array.isArray(event) && file[0].id === event[0].id
    );
    if (!this.selectedFiles.includes(event) && !checkExistFile) {
      this.selectedFiles.push(event);
    }
  }

  onTriggerAddFilesFromCrm() {
    if (this.uploadFromCRMService.getPopupState().uploadFileFromCRMOutside) {
      if (this.selectedFilesFromCMS)
        this.uploadFromCRMService
          .getPopupState()
          .handleCallback([...this.selectedFilesFromCMS]);

      this.uploadFromCRMService.setPopupState({
        uploadFileFromCRMOutside: false,
        handleCallback: null
      });
    }
  }

  onTriggerAddContactCard() {
    if (this.trudiAddContactCardService.getPopupState().addContactCardOutside) {
      if (this.selectedContactCard)
        this.trudiAddContactCardService
          .getPopupState()
          .handleCallback([...this.selectedContactCard]);
      this.trudiAddContactCardService.setPopupState({
        addContactCardOutside: false,
        handleCallback: null
      });
    }
  }

  onCloseAddContactCard() {
    if (this.trudiAddContactCardService.getPopupState().addContactCardOutside) {
      this.trudiAddContactCardService.setPopupState({
        addContactCardOutside: false
      });
    }
  }

  onCloseUploadFromCRM() {
    if (this.uploadFromCRMService.getPopupState().uploadFileFromCRMOutside) {
      this.uploadFromCRMService.setPopupState({
        uploadFileFromCRMOutside: false
      });
    }
  }

  handleShowTrudiSendMsg(event) {
    this.setStateTrudiSendMsg(this.fileSelected?.file);
    this.inboxToolbarService.setInboxItem([]);
    this.setPopupState(null);
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.isShowTrudiSendMsg = false;
        this.toastCustomService.handleShowToastMessSend(event);
        this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE);
        break;
      default:
        break;
    }
  }

  handleFileEmit(file) {
    this.fileSelected = file;
    this.selectedFiles = [];
    const {
      createdAt,
      fileType,
      id,
      isUserUpload,
      mediaLink,
      name,
      size,
      thumbMediaLink,
      propertyId,
      isTemporaryProperty,
      propertyStreetline,
      isForward
    } = file.file;
    const newFiles = {
      createdAt,
      fileType,
      icon: fileType?.icon,
      id,
      isUserUpload,
      mediaLink,
      name,
      size,
      thumbMediaLink,
      propertyId,
      isTemporaryProperty,
      propertyStreetline,
      isForward
    };
    this.selectedFiles.push({ ...newFiles, isHideRemoveIcon: true });
    this.replaceMessageFile();
  }

  async handleGetSelectedTask(file) {
    const currentTask = this.taskService.currentTask$.getValue();
    const extraConfigs = {
      'header.title': 'No property',
      'header.hideSelectProperty': false
    };
    if (file) {
      extraConfigs['header.title'] = file.propertyStreetline || null;
      extraConfigs['header.isPrefillProperty'] = true;
      extraConfigs['header.hideSelectProperty'] = !file.isTemporaryProperty;
      extraConfigs['otherConfigs.conversationPropertyId'] =
        file.propertyId || null;
      if (file.isForward) {
        extraConfigs['header.title'] = !currentTask?.property?.isTemporary
          ? currentTask?.property?.streetline
          : 'No property';
        extraConfigs['body.prefillTitle'] =
          'Fwd: ' + (this.currentConversation?.categoryName || '');
        extraConfigs['header.hideSelectProperty'] = false;
        extraConfigs['otherConfigs.conversationPropertyId'] = null;
      }
    }

    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs,
      ...extraConfigs
    };
    const tasks = [
      {
        taskId: currentTask.id,
        propertyId: file?.propertyId || currentTask.property?.id
      }
    ];
    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs,
      'inputs.rawMsg': this.contentText,
      'inputs.openFrom': TaskType.MESSAGE,
      'inputs.listOfFiles': this.selectedFiles,
      'inputs.selectedTasksForPrefill': tasks
    };
  }

  // forward message
  setStateTrudiSendMsg(file = null) {
    this.isShowTrudiSendMsg = true;
    this.inboxToolbarService.setInboxItem([]);
    this.handleGetSelectedTask(file);
    const configs = {
      ...this.createNewConversationConfigs,
      'header.isPrefillProperty': true,
      'header.title': '',
      'inputs.isForwardDocument': file?.isForward,
      'inputs.isAppMessage': false,
      'inputs.openFrom': TaskType.SEND_FILES,
      'otherConfigs.isCreateMessageType': true,
      'otherConfigs.createMessageFrom': ECreateMessageFrom.SCRATCH,
      'otherConfigs.isValidSigContentMsg': false,
      'otherConfigs.conversationPropertyId': null,
      'otherConfigs.isShowGreetingContent': !file,
      'body.autoGenerateMessage': null,
      'body.isFromInlineMsg': false,
      'header.hideSelectProperty': false,
      'body.prefillTitle':
        'Fwd: ' + (this.currentConversation?.categoryName || '')
    };
    this.messageFlowService
      .openSendMsgModal(configs)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        if (rs.type === ESendMessageModalOutput.MessageSent) {
          this.onSendMsg(rs.data);
        }
      });
  }

  openSendMessageFromSendQuote(status: boolean) {
    if (!status) {
      this.setPopupState(null);
    }
  }

  mapMessageProperties(isSkipRender = false) {
    if (!this.listofmessages) return;
    this.listofmessages = this.uniqueArrayMessage(this.listofmessages);
    this.listofmessages = this.listofmessages.filter((one) => !one.isDraft);
    this.appChatService.mapMessageProperties(
      this.listofmessages,
      this.currentConversation,
      this.listOfTicketCategory,
      this.listOfConversationCategory
    );
    this.lastMessagesTypeText = findLastItemMsgTypeTextOrTicket(
      this.listofmessages
    );
    this.updateStatusLastMsgTypeTextOrTicket(
      this.listofmessages,
      this.lastMessagesTypeText
    );

    if (!isSkipRender) {
      const newMessageOptions = [];
      this.listofmessages.forEach((message) => {
        if (
          message?.options?.response?.showMultipleIntentText &&
          !message.hasTemp
        ) {
          message.hasTemp = true;
          newMessageOptions.push({
            ...message,
            id: message.id + 'temp',
            message: [
              {
                type: 'text',
                value: message.options.response.multipleIntentText
              }
            ]
          });
        }
      });
      if (newMessageOptions?.length > 0) {
        this.listofmessages = [
          ...newMessageOptions,
          ...this.listofmessages
        ].sort(AppChatUtil.compareDates);
      }
      this.groupMessage = this.appChatService.groupMessagesByDate(
        this.listofmessages
      );
      this.tempConversationId =
        this.tempConversationId || this.queryParams['tempConversationId'];
      if (this.queryParams['fromScratch']) {
        const conversations = this.conversationService.tempConversations?.value;
        if (
          this.tempConversationId &&
          !conversations.some((item) => item.id === this.tempConversationId)
        ) {
          this.loadingCreateScratch = false;
        }
      }
      this.cdr.markForCheck();
    }
  }

  updateStatusLastMsgTypeTextOrTicket(
    listMessage,
    lastMessageTypeTextOrTicket
  ) {
    if (!listMessage?.length) return;
    this.listofmessages = listMessage.map((message) => {
      if (message?.id === lastMessageTypeTextOrTicket?.id) {
        return {
          ...message,
          status: this.currentConversation?.status
        };
      }
      return message;
    });
  }

  replaceMessageFile() {
    const fileName = this.selectedFiles[0]?.name?.split('.')[0];
    this.contentText = `Hi,\n\nPlease find the following file attached:\n\n •  ${fileName}\n\nIf you have any questions, please feel free to contact us.`;
    this.createNewConversationConfigs['inputs.rawMsg'] = this.contentText;
  }

  onDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    this.fileService.dragDropFile.next(event);
  }

  onDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  updateStatusTicket(event) {
    if (!event) return;
    this.listofmessages = this.listofmessages.map((message) => ({
      ...message,
      options: {
        ...message.options,
        status:
          event.conversationId === message.conversationId
            ? event.status
            : message.options.status
      }
    }));
    if (event.cancelAIGenerate) return;
    this.chatGptService.reset();
    this.chatGptService.enableGenerate.next(true);
    this.chatGptService.onGenerate.next({
      enable: true,
      skipValidate: false,
      show: true
    });
  }

  closeModalScheduleMsg() {
    this.setPopupState(null);
  }

  handleCloseImageDetail() {
    this.setPopupState(null);
    this.imageDetailUrl = '';
  }

  subscribeChangeParticipants() {
    this.conversationService
      .getParticipantChanged()
      .pipe(takeUntil(this.destroy$))
      .subscribe((newParticipant) => {
        if (!newParticipant) return;
        this.conversationService.reloadConversationList.next(true);
        for (const group of this.groupMessage) {
          group?.messages?.forEach((message) => {
            mapEmailMetadata(newParticipant, message);
          });
        }
      });
  }

  subscribeChatGptOnGenerate() {
    if (this.chatGptSubscription) {
      this.chatGptSubscription.unsubscribe();
    }
    this.chatGptSubscription = this.chatGptService.onGenerate
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (!data) return;
        this.AIgenerateReply(data.show, data?.isTellAIToGenerate);
      });
  }

  async AIgenerateReply(show: boolean, isTellAIToGenerate?: boolean) {
    try {
      const data = await lastValueFrom(
        this.chatGptService.generateReply(
          this.listofmessages,
          this.currentAgencyId,
          show,
          isTellAIToGenerate
        )
      );
      if (!data?.content?.content) return;
      const content = data.content.content;
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
      this.toastrService.error('Unable to create message');
    }
  }

  getListTicket(currentConversationId) {
    this.loadingTicket$.next(true);
    this.getActionDetail(currentConversationId).subscribe((rs) => {
      this.listAction$.next(rs);
    });
  }

  subscribeTriggerAction() {
    this.inboxService.triggerGetActionDetail$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          return this.getActionDetail(this.currentConversationId);
        })
      )
      .subscribe((rs) => {
        this.store.dispatch(
          conversationActions.setActionDetail({
            id: this.currentConversationId,
            actionDetail: rs
          })
        );
        this.listAction$.next(rs);
      });
  }

  getListAction() {
    this.listAction$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.listTicket = res.map((item) => {
          return {
            ...item,
            ticket: {
              ...item.ticket,
              options: JSON.parse(item.ticket.options as unknown as string)
            }
          };
        });
        this.loadingTicket$.next(false);
        this.cdr?.markForCheck();
      },
      error: () => {
        this.loadingTicket$.next(false);
      }
    });
  }

  getActionDetail(currentConversationId: string) {
    const companyId = this.companyService.currentCompanyId() || '';
    if (!currentConversationId || !this.currentMailBoxId) return of([]);
    return this.smsMessageApiService
      .getActionDetail(currentConversationId, this.currentMailBoxId, companyId)
      .pipe(
        tap((rs) => {
          if (!rs) return;
          this.store.dispatch(
            conversationActions.setActionDetail({
              id: this.currentConversationId,
              actionDetail: rs
            })
          );
        })
      );
  }

  handleItemRendered() {
    this.totalMsgRendered++;
    if (
      !this.allMessageRender &&
      this.totalMsgRendered >= this.groupMessage?.[0]?.messages?.length
    ) {
      const chatContainer =
        this.elr?.nativeElement?.querySelector('#chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
      this.allMessageRender = true;
      this.cdr.detectChanges();
    }
  }

  handleOnSendMsg(event: IAppTriggerSendMsgEvent) {
    if (event.sendOption === SendOption.SendResolve) {
      this.conversationService.openConversation(null, null);
      this.currentConversation = {};
      this.currentConversationId = null;
      return;
    }

    switch (event.event) {
      case ESentMsgEvent.SENDING:
        if (event.type === ISendMsgType.SCHEDULE_MSG) return;
        this.handleSending(event);
        break;
      case ESentMsgEvent.SUCCESS:
        const {
          conversation,
          message,
          fileMessages = []
        } = (event?.['data'] as any) || {};

        const conversationId = conversation?.id;

        if (this.currentConversationId !== conversationId) return;
        const updateMessageStatus = (msg) => {
          const found = this.listofmessages.find((m) => m.id === msg.tempId);
          if (!found) return;
          found.isSending = false;
          found.id = msg.id;
          found.createdAt = msg.createdAt;
        };
        updateMessageStatus(message);
        fileMessages?.forEach(updateMessageStatus);
        if (event.type !== ISendMsgType.SCHEDULE_MSG) {
          // navigated to Open tab after sending message successfully
          if (this.router?.url.includes('inbox/sms-messages/resolved')) {
            this.router.navigate(['dashboard/inbox/sms-messages', 'all'], {
              queryParams: {
                status: TaskStatusType.inprogress,
                conversationId: this.currentConversation.id
              },
              queryParamsHandling: 'merge'
            });
            this.toastrService.success('Sms message reopened');
          }
          if (
            this.helper.isInboxDetail &&
            this.queryParams['tab'] === EConversationStatus.resolved
          ) {
            this.router.navigate(
              ['/dashboard', 'inbox', 'detail', this.currentTaskId],
              {
                queryParams: {
                  tab: EConversationStatus.open,
                  conversationId: this.currentConversation.id,
                  pendingSelectFirst: true
                },
                queryParamsHandling: 'merge'
              }
            );
            this.toastrService.success('Sms message reopened');
          }
        }
        break;
      case ESentMsgEvent.ERR:
        this.handleSendError(event);
        break;
    }
  }

  onResendTheMessage(event: Event, id: string): void {
    event.stopPropagation();
    const body = this.cacheBodyMessages.get(id);
    const message = this.listofmessages.find((msg) => msg.id === id);
    message.isSending = true;
    message.isError = false;
    this.composeMessageRef.handleSendMsg(
      {
        action: SendOption.Resend,
        value: '',
        isTrudi: false
      },
      body
    );
  }

  handleSending(event: IAppTriggerSendMsgEvent) {
    const messages = AppChatUtil.genMessageTemp(event, {
      currentUser: this.currentUser,
      currentCompany: this.currentCompany,
      cacheBodyMessages: this.cacheBodyMessages
    });
    messages.forEach((element) => {
      this.mapHistoryChatMessage(element);
    });
    this.listofmessages = [...messages, ...this.listofmessages];
    this.listofmessages = this.listofmessages.sort(AppChatUtil.compareDates);
    this.updateIsLastReadMessage(this.listofmessages);

    this.mapMessageProperties();
  }

  handleSendError(event: IAppTriggerSendMsgEvent) {
    this.conversationService.removeLoadingNewMsg(event.tempConversationId);
    this.conversationService.filterTempConversations(
      (item) => item.id !== event.tempConversationId,
      'handleSendError'
    );

    if (!this.currentConversation?.id) {
      this.loadingCreateScratch = false;
      this.composeType = ComposeEditorType.NEW;
    }

    const { tempIds } = event;
    tempIds?.forEach((id) => {
      const message = this.listofmessages.find((msg) => msg.id === id);
      if (!message) return;
      message.isSending = false;
      message.isError = true;
    });
  }

  markAsReadTicket() {
    this.currentConversation = {
      ...this.currentConversation,
      countUnreadTicket: 0
    };
    this.cdr.markForCheck();
  }

  triggerCurrentConversation(value) {
    if (value?.id !== this.currentConversation?.id) return;
    this.currentConversation = { ...this.currentConversation, ...value };
    this.currentTask = {
      ...this.currentTask,
      conversations: [this.currentConversation]
    };
  }

  handleJoinConversation() {
    if (this.isDisabledJoinButton) return;
    this.pmJoinningConversation = true;
    this.conversationService
      .pmJoinConversation(this.currentConversation.id)
      .subscribe({
        error: () => {
          this.pmJoinningConversation = false;
          this.toastCustomService.handleShowToastAddItemToTask(
            'Failed to join conversation'
          );
        }
      });
  }

  private maintainScrollPosition(): void {
    const container = this.scrollDown?.nativeElement;
    const currentScrollHeight = container.scrollHeight;
    const currentScrollTop = container.scrollTop;

    requestAnimationFrame(() => {
      const newScrollHeight = container.scrollHeight;
      const scrollOffset = newScrollHeight - currentScrollHeight;
      container.scrollTop = currentScrollTop + scrollOffset;
    });
  }
}
