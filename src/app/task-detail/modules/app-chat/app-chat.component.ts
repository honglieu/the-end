import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Self,
  ViewChild
} from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import dayjs from 'dayjs';
import { isEqual } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  combineLatest,
  debounceTime,
  delay,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  finalize,
  fromEvent,
  map,
  switchMap,
  takeUntil,
  tap,
  throttleTime
} from 'rxjs';
import { EAddOn } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import {
  IListDynamic,
  PT_LIST_DYNAMIC_PARAMETERS,
  RM_LIST_DYNAMIC_PARAMETERS
} from '@/app/dashboard/modules/task-editor/constants/dynamic-parameter.constant';
import {
  ECRMState,
  EDynamicType
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { USER_TYPE_IN_RM } from '@/app/dashboard/utils/constants';
import { ApiService } from '@services/api.service';
import { BroadcastHelperService } from '@services/broadcast-helper.service';
import { ChatGptService } from '@services/chatGpt.service';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  CONVERSATION_STATUS,
  DEBOUNCE_SOCKET_TIME,
  DEFAULT_TEXT_MESS_HEIGHT,
  FILE_VALID_TYPE,
  MAX_TEXT_MESS_LENGTH,
  PHONE_PREFIXES,
  READONLY_FILE,
  SEND_MESSAGE_POPUP_OPEN_FROM,
  SHORT_ISO_DATE,
  SUPPORTED_FILE_CAROUSEL,
  SYNC_PT_FAIL,
  SYNC_PT_SUCCESSFULLY,
  listCalendarTypeDot,
  listVideoTypeDot,
  trudiUserId
} from '@services/constants';
import { ConversationService } from '@services/conversation.service';
import { DragDropFilesService } from '@services/drag-drop.service';
import { FilesService } from '@services/files.service';
import { FirebaseService } from '@services/firebase.service';
import {
  EStatusMessage,
  DeliveryFailedMessageStorageService
} from '@services/deliveryFailedMessageStorage.service';
import { HeaderService } from '@services/header.service';
import { LoadingService } from '@services/loading.service';
import { MaintenanceRequestService } from '@services/maintenance-request.service';
import { CallButtonState, MessageService } from '@services/message.service';
import { ASSIGN_TO_MESSAGE } from '@services/messages.constants';
import { NotificationService } from '@services/notification.service';
import { PermissionService } from '@services/permission.service';
import { PopupService, PopupState } from '@services/popup.service';
import { PropertiesService } from '@services/properties.service';
import { ReiFormService } from '@services/rei-form.service';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { SendMessageService } from '@services/send-message.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import {
  sendOptionLabel,
  sendOptionType
} from '@shared/components/tiny-editor/send-option-control/send-option-control.component';
import { SendOption } from '@shared/components/tiny-editor/tiny-editor.component';
import { TrudiAddContactCardService } from '@shared/components/trudi-add-contact-card/services/trudi-add-contact-card.service';
import { DestroyDecorator } from '@shared/decorators/destroy.decorator';
import { EConfirmContactType } from '@shared/enum/contact-type';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import {
  ECallTooltipType,
  ECreatedFrom,
  EMessageComeFromType,
  EMessageType
} from '@shared/enum/messageType.enum';
import { EOptionType } from '@shared/enum/optionType.enum';
import { CallTypeEnum } from '@shared/enum/share.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  EUserPropertyType,
  UserStatus,
  UserTypeEnum
} from '@shared/enum/user.enum';
import { EUserInviteStatusType } from '@shared/enum/userType.enum';
import {
  displayName,
  findLastItemMsgTypeTextOrTicket,
  getActionLinkImgSrc
} from '@shared/feature/function.feature';
import { TrudiTitleCasePipe } from '@shared/pipes/title-case.pipe';
import {
  ActionLinkProp,
  CategoryUser,
  TransferActionLinkProp
} from '@shared/types/action-link.interface';
import {
  LastUser,
  PreviewConversation,
  UserConversation
} from '@shared/types/conversation.interface';
import { FileCarousel, IFile } from '@shared/types/file.interface';
import {
  ECallTranscript,
  FileMessage,
  IMessage,
  IPeopleFromViaEmail,
  EScheduledStatus
} from '@shared/types/message.interface';
import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import { CallType, ConversionStatusType } from '@shared/types/share.model';
import {
  MessageCallSocketSendData,
  SocketCallData,
  SocketSendData,
  SyncPropertyDocumentStatus
} from '@shared/types/socket.interface';
import { Property } from '@shared/types/property.interface';
import { TrudiButton } from '@shared/types/trudi.interface';
import { UnhappyStatus } from '@shared/types/unhappy-path.interface';
import { AgentFileProp } from '@shared/types/user-file.interface';
import {
  IUserParticipant,
  UserPropInSelectPeople
} from '@shared/types/user.interface';
import { TrudiScheduledMsgService } from '@/app/trudi-scheduled-msg/services/trudi-scheduled-msg.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import {
  ESentMsgEvent,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { auth, conversations } from 'src/environments/environment';
