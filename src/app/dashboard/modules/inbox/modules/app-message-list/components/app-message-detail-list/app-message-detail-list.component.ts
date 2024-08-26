import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
  Self,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { isEqual } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
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
  of,
  pairwise,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { EAddOn } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { IListDynamic } from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { ApiService } from '@services/api.service';
import { BroadcastHelperService } from '@services/broadcast-helper.service';
import { ChatGptService, EBoxMessageType } from '@services/chatGpt.service';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  CONVERSATION_STATUS,
  DEBOUNCE_SOCKET_TIME,
  DEFAULT_TEXT_MESS_HEIGHT,
  FILE_VALID_TYPE,
  MAX_TEXT_MESS_LENGTH,
  PHONE_PREFIXES,
  SEND_MESSAGE_POPUP_OPEN_FROM,
  SUPPORTED_FILE_CAROUSEL,
  listCalendarTypeDot,
  listVideoTypeDot,
  trudiUserId
} from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { DragDropFilesService } from '@services/drag-drop.service';
import { FilesService } from '@services/files.service';
import { FirebaseService } from '@services/firebase.service';
import { HeaderService } from '@services/header.service';
import { LoadingService } from '@services/loading.service';
import { CallButtonState, MessageService } from '@services/message.service';
import { ASSIGN_TO_MESSAGE } from '@services/messages.constants';
import { NotificationService } from '@services/notification.service';
import { PermissionService } from '@services/permission.service';
import { PopupService, PopupState } from '@services/popup.service';
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
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import {
  ECallTooltipType,
  EMessageComeFromType,
  EMessageType
} from '@shared/enum/messageType.enum';
import { EOptionType } from '@shared/enum/optionType.enum';
import { CallTypeEnum, ERequestType } from '@shared/enum/share.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  EInviteStatus,
  EUserDetailStatus,
  EUserPropertyType,
  GroupType,
  UserStatus
} from '@shared/enum/user.enum';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import {
  HandleInitAISummaryContent,
  displayName,
  findLastItemMsgTypeTextOrTicket,
  getActionLinkImgSrc
} from '@shared/feature/function.feature';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import {
  CategoryUser,
  TransferActionLinkProp
} from '@shared/types/action-link.interface';
import {
  LastUser,
  UserConversation
} from '@shared/types/conversation.interface';
import { FileCarousel } from '@shared/types/file.interface';
import {
  ECallTranscript,
  FileMessage,
  IMessage,
  EScheduledStatus
} from '@shared/types/message.interface';
import { ConversionStatusType } from '@shared/types/share.model';
import {
  MessageCallSocketSendData,
  SocketCallData,
  SocketSendData
} from '@shared/types/socket.interface';
import { Property } from '@shared/types/property.interface';
import { TrudiButton } from '@shared/types/trudi.interface';
import { UnhappyStatus } from '@shared/types/unhappy-path.interface';
import { AgentFileProp } from '@shared/types/user-file.interface';
import {
  CurrentUser,
  UserPropInSelectPeople
} from '@shared/types/user.interface';
import { TrudiScheduledMsgService } from '@/app/trudi-scheduled-msg/services/trudi-scheduled-msg.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import {
  ESentMsgEvent,
  ISelectedReceivers,
  ISendMsgPayload,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { auth, conversations } from 'src/environments/environment';
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
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { SocketType } from '@shared/enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { ETypePage } from '@/app/user/utils/user.enum';
import { whiteListInMsgDetail } from '@shared/constants/outside-white-list.constant';
import { AppMessageApiService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-api.service';
import { AppMessageListService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-list.service';
import {
  AppComposeMessageComponent,
  ComposeEditorType,
  IAppTriggerSendMsgEvent
} from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/app-compose-message.component';
import { IAppMessageActionItem } from '@/app/dashboard/modules/inbox/modules/app-message-list/interfaces/message.interface';
import { AppMessageLoadingService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/app-message-loading.service';
import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';

const videoPattern = new RegExp(listVideoTypeDot.join('|'), 'gi');

import uuid4 from 'uuid4';
import { EAppMessageCreateType } from '@/app/dashboard/modules/inbox/modules/app-message-list/enum/message.enum';
import { TaskHelper } from '@/app/task-detail/utils/task.helper';
import { HelperService } from '@services/helper.service';
import { ITrudiScheduledMsgInfo } from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import { ERouterHiddenSidebar } from '@/app/dashboard/shared/types/sidebar.interface';
import { appMessageActions } from '@core/store/app-message/actions/app-message.actions';
import { MessageConversationIdSetService } from '@/app/dashboard/modules/inbox/modules/app-message-list/services/message-id-set.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { EConversationStatus } from '@/app/task-detail/modules/header-conversations/enums/conversation-status.enum';
import { ReplyMessageService } from '@services/reply-message.service';
import { trudiAgent } from '@/app/shared';
import { AppRoute } from '@/app/app.route';

enum MessageType {
  text = 'text',
  url = 'url'
}

enum EBehaviorScroll {
  SMOOTH = 'smooth',
  AUTO = 'auto'
}

// height of conversations linked to app
const LINKED_CONVERSATION_HEIGHT = 33;

@Component({
  selector: 'app-message-detail-list',
  templateUrl: './app-message-detail-list.component.html',
  styleUrls: ['./app-message-detail-list.component.scss'],
  providers: [
    TrudiSendMsgFormService,
    TrudiSendMsgService,
    LoadingService,
    ChatGptService,
    MessageDetailPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppMessageDetailListComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  public readonly ComposeEditorType = ComposeEditorType;
  @Input() taskDetailViewMode: EViewDetailMode = EViewDetailMode.MESSAGE;
  @Input() activeMobileApp: boolean;
  @Input() isConversationTypeApp: boolean = false;
  @ViewChild('scrollDown', { static: false }) public scrollDown: ElementRef;
  @ViewChild('redLineNew', { static: false }) private redLineNew: ElementRef;
  @ViewChild('boxChat') private boxChat: ElementRef<HTMLDivElement>;
  @ViewChild('textareaContainer') textareaContainer: ElementRef;
  @ViewChild('footerContainer') footerContainer: ElementRef<HTMLDivElement>;
  @ViewChild('textarea', { static: true })
  textarea: ElementRef<HTMLTextAreaElement>;
  @ViewChild('tst', { static: true }) tst: ElementRef<HTMLInputElement>;
  @ViewChild('tinyEditor', { static: true })
  tinyEditor: ElementRef<HTMLInputElement>;
  @ViewChild('todoList', { static: true }) todoList:
    | string
    | CdkDropList
    | (string | CdkDropList);
  @ViewChild('messageWrapper', { static: false })
  messageWrapper: ElementRef;
  @ViewChild('composeMessage') composeMessageRef: AppComposeMessageComponent;

  textAreaZone: HTMLTextAreaElement;
  textAreaContainerZone: HTMLDivElement;
  readonly MAX_TEXT_MESS_LENGTH = MAX_TEXT_MESS_LENGTH;
  public EOptionType = EOptionType;
  public listRoutineInspection: InspectionSyncData[] = [];
  public showSendInvoicePt = false;

  private _currentProperty: Property;
  getCurrentConversationIdbyParam: string = '';

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
  public EInviteStatus = EInviteStatus;
  public EUserDetailStatus = EUserDetailStatus;
  public messageType = MessageType;
  public messagesType = EMessageType;
  public userInviteStatusType = EUserInviteStatusType;
  public userPropertyType = EUserPropertyType;
  public conversationType = EConversationType;
  private totalMsgRendered = 0;
  public allMessageRender = false;

  private _groupMessage = [];

  public set groupMessage(value) {
    this._groupMessage = value;
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

  public listofmessagesWithTrudi: IMessage[] = [];

  // TODO: fix type later
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

  public currentPropertyType: string = '';
  public listofConversationCategory: any = [];
  public listofTicketCategory: any = [];
  public historyOffset = 0;
  public currentMessage = '';
  public popupModalPosition = ModalPopupPosition;
  private unsubscribe = new Subject<void>();
  public isModalDialogVisible = false;
  public token: string;
  public isFirstJoined = true;
  public isShowConfirmCallModal = false;
  public selectedUser = '';
  public selectedRole = '';
  public conversationId = '';
  public isTyping = false;
  message: AbstractControl;
  public isShowQuitConfirmModal = false;
  public isShowSelectPeopleModal = false;
  public isShowSendMessageModal = false;
  public isShowSecceessMessageModal = false;
  public isShowAddFilesModal = false;
  public countCheckbox = 0;
  public selectedFiles = [];
  public selectedUsersFromPopup = [];
  public isShowCarousel = false;
  public initialIndex: number;
  public arrayImageCarousel: FileCarousel[] = [];
  public arrayImageCarousel2: FileCarousel[] = [];
  public selectedTicket: any;
  private totalPages: number;
  public isDisplayTypingBlock = false;
  public disableDrop = false;
  public listRole: string[] = [];
  public trudiUserId = trudiUserId;
  public connectedChild: string | CdkDropList | (string | CdkDropList)[];
  public currentRoleDrop = '';
  public titleSelecPeople = '';
  public isOnlyOwnerTenant: boolean = false;
  public isOnlySupplier: boolean = false;
  public showOwnerTenantAndSupplier: boolean = false;
  public selectedMode = '';
  public isShowFromFile = false;
  public isResetModal = false;
  public listFileForward = [];
  public openFrom = SEND_MESSAGE_POPUP_OPEN_FROM.appChat;
  public showTextForward = false;
  public fileTypeQuote: string;
  public loadingChangeStatus: boolean = false;
  actionLinkList: TransferActionLinkProp[] = [];
  fileList: AgentFileProp[] = [];
  fullCategoryList: CategoryUser[] = [];
  timeOutOfFocus: NodeJS.Timeout = null;
  scrollBottomTimeOut: NodeJS.Timeout = null;
  scrollRedlineTimeOut: NodeJS.Timeout = null;
  timeOutOfBoxHeight: NodeJS.Timeout = null;
  chatSectionHeight = '100%';
  public statusOfCurrentConversation: Partial<IMessage>;

  public showSendActionLink = false;
  crm = '';
  isSendEmail = false; //true: sendEmail, false: forwardTicket

  public currentConversationStatus: EConversationType;
  public forwardButtons: TrudiButton[] = [];
  public buttonAction: TrudiButton;
  private conversationTrudiRespone: any;
  public messageSendQuote = '';
  public viewSyncFile: boolean = false;
  public statusModalMessage: boolean;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  public isRmEnvironment: boolean = false;
  private isFirstLoad = true;

  public inviteDeactive: boolean = false;
  public enableCallBtn = {
    voiceCall: false,
    videoCall: false
  };
  public showVideoCallBtn: boolean = false;
  public currentTaskDeleted: boolean = false;
  public noSendMessageBackBtn: boolean = true;
  public unhappyStatus: UnhappyStatus;
  public isUnHappyPath = false;
  public callBtnTooltip: string = '';
  public listNonAppUserPhoneNumber: string[] = [];
  public callType = CallTypeEnum;
  public isProgressCall: boolean = false;
  public startedCallMessage: any;
  public lastCall: MessageCallSocketSendData;
  public chatDetailWidth: number = 0;
  public isTaskType = false;
  public taskType = TaskType;
  public isReadMessage: boolean = false;
  public notificationId: string = '';
  public showTinyEditor: boolean = true;
  public isShowActionButton: boolean = true;
  public isResetFile = false;
  public fileSelected;
  public isCarousel: boolean = false;
  public isShowToast: boolean = false;
  public isForward: boolean = false;
  public defaultText: string = '';
  public isShowTrudiSendMsg: boolean = false;
  public isShowTrudiScheduledMsg: boolean = false;
  public isDisconnected: boolean = false;
  public contentText: string = '';
  public EMessageComeFromType = EMessageComeFromType;
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
    'inputs.isAppMessage': true
  };
  attachmentTextEditorConfigs = {
    'footer.buttons.showBackBtn': false
  };
  public conversationStatus = CONVERSATION_STATUS;
  public currentAgencyId: string;
  public paragraph: object = { rows: 0 };
  public isImageDetail = false;
  public imageDetailUrl = '';
  private hasRescheduledRequest = new BehaviorSubject(false);
  public currentCompany: ICompany;
  public isArchiveMailbox: boolean;
  public isDisconnectMailbox: boolean;
  private getConversationSubscriber: Subscription = new Subscription();
  private callButtonData: CallButtonState;
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
  hasMessageFromApp: boolean = false;
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
  private clearHistoryKey: string = '';
  private isFirstReadMessage = true;
  private isFirstLoadHistory = true;
  public lastReadMessageId: string;
  public shouldSkipRender: boolean;
  public currentTask: TaskItem;
  public typeShowAppMsg = false;
  public listTicket: IAppMessageActionItem[] = [];
  private loadingTicket$: Subject<boolean> = new Subject();
  public loadingTicket: boolean = false;
  private currentMailBoxId: string;
  readonly ETypePage = ETypePage;
  public readonly whiteListMsgDetail = [...whiteListInMsgDetail];
  public currentDataUserProfile: UserProperty;
  public isUserProfileDrawerVisible: boolean = false;
  public isAppMessageLog: boolean = false;
  public isCallConversation: boolean = false;
  public isHiddenMessageTypeCallFile: boolean = true;
  // use to forced refresh message list
  // TODO: find a better way to handle this
  private markedForRefresh: boolean = true;
  /// height detail wrapper = 100% - header + inline
  public heightDetailWrapper: string = 'calc(100% - 234px)';
  public chatHeaderHeight = 84;
  public lastReadMessageIndex: number = -1;
  public dynamicStyle = {
    chatContainer: {
      marginTop: 0
    }
  };
  public isInboxDetail: boolean;

  private cacheBodyMessages: Map<string, ISendMsgPayload> = new Map();
  private listTempId: Map<string, string> = new Map();
  public queryParams: Params = {};
  public composeType: ComposeEditorType = null;
  public composeEditorType = ComposeEditorType;
  private createNewMessageTypes = [
    EAppMessageCreateType.NewAppMessage,
    EAppMessageCreateType.ReplyViaApp,
    EAppMessageCreateType.NewAppMessageDone
  ];
  public hiddenLinkedTask = ERouterHiddenSidebar;
  public isNewConversationState: boolean = false;
  public showLinkedTask: boolean = false;

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
      givenTime.setMinutes(givenTime.getMinutes() - 0.5);
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

  get isCreateNewMessage() {
    return this.appMessageListService.isCreateNewMessage$;
  }

  public isAnyLoading$: Observable<boolean> = new Observable();
  public loading: boolean = false;
  private listAction$ = new Subject<IAppMessageActionItem[]>();
  private getHistoryOfConversationV2Sub = new Subscription();
  private chatGptSubscription = new Subscription();

  public loadingCreateScratch: boolean = false;
  public loadingReplyViaApp: boolean = false;
  readonly ERequestType = ERequestType;
  isFetchingNewerMessages: boolean = false;
  isFetchingOlderMessages: boolean = false;
  private tempConversationId: string = null;
  private appMessageCreateType: EAppMessageCreateType = null;
  public elementRefHeight: number = 0;
  public loadingMessageSection: boolean = false;
  public isRecipientAlreadyHasConversation: boolean = false;
  hasTrudiAssignee: boolean = false;
  public isUserVerified: boolean = true;
  public isDisabledJoinButton: boolean = false;
  private tabChange: boolean = false;
  private countSocketSend: number = 0;
  private eventChangeTab: (e: Event) => void;
  private eventChangeListenerBound: boolean = false;

  get isShowAppComposeMessage(): boolean {
    return (
      !this.loadingReplyViaApp &&
      ((this.queryParams?.['appMessageCreateType'] === 'NEW_APP_MESSAGE' &&
        !this.groupMessage.length) ||
        (this.currentConversation?.crmStatus !== EUserDetailStatus.DELETED &&
          this.currentConversation?.inviteStatus !== EInviteStatus.OFFBOARDED &&
          this.isUserVerified)) &&
      !this.loading
    );
  }

  constructor(
    private propertyService: PropertiesService,
    private apiService: ApiService,
    private messageService: MessageService,
    public conversationService: ConversationService,
    public userService: UserService,
    private websocketService: RxWebsocketService,
    private popupService: PopupService,
    private agentUserService: AgentUserService,
    private filesService: FilesService,
    public dropService: DragDropFilesService,
    public sharedService: SharedService,
    private readonly elr: ElementRef,
    public taskService: TaskService,
    private headerService: HeaderService,
    @Self() private loadingService: LoadingService,
    private broadcastHelperService: BroadcastHelperService,
    private toastrService: ToastrService,
    public firebaseService: FirebaseService,
    public notificationService: NotificationService,
    private fileService: FilesService,
    private chatGptService: ChatGptService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgService: TrudiSendMsgService,
    private agencyDashboardService: AgencyDashboardService,
    private trudiScheduledMsgService: TrudiScheduledMsgService,
    private router: Router,
    private reiFormService: ReiFormService,
    private routineInspectionService: RoutineInspectionService,
    public inboxService: InboxService,
    private messageLoadingService: MessageLoadingService,
    private permissionService: PermissionService,
    private agencyDateFormatService: AgencyDateFormatService,
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
    private appMessageApiService: AppMessageApiService,
    private appMessageListService: AppMessageListService,
    private activatedRoute: ActivatedRoute,
    private ngZone: NgZone,
    private appMessageLoadingService: AppMessageLoadingService,
    private widgetPTService: WidgetPTService,
    private helper: HelperService,
    private messageConversationIdSetService: MessageConversationIdSetService,
    private replyMessageService: ReplyMessageService,
    private renderer: Renderer2
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    const headerInfoElement = this.elr?.nativeElement.querySelector('.chat');
    this.chatDetailWidth = headerInfoElement?.offsetWidth - 150;
    // this.setupEditorResponsive();
  }

  private _listofmessages: any[];

  get listofmessages(): any[] {
    return this._listofmessages;
  }

  set listofmessages(value: any[]) {
    this._listofmessages = value.map((message, index) => ({
      ...message,
      originIndex: index
    }));
    this.chatGptService.listMsgInCurrentConversation = value;
    // hot fix for rendering issue
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

  private checkScroll(): void {
    const conversationHeaderHeight =
      this.elr?.nativeElement.querySelector('#app-chat-header')?.clientHeight ||
      this.elr?.nativeElement.querySelector('.to-preview')?.clientHeight;

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

  scrollDownSubscription: Subscription;
  private onEventScrollDown() {
    if (this.scrollDownSubscription) {
      this.scrollDownSubscription.unsubscribe();
    }
    fromEvent(this.scrollDownContainerEl, 'scroll')
      .pipe(debounceTime(200), takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.checkScroll();
        if (this.isScrolledDown()) {
          this.loadHistory(
            this.currentConversation.id,
            false,
            null,
            this.createdTimeOfLastMsg,
            null,
            null,
            'down'
          );
        }
      });
  }

  private isScrolledDown(): boolean {
    if (!this.scrollDownContainerEl) return false;
    const scrollPosition =
      this.scrollDownContainerEl.scrollHeight -
      this.scrollDownContainerEl.clientHeight;
    return this.scrollDownContainerEl.scrollTop + 80 >= scrollPosition;
  }

  public handleResizeInlineMsg(value) {
    const currentDetailWrapperHeight =
      Number(this.heightDetailWrapper?.replace('px', '')) || 0;
    const linkedConversationAppLogHeight = this.currentConversation
      ?.linkedConversationAppLog
      ? LINKED_CONVERSATION_HEIGHT
      : 0;
    const currentInlineHeight =
      currentDetailWrapperHeight - this.chatHeaderHeight;
    if (+currentInlineHeight !== value) {
      this.heightDetailWrapper = `calc(100% - ${
        value + this.chatHeaderHeight + linkedConversationAppLogHeight
      }px)`;
      this.cdr.markForCheck();
    }
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
      this.elementRefHeight = this.boxChat.nativeElement?.offsetHeight;
    }

    if (this.isFirstLoadRedLineNewEl && this.isHasScroll) {
      if (!this.isHasNewMessage && !this.redLineNew?.nativeElement) {
        this.scrollToBottom(EBehaviorScroll.AUTO);
      } else {
        this.scrollRedLineNewToView();
      }
      this.isFirstLoadRedLineNewEl = false;
    }
  }

  get popupState() {
    return this.trudiSendMsgService.getPopupState();
  }
  get contactCardPopupState() {
    return this.trudiAddContactCardService.getPopupState();
  }
  get uploadFileFromCRMPopupState() {
    return this.uploadFromCRMService.getPopupState();
  }
  get popupScheduleState() {
    return this.trudiScheduledMsgService.getPopupState();
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

  handleOnSelectedReceiversChange(data: ISelectedReceivers) {
    if (
      data?.id &&
      data?.propertyId &&
      data?.userPropertyId &&
      !this.loadingReplyViaApp &&
      this.queryParams['appMessageCreateType'] === 'NEW_APP_MESSAGE'
    ) {
      const payload = {
        propertyId: data.propertyId,
        userId: data.id,
        mailBoxId: this.currentMailBoxId,
        userPropertyId: data.userPropertyId
      };
      this.loadingMessageSection = true;
      this.conversationService
        .getConversationByAppUser(payload)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((conversationRes) => {
          if (
            conversationRes &&
            this.currentConversationId === conversationRes.id
          ) {
            this.loadingMessageSection = false;
            this.cdr.markForCheck();
            return;
          }

          this.loadingMessageSection = !!conversationRes;
          this.isRecipientAlreadyHasConversation = !!conversationRes;

          this.router.navigate([], {
            queryParams: {
              inboxType:
                !conversationRes || conversationRes?.isMyTask
                  ? this.activatedRoute.snapshot.queryParams['inboxType']
                  : GroupType.TEAM_TASK,
              taskId: conversationRes?.taskId || null,
              conversationId: conversationRes?.id || null
            },
            queryParamsHandling: 'merge'
          });
          this.cdr.detectChanges();
        });
    } else if (
      this.queryParams['appMessageCreateType'] === 'NEW_APP_MESSAGE' &&
      !data
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

  subscribeStore() {
    this.store
      .select(selectCurrentConversationId)
      .pipe(
        filter((conversation) => !!conversation),
        distinctUntilChanged(),
        tap((conversationId) => {
          this.currentConversationId = conversationId;
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe();

    this.store
      .select(selectCurrentConversationId)
      .pipe(
        filter((id) => !!id),
        switchMap((id) => this.store.select(selectConversationById(id))),
        filter((conversation) => !!conversation),
        distinctUntilChanged((prev, curr) => prev?.id === curr?.id),
        takeUntil(this.unsubscribe)
      )
      .subscribe({
        next: (state) => {
          this.currentConversationId = state.id;
          if (this.queryParams['fromScratch']) return;
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
            this._currentConversation = state?.currentConversation;
            this.createNewConversationConfigs[
              'serviceData.conversationService'
            ] = {
              currentConversation: this._currentConversation
            };

            this.isAppMessageLog = this.currentConversation.isAppMessageLog;
            this.isCallConversation =
              this.currentConversation?.isCallConversation;
          }

          if (state?.currentProperty) {
            this._currentProperty = state?.currentProperty;
          }

          if (this.currentConversation && this.groupMessage?.length) {
            this.loadingMessageSection = false;
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
        takeUntil(this.unsubscribe),
        map(
          ([isLoading, isLoadingMessage, isLoadingService, loadingTicket]) => {
            if (this.loadingTicket !== loadingTicket) {
              this.loadingTicket = this.loadingTicket;
            }
            return (
              (!this.queryParams['fromScratch'] &&
                !this.getNewConversationState() &&
                isLoading) ||
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

  private getNewConversationState(): boolean {
    return (this.isNewConversationState = this.createNewMessageTypes.includes(
      this.queryParams['appMessageCreateType']
    ));
  }

  private subscribeToQueryParams() {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(this.handleQueryParamsChange.bind(this));
  }

  private handleQueryParamsChange(queryParams) {
    this.appMessageCreateType = queryParams['appMessageCreateType'];
    if (
      queryParams['appMessageCreateType'] &&
      !queryParams['taskId'] &&
      !queryParams['conversationId']
    ) {
      this.resetHistory(queryParams['appMessageCreateType']);
    }
    this.createNewConversationConfigs = {
      ...this.createNewConversationConfigs
    };
    this.queryParams = queryParams;
    if (queryParams['tempConversationId']) {
      this.tempConversationId = queryParams['tempConversationId'];
    }
    if (
      queryParams['appMessageCreateType'] === EAppMessageCreateType.ReplyViaApp
    ) {
      this.loadingReplyViaApp = true;
      this.cdr.markForCheck();
    }

    const newConversationId = queryParams?.['conversationId'];
    if (
      this.queryParams['appMessageCreateType'] ===
      EAppMessageCreateType.NewAppMessage
    ) {
      this.composeType = ComposeEditorType.NEW;
      this.getCurrentConversationIdbyParam = newConversationId;
    } else if (
      this.queryParams['appMessageCreateType'] ===
      EAppMessageCreateType.NewAppMessageDone
    ) {
      this.composeType = ComposeEditorType.REPLY;
    } else if (!this.queryParams['appMessageCreateType']) {
      this.composeType = null;
    }

    if (this.getNewConversationState()) {
      this.loading = false;
      this.allMessageRender = true;
    }

    if (
      !queryParams['taskId'] &&
      !queryParams['conversationId'] &&
      this.router.url.includes(AppRoute.APP_MESSAGE_INDEX)
    ) {
      this.conversationService.setCurrentConversation({} as UserConversation);
      this.taskService.currentTask$.next(null);
    }

    if (
      !this.helper.isInboxDetail &&
      newConversationId &&
      this.getCurrentConversationIdbyParam !== newConversationId &&
      !this.queryParams['fromScratch']
    ) {
      this.loading = true;
      this.getCurrentConversationIdbyParam = newConversationId;
      this.resetHistory(newConversationId);
    }
  }

  onTempConversations() {
    this.conversationService.tempConversations
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((conversations) => {
        if (!this.tempConversationId) {
          this.loadingCreateScratch = false;
          this.loadingReplyViaApp = false;
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

  highlightElement(element: HTMLElement) {
    this.renderer.addClass(element, 'highlight');
    setTimeout(() => {
      this.renderer.removeClass(element, 'highlight');
    }, 1000);
  }

  scrollToMessage(messageId: string) {
    const messageElement = this.elr.nativeElement.querySelector(
      `#message-${messageId}`
    ) as HTMLElement;
    if (messageElement) {
      setTimeout(() => {
        messageElement.scrollIntoView({ behavior: 'smooth' });
        this.highlightElement(messageElement);
      }, 100);
    }
  }

  onTriggerScrollToElement() {
    this.replyMessageService.triggerScrollToElement
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((messageId) => {
        if (this.listofmessages.some((msg) => msg.id === messageId)) {
          this.scrollToMessage(messageId);
        } else {
          this.loadHistory(
            this.currentConversation.id,
            true,
            null,
            null,
            messageId,
            () => this.scrollToMessage(messageId)
          );
        }
      });
  }

  ngOnInit() {
    // this.onTriggerEventScheduleSendNow();
    this.handleNavigateNewAppMessURL();
    this.onTriggerScrollToElement();
    this.onPairwiseConversation();
    this.onTempConversations();
    this.setupLoadingObservables();
    this.subscribeToQueryParams();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.unsubscribe),
        filter((mailBoxId) => !!mailBoxId)
      )
      .subscribe((mailBoxId) => {
        this.currentMailBoxId = mailBoxId;
      });
    this.conversationService.reOpenConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (this.currentConversationStatus === this.conversationType.resolved) {
          this.changeConversationStatus(res);
        }
      });
    this.subscribeStore();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.taskService
      .getHeaderLeftHeight()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((headerLeftHeight) => {
        this.headerLeftHeight = headerLeftHeight;
      });

    combineLatest([
      this.inboxService.getIsDisconnectedMailbox(),
      this.inboxService.isArchiveMailbox$
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([isArchiveMailbox, isDisconnectedMailbox]) => {
        this.createNewConversationConfigs['footer.buttons.disableSendBtn'] = [
          isArchiveMailbox,
          isDisconnectedMailbox
        ].includes(true);
      });

    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isDisconnected) => {
        this.isDisconnected = isDisconnected;
      });

    this.messageTaskLoadingService.isLoading$
      .pipe(
        filter((isLoading) => isLoading),
        takeUntil(this.unsubscribe)
      )
      .subscribe(() => {
        this.isShowSidebarRight = false;
      });

    this.dropService.handleConnect({
      element: this.todoList,
      unsubscribe: this.unsubscribe,
      connectedElement: this.connectedChild,
      type: 'parent'
    });
    this.typeShowAppMsg = this.router.url.includes('app-messages');
    this.subscribeActiveMobileApp();
    this.handleEndCallWhenCloseTab();
    this.ConversationCategory();
    this.buildSendMessageForm();
    this.subscribeCallButtonData();
    this.subscribeChangeParticipants();

    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow) => {
        this.isArchiveMailbox = isShow;
      });
    this.inboxService
      .getIsDisconnectedMailbox()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isShow) => {
        this.isDisconnectMailbox = isShow;
      });

    this.conversationService.updateConversationStatus$
      .pipe(takeUntil(this.unsubscribe))
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
    this.conversationService.actionLinkTransfer$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.timeOutOfFocus && clearTimeout(this.timeOutOfFocus);
        this.timeOutOfFocus = setTimeout(() => {
          this.changeOnFocus();
        }, 1000);
      });

    this.subscribeCurrentConversation();
    this.getListAction();
    this.subscribeTriggerAction();
    this.propertyService.newCurrentProperty
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.clearChat();
          this.currentProperty = res;
        } else {
          this.currentProperty = null;
        }
        this.cdr.markForCheck();
      });
    this.messageService.getMessagesSubject
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res?.messages?.length) {
          this.currentConversation = {
            ...this.currentConversation,
            status: res.messages[0].status
          };
          this.checkInviteDeactive();
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
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          this.listofTicketCategory = res;
          localStorage.setItem('listTicketCategories', JSON.stringify(res));
        });
    } else {
      this.listofTicketCategory = JSON.parse(
        localStorage.getItem('listTicketCategories')
      );
    }
    localStorage.setItem('remoteName', '');
    this.conversationService.isDisplayTypingBlock
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res && this.isScrolledDown()) {
          this.scrollToBottom();
        }
      });
    this.filesService.dragDropFileTrigger$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((currentRole) => {
        this.listRole = currentRole;
        this.disableDrop = this.listRole.includes(this.currentRoleDrop);
      });
    this.dropService.dropEnded$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.disableDrop = true;
      });

    this.getFiles();
    this.subscribeViewDetailFile();
    this.subscribeIsShowDrawerViewUserProfile();

    this.websocketService.onSocketSend
      .pipe(
        filter((data) => data?.conversationId === this.currentConversationId),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
      )
      .subscribe((data) => {
        data?.['messages']?.forEach((item) => {
          this.listTempId.set(item.tempId, item.id);
        });
        try {
          if (this.checkGetCallFromSocketSend(data)) {
            this.handleAddSocketCallMessageToHistory(data);
            return;
          }

          if (
            data &&
            data.messageType === CONVERSATION_STATUS.AGENT_JOIN &&
            this.currentConversation &&
            data.propertyId === this.currentConversation.propertyId &&
            data.conversationId === this.currentConversation.id
          ) {
            this.currentConversation = {
              ...this.currentConversation,
              status: CONVERSATION_STATUS.OPEN
            };
            this.checkInviteDeactive();
          }

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

          const ticketUpdate = this.listTicket.find((ticket) =>
            ticket.linkedConversations.some(
              (conversation) =>
                conversation.id === data?.conversationId &&
                conversation.taskId === data.taskId
            )
          );
          if (!!ticketUpdate) {
            this.inboxService.triggerGetActionDetail$.next();
          }
        } catch (e) {
          console.log(e);
        }
      });

    this.websocketService.onSocketCall
      .pipe(
        distinctUntilChanged(
          (prev, cur) => prev.socketTrackId === cur.socketTrackId
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        try {
          const data = res;
          this.isHiddenMessageTypeCallFile = true;

          if (this.checkGetCallFromSocketCall(data)) {
            this.handleAddSocketCallMessageToHistory(data, true);
          }
        } catch (e) {
          console.log(e);
        }
      });

    this.websocketService.onSocketVoiceCall
      .pipe(
        distinctUntilChanged(
          (prev, cur) => prev.socketTrackId === cur.socketTrackId
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        try {
          const data = res;
          this.isHiddenMessageTypeCallFile = true;
          if (this.checkGetCallFromSocketCall(data)) {
            this.handleAddSocketCallMessageToHistory(data, true);
          }
        } catch (e) {
          console.log(e);
        }
      });

    this.websocketService.onSocketMarkRead
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
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

    this.websocketService.onSocketJob
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
      )
      .subscribe((data) => {
        this.updateMessagesList(data);
      });
    this.subscribeCurrentTask();
    this.subscribeCloseAllModal();
    this.subscribeCurrentCompany();
    this.hasRescheduledRequest
      .pipe(takeUntil(this.unsubscribe), distinctUntilChanged())
      .subscribe((res) => {
        if (res) {
          this.getPTWidgetRoutineInspection();
          this.subscribeRoutineInspection();
        }
      });
    this.checkRedLineMessage();
    this.triggerConversationId();
    this.subscribeLastReadMessageIndex();
    this.subscribeSocketTranscriptCompleted();
    this.isInboxDetail = this.helper.isInboxDetail;
    this.subscribeSocketChangeStatusTask();
    this.subscribeSocketTicketChange();
    this.subscribeSocketPmJoinConverstation();
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

  private subscribeSocketTicketChange() {
    this.websocketService.onSocketTicketChange
      .pipe(
        filter(
          (data) =>
            !!data &&
            data.conversationId === this.currentConversationId &&
            data.fromUserId !== this.currentUser?.id &&
            this.listofmessages.findIndex((msg) => msg.id === data.messageId) >
              -1
        )
      )
      .subscribe((data) => {
        this.listofmessages = this.listofmessages.map((message) => {
          if (data.messageId === message.id) {
            return {
              ...message,
              options: {
                ...message.options,
                status: data.options.status
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

  private subscribeSocketChangeStatusTask() {
    this.websocketService.onSocketMessage
      .pipe(
        filter(
          (res) =>
            res &&
            res.conversationId === this.currentConversationId &&
            res.type === SocketType.changeStatusTask &&
            res.isAutoReopenedByPM &&
            res.fromUserId === this.currentUser?.id
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe(() => {
        if (this.router?.url.includes('inbox/app-messages/resolved')) {
          this.currentConversation = {
            ...this.currentConversation,
            status: CONVERSATION_STATUS.OPEN
          };
          this.router.navigate(['dashboard/inbox/app-messages', 'all'], {
            queryParams: {
              status: TaskStatusType.inprogress,
              conversationId: this.currentConversation.id
            },
            queryParamsHandling: 'merge'
          });
          this.toastrService.success('App message reopened');
        }
      });
  }

  handleNavigateNewAppMessURL() {
    if (
      this.activatedRoute.snapshot.queryParams['appMessageCreateType'] &&
      this.activatedRoute.snapshot.queryParams['taskId'] &&
      this.activatedRoute.snapshot.queryParams['conversationId']
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

  subscribeSocketTranscriptCompleted() {
    this.websocketService.onSocketTranscriptCompleted
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
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
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((index) => {
        this.lastReadMessageIndex = index;
      });
  }

  triggerConversationId() {
    this.inboxService.triggerConversationId$
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((conversationId) => {
          return this.getActionDetail(conversationId);
        })
      )
      .subscribe((rs) => {
        this.listAction$.next(rs);
      });
  }

  setLoadingChangeStatus() {
    this.loadingService.onLoading();
    if (
      this.queryParams['status'] === TaskStatusType.draft ||
      this.queryParams['tab'] === TaskStatusType.draft
    ) {
      this.loadingChangeStatus = true;
    }
  }

  changeConversationStatus(
    status: string,
    options?: string,
    user?: LastUser
  ): any {
    this.setLoadingChangeStatus();
    this.filesService.fileList.next([]);
    this.conversationService.actionLinkList.next([]);
    this.sharedService.textContainerHeight.next(DEFAULT_TEXT_MESS_HEIGHT);
    const isTaskType =
      this.taskService.currentTask$.value?.taskType === TaskType.TASK;
    if (isTaskType) {
      if (status === this.messagesType.reopened) {
        this.currentConversationStatus = this.conversationType.open;
        this.statusOfCurrentConversation.status = 'OPEN';
        return this.conversationService
          .updateStatus(
            status,
            this.currentConversation.id,
            this.currentConversation.isSendViaEmail
          )
          .subscribe((response) => {
            this.loadingMessageSection = false;
            this.loadingService.stopLoading();
            const user = response.user;
            this.currentConversationStatus =
              this.conversationService.getConversationType(
                EConversationType.reopened,
                this.statusOfCurrentConversation.inviteStatus,
                this.currentConversation?.crmStatus,
                this.currentConversation.secondaryEmail
              );
            this.getChatSectionHeight(this.currentConversationStatus);
            const lastUser: LastUser = {
              firstName: user.firstName,
              lastName: user.lastName,
              status: status,
              avatar: user.googleAvatar,
              id: user.id,
              type: user.type,
              isUserPropetyTree: false
            };
            this.currentConversation = {
              ...this.currentConversation,
              status,
              lastUser
            };
            this.updatedStatusHeader(
              this.taskService.currentTask$.value.status
            );
            this.checkInviteDeactive();
            this.userService.selectedUser.next({
              ...lastUser,
              googleAvatar: user.googleAvatar
            });
            const currentTask = this.taskService.currentTask$.getValue();
            if (currentTask.status === TaskStatusType.completed) {
              this.reopenConversationInCompletedTask(currentTask);
            }
            if (this.router.url?.includes(ERouterLinkInbox.MSG_DRAFT)) {
              const dataForToast = {
                conversationId: this.conversationId,
                taskId: currentTask.id
              };
              this.toastCustomService.handleShowToastForDraft(
                dataForToast,
                SocketType.changeStatusTask,
                TaskType.TASK_DRAFT,
                TaskStatusType.inprogress
              );
            } else {
              const dataForToast = {
                conversationId: this.conversationId,
                taskId: this.currentTask.id,
                isShowToast: true,
                type: SocketType.changeStatusTask,
                mailBoxId: this.currentMailBoxId,
                taskType: TaskType.MESSAGE,
                status: TaskStatusType.inprogress,
                pushToAssignedUserIds: [],
                isAppMessage: true,
                conversationType: this.currentConversation.conversationType
              };
              if (!this.router.url.includes(ERouterLinkInbox.TASK_DETAIL))
                this.toastCustomService.openToastCustom(
                  dataForToast,
                  true,
                  EToastCustomType.SUCCESS_WITH_VIEW_BTN
                );
            }
            this.updateConversationStatus(status, options, user);
            this.taskService.reloadTaskArea$.next(true);
            this.conversationService.reloadConversationList.next(true);
            this.messageTaskLoadingService?.stopLoading();
          });
      }
    } else {
      if (!this.currentConversation) {
        return;
      }
      this.sharedMessageViewService.setMessageToReOpen({
        currentConversation: this.currentConversation,
        currentMailBoxId: this.currentMailBoxId,
        isAppMessage: true
      });
    }
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
    const skipKeys = [EAppMessageCreateType.NewAppMessageDone] as string[];
    if (skipKeys.includes(key) || this.queryParams['fromScratch']) {
      return;
    }
    if (
      key === this.clearHistoryKey &&
      this.queryParams['appMessageCreateType'] !==
        EAppMessageCreateType.NewAppMessage
    ) {
      return;
    }

    if (TaskHelper.isCreateAppMsg(this.router.url, false)) {
      this.getHistoryOfConversationV2Sub?.unsubscribe();
      this.getConversationSubscriber?.unsubscribe();
    }

    this.loadingService.onLoading();
    if (
      !(
        this.router.url.includes('inbox/detail') &&
        this.activatedRoute.snapshot.queryParams['appMessageCreateType'] ===
          EAppMessageCreateType.NewAppMessage
      )
    ) {
      this.messageLoadingService.setLoading(true);
    }
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
    this.clearHistoryKey = key;
    this.isFirstLoadHistory = true;
    this.chatGptSubscription?.unsubscribe();
    this.isLoadingHistoryConversation = false;
    this.totalMsgRendered = 0;
    this.listRoutineInspection = [];
    this.listTempId.clear();
    this.cacheBodyMessages.clear();
    this.tempConversationId = null;
    this.dynamicStyle = {
      chatContainer: {
        marginTop: 0
      }
    };
    if (key && !this.isNewConversationState) {
      this.allMessageRender = false;
    }
    this.loadingCreateScratch = false;
    this.loadingReplyViaApp = false;
    this.isUserProfileDrawerVisible = false;
    this.loadingChangeStatus = false;
  }

  private subscribeCurrentConversation() {
    this.loadingService.onLoading();

    const currentConversation$ =
      this.conversationService.currentConversation.pipe(
        takeUntil(this.unsubscribe)
      );

    currentConversation$
      .pipe(
        filter((conversation) => conversation?.id),
        distinctUntilKeyChanged('id')
      )
      .subscribe((conversation) => {
        this.createNewConversationConfigs = {
          ...this.createNewConversationConfigs
        };
        this.resetHistory(conversation.id);
      });

    currentConversation$
      .pipe(
        filter((conversation) => conversation?.id),
        distinctUntilKeyChanged('id'),
        switchMap((conversation) => {
          if (this.isFirstLoadHistory) {
            this.getListTicket(conversation.id);
          }
          return this.trudiScheduledMsgService
            .jobRemindersCount(conversation.id)
            .pipe(takeUntil(this.unsubscribe), debounceTime(1000));
        })
      )
      .subscribe();

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

      this.dynamicStyle = {
        chatContainer: {
          marginTop: 0
        }
      };

      this.markedForRefresh = false;
      this.threadId = res?.threadId;
      this.currentConversationId = res?.id;
      this.isUserVerified =
        res?.isPmJoined && res?.lastPmJoined?.id === this.currentUser.id;
      this.currentConversation = res;

      this.isAppMessageLog = this.currentConversation?.isAppMessageLog;
      this.isCallConversation = this.currentConversation?.isCallConversation;
      let composeMsgHeight = 150;
      if (this.composeMessageRef) {
        composeMsgHeight = this.composeMessageRef.contentHeight;
      }
      this.heightDetailWrapper = `calc(100% - ${
        this.isAppMessageLog
          ? this.chatHeaderHeight
          : composeMsgHeight + this.chatHeaderHeight
      }px - ${this.currentConversation?.linkedConversationAppLog ? 33 : 0}px)`;
      this.hasMessageFromApp =
        this.currentConversation?.inviteStatus === UserStatus.ACTIVE;
      setTimeout(() => {
        const headerInfoElement =
          this.elr?.nativeElement.querySelector('.chat');
        if (headerInfoElement)
          this.chatDetailWidth = headerInfoElement?.offsetWidth - 150;
      }, 100);

      res && (this.showTinyEditor = res?.status !== EConversationType.resolved);

      if (
        res &&
        JSON.stringify(res) !== '{}' &&
        (res.length || Object.keys(res).length)
      ) {
        this.currentTaskId = res.taskId;
        const conversationStatus = res.status as ConversionStatusType;
        this.currentRoleDrop = res.userId;
        this.filesService.onFileDragging([this.currentRoleDrop]);
        this.checkConversationCanDragDrop(conversationStatus, res.inviteStatus);

        const fullName =
          res.firstName && res.lastName
            ? res.firstName + ' ' + res.lastName
            : res.firstName || res.lastName;
        this.trudiScheduledMsgService.setSelectedReceiverName(fullName);
      }
      this.listNonAppUserPhoneNumber = res?.phoneNumber
        ? [res?.phoneNumber]
        : [];
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
        this.conversationId = res.id;
        if (
          this.currentConversation &&
          this.currentConversation.id === res.id
        ) {
          this.getHistoryConversation(res);
          return;
        } else {
          this.loadingMessageSection = false;
          this.isFirstJoined = true;
        }
      } else {
        this._listofmessages = [];
        this._groupMessage = [];
        this.loadingMessageSection = false;
      }
      this.clearChat();
    });

    // after call api, if conversation was null, off loading
    this.conversationService.afterGetConversations$
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap(() => this.conversationService?.afterSetConversations$)
      )
      .subscribe((conversations) => {
        if (!conversations) {
          this.loadingService?.stopLoading();
          this.messageTaskLoadingService?.stopLoading();
        }
      });
  }

  public checkIsShowViewConversation() {
    return this.currentConversation?.createdFrom === EMessageComeFromType.APP;
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
        takeUntil(this.unsubscribe),
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
        //No more inline message function so this call is commented

        let callTooltipType = {
          voice: null,
          video: null
        };

        if (currentCompany) {
          if (!currentCompany.addOns.includes(EAddOn.OUTGOING_CALLS)) {
            callTooltipType.voice = this.permissionService.isMember
              ? ECallTooltipType.VOICE_CALL_MENBER
              : ECallTooltipType.VOICE_CALL_ADMIN;
          } else {
            callTooltipType.voice = null;
          }

          if (!currentCompany.addOns.includes(EAddOn.MOBILE_APP)) {
            callTooltipType.video = this.permissionService.isMember
              ? ECallTooltipType.VIDEO_CALL_MENBER
              : ECallTooltipType.VIDEO_CALL_ADMIN;
          } else {
            callTooltipType.video = null;
          }
        }
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
        this.detectEnableCallBtn(callTooltipType);
      });
  }

  subscribeCurrentCompany() {
    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
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

  subscribeActiveMobileApp() {
    this.companyService
      .getActiveMobileApp()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((status: boolean) => {
        this.activeMobileApp = status;
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
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((el) => {
        if (el === true) {
          this.selectedFiles = [];
        }
      });
  }

  setCurrentTask(value: TaskItem) {
    this.currentTask = value;
    this.hasTrudiAssignee =
      value.assignToAgents.findIndex((a) => a.id === trudiUserId) > -1;
    this.showLinkedTask =
      !this.helper.isInboxDetail &&
      this.currentTask?.taskType === TaskType.TASK;
    this.cdr.markForCheck();
  }

  subscribeCurrentTask() {
    this.taskService.currentTask$.pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (res) => {
        if (res) {
          this.setCurrentTask(res);
          this.isUnHappyPath = res.isUnHappyPath;
          this.unhappyStatus = res.unhappyStatus;
          this.currentTaskDeleted =
            this.taskService.checkIfCurrentTaskDeleted();
          this.isTaskType = res.taskType !== TaskType.MESSAGE;
          this.createNewConversationConfigs['footer.buttons.sendType'] = !this
            .isTaskType
            ? ISendMsgType.BULK_EVENT
            : '';
          if (
            this.currentTask.id ===
            this.appMessageLoadingService.getMessageLoadingValue()
          ) {
            this.appMessageLoadingService.setCreateMessageLoading(null);
          }
        }
      }
    });
  }

  subscribeViewDetailFile() {
    this.filesService.viewDetailFile
      .pipe(takeUntil(this.unsubscribe))
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
          this.isShowCarousel = true;
          this.filesService.viewDetailFile.next(null);
        }
      });
  }

  openModalScheduledMsg() {
    this.isShowTrudiScheduledMsg = true;
    this.trudiScheduledMsgService
      .getListScheduledMsg(
        this.currentConversation.taskId,
        this.currentConversation.id
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe();
    this.trudiScheduledMsgService.setPopupState({
      scheduledMessage: true
    });
  }

  subscribeIsShowDrawerViewUserProfile() {
    combineLatest([
      this.userProfileDrawerService.isUserProfileDrawerVisible$,
      this.userProfileDrawerService.dataUser$
    ])
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),
        debounceTime(300)
      )
      .subscribe(([isShow, dataUser]) => {
        this.isUserProfileDrawerVisible = isShow;
        this.currentDataUserProfile = {
          ...dataUser,
          isAppUser: true,
          isUserVerified:
            this.currentConversation?.isPmJoined &&
            this.currentConversation?.lastPmJoined?.id === this.currentUser?.id
        };
        this.cdr.markForCheck();
      });
  }

  handleClickOutsideUserProfileDrawer(): void {
    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      false,
      null
    );
  }

  getPropertyType(currentConversation: UserConversation) {
    const { propertyType, contactType } = currentConversation;
    if (propertyType === this.userPropertyType.AGENT) {
      this.currentPropertyType = 'Property Manager';
    } else if (propertyType === this.userPropertyType.OTHER) {
      this.currentPropertyType =
        this.sharedService.displayAllCapitalizeFirstLetter(
          contactType?.split('_').join(' ').toLowerCase()
        );
    } else {
      this.currentPropertyType = propertyType;
    }
  }

  getHistoryConversation(data: UserConversation) {
    this.currentConversation = { ...data };
    this.getPropertyType(data);
    this.checkInviteDeactive();
    this.selectedUser = data.firstName || '' + ' ' + data.lastName || '';
    this.selectedRole =
      (data.isPrimary ? 'Primary ' : '') +
      (USER_TYPE_IN_RM[data.propertyType]
        ?.replace(/\(|\)/g, '')
        ?.toLowerCase() || data.propertyType?.toLowerCase());
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
      this.loadingMessageSection = false;
      if (!this.isScrolledDown()) this.showScrollToBottomButton = true;
    }
  }

  getFiles(): void {
    this.conversationService.actionLinkList
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((al) => {
        if (Array.isArray(al)) {
          this.actionLinkList = al.map((item) => {
            const actionInfo = this.getActionLinkInfo(item.actionLink.topicId);
            item.actionLink.color = actionInfo.color;
            item.actionLink.svg = actionInfo.svg;
            return item;
          });
        }
      });
    this.filesService.fileList
      .pipe(takeUntil(this.unsubscribe))
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
    console.log(event);
    if (event.item) {
      this.fileService.dragDropFile.next(event);
    }
  }

  checkConversationCanDragDrop(
    conversationStatus: string,
    inviteStatus: string
  ): void {
    this.conversationService.checkConversationLock(
      conversationStatus === 'LOCKED' ||
        conversationStatus === 'RESOLVED' ||
        conversationStatus === 'ARCHIVE'
    );
  }

  removeOneItemFromList(list: any[], index: number): void {
    list.splice(index, 1);
  }

  public closeModal(status) {
    if (status && this.checkIsAgentJoined()) {
      this.apiService
        .postAPI(conversations, 'agent-join-to-conversation', {
          conversationId: this.currentConversation.id,
          propertyId: this.currentProperty.id
        })
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res: IMessage) => {
          this.listofmessages = this.listofmessages.concat([res]);
          if (res.messageType === this.messagesType.agentJoin) {
            this.currentConversation.status = 'OPEN';
            this.conversationService.changeConversationLock.next(false);
            // this.assignDataForNewListConv(res);
            this.setMsgAfterJoin(res.status, res.messageType);
          }
          this.addCurrentUserToParticipantList();
          this.isShowConfirmCallModal = true;
        });
    }
    this.isModalDialogVisible = false;
    this.statusModalMessage = false;
  }

  handleRemoveScratchTicket(conversation: UserConversation) {
    if (!conversation?.['isScratchTicket'] || /draft/gi.test(this.router.url)) {
      return;
    }
    this.messageConversationIdSetService.delete(conversation?.id);
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

  setComposeType(conversation) {
    if (
      this.activatedRoute.snapshot.queryParams['appMessageCreateType'] !==
      EAppMessageCreateType.NewAppMessage
    ) {
      if (
        !conversation?.isScratchDraft &&
        (conversation?.messageCount || conversation?.scheduleMessageCount)
      ) {
        this.composeType = ComposeEditorType.REPLY;
      } else {
        if (conversation?.isScratchDraft) {
          this.composeType = ComposeEditorType.NEW;
        }
      }
    }
  }
  firstEmitConversation = false;
  onPairwiseConversation() {
    this.conversationService.currentConversation
      .pipe(
        tap((res) => {
          if (!this.firstEmitConversation && res) {
            this.setComposeType(res);
            this.firstEmitConversation = true;
          }
        }),
        pairwise(),
        takeUntil(this.unsubscribe)
      )
      .subscribe(([previousValue, current]) => {
        if (previousValue?.id !== current?.id) {
          this.handleRemoveScratchTicket(previousValue);
        }
        current && this.setComposeType(current);
      });
  }

  ngOnDestroy() {
    if (this.scrollDownSubscription) {
      this.scrollDownSubscription.unsubscribe();
    }
    this.handleRemoveScratchTicket(this.currentConversation);
    this.appMessageListService.setPreFillCreateNewMessage(null);
    this.ngZone.run(() => {
      this.store.dispatch(
        conversationPageActions.exitPage({ id: this.currentConversationId })
      );
    });
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.fileService.dragDropFile.next(null);
    this.chatGptService.reset();
    this.trudiSendMsgService.setListFilesReiFormEmpty();
    // TODO:
    // this.conversationService.currentConversation.next(null);
    // this.conversationService.currentConversationId.next(null);
    this.routineInspectionService.triggerSyncRoutineInSpection(null);
    this.appMessageLoadingService.setCreateMessageLoading(null);
    clearTimeout(this.timeOutOfBoxHeight);
    clearTimeout(this.timeOutOfFocus);
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
    this.isDisabledJoinButton = false;
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
    this.currentConversationStatus =
      this.conversationService.getConversationType(
        status,
        this.statusOfCurrentConversation?.inviteStatus,
        this.currentConversation?.crmStatus,
        this.currentConversation?.secondaryEmail
      );
    this.getChatSectionHeight(this.currentConversationStatus);
    this.checkConversationCanDragDrop(
      this.currentConversation.status,
      this.currentConversation.inviteStatus
    );
    // if agent hasn't joined, socket will not be sent -> update message manually

    if (
      canAddMessageToHistory &&
      this.queryParams['status'] !== TaskStatusType.draft &&
      this.queryParams['tab'] !== TaskStatusType.draft
    ) {
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

  setMsgAfterJoin(conversationStatus: string, messageStatus?: string) {
    this.conversationService.joinConversation.next({
      conversationId: this.currentConversation.id,
      conversationStatus,
      messageStatus
    });
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
    this.boxChat.nativeElement.style.background = '#fff';

    if (this.scrollBottomTimeOut) {
      clearTimeout(this.scrollBottomTimeOut);
    }

    this.scrollBottomTimeOut = setTimeout(() => {
      if (this.scrollDown) {
        const messages =
          this.scrollDown.nativeElement.querySelectorAll('.message');
        const lastMessage =
          messages.length > 0 ? messages[messages.length - 1] : null;
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

  changeOnFocus(): void {
    this.textAreaZone = this.elr?.nativeElement.querySelector(
      'textarea#app-chat-textarea'
    );
    this.textAreaZone && this.textAreaZone.focus();
  }

  clearChat() {
    this.currentMessage = '';
    this.isTyping = false;
  }

  uniqueArrayMessage(array: IMessage[]) {
    if (!array?.length) return [];
    const newArr = array.reduce((acc, item) => {
      if (this.listTempId.has(item.id)) {
        // handle case socket send before API new message response success
        item.id = this.listTempId.get(item.id);
      }
      if (
        !acc[item.id] ||
        (acc[item.id]?.isTemp && !item['isTemp']) ||
        (item.messageCall?.endedAt && !acc[item.id].messageCall?.endedAt)
      ) {
        acc[item.id] = item;
      }
      return acc;
    }, {});
    return Object.values(newArr);
  }

  private checkRedLineMessage() {
    this.inboxService.changeUnreadData$
      .pipe(takeUntil(this.unsubscribe))
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
    messageId: string = null,
    callback: () => void = null,
    direction?: 'up' | 'down'
  ) {
    if (this.checkReturnApiHistory(before, after) && !messageId) return;
    if (!!direction) {
      if (direction === 'up') {
        this.isFetchingOlderMessages = true;
      } else {
        this.isFetchingNewerMessages = true;
      }
    }
    this.isLoadingHistoryConversation = true;
    // this.handleResetBtnSendOption();
    if (this.getHistoryOfConversationV2Sub) {
      this.getHistoryOfConversationV2Sub.unsubscribe();
    }
    this.getHistoryOfConversationV2Sub = this.conversationService
      .getHistoryOfConversationV2(
        conversationId,
        !!after,
        before,
        after,
        !before || this.isViewMostRecent,
        false,
        messageId
      )
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged(),
        finalize(() => {
          if (!!direction) {
            if (direction === 'up') {
              this.isFetchingOlderMessages = false;
            } else {
              this.isFetchingNewerMessages = false;
            }
          }
          if (!isUpdate) {
            this.loadingMessageSection = false;
            this.loadingService.stopLoading();
            this.messageTaskLoadingService.stopLoading();
            this.messageLoadingService.setLoading(false);
            this.isFetchingOlderMessages = false;
          }
        })
      )
      .subscribe({
        next: (res) => {
          // change conversation not handle when after history get done
          if (conversationId !== this.currentConversationId) {
            this.isLoadingHistoryConversation = false;
            return;
          }
          this.isFirstJoined = !res.hasPMJoin;
          if (res && res.list.length) {
            this.totalPages = res.totalPages;
            if (this.historyOffset > 0) {
              const listofmessagesTemp = this.listofmessages;
              res.list.forEach((element, key) => {
                listofmessagesTemp.splice(key, 0, element);
              });
              this.listofmessages = listofmessagesTemp;
            } else {
              const sortedData = [];
              this.statusOfCurrentConversation = res.list[0] as IMessage;
              this.currentConversationStatus =
                this.conversationService.getConversationType(
                  this.statusOfCurrentConversation?.status,
                  this.statusOfCurrentConversation?.inviteStatus,
                  this.currentConversation?.crmStatus,
                  this.currentConversation?.secondaryEmail
                );
              this.getChatSectionHeight(this.currentConversationStatus);
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
            }
          } else if (res.list) {
            if (before) this.isBeforeUpdated = true;
            if (after) this.isAfterUpdated = true;
          }
          if (isUpdate) {
            this.maintainScrollPosition();
          }
          this.mapMessageProperties();
          this.detectEnableCallBtn();
          if (this.isFirstLoadRedLineNewEl === null)
            this.isFirstLoadRedLineNewEl = true;

          this.isLoadingHistoryConversation = false;
          if (callback) {
            callback();
          }
          if (
            !this.hasTrudiAssignee &&
            this.listofmessages.some((msg) => msg.userId === trudiUserId)
          ) {
            this.currentTask.assignToAgents.unshift(trudiAgent);
            this.taskService.currentTask$.next(this.currentTask);
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingMessageSection = false;
          this.loadingService.stopLoading();
          this.isLoadingHistoryConversation = false;
        }
      });
  }

  mapHistoryChatMessage(message: IMessage): void {
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
          takeUntil(this.unsubscribe),
          distinctUntilChanged(),
          finalize(() => {
            if (
              this.loadingChangeStatus ||
              !isUpdate ||
              !this.shouldSkipRender
            ) {
              this.loadingMessageSection = false;
              this.loadingChangeStatus = false;
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
            this.onGetConversation(
              res,
              isUpdate,
              this.shouldSkipRender,
              setNewMessagesCb
            );
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
            this.loadingMessageSection = false;
            this.loadingService.stopLoading();
            this.messageTaskLoadingService.stopLoading();
          }
        });
    } else {
      this.loadingMessageSection = false;
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
      this.showTinyEditor =
        conversations.list[0]?.status !== EConversationType.resolved;
      this.statusOfCurrentConversation = conversations.list[0] as IMessage;
      this.currentConversationStatus =
        this.conversationService.getConversationType(
          this.statusOfCurrentConversation?.status,
          this.statusOfCurrentConversation?.inviteStatus,
          this.currentConversation?.crmStatus,
          this.currentConversation?.secondaryEmail
        );
      this.getChatSectionHeight(this.currentConversationStatus);
      this.totalPages = conversations.totalPages;
      if (this.historyOffset > 0) {
        const listofmessagesTemp = this.listofmessages;
        conversations.list.forEach((element, key) => {
          listofmessagesTemp.splice(key, 0, element);
        });
        this.listofmessages = listofmessagesTemp;
      } else {
        this.checkInviteDeactive();
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
            this.listofmessages = [
              ...conversationList,
              ...listMessageFromCache
            ].filter((mess: any) => mess.id !== this.startedCallMessage?.id);
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
    }

    this.mapMessageProperties(isSkipRender);
    this.detectEnableCallBtn();

    this.startedCallMessage = this.listofmessages.find(
      (item) =>
        item.messageType === this.messagesType.call &&
        !item.messageCall?.endedAt
    );
    if (this.startedCallMessage) {
      this.isProgressCall = true;
    }

    if (conversations.userLastCalls) {
      const lastMessageCall = conversations.userLastCalls.find(
        (item) => !item.endedAt
      );
      if (lastMessageCall) {
        this.lastCall = lastMessageCall;
        this.isProgressCall = true;
      } else {
        this.isProgressCall = false;
      }
    }

    // Sharing Data message-detail-component
    this.messageService.callButtonData.next({
      ...this.callButtonData,
      isProgressCall: this.isProgressCall
    });

    if (this.taskService.hasRescheduleRequest$.getValue()) {
      this.taskService.hasRescheduleRequest$.next(false);
      return;
    }
  }

  markReadNotiDesktop() {
    this.firebaseService.notificationId$
      .pipe(takeUntil(this.unsubscribe))
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
      .pipe(takeUntil(this.unsubscribe))
      .subscribe();
    this.notificationService.removeNotiFromUnseenList(this.notificationId);
    this.notificationService
      .getListNotification(0, null)
      .pipe(takeUntil(this.unsubscribe))
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
      if (
        curr.bulkMessageId &&
        !this.checkCallTranscriptType(curr.file) &&
        parentMess?.isSendFromEmail
      ) {
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
    e && (this.showSendActionLink = false);
  }
  getChatSectionHeight(currentConversationStatus: EConversationType) {
    switch (currentConversationStatus) {
      case this.conversationType.locked:
        break;
      case this.conversationType.open:
        break;
      case this.conversationType.nonApp:
      case this.conversationType.resolved:
        break;
      default:
        break;
    }
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

  openFromAppChat() {
    this.titleSelecPeople = null;
    this.showOwnerTenantAndSupplier = null;
    this.isOnlyOwnerTenant = null;
    this.isOnlySupplier = null;
    this.selectedMode = null;
    this.buttonAction = null;
    this.isShowFromFile = false;
  }

  changeTextForwardLandlordSendMessage(list) {
    const { decisionIndex } = this.conversationTrudiRespone?.data[0] || {};
    this.buttonAction = this.conversationTrudiRespone?.data[0]?.body?.decisions[
      decisionIndex
    ]?.button.find(
      (button) =>
        (this.selectedMode && button.action === this.selectedMode) ||
        (!this.selectedMode &&
          button.action === ForwardButtonAction.sendQuoteLandlord) ||
        (!this.selectedMode &&
          button.action === ForwardButtonAction.sendInvoicePT)
    );
    this.messageSendQuote = this.buttonAction?.textForward;
    if (this.messageSendQuote) {
      if (list.length > 1) {
        this.messageSendQuote = this.messageSendQuote
          .trim()
          .replace('@landlordFirstName', '{receiver name}');
        this.messageSendQuote = this.messageSendQuote
          .trim()
          .replace('@receiverName', '{receiver name}');
      }
      if (list.length === 1) {
        const landlordName = `${
          list[0].firstName ? list[0].firstName + ' ' : ''
        }${list[0].lastName}`;
        this.messageSendQuote = this.messageSendQuote
          .trim()
          .replace('@landlordFirstName', landlordName);
        this.messageSendQuote = this.messageSendQuote
          .trim()
          .replace('@receiverName', landlordName);
      }
      this.messageSendQuote = this.messageSendQuote
        .split('@numberOfQuote')
        .join('quote');
      this.messageSendQuote = this.messageSendQuote.replace(
        '@numberOfSupplier',
        this.currentConversation.lastName
      );
      this.messageSendQuote = this.messageSendQuote.replace(
        '{maintenance_object}',
        this.conversationTrudiRespone?.data[0].taskDetail.variable?.[
          '{maintenance_object}'
        ] || ''
      );
      this.messageSendQuote = this.messageSendQuote.replace(
        '{maintenance_summary}',
        this.conversationTrudiRespone?.data[0].taskDetail.variable?.[
          '{maintenance_summary}'
        ] || ''
      );
    }
  }

  changeTextForwardSendMessage() {
    let listUser = this.selectedUsersFromPopup;
    const landlordName =
      listUser?.length > 1 ? '' : listUser[0]?.firstName || '';
    this.messageSendQuote = this.messageSendQuote
      .trim()
      .replace('@landlordFirstName', landlordName);
    this.messageSendQuote = this.messageSendQuote
      .split('@numberOfQuote')
      .join('quote');
    this.messageSendQuote = this.messageSendQuote.replace(
      '@numberOfSupplier',
      this.currentConversation.lastName
    );
  }

  manageCarouselState(event) {
    this.viewSyncFile = false;
    if (event.state) {
      this.filesService
        .getFileListInConversation(this.currentConversation.id)
        .pipe(takeUntil(this.unsubscribe))
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
                  this.fileService.getFileExtensionWithoutDot(
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
              this.isShowCarousel = event.state;
              this.isCarousel = event.state;
            }
          }
        });
    } else {
      this.isShowCarousel = event.state;
      this.isCarousel = event.state;
      this.initialIndex = null;
    }
  }

  resetFile(): void {
    this.fileList = [];
    this.actionLinkList = [];
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
    if (this.popupState.addReiFormOutside) {
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

  ConversationCategory() {
    this.fullCategoryList =
      JSON.parse(localStorage.getItem('listCategoryTypes')) || [];
    if (this.fullCategoryList) {
      this.listofConversationCategory = this.fullCategoryList;
    }
  }

  updateMessagesList(res) {
    if (!res.type) {
      return;
    }
    if (!this.currentConversation?.id) {
      return;
    }
    if (res.conversationId !== this.currentConversation?.id) {
      return;
    }
    this.trudiScheduledMsgService
      .jobRemindersCount(res.conversationId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe();
    this.maintainRequest(res.conversationId, true);
    this.loadingMessageSection = false;
    this.loadingService.stopLoading();
    this.messageTaskLoadingService.stopLoading();
  }

  showSelectPeople(status: boolean, message) {
    if (this.selectedTicket) this.fileSelected = {};
    this.isSendEmail = false;
    if (status) {
      this.setStateTrudiSendMsg();
      this.titleSelecPeople = 'Select People';
      if (
        message &&
        message.options &&
        this.selectedMode !== ForwardButtonAction.sendQuoteLandlord
      ) {
        this.fileSelected = { ...message };
        this.selectedTicket = {
          options: {
            ...message.options,
            userId: message.options.userId || this.currentConversation.userId,
            firstName:
              message.options.firstName || this.currentConversation.firstName,
            lastName:
              message.options.lastName || this.currentConversation.lastName,
            isPrimary:
              message.options.isPrimary || this.currentConversation.isPrimary,
            propertyType:
              message.options.propertyType ||
              this.currentConversation.propertyType,
            createdAt: message.options.createdAt || message.createdAt,
            propertyAddress:
              message.options.propertyAddress || this.currentProperty.streetline
          },
          fileIds: [],
          ticketFile: message.ticketFile
        };
        if (message.ticketFile && message.ticketFile.length) {
          message.ticketFile.forEach((ele) => {
            this.selectedTicket.fileIds.push(ele.fileId);
          });
        }
      }
      this.isShowSendMessageModal = false;
      this.resetFieldInSendMessage();
    } else {
      this.openFromAppChat();
      this.isShowSelectPeopleModal = false;
      this.selectedUsersFromPopup = [];
      this.selectedTicket = {};
      this.listFileForward = [];
      this.openFrom = SEND_MESSAGE_POPUP_OPEN_FROM.appChat;
      this.resetFieldInSendMessage();
      if (this.isCarousel) this.isShowCarousel = true;
    }
  }

  openForwardMessageModal(data: { file: FileMessage; type: string }) {
    this.setStateTrudiSendMsg(data?.file);
  }

  getSelectedUser(event) {
    this.selectedUsersFromPopup = event;
    if (this.selectedMode === ForwardButtonAction.sendQuoteLandlord) {
      this.changeTextForwardLandlordSendMessage(this.selectedUsersFromPopup);
    }
    if (
      !this.selectedMode ||
      this.selectedMode === ForwardButtonAction.sendQuoteLandlord ||
      this.selectedMode === ForwardButtonAction.sendInvoicePT
    ) {
      this.changeTextForwardLandlordSendMessage(event);
    }
    const users: UserPropInSelectPeople[] = event;
    const type = users.map((user) =>
      this.userService.getStatusInvite(
        user.inviteSent,
        user.lastActivity,
        user.offBoarded,
        user.trudiUserId
      )
    );
    this.popupService.selectPeople$.next(
      type.includes(EUserInviteStatusType.active)
    );
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

  showQuitConfirm(status: boolean) {
    if (status) {
      this.isShowSendMessageModal = false;
      this.isShowSelectPeopleModal = false;
      this.isShowAddFilesModal = false;
      this.isShowQuitConfirmModal = true;
      this.selectedFiles = [];
    } else {
      this.isShowQuitConfirmModal = false;
      this.listFileForward = [];
      this.selectedFiles = [];
      this.openFrom = SEND_MESSAGE_POPUP_OPEN_FROM.appChat;
      this.agentUserService.setIsCloseAllModal(true);
      this.closeSendMessageModalAndResetCount();
      this.openFromAppChat();
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

  onForwardBtn(title: string) {
    this.titleSelecPeople = title;
    this.isOnlyOwnerTenant = false;
    this.isOnlySupplier = false;
    this.showOwnerTenantAndSupplier = true;
    this.showTextForward = true;
    this.noSendMessageBackBtn = false;
  }

  handleShowTrudiSendMsg(event) {
    this.setStateTrudiSendMsg(this.fileSelected?.file);
    this.inboxToolbarService.setInboxItem([]);
    this.isShowCarousel = false;
  }

  showSelectLandLord(status: boolean) {
    if (status) {
      this.isShowSelectPeopleModal = true;
    }
    this.isShowSendMessageModal = false;
  }

  resetFieldInSendMessage() {
    this.selectedFiles = [];
    this.isResetModal = true;
  }

  closeSendMessageModalAndResetCount() {
    this.isShowSendMessageModal = false;
    this.openFrom = SEND_MESSAGE_POPUP_OPEN_FROM.appChat;
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.isShowTrudiSendMsg = false;
        this.toastCustomService.handleShowToastMessSend(event);
        !this.isTaskType &&
          this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE);
        break;
      default:
        break;
    }
  }

  handleFileEmit(file) {
    this.selectedTicket = null;
    this.fileSelected = file;
    this.selectedFiles = [];
    this.isForward = file.file.isForward;
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

  showAppSendMessage(status: PopupState) {
    this.isResetModal = status.resetField;
    this.isResetFile = this.popupService.isResetFile$.getValue();
    if (status.resetField) {
      if (
        ![
          ForwardButtonAction.sendQuoteLandlord,
          ForwardButtonAction.sendInvoicePT
        ].includes(this.buttonAction?.action as ForwardButtonAction)
      ) {
        this.resetFieldInSendMessage();
      }
    }
    if (status.display) {
      this.isShowSendMessageModal = true;
      this.isResetModal = status.resetField;
      this.userService.getUserInfo();
      this.isShowQuitConfirmModal = false;
      this.isShowSelectPeopleModal = false;
      this.isShowAddFilesModal = false;
      if (
        this.selectedMode === ForwardButtonAction.sendQuoteLandlord ||
        this.selectedMode === ForwardButtonAction.sendInvoicePT
      ) {
        this.changeTextForwardLandlordSendMessage(this.selectedUsersFromPopup);
      }
      if (
        (!this.isResetFile || status.fileTabNotReset) &&
        !this.selectedFiles.some((el) => el.id === this.fileSelected.id) &&
        this.fileSelected &&
        this.fileSelected.file
      ) {
        const { messageType } = this.fileSelected;
        const {
          createdAt,
          fileType,
          id,
          isUserUpload,
          mediaLink,
          name,
          size,
          thumbMediaLink
        } = this.fileSelected.file;
        if (messageType === EMessageType.file) {
          const newFiles = {
            createdAt,
            fileType,
            icon: fileType?.icon,
            id,
            isUserUpload,
            mediaLink,
            name,
            size,
            thumbMediaLink
          };
          this.selectedFiles.push(newFiles);
        } else {
          this.selectedFiles = [];
        }
      }
    } else {
      this.resetFieldInSendMessage();
      this.closeSendMessageModalAndResetCount();
    }

    if (
      [
        ForwardButtonAction.sendQuoteLandlord,
        ForwardButtonAction.sendInvoicePT
      ].includes(this.buttonAction?.action as ForwardButtonAction)
    ) {
      this.listFileForward.forEach((file) => {
        this.getSelectedFile(Array.isArray(file) ? file : [file]);
      });
      this.changeTextForwardSendMessage();
    }
  }

  showAddFiles(status: boolean) {
    if (status) {
      this.isResetModal = false;
      this.isShowAddFilesModal = true;
      this.isShowSendMessageModal = false;
      this.isShowQuitConfirmModal = false;
    } else {
      this.isShowAddFilesModal = false;
      this.closeSendMessageModalAndResetCount();
    }
  }

  async handleGetSelectedTask(file) {
    const currentTask = this.taskService.currentTask$.getValue();
    const extraConfigs = {
      'header.title': this.isTaskType
        ? currentTask?.property?.streetline || 'No property'
        : null,
      'header.hideSelectProperty': this.isTaskType
    };
    if (file) {
      extraConfigs['header.title'] = file.propertyStreetline || null;
      extraConfigs['header.isPrefillProperty'] = true;
      extraConfigs['header.hideSelectProperty'] = !file.isTemporaryProperty;
      extraConfigs['otherConfigs.conversationPropertyId'] =
        file.propertyId || null;
      if (file.isForward) {
        extraConfigs['header.title'] =
          this.isTaskType && !currentTask?.property?.isTemporary
            ? currentTask?.property?.streetline
            : '';
        extraConfigs['body.prefillTitle'] =
          'Fwd: ' + (this.currentConversation?.categoryName || '');
        extraConfigs['header.hideSelectProperty'] = this.isTaskType
          ? !currentTask?.property?.isTemporary
          : false;
        extraConfigs['otherConfigs.conversationPropertyId'] = this.isTaskType
          ? this.currentConversation?.propertyId
          : null;
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
      'inputs.openFrom': !this.isTaskType ? TaskType.MESSAGE : '',
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
      'inputs.openFrom': file ? TaskType.SEND_FILES : '',
      'header.isPrefillProperty': true,
      'header.title': '',
      'inputs.isForwardDocument': file?.isForward,
      'inputs.isAppMessage': false,
      'otherConfigs.isCreateMessageType': !this.isTaskType,
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
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs.type === ESendMessageModalOutput.MessageSent) {
          this.onSendMsg(rs.data);
        }
      });
  }

  detectEnableCallBtn(callTooltipType?: {
    voice: ECallTooltipType;
    video: ECallTooltipType;
  }) {
    if (
      this.currentConversation?.crmStatus === 'ACTIVE' &&
      this.currentConversation?.secondaryEmail
    ) {
      this.enableCallBtn.videoCall = false;
      this.enableCallBtn.voiceCall = false;
    } else {
      const enableCall =
        this.currentConversation?.inviteStatus === UserStatus.ACTIVE &&
        this.checkEnableCallBtn();
      this.enableCallBtn.videoCall = enableCall;
      this.enableCallBtn.voiceCall = enableCall;
    }

    this.setCallTooltipType(callTooltipType);

    // Sharing Data message-detail-component
    this.messageService.callButtonData.next({
      ...this.callButtonData,
      enableCallBtn: this.enableCallBtn,
      callBtnTooltip: this.callBtnTooltip,
      showVideoCallBtn: this.showVideoCallBtn,
      callTooltipType: callTooltipType || this.callButtonData.callTooltipType
    });
  }

  setCallTooltipType(callTooltipType: {
    voice: ECallTooltipType;
    video: ECallTooltipType;
  }) {
    const voiceTooltipType = callTooltipType
      ? callTooltipType?.voice
      : this.callButtonData?.callTooltipType?.voice;
    const videoTooltipType = callTooltipType
      ? callTooltipType?.video
      : this.callButtonData?.callTooltipType?.video;

    if (!voiceTooltipType && !videoTooltipType) return;

    if (voiceTooltipType) {
      this.enableCallBtn.voiceCall = !voiceTooltipType
        ? this.enableCallBtn.voiceCall
        : !voiceTooltipType;
      this.callBtnTooltip = this.enableCallBtn.voiceCall
        ? ''
        : this.callBtnTooltip;
    }

    if (videoTooltipType) {
      this.enableCallBtn.videoCall = !videoTooltipType
        ? this.enableCallBtn.videoCall
        : !videoTooltipType;
    }
  }

  checkEnableCallBtn(): boolean {
    return (
      this.currentConversation?.status !== this.messagesType.solved &&
      !this.currentTaskDeleted
    );
  }

  checkGetCallFromSocketSend(data) {
    return (
      data &&
      this.currentConversation &&
      !data.sendType &&
      data.messageType === this.messagesType?.call
    );
  }

  checkGetCallFromSocketCall(data) {
    if (!data || !this.currentConversation) return false;

    const { sendType, receiverId, userId: socketUserId } = data;
    const { userId: conversationUserId, participants } =
      this.currentConversation;

    return !!(
      !sendType &&
      ([receiverId, socketUserId].includes(conversationUserId) ||
        socketUserId === conversationUserId ||
        participants?.some((user) =>
          [receiverId, socketUserId].includes(user?.userId)
        ))
    );
  }

  checkCallTranscriptType(file) {
    const callTranscripType = [
      ECallTranscript.CALL_TRANSCRIPT,
      ECallTranscript.CORRESPONDENCE_OWNER,
      ECallTranscript.CORRESPONDENCE_TENANT
    ];
    return (
      callTranscripType.includes(file?.documentType?.name) &&
      file?.name?.includes(ECallTranscript.CALL_TRANSCRIPT)
    );
  }

  handleAddSocketCallMessageToHistory(
    data: SocketSendData | SocketCallData,
    isStartCall = false
  ) {
    const socketData = data;
    socketData.userType = 'ADMIN';
    socketData.senderType = 'ADMIN';
    if (!Array.isArray(socketData.messageCall.participiants) || isStartCall) {
      socketData.callType = localStorage.getItem('CALL_TYPE');
      this.isProgressCall = true;
      this.startedCallMessage = socketData;
      socketData.messageType = this.messagesType.call;
      this.lastCall = {
        createdAt: socketData.messageCall.createdAt,
        endedAt: socketData.messageCall.endedAt,
        participiants: [],
        callTime: '',
        callToPhoneNumber: '',
        hadRecord: socketData.messageCall?.hadRecord
      };
    }

    const msgIdx = this.listofmessages.findIndex(
      (msg) =>
        msg.id === socketData.id &&
        socketData.id !== this.startedCallMessage?.id
    );
    if (
      msgIdx === -1 &&
      Array.isArray(socketData.messageCall.participiants) &&
      !isStartCall
    ) {
      this.listofmessages = this.listofmessages.concat([data] as any);
      this.groupMessage = this.appChatService.groupMessagesByDate(
        this.listofmessages
      );
      this.isProgressCall = false;
      this.lastCall = null;
      this.startedCallMessage = '';
      this.cdr.markForCheck();
      this.scrollToBottom();
    }

    // Sharing Data message-detail-component
    this.messageService.callButtonData.next({
      ...this.callButtonData,
      isProgressCall: this.isProgressCall
    });
  }

  private subscribeCallButtonData() {
    this.messageService.callButtonData
      .pipe(
        takeUntil(this.unsubscribe),
        filter((data) => Boolean(data))
      )
      .subscribe((data) => {
        this.callButtonData = data;
      });
  }

  handleEndCallWhenCloseTab() {
    this.broadcastHelperService
      .getMessage()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data: any) => {
        if ('close' === data.message) {
          this.onEndCall(data.body);
        }
      });
  }

  onEndCall(body: any) {
    this.apiService
      .postAPI(auth, 'end-call', body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe();
  }

  openSendMessageFromSendQuote(status: boolean) {
    if (!status) {
      this.isShowSendMessageModal = true;
      this.isShowSelectPeopleModal = false;
    }
  }

  checkInviteDeactive() {
    this.inviteDeactive = this.appChatService.getInviteDeactive(
      this.currentConversation,
      this.userInviteStatusType
    );
  }

  mapMessageProperties(isSkipRender = false) {
    if (!this.listofmessages) return;
    this.listofmessages = this.uniqueArrayMessage(this.listofmessages);
    this.listofmessages = this.listofmessages.filter(
      (one) =>
        !one.isDraft && one.messageType !== EMessageType.verifyChangeEmail
    );
    this.appChatService.mapMessageProperties(
      this.listofmessages,
      this.currentConversation,
      this.listofTicketCategory,
      this.listofConversationCategory
    );
    this.lastMessagesTypeText = findLastItemMsgTypeTextOrTicket(
      this.listofmessages
    );
    this.updateStatusLastMsgTypeTextOrTicket(
      this.listofmessages,
      this.lastMessagesTypeText
    );

    if (!this.hasRescheduledRequest.value) {
      this.hasRescheduledRequest.next(
        this.listofmessages?.some(
          (message) =>
            message?.options?.type === EOptionType.RESCHEDULE_REQUEST &&
            message?.options?.status === EScheduledStatus.PENDING
        )
      );
    }
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
          this.loadingReplyViaApp = false;
        }
      }
      if (!this.groupMessage?.length) {
        this.allMessageRender = true;
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
    this.listofmessages = this.listofmessages.map((message) => {
      if (
        !message.options ||
        message.options.response?.type !== ERequestType.RESCHEDULE_INSPECTION
      ) {
        return message;
      }
      if (event.messageId === message.id) {
        return {
          ...message,
          options: {
            ...message.options,
            status: event.status
          }
        };
      }
      return message;
    });
    this.groupMessage = this.appChatService.groupMessagesByDate(
      this.listofmessages
    );
    this.cdr.markForCheck();
    if (event.cancelAIGenerate) return;
    this.chatGptService.reset();
    this.chatGptService.enableGenerate.next(true);
    this.chatGptService.onGenerate.next({
      enable: true,
      skipValidate: false,
      show: true,
      messageId: event.messageId
    });
  }

  closeModalScheduleMsg() {
    this.isShowTrudiScheduledMsg = false;
  }

  handleCloseImageDetail() {
    this.isImageDetail = false;
    this.imageDetailUrl = '';
  }

  subscribeChangeParticipants() {
    this.conversationService
      .getParticipantChanged()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((newParticipant) => {
        if (!newParticipant) return;
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
      .pipe(takeUntil(this.unsubscribe))
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
      const matchedMessage = this.listofmessages.find(
        (msg) => msg.id === messageId
      );
      const listMessages = matchedMessage
        ? [matchedMessage]
        : this.listofmessages;
      const data = await lastValueFrom(
        this.chatGptService.generateReply(
          listMessages,
          this.companyService.currentCompanyId() || '',
          show,
          isTellAIToGenerate,
          messageId,
          this.currentConversation?.lastSessionId
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
        takeUntil(this.unsubscribe),
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
    this.listAction$.pipe(takeUntil(this.unsubscribe)).subscribe({
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
    return this.appMessageApiService
      .getActionDetail(currentConversationId, this.currentMailBoxId, companyId)
      .pipe(
        tap((rs) => {
          if (!rs) return;
          this.store.dispatch(
            conversationActions.setActionDetail({
              id: this.conversationId,
              actionDetail: rs
            })
          );
        })
      );
  }

  handleItemRendered() {
    // TODO:
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

  private getPTWidgetRoutineInspection() {
    this.widgetPTService
      .getPTWidgetStateByType<InspectionSyncData[]>(
        PTWidgetDataField.ROUTINE_INSPECTION
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.listRoutineInspection = data;
      });
  }

  private subscribeRoutineInspection() {
    this.routineInspectionService.triggerSyncRoutineInSpection$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res === ESyncStatus.COMPLETED) {
          this.taskService.reloadTrudiResponseReschedule.next(true);
          this.taskService.reloadTaskArea$.next(true);
          this.taskService.reloadTaskDetail.next(true);
        }
      });
  }

  handleOnSendMsg(event: IAppTriggerSendMsgEvent) {
    if (event.sendOption === SendOption.SendResolve) {
      this.conversationService.openConversation(null, null);
      this.currentConversation = {};
      this.currentConversationId = null;
      return;
    }

    if (
      this.queryParams['appMessageCreateType'] ===
        EAppMessageCreateType.NewAppMessage ||
      this.queryParams['appMessageCreateType'] ===
        EAppMessageCreateType.NewAppMessageDone
    ) {
      if (event.event === ESentMsgEvent.SENDING) {
        this.tempConversationId = event.tempConversationId;
        if (!this.isRecipientAlreadyHasConversation) {
          this.conversationService.setLoadingNewMsg(
            event.tempConversationId,
            new Date().toISOString(),
            true
          );
          this.conversationService.pushTempConversation(
            this.tempConversationId,
            'APP_MESSAGE_DETAIL_LIST'
          );
        }

        let navigatePath = [];
        let queryParams = {
          fromScratch: true,
          appMessageCreateType: EAppMessageCreateType.NewAppMessageDone
        };
        if (this.helper.isInboxDetail) {
          const taskId =
            event.data['emailMessage']?.taskId || event?.['data']?.['taskId'];
          navigatePath = ['/dashboard', 'inbox', 'detail', taskId];
          queryParams['pendingSelectFirst'] = true;
        }
        this.router.navigate(navigatePath, {
          queryParams,
          queryParamsHandling: 'merge'
        });
      }

      if (event.type === ISendMsgType.SCHEDULE_MSG) {
        this.handleResonseSchedule(event);
        return;
      }
    }

    switch (event.event) {
      case ESentMsgEvent.SENDING:
        if (event.type === ISendMsgType.SCHEDULE_MSG) return;
        this.handleSending(event);
        break;
      case ESentMsgEvent.SUCCESS:
        if (this.isTaskType) this.taskService.reloadTaskDetail.next(true);
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
          if (this.router?.url.includes('inbox/app-messages/resolved')) {
            this.router.navigate(['dashboard/inbox/app-messages', 'all'], {
              queryParams: {
                status: TaskStatusType.inprogress,
                conversationId: this.currentConversation.id
              },
              queryParamsHandling: 'merge'
            });
            this.toastrService.success('App message reopened');
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
            this.toastrService.success('App message reopened');
          }
        }
        break;
      case ESentMsgEvent.ERR:
        this.handleSendError(event);
        break;
    }
  }

  handleResonseSchedule(event: IAppTriggerSendMsgEvent) {
    const isInboxDetail = this.helper.isInboxDetail;
    const taskId = event?.['data']?.['jobReminders']?.[0]?.['taskId'];
    if (
      event.event !== ESentMsgEvent.SUCCESS &&
      event.event !== ESentMsgEvent.ERR
    ) {
      return;
    }
    this.conversationService.removeLoadingNewMsg(event.tempConversationId);
    this.conversationService.filterTempConversations(
      (item) => item.id !== event.tempConversationId,
      'SCHEDULE_MSG_SUCCESS'
    );
    if (taskId) {
      this.conversationService.pushTempConversation(
        taskId,
        'SCHEDULE_MSG_SUCCESS'
      );
      if (isInboxDetail) {
        this.router.navigate(['/dashboard', 'inbox', 'detail', taskId], {
          queryParams: {
            tempConversationId: taskId
          },
          queryParamsHandling: 'merge'
        });
      }
    } else {
      this.loadingCreateScratch = false;
      this.router.navigate([], {
        queryParams: {
          fromScratch: false,
          appMessageCreateType: EAppMessageCreateType.NewAppMessage
        },
        queryParamsHandling: 'merge'
      });
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
      this.dynamicStyle.chatContainer.marginTop = 86;
    }

    const { tempIds } = event;
    tempIds?.forEach((id) => {
      const message = this.listofmessages.find((msg) => msg.id === id);
      if (!message) return;
      message.isSending = false;
      message.isError = true;
    });
  }

  getCountJobsReminder(conversationId: string) {
    return this.trudiScheduledMsgService
      .jobRemindersCount(conversationId)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe();
  }

  handleSendNowMessage(selectedScheduledMsg: ITrudiScheduledMsgInfo) {
    this.trudiScheduledMsgService.setPopupState({
      sendNowMessage: false,
      scheduledMessage: false
    });
    const { id, taskId, conversationId } = selectedScheduledMsg;
    this.trudiScheduledMsgService
      .sendNowMsg(id, this.currentMailBoxId)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap(() => {
          this.getCountJobsReminder(conversationId);
          return this.trudiScheduledMsgService.getListScheduledMsg(
            taskId,
            conversationId
          );
        })
      )
      .subscribe({
        complete: () => {},
        error: () => {
          this.trudiScheduledMsgService.setPopupState({
            sendNowMessage: false,
            scheduledMessage: true
          });
        }
      });
  }

  onTriggerEventScheduleSendNow() {
    this.trudiScheduledMsgService.triggerEventSendNow
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (!data?.['id']) return;
        const scheduleMsg =
          this.trudiScheduledMsgService.listScheduledMsg.value?.find(
            (item) => item.id === data['id']
          );
        if (!scheduleMsg?.data) return;
        const {
          conversationTitle,
          message,
          propertyId,
          userId,
          options,
          files,
          messageContact,
          recipients
        } = scheduleMsg.data;
        const event = {
          propertyId: propertyId,
          emailMessage: {
            tempIds: [scheduleMsg.id],
            tempId: scheduleMsg.id,
            title: conversationTitle,
            content: message,
            userId,
            recipients,
            files,
            reiFormIds: [],
            taskId: scheduleMsg.taskId,
            conversationId: scheduleMsg.conversationId,
            contacts: options.contacts,
            calendarEventIds: [],
            isSendFromEmail: false,
            replyToMessageId: null,
            isDraft: false,
            isFromDraftFolder: false,
            stepTask: {},
            conversationType: 'APP',
            messageContact
          }
        };
        this.handleSending({
          data: event
        } as any);
        this.handleSendNowMessage(scheduleMsg);
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

  triggerCurrentConversation(value) {
    this.currentConversation = { ...this.currentConversation, ...value };
    this.currentTask = {
      ...this.currentTask,
      conversations: [this.currentConversation]
    };
  }

  private subscribeSocketPmJoinConverstation() {
    // Note: handle PM Join Conversation of message
    this.websocketService.onSocketPmJoinConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        const { isPmJoined, conversationId, userId } = res;
        if (
          conversationId === this.currentConversation.id &&
          this.currentUser.id === userId &&
          isPmJoined
        ) {
          this.isUserVerified = true;
          this.isDisabledJoinButton = false;
        }
      });
  }

  handleJoinConversation() {
    if (this.isDisabledJoinButton) return;
    this.isDisabledJoinButton = true;
    this.conversationService
      .pmJoinConversation(this.currentConversation.id)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (response) => {},
        error: (error) => {
          this.toastCustomService.handleShowToastAddItemToTask(
            'Failed to join conversation'
          );
          this.isDisabledJoinButton = false;
        }
      });
  }
}