import { MessageLoadingService } from '@/app/task-detail/services/message-loading.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { ViewConversationComponent } from './components/view-conversation/view-conversation.component';
import { EViewDetailMode } from '@/app/task-detail/enums/task-detail.enum';
import { animate, style, transition, trigger } from '@angular/animations';
import { EMessageMenuOption } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { MessageTaskLoadingService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-task-loading.service';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { SyncAttachmentType } from '@shared/enum/inbox.enum';
import { SharedMessageViewService } from '@services/shared-message-view.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { mapEmailMetadata } from './components/button-action/utils/functions';
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
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { SocketType } from '@shared/enum';
import { InboxToolbarService } from '@/app/dashboard/modules/inbox/services/inbox-toolbar.service';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import {
  EMessageDetailProperty,
  MessageDetailPipe
} from '@/app/dashboard/modules/inbox/modules/app-message-list/pipes/message-detail.pipe';

const videoPattern = new RegExp(listVideoTypeDot.join('|'), 'gi');

import uuid4 from 'uuid4';
import { ERouterHiddenSidebar } from '@/app/dashboard/shared/types/sidebar.interface';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';

enum MessageType {
  text = 'text',
  url = 'url'
}

enum EBehaviorScroll {
  SMOOTH = 'smooth',
  AUTO = 'auto'
}

@DestroyDecorator
@Component({
  selector: 'app-chat',
  templateUrl: './app-chat.component.html',
  styleUrls: ['./app-chat.component.scss'],
  providers: [
    TrudiSendMsgFormService,
    TrudiSendMsgService,
    LoadingService,
    ChatGptService,
    DeliveryFailedMessageStorageService,
    MessageDetailPipe
  ],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('100ms ease-in', style({ transform: 'translateX(0%)' }))
      ]),
      transition(':leave', [
        animate('100ms ease-out', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class AppChatComponent
  implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit
{
  @Input() taskDetailViewMode: EViewDetailMode = EViewDetailMode.TASK;
  @ViewChild('scrollDown', { static: false }) private scrollDown: ElementRef;
  @ViewChild('redLineNew', { static: false }) private redLineNew: ElementRef;
  @ViewChild('boxChat') private boxChat: ElementRef<HTMLDivElement>;
  @ViewChild('textareaContainer') textareaContainer: ElementRef<HTMLDivElement>;
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
  @ViewChild('messageEmailDetail')
  messageEmailDetail: ElementRef;
  textAreaZone: HTMLTextAreaElement;
  textAreaContainerZone: HTMLDivElement;
  private overlayRef: OverlayRef;
  private isShowViewConversation: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  readonly MAX_TEXT_MESS_LENGTH = MAX_TEXT_MESS_LENGTH;
  public EOptionType = EOptionType;
  public showSendInvoicePt = false;

  private _currentProperty: Property;
  public lastReadMessageIndex: number = -1;

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

  public messageType = MessageType;
  public messagesType = EMessageType;
  public userInviteStatusType = EUserInviteStatusType;
  public userPropertyType = EUserPropertyType;
  public conversationType = EConversationType;

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

  private _currentConversation: UserConversation;

  public get currentConversation() {
    return this._currentConversation;
  }

  public set currentConversation(value) {
    this._currentConversation = value;
    if (value) {
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
  public typeLoadingTask = false;
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
  private totalPagesOfConversationWithTrudi: number;
  private pageIndex = 0;
  private countDownTypeNothing;
  public isDisplayTypingBlock = false;
  private timeTypeNothing = 120;
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
  public listConversationForwardLandlord = [];
  public isResetModal = false;
  public isBackSendQuote = false;
  public maintenanceFromAppChat = {
    isForward: false,
    sendQuote: false
  };
  public listFileForward = [];
  public openFrom = SEND_MESSAGE_POPUP_OPEN_FROM.appChat;
  public showTextForward = false;
  public fileTypeQuote: string;
  public cacheBodyRequest = [];
  eConfirmContactType = EConfirmContactType;
  actionLinkList: TransferActionLinkProp[] = [];
  fileList: AgentFileProp[] = [];
  fullCategoryList: CategoryUser[] = [];
  typeOfCall: CallType;
  timeOutOfFocus: NodeJS.Timeout = null;
  scrollBottomTimeOut: NodeJS.Timeout = null;
  scrollRedlineTimeOut: NodeJS.Timeout = null;
  scrollToUnreadMessageTimeOut: NodeJS.Timeout = null;
  timeOutOfBoxHeight: NodeJS.Timeout = null;

  chatSectionHeight = '100%';
  isShowInternalNote = false;
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
  public typeFormViaEmail: IPeopleFromViaEmail['type'] = 'SEND_LANDLORD';
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
  private listOfFiles: FileMessage[];
  public defaultText: string = '';
  public isShowTrudiSendMsg: boolean = false;
  public isShowTrudiScheduledMsg: boolean = false;
  public isDisconnected: boolean = false;
  public contentText: string = '';
  public showFileType: boolean = false;
  public EMessageComeFromType = EMessageComeFromType;
  public filterArrayMsg = [
    EMessageType.solved,
    EMessageType.agentJoin,
    EMessageType.file,
    EMessageType.buttons,
    EMessageType.url,
    EMessageType.ticket
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
    'otherConfigs.createMessageFrom': ECreateMessageFrom.SCRATCH,
    'inputs.rawMsg': '',
    'inputs.openFrom': '',
    'inputs.listOfFiles': [],
    'inputs.selectedTasksForPrefill': null,
    'inputs.isForwardDocument': false,
    'otherConfigs.isSendForward': false,
    'otherConfigs.isShowGreetingContent': false
  };
  attachmentTextEditorConfigs = {
    'footer.buttons.showBackBtn': false
  };
  public scheduledDate: string;
  public conversationStatus = CONVERSATION_STATUS;
  public currentAgencyId: string;
  public activeMobileApp: boolean = true;
  public paragraph: object = { rows: 0 };
  public isImageDetail = false;
  public imageDetailUrl = '';
  public listRoutineInspection: InspectionSyncData[] = [];
  private hasRescheduledRequest = new BehaviorSubject(false);
  public currentCompany: ICompany;
  private triggerTypingSubject = new Subject<boolean>();
  public isArchiveMailbox: boolean;
  public isDisconnectMailbox: boolean;
  private sendingMessages = [];
  private getConversationSubscriber: Subscription;
  private callButtonData: CallButtonState;
  private currentMailBoxId: string;
  private trudiInfo = {
    firstName: 'Trudi',
    status: 'status',
    isUserPropetyTree: false,
    lastName: '',
    googleAvatar: 'assets/icon/trudi-logo.svg',
    id: trudiUserId,
    type: 'trudi'
  };
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
  currentUserId: string;
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
  public shouldSkipRender: boolean;
  public currentTask: TaskItem;
  public typeShowAppMsg = false;
  public isHasNewMessage: boolean;
  readonly EConversationType = EConversationType;
  public maxWidthMessageSummary = 0;
  public expandMessage = false;
  public isMessageText: boolean = false;
  private resizeObserver: ResizeObserver;
  public heightMessageEmailDetail: number = 0;
  public isLoadingSummary = false;
  public isExpandMessageSummary = false;
  // use to forced refresh message list
  // TODO: find a better way to handle this
  private markedForRefresh: boolean = true;
  public hiddenLinkedTask = ERouterHiddenSidebar;
  public showLinkedTask: boolean = false;
  private tabChange: boolean = false;
  private countSocketSend: number = 0;
  private eventChangeTab: (e: Event) => void;
  private eventChangeListenerBound: boolean = false;

  get scrollDownContainerEl() {
    return this.scrollDown?.nativeElement;
  }

  get createdTimeOfLastMsg(): string {
    if (!this.listofmessages.length) return null;
    const fileList = this.listofmessages[this.listofmessages.length - 1]?.files;
    const dateMessage =
      this.listofmessages[this.listofmessages.length - 1].createdAt;
    let dateFile;
    let dateCreated = dateMessage;
    if (fileList) {
      const listFileOfMessage = [
        ...(fileList['fileList'] || []),
        ...(fileList['mediaList'] || []),
        ...(fileList['unSupportedList'] || [])
      ];
      dateFile = listFileOfMessage.sort(this.compareDates)?.[
        listFileOfMessage.length - 1
      ]?.createdAt;
    }
    if (dateFile) {
      dateCreated =
        new Date(dateMessage).getTime() > new Date(dateFile).getTime()
          ? dateMessage
          : dateFile;
    }
    return this.formatDateString(dateCreated) as string;
  }

  get createdTimeOfFirstMsg(): string {
    if (!this.listofmessages.length) return null;
    return this.formatDateString(this.listofmessages[0].createdAt) as string;
  }

  get isHasScroll() {
    return (
      this.scrollDownContainerEl?.scrollHeight >
      this.scrollDownContainerEl?.clientHeight
    );
  }

  private readonly _currentConversationId$ = new Subject<string>();

  public readonly visibleSkeletonLoading$ = combineLatest([
    this.loadingService.isLoading$,
    this.messageTaskLoadingService.isLoading$,
    this.messageTaskLoadingService.isLoadingMessage$
  ]).pipe(map((loadings) => loadings.some((loading) => loading)));

  private setupLoadingMessageSummary(): void {
    this.conversationSummaryService.loadingMessageSummary$
      .pipe(
        takeUntil(this.unsubscribe),
        tap((isLoadingSummary) => {
          this.isLoadingSummary = isLoadingSummary;
          this.cdr.markForCheck();
        })
      )
      .subscribe();
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
    private maintenanceService: MaintenanceRequestService,
    private sendMessageService: SendMessageService,
    private fileService: FilesService,
    private chatGptService: ChatGptService,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSendMsgService: TrudiSendMsgService,
    private agencyDashboardService: AgencyDashboardService,
    private trudiScheduledMsgService: TrudiScheduledMsgService,
    public router: Router,
    private reiFormService: ReiFormService,
    private widgetPTService: WidgetPTService,
    private routineInspectionService: RoutineInspectionService,
    private overlay: Overlay,
    public inboxService: InboxService,
    private messageLoadingService: MessageLoadingService,
    private permissionService: PermissionService,
    private agencyDateFormatService: AgencyDateFormatService,
    private uploadFromCRMService: UploadFromCRMService,
    private trudiAddContactCardService: TrudiAddContactCardService,
    private deliveryFailedMessageStorageService: DeliveryFailedMessageStorageService,
    private trudiDynamicParameterService: TrudiDynamicParameterService,
    private cdr: ChangeDetectorRef,
    private titleCasePipe: TrudiTitleCasePipe,
    private messageDetailPipe: MessageDetailPipe,
    public messageTaskLoadingService: MessageTaskLoadingService,
    private phoneNumberFormatPipe: PhoneNumberFormatPipe,
    private toastCustomService: ToastCustomService,
    private sharedMessageViewService: SharedMessageViewService,
    private companyService: CompanyService,
    private inboxToolbarService: InboxToolbarService,
    private store: Store,
    private messageFlowService: MessageFlowService,
    private ngZone: NgZone,
    private activeRoute: ActivatedRoute,
    private conversationSummaryService: ConverationSummaryService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    const headerInfoElement = document.querySelector('.chat') as HTMLDivElement;
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
      this.cdr.markForCheck();
    }, 0);
  }

  private formatDateString(inputDate: string) {
    const parsedDate = dayjs(inputDate);
    const offsetInMinutes = parsedDate.utcOffset();
    const utcDate = parsedDate.subtract(offsetInMinutes, 'minute');
    const formattedDate = utcDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    return formattedDate;
  }

  checkHasNewMessage() {
    if (!this.listofmessages.length) {
      this.isHasNewMessage = false;
      return false;
    }
    this.isHasNewMessage = this.listofmessages.some(
      (item, index) => item.isLastReadMessage && this.listofmessages[index + 1]
    );
    return this.isHasNewMessage;
  }

  private checkScroll(): void {
    const conversationHeaderHeight =
      document.querySelector('#app-chat-header').clientHeight;

    const timeStamps = document.querySelectorAll('.wrap-order-day');
    const distanceConversationToHeader = 53;
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

  private onEventScrollDown() {
    fromEvent(this.scrollDownContainerEl, 'scroll')
      .pipe(takeUntil(this.unsubscribe), debounceTime(200))
      .subscribe((event: EventListener) => {
        this.checkScroll();
        if (this.isScrolledDown()) {
          this.loadHistory(
            this.currentConversation.id,
            null,
            null,
            this.createdTimeOfLastMsg
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

  ngAfterViewChecked() {
    if (
      this.scrollDownContainerEl &&
      this.isFirstLoadScrollDownContainerEl &&
      this.isHasScroll &&
      this.listofmessages.length
    ) {
      if (!this.checkHasNewMessage()) {
        if (this.listofmessages.some((message) => message.isMarkUnRead)) {
          this.scrollToUnreadMessage();
        } else {
          this.scrollToBottom(EBehaviorScroll.AUTO);
        }
      } else {
        this.scrollRedLineNewToView();
        if (this.showScrollToBottomButton === null)
          this.showScrollToBottomButton = !this.isScrolledDown();
      }
      this.onEventScrollDown();
      this.isFirstLoadScrollDownContainerEl = false;
    }

    if (this.isFirstLoadRedLineNewEl && this.isHasScroll) {
      if (!this.checkHasNewMessage() && !this.redLineNew?.nativeElement) {
        if (this.listofmessages.some((message) => message.isMarkUnRead)) {
          this.scrollToUnreadMessage();
        } else {
          this.scrollToBottom(EBehaviorScroll.AUTO);
        }
      } else {
        this.scrollRedLineNewToView();
      }

      this.isFirstLoadRedLineNewEl = false;
    }
  }

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === this.messageEmailDetail.nativeElement) {
          this.heightMessageEmailDetail = entry.target?.clientHeight;
        }
      }
    });

    if (this.messageEmailDetail?.nativeElement) {
      this.resizeObserver.observe(this.messageEmailDetail.nativeElement);
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

  subscribeReloadHistory() {
    this.taskService.triggerReloadHistoryAfterSync
      .pipe(takeUntil(this.unsubscribe), throttleTime(300))
      .subscribe((res) => {
        if (!res.status || !res.threadIds.includes(this.threadId)) return;
        this.reloadGetMessages();
      });
  }

  subscribeStore() {
    this.store
      .select(selectCurrentConversationId)
      .pipe(
        filter((conversation) => !!conversation),
        distinctUntilChanged(),
        tap((id) => this.resetHistory(id)),
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
          console.debug(
            'conversation history',
            this.currentConversationId,
            state
          );

          if (state?.groupMessage) {
            this._groupMessage = state?.groupMessage;
          }

          if (state?.entities) {
            this._listofmessages = selectAllConversationMessagesInternal(state);
            this.lastMessagesTypeText = findLastItemMsgTypeTextOrTicket(
              this.listofmessages
            );
            this._groupMessage = this.groupMessagesByDate(this.listofmessages);
          }

          if (state?.currentConversation) {
            this._currentConversation = state?.currentConversation;
          }

          if (
            state?.currentProperty &&
            state?.currentProperty?.id ===
              state?.currentConversation?.propertyId
          ) {
            this._currentProperty = state?.currentProperty;
          }

          if (this.groupMessage?.length) {
            this.loadingService.stopLoading();
            this.messageTaskLoadingService.stopFullLoading();
            this.messageLoadingService.setLoading(false);
          }
        },
        error: (err) => console.error(err)
      });
  }

  subscribeDeleteDraft() {
    this.websocketService.onSocketDeleteDraft
      .pipe(delay(500), takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (this.currentConversationId === res.conversationId) {
          this.listofmessages = this.listofmessages.filter(
            (item) => item.id !== res.draftMessageId
          );
          for (const group of this.groupMessage) {
            group.messages = group?.messages?.filter(
              (message) => message.id !== res.draftMessageId
            );
          }
        }
      });
  }

  ngOnInit() {
    this.setupLoadingMessageSummary();
    this.subscribeStore();
    this.isConsole = this.sharedService.isConsoleUsers();
    this.taskService
      .getHeaderLeftHeight()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((headerLeftHeight) => {
        this.headerLeftHeight = headerLeftHeight;
      });

    this.taskService.triggerOpenMessageDetail
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.resetHistory(this.currentConversation?.id);
      });

    this.subscribeSyncAttachmentEvent();

    this.conversationService.currentConversation
      .pipe(
        takeUntil(this.unsubscribe),
        map((conversation) => conversation?.id),
        filter(Boolean),
        distinctUntilChanged()
      )
      .subscribe((conversationId) => {
        this._currentConversationId$.next(conversationId);
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

    this.typeLoadingTask =
      this.router.url.includes('type=TASK') ||
      this.router.url.includes('/inbox/detail');

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(filter((mailBoxId) => !!mailBoxId))
      .subscribe((mailBoxId) => {
        this.currentMailBoxId = mailBoxId;
      });
    this.subscribeTriggerTyping();
    this.subscribeActiveMobileApp();
    this.subscribeWebSocketSyncPT();
    this.handleEndCallWhenCloseTab();
    this.ConversationCategory();
    this.buildSendMessageForm();
    this.subscribeCallButtonData();
    this.subscribeEventChangeHeightIframe();
    this.subscribeReloadHistory();
    this.subscribeChangeParticipants();
    this.subscribeSocketDeleteSecondaryEmail();
    this.subscribeDeleteDraft();

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

    this.maintenanceService.maintenanceRequestResponse
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.conversationTrudiRespone = res;
          if (this.conversationTrudiRespone?.data[0]?.decisionIndex === 0) {
            const listButton =
              this.conversationTrudiRespone?.data[0]?.body?.decisions[0]?.button.filter(
                (res) =>
                  [
                    ForwardButtonAction.sendInvoicePT,
                    ForwardButtonAction.sendQuoteLandlord
                  ].includes(res?.action)
              );
            this.forwardButtons = listButton;
            this.buttonAction = listButton?.find(
              (button) =>
                button.action === ForwardButtonAction.sendQuoteLandlord
            );
            this.messageSendQuote = this.buttonAction?.textForward;
          }
        }
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

    this.conversationService.messagesSentViaEmail$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: IMessage[]) => {
        if (
          res?.find((v) => v.conversationId === this.currentConversation?.id)
        ) {
          res.forEach((element, idx) => {
            this.mapHistoryChatMessage(element);
          });
          res = this.groupMessageViaEmail(res?.reverse()).filter(
            (x) => !this.listofmessages.find((l) => l.id === x.id)
          );
          const temp = [...this.listofmessages, ...res?.reverse()];
          this.statusOfCurrentConversation = temp[temp.length - 1];
          if (
            this.statusOfCurrentConversation.status ===
              CONVERSATION_STATUS.RESOLVED ||
            this.statusOfCurrentConversation.status ===
              CONVERSATION_STATUS.SOLVED
          ) {
            const user = (this.statusOfCurrentConversation as any).user;
            this.currentConversation = {
              ...this.currentConversation,
              lastUser: { ...user, avatar: user.avatar || user.googleAvatar },
              status: this.statusOfCurrentConversation.status
            };
            this.currentConversationStatus = EConversationType.resolved;
          }
          this.listofmessages = temp;

          this.getChatSectionHeight(this.currentConversationStatus);
          this.mapMessageProperties();
          if (!this.isFirstLoadRedLineNewEl) this.scrollToBottom();
        }
      });
    this.propertyService.newCurrentProperty
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.clearChat();
          this.currentProperty = res;
        } else {
          this.currentProperty = null;
        }
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
            element.message = this.parseMessageToObject(element.message);
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
    this.onDisplayTyping();
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
    this.conversationService.reOpenConversation
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (this.currentConversationStatus === this.conversationType.resolved) {
          this.changeConversationStatus(res);
        }
      });
    this.subscribeViewDetailFile();

    this.websocketService.onSocketSend
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
      )
      .subscribe((data) => {
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
          if (this.checkGetCallFromSocketCall(data)) {
            this.handleAddSocketCallMessageToHistory(data);
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
          if (this.checkGetCallFromSocketCall(data)) {
            this.handleAddSocketCallMessageToHistory(data);
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
          if (
            data &&
            data.propertyId === this.currentConversation.propertyId &&
            data.conversationId === this.currentConversation.id
          ) {
            this.listofmessages = this.listofmessages.map((msg) =>
              msg.isRead ? msg : { ...msg, isRead: true }
            );
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
    this.subscribeSocketMessageViaEmail();
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

    this.messageService
      .getImageDetail()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        this.openImageDetail(value);
      });
    this.checkToShowRedLineMessage();
    this.scrollToElementItem();
    this.triggerExpandMessageSummary();

    combineLatest([this.taskService.currentTask$, this.activeRoute.queryParams])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: ([res, queryParams]) => {
          if (res && queryParams?.['conversationId']) {
            const messageHasLinked = this.currentTask?.conversations?.some(
              (conversation) =>
                conversation?.id === queryParams?.['conversationId'] &&
                !!conversation?.linkedTask
            );
            const taskType = this.currentTask?.taskType;
            this.showLinkedTask =
              (taskType === TaskType.MESSAGE && messageHasLinked) ||
              taskType === TaskType.TASK;
          }
        }
      });
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

  triggerExpandMessageSummary() {
    this.conversationSummaryService.triggerExpandConversationSummary$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.isExpandMessageSummary = res;
      });
  }

  scrollToElement(
    position: number,
    block: ScrollLogicalPosition = 'center',
    inline: ScrollLogicalPosition = 'nearest'
  ): void {
    this.scrollBottomTimeOut = setTimeout(() => {
      const messages =
        this.scrollDown.nativeElement.querySelectorAll('.message');
      const targetElement = messages[position];

      if (!targetElement) {
        return;
      }
      targetElement.scrollIntoView({
        block,
        inline,
        behavior: 'smooth'
      });
    }, 200);
  }

  scrollToElementItem() {
    this.conversationSummaryService.triggerMessageSummary$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        const messageIdList = this.listofmessages.map((item) => item.id);
        if (messageIdList.includes(value?.messageId)) {
          const messageIndex = this.listofmessages?.findIndex(
            (item) => item.id === value?.messageId
          );
          this.scrollToElement(messageIndex, 'start');
          this.conversationSummaryService.triggerSummaryCollapseMessage$.next(
            value
          );
        } else {
          this.loadHistory(
            this.currentConversation.id,
            true,
            this.createdTimeOfFirstMsg,
            null,
            value
          );
        }
      });
  }

  handleAddSocketCallMessageToHistory(data: SocketSendData | SocketCallData) {
    const socketData = data;
    socketData.userType = 'ADMIN';
    socketData.senderType = 'ADMIN';
    if (!Array.isArray(socketData.messageCall.participiants)) {
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
      (msg) => msg.id === socketData.id
    );
    if (msgIdx === -1 && Array.isArray(socketData.messageCall.participiants)) {
      this.listofmessages = this.listofmessages.concat([data] as any);
      this.groupMessage = this.groupMessagesByDate(this.listofmessages);
      this.isProgressCall = false;
      this.lastCall = null;
      this.startedCallMessage = '';
      this.scrollToBottom();
    }

    // Sharing Data message-detail-component
    this.messageService.callButtonData.next({
      ...this.callButtonData,
      isProgressCall: this.isProgressCall
    });
  }

  subscribeSyncAttachmentEvent() {
    // outlook gmail
    this.taskService.triggerSyncAttachment
      .pipe(
        takeUntil(this.unsubscribe),
        throttleTime(300),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr))
      )
      .subscribe((threadIds) => {
        if (!threadIds?.includes(this.threadId)) return;
        this.conversationService.syncAttachment({
          mailBoxId: this.currentMailBoxId,
          threadIds: [this.threadId],
          type: SyncAttachmentType.PORTAL_FOLDER
        });
      });
  }

  resetHistory(key?: string) {
    if (key === this.clearHistoryKey) {
      return;
    }
    this.loadingService.onLoading();
    this.messageLoadingService.setLoading(true);
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
    this.sendingMessages = [];
    this.clearHistoryKey = key;
    this.isFirstLoadHistory = true;
    this.conversationSummaryService.triggerSummaryCollapseMessage$.next(null);

    // if (this.taskDetailViewMode == EViewDetailMode.MESSAGE) {
    //   this._currentProperty = null;
    // }
  }

  reloadGetMessages() {
    this.conversationService
      .getHistoryOfConversationV2(
        this.currentConversation.id,
        true,
        dayjs.utc().toISOString(),
        null,
        null
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          if (!res.list?.length) return;
          const listMessageIdUpdate = this.listofmessages
            .filter((item) => !item.isSyncedAttachment)
            .map((item) => item.id);
          res.list = this.groupMessageViaEmail(res.list);
          let index = 0;
          let updatedMessages = [...this.listofmessages];
          for (const item of res.list) {
            let messageIndex = updatedMessages.findIndex(
              (m) => m.id === item.id
            );
            if (
              messageIndex !== -1 &&
              updatedMessages[messageIndex].isSyncedAttachment !=
                item.isSyncedAttachment
            ) {
              this.mapHistoryChatMessage(item);
              updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                ...item
              };
            }
            index++;
          }
          this.listofmessages = updatedMessages;
          this.mapMessageProperties();
          this.taskService.messageAttachmentUpdateIds.next(listMessageIdUpdate);
        }
      });
  }

  getListDynamicByCRM(crm) {
    let tempListParamByCRM = [];
    switch (crm) {
      case ECRMState.PROPERTY_TREE:
        tempListParamByCRM = PT_LIST_DYNAMIC_PARAMETERS;
        break;
      case ECRMState.RENT_MANAGER:
        tempListParamByCRM = RM_LIST_DYNAMIC_PARAMETERS;
        break;
      default:
        break;
    }
    return this.handleShowListDynamic(tempListParamByCRM);
  }

  handleShowListDynamic(tempListParamByCRM) {
    if (this.listDynamicFieldData?.length > 0) {
      let listTypes = this.listDynamicFieldData.map(
        (item) =>
          item.calendarEventType ||
          item.componentType ||
          item.communicationStepType
      );

      tempListParamByCRM.forEach((item) => {
        if (
          item.dynamicType ===
          (EDynamicType.COMMUNICATION_STEP ||
            EDynamicType.PT_COMPONENT ||
            EDynamicType.RM_COMPONENT ||
            EDynamicType.CALENDER_EVENT)
        ) {
          item.isDisplay =
            listTypes.includes(item.communicationStepType) ||
            listTypes.includes(item.componentType) ||
            listTypes.includes(item.communicationStepType);
        }
      });
    }
    return tempListParamByCRM.filter((p) => p.isDisplay);
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

  private subscribeCurrentConversation() {
    this.loadingService.onLoading();

    const currentConversation$ =
      this.conversationService.currentConversation.pipe(
        takeUntil(this.unsubscribe)
      );

    currentConversation$
      .pipe(
        tap(() => {
          this.isBeforeUpdated = false;
          this.isAfterUpdated = false;
        }),
        filter((conversation) => conversation?.id),
        distinctUntilKeyChanged('id')
      )
      .subscribe((conversation) => {
        this.resetHistory(conversation.id);
      });

    currentConversation$
      .pipe(
        filter((conversation) => conversation?.id),
        distinctUntilKeyChanged('id'),
        switchMap((conversation) => {
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
      this.markedForRefresh = false;
      this.threadId = res?.threadId;
      this.currentConversationId = res?.id;
      this.currentConversation = res;
      this.hasMessageFromApp =
        this.currentConversation?.inviteStatus === UserStatus.ACTIVE;

      setTimeout(() => {
        const headerInfoElement =
          document.querySelector<HTMLDivElement>('.chat');
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
      this.pageIndex = 0;
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
          this.isFirstJoined = true;
        }
      } else {
        this._listofmessages = [];
        this._groupMessage = [];
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

  private subscribeTriggerTyping() {
    this.triggerTypingSubject
      .pipe(takeUntil(this.unsubscribe), throttleTime(1000))
      .subscribe((status) => {
        this.sendTypingSocket(status);
      });
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
        this.currentUserId = id;
        const sender = {
          avatar: googleAvatar,
          id: id,
          index: 1,
          name: firstName + ' ' + lastName,
          title: title
        };
        const formDefaultValue = {
          selectedSender: sender,
          msgTitle: '',
          selectedReceivers: [],
          listOfFiles: [],
          attachMediaFiles: []
        };
        //No more inline message function so this call is commented
        //this.trudiSendMsgFormService.buildForm(formDefaultValue);

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

  subscribeWebSocketSyncPT() {
    this.websocketService.onSocketNotifySyncPropertyDocumentToPT
      .pipe(
        filter(
          (dataSync) =>
            dataSync?.companyId === this.companyService.currentCompanyId()
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((dataSync) => {
        const afterSync = () => {
          this.popupService.isResetFile$.next(true);
        };
        switch (dataSync?.status) {
          case SyncPropertyDocumentStatus.SUCCESS:
            this.showToast(SYNC_PT_SUCCESSFULLY, 'success');
            afterSync();
            break;
          case SyncPropertyDocumentStatus.FAILED:
            this.showToast(SYNC_PT_FAIL, 'error');
            afterSync();
            break;
        }
      });
  }

  showToast = (message: string, type: 'success' | 'error') => {
    if (typeof this.toastrService[type] == 'function') {
      this.toastrService[type](message);
    }
  };

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

  formatPhoneNumber(phone: string) {
    return this.phoneNumberFormatPipe.transform(phone).replace(/ /g, '');
  }

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

  subscribeSocketMessageViaEmail() {
    this.websocketService.onSocketMessageViaEmail
      .pipe(
        debounceTime(DEBOUNCE_SOCKET_TIME),
        distinctUntilChanged(),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        try {
          const conversation =
            this.conversationService.currentConversation.getValue() || {};
          const {
            conversationId,
            messageId,
            emailStatus,
            emailStatusChangeDate
          } = res || {};
          if (conversation.id !== conversationId) return;

          this.listofmessages = [...this.listofmessages].map((message) => {
            if (message.id === messageId) {
              message.emailStatus = emailStatus;
              message.emailStatusChangeDate = emailStatusChangeDate;
            }
            return message;
          });
        } catch (err) {
          console.log(err);
        }
      });
  }

  subscribeCurrentTask() {
    this.taskService.currentTask$.pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (res) => {
        if (res) {
          this.currentTask = res;
          this.isUnHappyPath = res.isUnHappyPath;
          this.unhappyStatus = res.unhappyStatus;
          this.currentTaskDeleted =
            this.taskService.checkIfCurrentTaskDeleted();
          this.isTaskType = res.taskType !== TaskType.MESSAGE;
          this.createNewConversationConfigs[
            'otherConfigs.isCreateMessageType'
          ] = !this.isTaskType;
          this.createNewConversationConfigs['footer.buttons.sendType'] = !this
            .isTaskType
            ? ISendMsgType.BULK_EVENT
            : '';
          this.createNewConversationConfigs['otherConfigs.createMessageFrom'] =
            this.isTaskType
              ? ECreateMessageFrom.TASK_HEADER
              : ECreateMessageFrom.SCRATCH;
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
      this.maintainRequest(data.id, data, isUpdate);
    } else {
      this.isAfterUpdated = false;
      this.isHideRedLineNew = false;
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
    this.fileService.dragDropFile.next(event);
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

  getCurrentRoleCanDrop(name: string, listRole: string[]): () => boolean {
    return () => listRole.includes(name);
  }

  checkRoleCanDropForUI() {
    this.disableDrop = this.listRole.includes(this.currentRoleDrop);
  }

  removeOneItemFromList(list: any[], index: number): void {
    list.splice(index, 1);
  }

  sendTypingSocket(status = true) {
    if (
      this.currentConversation &&
      this.conversationService.isTrudiControlConversation(
        this.currentConversation
      )
    ) {
      return;
    }
    const currentUserId = this.userService.selectedUser.value.id;
    const user = this.userService.selectedUser.getValue();
    const body = {
      propertyId: this.currentProperty?.id,
      createdAt: dayjs().format(),
      type: 'SEND',
      sendType: `typing ${status ? 'on' : 'off'}`,
      userType: 'AGENT',
      userId: currentUserId,
      firstName: user.firstName,
      lastName: user.lastName,
      googleAvatar: user.googleAvatar,
      isUserPropetyTree:
        !!this.userService.selectedUser.value?.userProperties?.length
    };
    this.conversationService
      .sendTyingSocketByCallingAPI(
        this.currentConversation.id,
        currentUserId,
        body
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe();
  }

  // TODO remove confirm dialog
  public showDialog() {
    if (this.checkIsAgentJoined()) {
      this.apiService
        .postAPI(conversations, 'agent-join-to-conversation', {
          conversationId: this.currentConversation.id,
          propertyId: this.currentProperty.id
        })
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res: IMessage) => {
          this.agentCallTime(res.createdAt);
          this.listofmessages = this.listofmessages.concat([res]);
          if (res.messageType === this.messagesType.agentJoin) {
            this.currentConversation.status = 'OPEN';
            this.conversationService.changeConversationLock.next(false);
            this.setMsgAfterJoin(res.status, res.messageType);
          }
          this.addCurrentUserToParticipantList();
        });
    }
  }

  public agentCallTime(time) {
    const startTime = new Date(
      this.listofmessages[this.listofmessages.length - 1].createdAt
    ).getTime();
    const propertyId = this.listofmessages[0].propertyId;
    const userId = this.listofmessages[0].userId;
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
          this.agentCallTime(res.createdAt);
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

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.ngZone.run(() => {
      this.store.dispatch(
        conversationPageActions.exitPage({ id: this.currentConversationId })
      );
    });
    this.deliveryFailedMessageStorageService.updateGuildBlockAction();
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.fileService.dragDropFile.next(null);
    this.chatGptService.reset();
    this.trudiSendMsgService.setListFilesReiFormEmpty();
    // TODO:
    // this.conversationService.currentConversation.next(null);
    // this.conversationService.currentConversationId.next(null);
    this.routineInspectionService.triggerSyncRoutineInSpection(null);
    this.conversationSummaryService.triggerSummaryCollapseMessage$.next(null);
    this.messageService.triggerUseMasterDB.next(false);
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
    this._currentConversationId$.complete();
    if (this.eventChangeTab) {
      window.document.removeEventListener(
        'visibilitychange',
        this.eventChangeTab,
        false
      );
      this.eventChangeListenerBound = false;
    }
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
    const isTaskType =
      this.taskService.currentTask$.value?.taskType === TaskType.TASK;
    if (isTaskType) {
      if (status === this.messagesType.reopened) {
        this.currentConversationStatus = this.conversationType.open;
        this.statusOfCurrentConversation.status = 'OPEN';

        this.conversationService
          .updateStatus(
            status,
            this.currentConversation.id,
            this.currentConversation.isSendViaEmail
          )
          .subscribe((response) => {
            this.loadingService.stopLoading();
            const user = response.user;
            this.currentConversationStatus =
              this.conversationService.getConversationType(
                EConversationType.reopened,
                this.statusOfCurrentConversation.inviteStatus,
                this.currentConversation?.crmStatus,
                this.currentConversation?.secondaryEmail
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
              this.conversationService.previousConversation$.next(
                this.currentConversation
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
        currentMailBoxId: this.currentMailBoxId
      });
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

  private scrollToUnreadMessage() {
    if (this.scrollToUnreadMessageTimeOut) {
      clearTimeout(this.scrollToUnreadMessageTimeOut);
    }

    const unreadMessages =
      this.scrollDown.nativeElement.querySelectorAll('.unread-message');

    this.scrollToUnreadMessageTimeOut = setTimeout(() => {
      unreadMessages[0].scrollIntoView({
        behavior: EBehaviorScroll.AUTO
      });
      this.showScrollToBottomButton = !this.isScrolledDown();
    }, 0);
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
    this.textAreaZone = this.elr.nativeElement.querySelector(
      'textarea#app-chat-textarea'
    );
    this.textAreaZone && this.textAreaZone.focus();
  }

  detectUserRole(
    userType: string,
    type: string,
    userId: string,
    isSendFromEmail?: boolean,
    messageType?: EMessageType
  ) {
    if (messageType === EMessageType.call) {
      return 'admin';
    }

    if (!userType || !userId || !type) {
      return '';
    }
    let role = '';
    if (
      this.userService.checkConsoleUserRole(userType.toLowerCase()) ||
      this.userService.checkConsoleUserRole(type.toLowerCase()) ||
      userType.toUpperCase() === UserTypeEnum.MAILBOX ||
      userId === localStorage.getItem('userId')
    ) {
      role = userId === trudiUserId ? 'trudi' : 'admin';
    } else {
      role =
        userType === 'trudi' && type === 'trudi' && userId === trudiUserId
          ? 'trudi'
          : 'user';
    }
    if (
      this.currentConversation?.isFrozen &&
      (this.currentConversation.lastUser?.id === trudiUserId ||
        this.currentConversation.status === 'RESOLVED')
    ) {
      role += ' non-app-user';
    }
    if (isSendFromEmail) {
      role += ' send-from-email';
    }
    return role;
  }

  private checkToShowRedLineMessage() {
    this.inboxService.changeUnreadData$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((changeUnreadData) => {
        const { currentMessageId, isMarkUnRead } = changeUnreadData || {};
        if (!currentMessageId || isMarkUnRead) return;
        const changedMessage = this.listofmessages.find(
          (message) => message.id === currentMessageId
        );
        if (
          !changedMessage ||
          changedMessage.originIndex < this.lastReadMessageIndex
        )
          return;

        this.isHideRedLineNew = true;
        this.cdr.markForCheck();
      });
  }

  clearChat() {
    this.currentMessage = '';
    this.isTyping = false;
  }

  uniqueArrayMessage(array: IMessage[]) {
    return Array.from(new Set(array.map((item) => item.id))).map((id) => {
      return array.find((item) => item.id === id);
    });
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
    value?
  ) {
    if (this.checkReturnApiHistory(before, after) && !value?.messageId) return;

    this.isLoadingHistoryConversation = true;
    // this.handleResetBtnSendOption();
    this.conversationService
      .getHistoryOfConversationV2(
        conversationId,
        !!after,
        before,
        after,
        !before || this.isViewMostRecent,
        false,
        value?.messageId
      )
      .pipe(
        takeUntil(this.unsubscribe),
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
                  this.statusOfCurrentConversation.status,
                  this.statusOfCurrentConversation.inviteStatus,
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
                this.listofmessages = this.uniqueArrayMessage([
                  ...this.listofmessages,
                  ...sortedData
                ]);
                this.scrollToBottom(EBehaviorScroll.SMOOTH);
              } else {
                this.listofmessages = [...sortedData, ...this.listofmessages];
              }
            }
          } else if (res.list) {
            if (before) this.isBeforeUpdated = true;
            if (after) this.isAfterUpdated = true;
            this.cdr?.markForCheck();
          }

          this.mapMessageProperties();
          this.detectEnableCallBtn();
          if (this.isFirstLoadRedLineNewEl === null)
            this.isFirstLoadRedLineNewEl = true;

          this.isLoadingHistoryConversation = false;
          if (value?.messageId) {
            const hasItem = res.list?.findIndex(
              (item) => item.id === value?.messageId
            );
            if (hasItem === -1) {
              this.toastrService.error('Can not find message!');
            } else {
              const messageIndex = this.listofmessages.findIndex(
                (item) => item.id === value?.messageId
              );
              this.scrollToElement(messageIndex, 'start');
              this.conversationSummaryService.triggerSummaryCollapseMessage$.next(
                value
              );
            }
          }
        },
        error: () => {
          this.loadingService.stopLoading();
          this.isLoadingHistoryConversation = false;
        }
      });
  }

  mapHistoryChatMessage(message: IMessage): void {
    if (
      message.messageType === EMessageType.agentJoin &&
      this.currentConversation?.createdFrom === ECreatedFrom.WEB &&
      this.currentConversation.isAppUser
    ) {
      message.messageType = EMessageType.agentStart;
    }
    if (message.message || (message.message === '' && message.isDraft)) {
      message.message = this.parseMessageToObject(message.message);
    }
  }

  maintainRequest(conversationId: string, conversation?, isUpdate?: boolean) {
    this.pageIndex = 0;
    if (!isUpdate) {
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
          _isViewMostRecent,
          this.messageService.triggerUseMasterDB.getValue()
        )
        .pipe(
          takeUntil(this.unsubscribe),
          takeUntil(this._currentConversationId$),
          distinctUntilChanged(),
          finalize(() => {
            if (!isUpdate && !this.shouldSkipRender) {
              this.loadingService.stopLoading();
              this.messageLoadingService.setLoading(false);
              this.getConversationSubscriber = null;
            }
            this.messageService.triggerUseMasterDB.next(false);
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
            const isFirstLoadHistory = !!this.isFirstLoadHistory;
            if (this.isFirstLoadHistory) {
              this.isFirstLoadHistory = false;
            }
            if (res.list.length < res.pageSize) {
              if (!this.checkHasNewMessage() && !this.isFirstReadMessage) {
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

  private onGetConversation(conversations, isUpdate, isSkipRender = false) {
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
        this.sendingMessages = this.removeSendingMessage(
          messages,
          this.sendingMessages
        );
        if (!this.listofmessages?.length) {
          const listMessageFromCache = this.isFirstLoadHistory
            ? []
            : this.listofmessages;
          this.listofmessages = [
            ...listMessageFromCache,
            ...messages,
            ...this.sendingMessages
          ];
          this.listofmessages = this.listofmessages.sort(this.compareDates);
          if (!this.isFirstLoadRedLineNewEl && !this.checkHasNewMessage()) {
            this.scrollToBottom();
          }
        }

        if (conversations.list.length) {
          let conversationList = conversations.list;
          const sendingMessage = this.listofmessages.find(
            (item) => item.isSending === true
          );
          if (sendingMessage) {
            conversationList = conversations.list.map((item) => {
              return { ...item, isSending: sendingMessage.id === item.id };
            });
          }

          const deliveryFail =
            this.deliveryFailedMessageStorageService.getDeliveryFailedMessage(
              this.currentConversation.id
            );
          const listMessageFromCache = this.isFirstLoadHistory
            ? []
            : this.listofmessages;

          this.listofmessages = this.uniqueArrayMessage([
            ...conversationList,
            ...listMessageFromCache,
            ...deliveryFail
          ]).filter((mess) => mess.id !== this.startedCallMessage?.id);

          if (deliveryFail.length === 0) {
            this.listofmessages = this.listofmessages.filter((i) => !i.isError);
          }

          this.conversationService.afterEachGetConversation(
            this.currentConversation.id,
            this.listofmessages
          );

          this.listofmessages = this.listofmessages.sort(this.compareDates);

          if (
            this.isHasScroll &&
            this.isScrolledDown() &&
            this.listofmessages.length &&
            !this.isFirstLoadRedLineNewEl
          )
            this.scrollToBottom();
        }
        this.mapDraftMessageToMessage();
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

  private removeSendingMessage(messages = [], sendingMessages = []) {
    const messageIdLookup: Record<string, boolean> = messages.reduce(
      (idMap, message) => {
        idMap[message.id] = true;
        return idMap;
      },
      {}
    );
    return JSON.parse(
      JSON.stringify(
        sendingMessages.filter((message) => !messageIdLookup[message.id])
      )
    );
  }

  private onGetCoversationWithTrudi(res: any) {
    this.isFirstJoined = !res.hasPMJoin;
    if (
      (this.currentConversation?.crmStatus,
      this.currentConversation && res.list)
    ) {
      this.totalPagesOfConversationWithTrudi = res?.totalPages || 0;
      this.listofmessagesWithTrudi = [];
      if (this.historyOffset > 0) {
        res.list.forEach((element, key) => {
          this.listofmessagesWithTrudi.splice(key, 0, element);
        });
      } else {
        res.list = this.groupMessageViaEmail(res.list);
        res.list
          .reverse()
          .filter((element) => this.filterMsg(element))
          .forEach((element, idx) => {
            this.mapHistoryChatMessage(element);
            this.listofmessagesWithTrudi.push({
              ...element,
              senderType: this.detectUserRole(
                element.userType,
                element.type,
                element.userId,
                element.isSendFromEmail,
                element?.messageType
              )
            });
          });
      }
    }
  }

  compareDates(a, b) {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }

  compareStatus(a, b) {
    return Number(a?.isError || 0) - Number(b?.isError || 0);
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
          this.mapFileMessageToMessage(prefillAttachments, curr);
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
        this.mapFileMessageToMessage(curr, one);
      });

      acc.set(curr.id, curr);
      return acc;
    }, new Map());
    const result: IMessage[] = Array.from(messageListObj.values());
    return result;
  }

  mapFileMessageToMessage(currentMess, fileMess) {
    if (fileMess.file && fileMess.file?.fileType && fileMess.isShowFile) {
      switch (
        this.filesService.getFileTypeSlash(fileMess.file?.fileType?.name)
      ) {
        case 'video':
        case 'photo':
        case 'audio':
          currentMess?.files?.mediaList.push({
            ...fileMess.file,
            isShowFile: fileMess.isShowFile,
            messageId: fileMess.id,
            createdAt: fileMess.createdAt
          });
          break;
        case 'file':
          currentMess?.files?.fileList.push({
            ...fileMess.file,
            isShowFile: fileMess.isShowFile,
            messageId: fileMess.id,
            createdAt: fileMess.createdAt
          });
          break;
      }
    } else if (!fileMess.file?.fileType || !fileMess.isShowFile) {
      currentMess?.files?.unSupportedList.push({
        ...fileMess.file,
        isShowFile: true,
        messageId: fileMess.id,
        createdAt: fileMess.createdAt
      });
    }
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

  parseMessageToObject(message): any {
    if (!message && message !== '') {
      return;
    }

    if (message === '') {
      return [{ type: this.messageType.text, value: '' }];
    }

    // tslint:disable-next-line:max-line-length
    const regExpUrl =
      /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;
    const regExpWhiteSpace = /\s/g;
    const defaultTypeExp = /(:\*\*\()/gim;
    let fromIndex = 0;
    let regRes;
    const res = [];
    if (!res.find((r) => r.value === message)) {
      if (regExpUrl.test(message)) {
        if (regExpWhiteSpace.test(message)) {
          res.push({
            type: this.messageType.text,
            value: message
          });
        } else {
          res.push({
            type: this.messageType.url,
            value: message
          });
        }
        fromIndex = regExpUrl.lastIndex;
      } else {
        res.push({
          type: this.messageType.text,
          value: message
        });
      }
    }
    while ((regRes = defaultTypeExp.exec(message)) !== null) {
      res.push({
        type: 'otherTypes',
        value: regRes[0]
      });
      fromIndex = regExpUrl.lastIndex;
    }
    return res;
  }

  checkIsAgentJoined() {
    if (!this.conversationService.agentJoined() && this.isFirstJoined) {
      this.isFirstJoined = false;
      return true;
    }
    return false;
  }

  checkLink(actionLinks: TransferActionLinkProp[]) {
    if (actionLinks && actionLinks.length > 0) {
      let actionLinksBody: ActionLinkProp[] = [];
      actionLinks.forEach((link) => {
        actionLinksBody = [...actionLinksBody, { ...link.actionLink }];
      });
      return actionLinksBody;
    }
    return [];
  }

  async checkMessage(onlyText: boolean, data?: any) {
    const user = data.isTrudi
      ? { ...this.trudiInfo }
      : this.userService.userInfo$.getValue();
    const { type, id } = user;
    this.currentMessage =
      this.trudiDynamicParameterService.handleReplaceDynamicParamsForInline(
        this.currentMessage?.trim()
      );
    let body: any = {
      ...(onlyText && { id: uuid4() }),
      textMessage: {
        id: uuid4(),
        message: this.currentMessage?.trim(),
        userId: id,
        optionParam: {
          contacts: this.sendMessageService.formatContactsList(
            data?.contactInfos
          )
        },
        isSendFromEmail: data.sendType === sendOptionType.EMAIL
      },
      conversationId: this.currentConversation.id,
      files: this.listOfFiles ?? [],
      isResolveConversation: !!data?.resolved
    };

    if (body.files?.length) {
      const fileUpload = await this.sendMessageService.uploadFileS3(
        body?.files as any
      );
      body.files = fileUpload.map((file) => ({
        ...file,
        id: uuid4(),
        tempMessageFileId: uuid4(),
        name: file.title || file.fileName,
        fileType: file.fileType?.name ?? file.fileType,
        fileName: file.title || file.fileName,
        size: file.fileSize
      })) as any;
    }

    const filteredMessage = this.parseMessageToObject(this.currentMessage);
    const message = {
      ...(onlyText && { id: body.textMessage.id }),
      conversationId: this.currentConversation.id,
      isRead: false,
      message: filteredMessage,
      messageType: EMessageType.defaultText,
      propertyDocumentId: null,
      type,
      userType: type,
      userPropertyType: type === UserTypeEnum.LEAD ? '' : 'AGENT',
      updatedAt: dayjs().format(),
      userId: id,
      firstName: user.firstName,
      lastName: user.lastName,
      senderType: this.detectUserRole(type, type, id),
      googleAvatar: user.googleAvatar,
      isUserPropetyTree:
        !!this.userService.selectedUser.value?.userProperties?.length,
      createdAt: dayjs().format(),
      options: body.textMessage.optionParam,
      files: body.files ?? [],
      isSendFromEmail: data.sendType === sendOptionType.EMAIL,
      isSendFromVoiceMail: false
    };
    this.sendMessageService.handleMessageTurnOnApp(message);
    if (this.checkIsAgentJoined()) {
      this.listofmessages = this.listofmessages.filter(
        (el) => el.messageType !== this.messagesType.agentExpectation
      );
      this.formatMessageAppUser(message);
      this.mapMessageProperties();
      this.apiService
        .postAPI(conversations, 'agent-join-to-conversation', {
          conversationId: this.currentConversation.id,
          propertyId: this.currentProperty.id
        })
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res: IMessage) => {
          this.agentCallTime(res.createdAt);
          this.addCurrentUserToParticipantList();
          this.assignDataForNewMsg(res, user);
          this.setMsgAfterJoin(res.status, res.messageType);
          this.sendTheMessage(body);
        });
    } else {
      this.formatMessageAppUser(message);
      this.sendTheMessage(body);
    }
  }

  formatMessageAppUser(message, isUpdate?: boolean) {
    const formatedMessage = { ...message, isSending: true };

    if (message.files?.length) {
      message.files.forEach((file) => {
        const messageFile = {
          ...message,
          id: file.tempMessageFileId,
          isSending: true,
          file: file,
          isShowFile: true,
          messageType: EMessageType.file
        };
        const itemFileToUpdate = this.listofmessages.find(
          (item) => item?.id === messageFile?.id
        );
        if (!isUpdate) {
          this.sendingMessages.push(messageFile);
        }
        this.handleMessageStatus(itemFileToUpdate, messageFile, isUpdate);
      });
    }

    const isHaveTextMessage = Boolean(
      message?.textMessage?.message?.length ||
        message?.message?.[0]?.value?.length
    );
    const isHaveContactCard = Boolean(
      message?.textMessage?.optionParam?.contacts?.length ||
        message.options?.contacts?.length
    );
    const itemToUpdate = this.listofmessages.find(
      (item) =>
        item.id === formatedMessage.id &&
        item.messageType === EMessageType.defaultText
    );
    if (isHaveContactCard || isHaveTextMessage) {
      if (!isUpdate) {
        this.sendingMessages.push(formatedMessage);
      }
      this.handleMessageStatus(itemToUpdate, formatedMessage, isUpdate);
    }
    return formatedMessage;
  }

  handleMessageStatus(itemToUpdate, message, isUpdateError) {
    if (isUpdateError) {
      this.updateErrorMessage(itemToUpdate);
    } else {
      this.addMessage(message, true);
      this.mapMessageProperties();
    }
  }

  addCurrentUserToParticipantList() {
    this.currentConversation.participants.push({
      ...this.currentConversation.participants[0],
      userId: this.userService.userInfo$.getValue().id
    });
  }

  assignDataForNewMsg(data, userInfo) {
    data.firstName = userInfo.firstName;
    data['isUserPropetyTree'] = !!localStorage.getItem('isUserPropetyTree');
    data['lastName'] = userInfo.lastName;
    data['googleAvatar'] = userInfo.googleAvatar;
    const replaceIndex = this.listofmessages.findIndex(
      (el) => el.id === data.id
    );
    data.userType = data.type;
    if (replaceIndex === -1) {
      this.addMessage(data);
    } else {
      this.listofmessages[replaceIndex] = data;
    }
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

  openFromViaEmail() {
    this.titleSelecPeople =
      'Which landlords would you like to send this quote to?';
    this.isOnlyOwnerTenant = true;
    this.isOnlySupplier = false;
    this.showOwnerTenantAndSupplier = true;
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

  handleSendQuoteLandlordClicked() {
    this.selectedTicket = null;
    this.isShowFromFile = true;
    this.fileTypeQuote = READONLY_FILE.pdf;
    this.isResetModal = true;
    this.showTextForward = true;
    this.noSendMessageBackBtn = true;
    this.maintenanceFromAppChat = {
      isForward: true,
      sendQuote: true
    };
    const { decisionIndex } = this.conversationTrudiRespone?.data[0] || {};
    this.buttonAction = this.conversationTrudiRespone?.data[0]?.body?.decisions[
      decisionIndex
    ]?.button?.find(
      (button) => button.action === ForwardButtonAction.sendQuoteLandlord
    );
    this.messageSendQuote = this.buttonAction?.textForward;
    this.selectedMode = ForwardButtonAction.sendQuoteLandlord;
    this.openFrom = SEND_MESSAGE_POPUP_OPEN_FROM.file;
    this.conversationService
      .getListLandlordConversationByTask(
        this.taskService.currentTaskId$?.getValue()
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.selectedUsersFromPopup = res;
        this.listConversationForwardLandlord = res;
        if (this.selectedUsersFromPopup.length) {
          this.changeTextForwardLandlordSendMessage(
            this.selectedUsersFromPopup
          );
          this.isShowSendMessageModal = true;
          this.isBackSendQuote = false;
        } else {
          this.openFromViaEmail();
          this.isBackSendQuote = true;
          this.isShowSelectPeopleModal = true;
          this.isOnlyOwnerTenant = true;
          this.isOnlySupplier = false;
        }
      });
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

  private updateSendingMessage(sendingIds: string[], isError: boolean = false) {
    if (!sendingIds) return;
    this.listofmessages.forEach((message) => {
      if (sendingIds.includes(message.id)) {
        message.isSending = false;
        message.isError = isError;
      }
    });
  }

  private updateReSendingMessage(
    sendingIds: string[],
    isSending: boolean = true,
    isError: boolean = false
  ) {
    if (!sendingIds) return;
    this.listofmessages.forEach((message) => {
      if (sendingIds.includes(message.id)) {
        message.isSending = isSending;
        message.isError = isError;
      }
    });

    this.groupMessage.forEach((group) => {
      group.messages.forEach((message) => {
        if (sendingIds.includes(message.id)) {
          message.isSending = isSending;
          message.isError = isError;
        }
      });
    });
  }

  formatMessageNonApp(body, isTrudi = false) {
    const user = isTrudi
      ? { ...this.trudiInfo }
      : this.userService.userInfo$.getValue();
    const { type } = user;
    const { id } = this.conversationService.currentConversation.value;
    const contactCard = body?.textMessages?.[0]?.optionParam?.contacts;
    return {
      id: body?.textMessages?.[0]?.id,
      conversationId: this.currentConversation.id,
      createdAt: dayjs().format(),
      files: this.formatFilesList({
        ...body,
        isShowFile: Boolean(body.files.length)
      }),
      firstName: user.firstName,
      googleAvatar: user.googleAvatar,
      isRead: false,
      isSendFromEmail: true,
      isShowFile: Boolean(body.files.length),
      isSending: true,
      isUserPropetyTree:
        !!this.userService.selectedUser.value?.userProperties?.length,
      lastName: user.lastName,
      message: this.parseMessageToObject(body?.textMessages?.[0].message),
      messageType: EMessageType.defaultText,
      options: { contacts: contactCard },
      propertyDocumentId: null,
      senderType: this.detectUserRole(type, type, id),
      type,
      updatedAt: dayjs().format(),
      userId: user.id,
      userPropertyType: type === UserTypeEnum.LEAD ? '' : 'AGENT',
      userType: type,
      isSyncedAttachment: true,
      unhandledAttachmentCount: 0
    };
  }

  formatFilesList(message) {
    let currentFiles = {
      fileList: [],
      mediaList: [],
      unSupportedList: []
    };
    if (message.files.length) {
      message.files.forEach((file) => {
        const formatedFile = {
          ...file,
          id: file.id,
          fileType: {
            name: file.fileType?.name ?? file.fileType
          },
          name: file.title || file.fileName,
          isShowFile: message.isShowFile
        };
        if (file && file?.fileType && message.isShowFile) {
          switch (this.filesService.getFileTypeSlash(file?.fileType)) {
            case 'video':
            case 'photo':
            case 'audio':
              currentFiles?.mediaList.push(formatedFile);
              break;
            case 'file':
              currentFiles?.fileList.push(formatedFile);
              break;
          }
        } else if (!file?.fileType || !message.isShowFile) {
          currentFiles?.unSupportedList.push(formatedFile);
        }
      });
    }
    return currentFiles;
  }

  scheduleSendMessage(body) {
    this.sendMessageService
      .scheduleSendV3Message(body)
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((data) => {
          const response = data?.jobReminders?.[0];
          return this.trudiScheduledMsgService.jobRemindersCount(
            response.conversationId
          );
        })
      )
      .subscribe({
        complete: () => {
          this.resetContactCard();
        }
      });
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
  sendTheMessage(body) {
    this.resetFile();
    const sendingIds = [
      body.textMessage?.id,
      ...(body.files?.map((file) => file.tempMessageFileId) || [])
    ];
    this.sendMessageService
      .sendV2Message(body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          this.resetContactCard();
          this.conversationService.onNavigateOutConversation({ value: '' });
          this.currentMessage = '';
          this.resetFile();
          this.getFiles();
          this.updateSendingMessage(sendingIds);
          if (body?.isResolveConversation) {
            if (this.currentConversation.taskType === TaskType.MESSAGE) {
              this.sendingMessages = [];
              this.cdr.markForCheck();
              this.headerService.setConversationAction({
                option: EMessageMenuOption.SEND_AND_RESOLVE,
                taskId: this.currentConversation.taskId,
                conversationId: this.currentConversation.id
              });
            } else {
              this.currentConversation.status = EConversationType.resolved;
            }
            this.currentConversation.status = EConversationType.resolved;
          }
          this.deliveryFailedMessageStorageService.updateDeliveryFailedMessages(
            body,
            this.groupMessage,
            this.currentTaskId,
            EStatusMessage.SUCCESS,
            EMessageType.defaultText
          );
          this.confirmCreateLinkReiForm(res[0].taskId);
        },
        error: () => {
          this.onGetConversation({}, false);
          this.deliveryFailedMessageStorageService.updateDeliveryFailedMessages(
            { ...body, files: [] },
            this.groupMessage,
            this.currentTaskId,
            EStatusMessage.ERROR,
            EMessageType.defaultText
          );
          this.updateSendingMessage(sendingIds, true);
          this.updateReSendingMessage(sendingIds, false, true);
        }
      });
  }

  onResendTheMessage(id: string): void {
    const { body, messageType } =
      this.deliveryFailedMessageStorageService.getDeliveryFailedBody(id) || {};

    this.updateReSendingMessage([id]);

    switch (messageType) {
      case EMessageType.defaultText: {
        this.sendTheMessage(body);
        return;
      }
      // case EMessageType.viaGmail: {
      //   this.submitToSendMessage({ body });
      //   return;
      // }
    }
  }

  showFile(collapse: boolean) {
    this.showFileType = collapse;
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

  updateErrorMessage(itemToUpdate) {
    if (itemToUpdate) {
      itemToUpdate.isSending = false;
      itemToUpdate.isError = true;
    }
  }

  addMessage(message, isFile?: boolean) {
    if (this.listofmessages.find((m) => m.id === message.id) && !isFile) {
      return;
    }
    message.messageType = message.messageType.toUpperCase();
    if (Array.isArray(message.message)) {
      for (let item of message.message) {
        item.value = item.value
          ?.replace(/(<p>&nbsp;<\/p>)+$/, '')
          .replace(/(&nbsp; )+/, '');
      }
    }
    this.listofmessages.push(message);
    this.currentMessage = '';
    this.isTyping = false;
    this.scrollToBottom(EBehaviorScroll.SMOOTH);
    this.changeOnFocus();
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

    if (
      [SocketType.forceCompleteJob, SocketType.completeJob].includes(res.type)
    ) {
      this.maintainRequest(res.conversationId, this.currentConversation, true);
    }

    this.loadingService.stopLoading();
    this.messageTaskLoadingService.stopLoading();
  }

  public getCategoryDitails(categoryId) {
    const categoryDetails =
      this.listofConversationCategory.find((cat) => cat.id === categoryId) ||
      {};
    if (categoryId === '0d2817fa-9687-11e9-bc42-526af7764f64') {
      categoryDetails.svg = 'old-rent.svg';
      categoryDetails.color = 'rgb(0, 169, 159)';
    }
    return categoryDetails;
  }

  public getTicketDetails(id) {
    const categoryDetail = this.listofTicketCategory.find((el) => el.id === id);
    if (!categoryDetail) {
      return {};
    }
    return categoryDetail;
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

  showSuccessMessageModal(status: boolean) {
    if (status) {
      this.isShowSendMessageModal = true;
      this.userService.getUserInfo();
      this.isResetModal = true;
    } else {
      this.isShowSendMessageModal = false;
      this.isShowSecceessMessageModal = false;
      this.openFrom = SEND_MESSAGE_POPUP_OPEN_FROM.appChat;
      this.openFromAppChat();
      this.countCheckbox = 0;
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

  openModalContact() {
    this.trudiAddContactCardService.setPopupState({
      addContactCardOutside: true
    });
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

  showSendEmail(status: PopupState, crmStatus?: string) {
    this.selectedTicket = null;
    this.isSendEmail = true;
    this.crm = crmStatus;
    this.showTextForward = false;
    this.popupService.selectPeople$.next(true);
    this.popupService.includePeople$.next(false);
    this.noSendMessageBackBtn = true;
    this.selectedUsersFromPopup = [];
    this.selectedUsersFromPopup.push({
      type: this.currentConversation.isPrimary
        ? 'Primary ' + this.currentConversation.propertyType
        : this.currentConversation.propertyType,
      firstName: this.currentConversation.firstName,
      lastName: this.currentConversation.lastName,
      inviteSent: this.currentConversation.iviteSent,
      lastActivity: this.currentConversation.lastActivity,
      offBoarded: this.currentConversation.offBoardedDate,
      status: crmStatus,
      checked: true,
      userId: this.currentConversation.id,
      propertyId: this.currentProperty.id
    });
    if (status.resetField) {
      this.resetFieldInSendMessage();
    }
    if (status.display) {
      this.isShowSendMessageModal = true;
      this.userService.getUserInfo();
      this.isResetModal = status.resetField;
      this.isShowQuitConfirmModal = false;
      this.isShowSelectPeopleModal = false;
      this.isShowAddFilesModal = false;
    } else {
      this.resetFieldInSendMessage();
      this.closeSendMessageModalAndResetCount();
    }
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.isShowTrudiSendMsg = false;
        if (event?.isDraft) {
          return;
        }
        this.toastCustomService.handleShowToastMessSend(event);
        !this.isTaskType &&
          this.toastCustomService.handleShowToastByMailBox(ASSIGN_TO_MESSAGE);
        break;
      default:
        break;
    }
  }

  handleSent(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.isHideRedLineNew = true;
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

  handleShowTrudiSendMsgFromViaEmail(event: IPeopleFromViaEmail) {
    const { file, type } = event;
    this.fileSelected = file.file;
    this.typeFormViaEmail = type;
    this.showTextForward = true;
    this.noSendMessageBackBtn = false;
    this.titleSelecPeople =
      type === 'SEND_LANDLORD'
        ? 'Who would you like to forward this quote to?'
        : 'Who would you like to forward this invoice to?';

    const { decisionIndex } = this.conversationTrudiRespone?.data[0] || {};
    if (type === 'SEND_LANDLORD') {
      this.buttonAction =
        this.conversationTrudiRespone?.data[0]?.body?.decisions[
          decisionIndex
        ]?.button.find(
          (button) => button.action === ForwardButtonAction.sendQuoteLandlord
        );
    } else {
      this.buttonAction =
        this.conversationTrudiRespone?.data[0]?.body?.decisions[
          decisionIndex
        ]?.button.find(
          (button) => button.action === ForwardButtonAction.sendInvoicePT
        );
      this.selectedMode = ForwardButtonAction.sendInvoicePT;
    }
    this.messageSendQuote = this.buttonAction?.textForward;
    this.changeTextForwardLandlordSendMessage(this.selectedUsersFromPopup);
    this.openFrom = SEND_MESSAGE_POPUP_OPEN_FROM.conv;
    this.showOwnerTenantAndSupplier = true;
    this.isBackSendQuote = true;
    this.maintenanceFromAppChat = {
      isForward: true,
      sendQuote: false
    };
    this.setStateTrudiSendMsg(this.fileSelected);
    this.resetFieldInSendMessage();
    this.listFileForward = [];
    this.listFileForward.push(file);
    this.isShowFromFile = true;
    this.selectedTicket = null;
  }

  onDisplayTyping() {
    this.conversationService.isDisplayTypingBlock
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => (this.isDisplayTypingBlock = res));
  }

  async handleGetSelectedTask(file) {
    const currentTask = this.taskService.currentTask$.getValue();
    const extraConfigs = {
      'header.title': this.isTaskType
        ? currentTask?.property?.streetline || 'No property'
        : null,
      'header.hideSelectProperty': this.isTaskType,
      'otherConfigs.isCreateMessageType': !this.isTaskType
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
      'inputs.selectedTasksForPrefill': tasks,
      'otherConfigs.isSendForward': true,
      'otherConfigs.isShowGreetingContent': !file
    };
  }

  setStateTrudiSendMsg(file = null) {
    this.isShowTrudiSendMsg = true;
    this.inboxToolbarService.setInboxItem([]);
    this.handleGetSelectedTask(file);
    this.createNewConversationConfigs['inputs.isForwardDocument'] =
      file?.isForward;
    this.messageFlowService
      .openSendMsgModal(this.createNewConversationConfigs)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (rs.type === ESendMessageModalOutput.MessageSent) {
          this.onSendMsg(rs.data);
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

  closeModalScheduleMsg() {
    this.isShowTrudiScheduledMsg = false;
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

  checkToGetListMsg(data) {
    return (
      data &&
      this.currentConversation &&
      data.propertyId === this.currentConversation.propertyId &&
      !data.sendType &&
      !data.isScheduleMessage &&
      (data.userId !== this.userService.selectedUser.value.id ||
        data.messageType === this.messagesType.file)
    );
  }

  checkGetCallFromSocketSend(data) {
    return (
      data &&
      this.currentConversation &&
      !data.sendType &&
      data.messageType === this.messagesType.call
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
        participants.some((user) =>
          [receiverId, socketUserId].includes(user?.userId)
        ))
    );
  }

  getLisQuoteSelected(event: any[]) {
    this.selectedFiles = event;
  }

  openSendMessageFromSendQuote(status: boolean) {
    if (!status) {
      this.isShowSendMessageModal = true;
      this.isShowSelectPeopleModal = false;
    }
  }
  handleOnCloseSendInvoice() {
    this.showSendInvoicePt = false;
  }
  handleSendInvoicePTClicked() {
    this.showSendInvoicePt = true;
  }

  checkInviteDeactive() {
    if (
      this.currentConversation?.crmStatus === 'ACTIVE' &&
      this.currentConversation?.secondaryEmail
    ) {
      this.inviteDeactive = true;
    } else {
      this.inviteDeactive =
        this.userService.getStatusInvite(
          this.currentConversation.iviteSent,
          this.currentConversation.lastActivity,
          this.currentConversation.offBoardedDate,
          this.currentConversation.trudiUserId
        ) !== this.userInviteStatusType.active;
    }
  }

  mapMessageProperties(isSkipRender = false) {
    if (!this.listofmessages) return;
    this.listofmessages = this.listofmessages.map((message) => {
      message.senderType = this.detectUserRole(
        message.userType,
        message.type,
        message.userId,
        message.isSendFromEmail,
        message?.messageType
      );
      message.messageType = message.messageType.toUpperCase() as EMessageType;
      if (message.messageType === EMessageType.actionLink) {
        const categoryDetail = this.getCategoryDitails(
          message.actionLink.topicId
        );
        message.color = categoryDetail.color;
        message.svg = categoryDetail.svg;
      } else if (
        message.messageType === EMessageType.ticket &&
        (message.options?.ticket?.ticketCategoryId ||
          message.options?.ticketCategoryId)
      ) {
        if (message.options.type === 'MUlTIPLE_TASK') {
          message.ticketCategoryInfo = this.getTicketDetails(
            message.options.ticket.ticketCategoryId
          );
        } else {
          message.ticketCategoryInfo = this.getTicketDetails(
            message.options.ticketCategoryId
          );
        }
      }
      if (message.isSendFromEmail) {
        if (typeof message.message === 'string') {
          message.message = message.message
            .replace(/\r/g, '')
            .replace(/\n{3,}/g, '\n\n');
        } else {
          message.message = message.message.map((item) => {
            item.value = item.value
              .replace(/\r/g, '')
              .replace(/\n{3,}/g, '\n\n');
            return item;
          });
        }
      }
      return message;
    });
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
    !isSkipRender &&
      (this.groupMessage = this.groupMessagesByDate(this.listofmessages));
    const messageTypeForAISummary = [
      EMessageType.defaultText,
      EMessageType.ticket
    ];
    this.isMessageText = this.groupMessage
      .flatMap((item) => item?.messages)
      .some((message) =>
        messageTypeForAISummary.includes(message?.messageType)
      );
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
          status: this.currentConversation.status
        };
      }
      return message;
    });
  }

  groupMessagesByDate(messages) {
    const listMessage = this.handleMapListMessage(messages);
    const grouped = listMessage.reduce((acc, message) => {
      const date: string = this.agencyDateFormatService
        .agencyDayJs(message?.createdAt)
        .format(SHORT_ISO_DATE);
      if (!acc[date]) {
        acc[date] = {
          timeStamp: date,
          messages: [message]
        };
      } else {
        acc[date].messages.push(message);
      }
      return acc;
    }, {});
    this.checkHasNewMessage();
    return Object.values(grouped);
  }

  handleMapListMessage(messages) {
    const arrType = [
      EMessageType.reopened,
      EMessageType.changeProperty,
      EMessageType.deleted,
      EMessageType.agentExpectation,
      EMessageType.moveToTask,
      EMessageType.solved
    ];
    this.lastReadMessageIndex = -1;
    const newMessages = messages.map((message, index) => {
      const participants = message?.messageCall?.participiants;
      if (participants) {
        participants.forEach((participant) => {
          if (participant?.messageCallParticipiant?.joinedAt) {
            participant.joinedAt = participant.messageCallParticipiant.joinedAt;
          }
        });
      }
      if (message) {
        let classForMarker = [];
        const prevMessageType = messages[index - 1]?.messageType;
        const nextMessageType = messages[index + 1]?.messageType;
        const isShowAgentJoin = !this.conversationService.checkIsSendFromEmail(
          message?.conversationId
        );

        if (message.messageType === EMessageType.agentJoin && isShowAgentJoin) {
          if (
            prevMessageType === EMessageType.defaultText ||
            prevMessageType === EMessageType.ticket
          ) {
            classForMarker.push('mt-16');
          }
          if (
            nextMessageType === EMessageType.defaultText ||
            nextMessageType === EMessageType.ticket
          ) {
            classForMarker.push('mb-16');
          }
        }

        if (arrType.includes(message?.messageType)) {
          switch (prevMessageType) {
            case EMessageType.defaultText:
            case EMessageType.ticket:
              classForMarker.push('mt-16');
              break;
            case EMessageType.agentJoin:
              const isHideAgentJoinPrevious =
                this.conversationService.checkIsSendFromEmail(
                  messages[index - 1]?.conversationId
                );
              if (isHideAgentJoinPrevious) {
                classForMarker.push('mt-16');
              }
              break;
          }

          switch (nextMessageType) {
            case EMessageType.defaultText:
            case EMessageType.ticket:
              classForMarker.push('mb-16');
              break;
            case EMessageType.agentJoin:
              const isHideAgentJoinNext =
                this.conversationService.checkIsSendFromEmail(
                  messages[index + 1]?.conversationId
                );
              if (isHideAgentJoinNext) {
                classForMarker.push('mb-16');
              }
              break;
          }
        }
        message.classForMarker = classForMarker.join(' ');
      }

      if (message?.isLastReadMessage && this.lastReadMessageIndex < 0) {
        if (messages[index + 1]?.messageType !== EMessageType.defaultText) {
          message.isLastReadMessage = false;
        } else {
          this.lastReadMessageIndex = index;
        }
      }
      return message;
    });
    return newMessages;
  }

  handleRemoveDraftMsg(draftMsgId: string) {
    this._listofmessages = this.listofmessages.filter(
      (message) =>
        message.id !== draftMsgId &&
        (message.bulkMessageId ? message.bulkMessageId !== draftMsgId : true)
    );

    for (const msg of this._listofmessages) {
      if (msg.draftMessageId === draftMsgId) {
        msg.draftMessageId = null;
        msg.draftMsg = null;
      }
    }
    this._groupMessage = this.groupMessage.map((group) => {
      if (group.messages.length) {
        const newGroupMsg = group?.messages?.filter(
          (message) => message.id !== draftMsgId
        );
        newGroupMsg?.forEach((element) => {
          if (element?.draftMessageId === draftMsgId) {
            element.draftMessageId = null;
            element.draftMsg = null;
          }
        });
        group.messages = JSON.parse(JSON.stringify(newGroupMsg));
      }
      return group;
    });
    this.store.dispatch(
      conversationActions.setAllConversationMessages({
        conversations: this._listofmessages,
        id: this.currentConversation.id
      })
    );
    this.store.dispatch(
      conversationActions.setGroupMessage({
        id: this.currentConversation.id,
        groupMessage: this._groupMessage
      })
    );
    this.lastMessagesTypeText = findLastItemMsgTypeTextOrTicket(
      this.listofmessages
    );
  }

  handleUpdateDraftMsg(currentMsg) {
    const draftMsgId =
      currentMsg.draftMessageId || (currentMsg.isDraft ? currentMsg.id : null);
    if (draftMsgId) {
      this.handleRemoveDraftMsg(draftMsgId);
    }
  }

  handleRemoveFileItem(index: number) {
    this.selectedFiles.splice(index, 1);
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

  handleSelectDate(event) {
    this.trudiScheduledMsgService.setPopupState({
      rescheduleMsgInline: false
    });
    this.scheduledDate = event;
  }

  handleOnBackScheduleMessage() {
    this.trudiScheduledMsgService.setPopupState({
      rescheduleMsgInline: false
    });
  }

  messageTrackBy(_: number, message: IMessage) {
    if (message?.emailMetadata?.from?.[0]?.userId) {
      return (
        message.id +
        message.createdAt +
        message?.emailMetadata?.from?.[0]?.userId
      );
    }

    return message.id + message.createdAt;
  }

  dateTrackby(_: number, message) {
    return message.timeStamp;
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
    this.chatGptService.reset();
    this.chatGptService.enableGenerate.next(true);
    this.chatGptService.onGenerate.next({
      enable: true,
      skipValidate: false,
      show: true
    });
  }

  public handleOpenLinkTask(): void {
    let isShow = true;
    if (!this.isShowViewConversation.value) {
      this.attachComponentToBody(
        this.listofmessagesWithTrudi,
        this.totalPagesOfConversationWithTrudi
      );
    } else {
      isShow = false;
    }

    this.isShowViewConversation.next(isShow);
  }

  private attachComponentToBody(
    listofmessages: IMessage[] = [],
    totalPages: number
  ): void {
    this.destroyComponent();
    const overlayConfig = new OverlayConfig({
      hasBackdrop: true,
      backdropClass: 'background--dark'
    });
    this.overlayRef = this.overlay.create(overlayConfig);
    const componentPortal = new ComponentPortal(ViewConversationComponent);
    const componentRef = this.overlayRef.attach(componentPortal);
    componentRef.instance.isShowViewConversationBS =
      this.isShowViewConversation;
    componentRef.instance.listofmessages = listofmessages;
    componentRef.instance.currentConversation = this.currentConversation;
    componentRef.instance.filterMsg = this.filterMsg;
    componentRef.instance.mapHistoryChatMessage = this.mapHistoryChatMessage;
    componentRef.instance.groupMessageViaEmail = this.groupMessageViaEmail;
    componentRef.instance.getCategoryDitails = this.getCategoryDitails;
    componentRef.instance.parseMessageToObject = this.parseMessageToObject;
    componentRef.instance.detectUserRole = this.detectUserRole;
    componentRef.instance.listofTicketCategory = this.listofTicketCategory;
    componentRef.instance.totalPagesOfConversationWithTrudi = totalPages;
    componentRef.instance.messageType = this.messageType;
    componentRef.instance.createdFrom = this.currentConversation
      .createdFrom as EMessageComeFromType;

    componentRef.instance.destroyRef = () => {
      if (this.overlayRef) {
        this.overlayRef.detach();
      }
      this.isShowViewConversation.next(!this.isShowViewConversation);
    };
    this.overlayRef.backdropClick().subscribe(() => {
      this.destroyComponent();
      this.isShowViewConversation.next(!this.isShowViewConversation);
    });
  }

  public destroyComponent(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
    }
  }

  openImageDetail(event) {
    if (event?.target instanceof HTMLImageElement) {
      const imgSrc = event.target.src;
      this.isImageDetail = true;
      this.imageDetailUrl = imgSrc;
    }
  }

  handleCloseImageDetail() {
    this.isImageDetail = false;
    this.imageDetailUrl = '';
  }

  subscribeEventChangeHeightIframe() {
    this.eventChangeQuoteSizeHandler = (e: CustomEvent) => {
      this.messageService.setMessageChangeIframeId(e.detail?.messageId);
    };
    window.document.addEventListener(
      'eventChangeQuoteSize',
      this.eventChangeQuoteSizeHandler,
      false
    );
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

  private subscribeSocketDeleteSecondaryEmail() {
    this.websocketService.onSocketDeleteSecondaryContact
      .pipe(
        distinctUntilChanged(),
        filter(
          (socket) => socket.conversationId === this.currentConversationId
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe((res) => {
        this.conversationService.reloadConversationList.next(true);

        this.taskService.currentTask$.next({
          ...this.taskService.currentTask$.value,
          conversations: this.taskService.currentTask$.value.conversations.map(
            (conversation) => ({
              ...conversation,
              participants: res.participants
            })
          )
        });
        const participantChange = [...res.participants].find(
          (p: IUserParticipant) => p.userId === res?.newUserId
        ) as IUserParticipant;
        this.conversationService.setParticipantChanged({
          ...participantChange,
          oldUserId: res?.userId,
          isReassign: true
        });

        this.taskService.reloadTaskDetail.next(true);
      });
  }

  mapDraftMessageToMessage() {
    this.listofmessages.forEach((item) => {
      const draftMessage = this.listofmessages.find(
        (one) =>
          item.draftMessageId === one.id ||
          (one.isDraft && one.replyToMessageId === item.id)
      );
      if (draftMessage) {
        item.draftMessageId = draftMessage?.id;
        item.draftMsg = draftMessage;
      }
    });
  }

  triggerCurrentConversation(value) {
    if (value?.id !== this.currentConversation?.id) return;
    this.currentConversation = { ...this.currentConversation, ...value };
    this.currentTask = {
      ...this.currentTask,
      conversations: [this.currentConversation as PreviewConversation]
    };
  }
}
