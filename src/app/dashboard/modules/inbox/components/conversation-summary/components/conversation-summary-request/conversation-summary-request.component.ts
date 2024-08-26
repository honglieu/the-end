import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  Subject,
  switchMap,
  takeUntil
} from 'rxjs';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { SharedService } from '@/app/services/shared.service';
import {
  EConversationType,
  EExcludedUserRole,
  EMailBoxStatus,
  EMessageType,
  EOptionType,
  SocketType,
  TaskStatusType,
  TaskType
} from '@/app/shared/enum';
import { PreviewConversation } from '@/app/shared/types/conversation.interface';
import {
  FileMessage,
  IMessage,
  ITicket,
  ITicketResponse
} from '@/app/shared/types/message.interface';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import {
  EButtonTask,
  EButtonType,
  EUserPropertyType,
  PreventButtonService
} from '@trudi-ui';
import { LanguageOriginalContentComponent } from '@/app/shared/components/language-original-content/language-original-content.component';
import { mapTicketToDisplayItem } from '@/app/dashboard/modules/inbox/modules/facebook-view/utils/function';
import {
  IActionItem,
  IConversationSummary,
  IFacebookMessage,
  ILinkedConversation,
  IRequestItemToDisplay
} from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import {
  defaultConfigsButtonAction,
  taskForwardConfigsButtonAction
} from '@/app/task-detail/modules/app-chat/components/button-action/utils/constant';
import { cloneDeep, isEqual } from 'lodash-es';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import {
  ESentMsgEvent,
  ISelectedReceivers,
  ISendMsgSchedule,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  combineNames,
  ContactTitleByConversationPropertyPipe,
  FileCarousel,
  IMailBox,
  IParticipant,
  IParticipantContact,
  IUserParticipant,
  PhoneNumberFormatPipe,
  SendOption,
  TaskItem
} from '@/app/shared';
import { MessageService } from '@/app/services/message.service';
import { FacebookService } from '@/app/dashboard/modules/inbox/modules/facebook-view/services/facebook.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import {
  extractQuoteAndMessage,
  isMailboxCompany
} from '@/app/trudi-send-msg/utils/helper-functions';
import {
  ACCEPT_ONLY_SUPPORTED_FILE,
  listThumbnailExtension,
  listVideoTypeDot,
  NO_PROPERTY,
  trudiUserId
} from '@/app/services/constants';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { Router } from '@angular/router';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { EStateModalAddToTask } from '@/app/dashboard/modules/inbox/components/add-item-to-task/add-item-to-task.component';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';
import { stringFormat } from '@/app/core';
import { AppRoute } from '@/app/app.route';
import { NavigatorService } from '@/app/services/navigator.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ConverationSummaryService } from '@/app/dashboard/modules/inbox/components/conversation-summary/services/converation-summary.service';
import { WhatsappService } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/services/whatsapp.service';
import {
  DialogService,
  FilesService,
  FontSetting,
  HeaderService,
  RxWebsocketService
} from '@/app/services';
import {
  EPageMessengerConnectStatus,
  PageFacebookMessengerType
} from '@/app/dashboard/shared/types/facebook-account.interface';
import {
  PageWhatsAppType,
  WhatsAppConnectStatus
} from '@/app/dashboard/shared/types/whatsapp-account.interface';
import { ImagesCarouselModalComponent } from '@/app/shared/components/images-carousel-modal/images-carousel-modal.component';
import { WidgetLinkedService } from '@/app/task-detail/modules/sidebar-right/services/widget-linked.service';

@Component({
  selector: 'conversation-summary-request',
  templateUrl: './conversation-summary-request.component.html',
  styleUrl: './conversation-summary-request.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationSummaryRequestComponent
  implements OnInit, OnDestroy, OnChanges
{
  @ViewChild(LanguageOriginalContentComponent)
  languageOriginalContent: LanguageOriginalContentComponent;

  @Input() emailMetaData;
  @Input() displayName: string;
  @Input() channelUserName: string;
  @Input() requestItem: IActionItem;
  @Input() isTemporary: IFacebookMessage;
  @Input() isLinkedConversationsExpanded: boolean;
  @Input() currentConversation: PreviewConversation;
  @Input() message: IConversationSummary;
  @Input() emailVerified: string = '';
  @Input() currentTask: TaskItem;

  @Output() linkedEmailsExpanded = new EventEmitter();
  @Output() reloadMessageRequest = new EventEmitter();

  private readonly destroy$ = new Subject<void>();
  public sendMsgModalConfig: any = cloneDeep(defaultConfigsButtonAction);
  public currentUserOfConversation;
  public headerTitle: string = '';
  public rawMsg: string = '';
  public listOfFiles: FileMessage[] = [];
  public arrayImageCarousel: FileCarousel[] = [];
  public arrayImageCarousel2: FileCarousel[] = [];
  public contactsList: ISelectedReceivers[] = [];
  public stateModalAddToTask: EStateModalAddToTask = null;
  public requestItemToDisplay: IRequestItemToDisplay;
  public isOpenDescription: boolean = false;
  public isOpenMenuAction: boolean = false;
  public isConsole: boolean;
  public isTaskType: boolean = false;
  public replied: boolean = false;
  public viewSyncFile: boolean = false;
  public initialIndex: number;
  public isShowCarousel: boolean = false;
  public isCarousel: boolean = false;
  public videoPattern = new RegExp(listVideoTypeDot.join('|'), 'gi');
  public selectedFacebookMessenger: PageFacebookMessengerType;
  public selectedWhatsapp: PageWhatsAppType;
  public languageOriginContent: string;
  public disableReplyEmail: boolean = false;
  public isDisconnectedMailbox: boolean = false;
  public isArchiveMailbox: boolean = false;
  public listMailBoxes: IMailBox[] = [];
  public mailBoxShared: IUserParticipant;
  public currentMailBoxId: string;
  public currentMailBox: IMailBox;
  public showMessageHasLinkedTask: boolean = false;
  private isPmSend: IMailBox;
  public senderOfMessage: {
    senderName?: string;
    senderRole?: EExcludedUserRole | string;
    pmName?: string;
    pmUserId?: string;
    isSender?: boolean;
  } & IUserParticipant = null;

  readonly EMailBoxStatus = EMailBoxStatus;
  readonly EOptionType = EOptionType;
  readonly TaskType = TaskType;
  readonly MAX_FILE_DISPLAY: number = 3;
  public excludedUserRole = [
    EExcludedUserRole.BELONGS_TO_OTHER_PROPERTIES,
    EExcludedUserRole.UNRECOGNIZED,
    EExcludedUserRole.EMPTY
  ];

  constructor(
    private readonly preventButtonService: PreventButtonService,
    private readonly sharedService: SharedService,
    private readonly agencyDateFormatService: AgencyDateFormatService,
    private readonly messageFlowService: MessageFlowService,
    private readonly messageService: MessageService,
    private readonly facebookService: FacebookService,
    private readonly toastCustomService: ToastCustomService,
    private readonly router: Router,
    private readonly navigatorService: NavigatorService,
    private readonly showSidebarRightService: ShowSidebarRightService,
    private readonly trudiSaveDraftService: TrudiSaveDraftService,
    private readonly inboxService: InboxService,
    private readonly converationSummaryService: ConverationSummaryService,
    private readonly whatsappService: WhatsappService,
    private readonly rxWebsocketService: RxWebsocketService,
    private readonly phoneFormatPipe: PhoneNumberFormatPipe,
    private readonly cdr: ChangeDetectorRef,
    private el: ElementRef<HTMLElement>,
    private dialogService: DialogService<ImagesCarouselModalComponent>,
    private headerService: HeaderService,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private readonly filesService: FilesService,
    private widgetLinkedService: WidgetLinkedService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.isPmSend = this.checkIsPmSend();
    this.setSenderOfMessageValue();

    this.converationSummaryService.triggerScroll$
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.isOpenMenuAction)
      )
      .subscribe(() => {
        this.el.nativeElement.click();
      });

    this.trudiSaveDraftService
      .getIsSavedDraftMsg()
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        filter((boolean) => boolean)
      )
      .subscribe(() => {
        this.trudiSaveDraftService.setIsSavedDraftMsg(false);
        this.reloadMessageActionList();
      });

    this.facebookService.facebookMessengerSelected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.selectedFacebookMessenger = res;
      });

    this.whatsappService.whatsappSelected$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.selectedWhatsapp = res;
      });
    this.getDisconnectArchivedMailBox();
    this.subscribeSocketTask();

    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        switchMap((mailBoxId) => {
          if (mailBoxId) {
            this.currentMailBoxId = mailBoxId;
            return this.inboxService.listMailBoxs$;
          } else {
            return of(null);
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((listMailBoxs) => {
        if (listMailBoxs.length) {
          this.listMailBoxes = listMailBoxs;
          this.currentMailBox = listMailBoxs.find(
            (mailBox) => mailBox.id === this.currentMailBoxId
          );
        }
      });
  }

  checkIsPmSend() {
    const emailSender =
      this.senderOfMessage?.email || this.message?.user?.email;
    const isPmSend = this.listMailBoxes?.find(
      (item) => item?.emailAddress === emailSender
    );
    return isPmSend;
  }

  setSenderOfMessageValue() {
    if (!this.emailMetaData?.from?.length) return;
    this.senderOfMessage = this.emailMetaData.from[0];

    if (this.senderOfMessage.userType === EUserPropertyType.MAILBOX) {
      this.senderOfMessage = {
        ...this.senderOfMessage,
        pmName: this.message?.user?.firstName || this.message?.user?.lastName,
        pmUserId: this.message?.user?.userId,
        isSender: true
      };
    }

    const senderOfMessageUserRole =
      this.contactTitleByConversationPropertyPipe.transform(
        this.senderOfMessage as unknown as IParticipantContact,
        {
          isNoPropertyConversation:
            this.currentConversation?.isTemporaryProperty,
          isMatchingPropertyWithConversation:
            this.senderOfMessage?.propertyId ===
            this.currentConversation?.propertyId,
          showOnlyRole: true,
          showFullContactRole: true,
          showCrmStatus: true
        }
      ) as EExcludedUserRole;

    const senderOfMessageUserName =
      this.contactTitleByConversationPropertyPipe.transform(
        this.senderOfMessage as unknown as IParticipantContact,
        {
          isNoPropertyConversation:
            this.currentConversation?.isTemporaryProperty,
          isMatchingPropertyWithConversation:
            this.senderOfMessage?.propertyId ===
            this.currentConversation?.propertyId,
          showOnlyName: true
        }
      );

    this.senderOfMessage = {
      ...this.senderOfMessage,
      senderRole: this.excludedUserRole.includes(senderOfMessageUserRole)
        ? ''
        : senderOfMessageUserRole,
      senderName: senderOfMessageUserName
    };
  }

  getDisconnectArchivedMailBox() {
    combineLatest([
      this.inboxService.getIsDisconnectedMailbox(),
      this.inboxService.isArchiveMailbox$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([isArchiveMailbox, isDisconnectedMailbox]) => {
        this.isDisconnectedMailbox = isDisconnectedMailbox;
        this.isArchiveMailbox = isArchiveMailbox;
      });
  }

  subscribeSocketTask() {
    this.rxWebsocketService.onSocketTask
      .pipe(
        filter((data) => !!data && data?.type === SocketType.updateTask),
        takeUntil(this.destroy$)
      )
      .subscribe((data) => {
        this.requestItem.actionLinkedTaskHistory =
          this.requestItem?.actionLinkedTaskHistory.map((item) => {
            if (item?.taskId === data?.id) {
              return {
                ...item,
                title: data?.title
              };
            }
            return item;
          });
        this.mapRequestItemToDisplay();
        this.cdr.detectChanges();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentConversation']?.currentValue) {
      this.headerTitle = this.currentConversation?.streetline || 'No property';
      this.isTaskType = this.currentConversation?.taskType === TaskType.TASK;
      this.currentUserOfConversation =
        this.currentConversation?.participants?.find(
          (u) => u?.userId === this.currentConversation?.userId
        );
      if (this.currentUserOfConversation) {
        this.currentUserOfConversation.secondaryEmail =
          this.currentConversation?.secondaryEmail;
      }
    }

    if (changes['currentTask']?.currentValue) {
      this.showMessageHasLinkedTask = this.currentTask?.conversations?.some(
        (conversation) =>
          conversation.id === this.currentConversation?.id &&
          !!conversation.linkedTask
      );
    }

    if (changes['requestItem']?.currentValue) {
      this.mapRequestItemToDisplay();
    }

    if (changes['isLinkedConversationsExpanded']) {
      if (!this.isLinkedConversationsExpanded) {
        if (this.languageOriginalContent) {
          this.languageOriginalContent.showTranslatedContent = false;
        }
      }
    }

    if (changes['message']?.currentValue) {
      this.setSenderOfMessageValue();
    }
  }

  private mapRequestItemToDisplay() {
    const response = this.requestItem.options
      ?.response as unknown as ITicketResponse;

    if (response) {
      const {
        linkedConversations,
        messagesTranslate,
        languageCode,
        actionLinkedTaskHistory,
        ticketFiles,
        options
      } = this.requestItem || {};
      this.replied = this.requestItem?.linkedConversations?.some(
        (item: ILinkedConversation) => !!item?.replyConversationId
      );

      this.requestItemToDisplay = mapTicketToDisplayItem(
        response,
        this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS,
        {
          checkStatus: false,
          linkedConversations,
          ticketTrans: [
            EConversationType.APP,
            EConversationType.VOICE_MAIL
          ].includes(this.currentConversation?.conversationType)
            ? options.response.payload.ticket.ticketTrans
            : messagesTranslate,
          ticketLanguageCode: [
            EConversationType.APP,
            EConversationType.VOICE_MAIL
          ].includes(this.currentConversation?.conversationType)
            ? options.response.payload.ticket.ticketLanguageCode
            : languageCode,
          actionLinkedTaskHistory,
          ticketFiles
        }
      );

      this.mapLanguageOriginContent(this.requestItemToDisplay);
    }
  }

  mapLanguageOriginContent(requestItemToDisplay: IRequestItemToDisplay) {
    switch (requestItemToDisplay?.type) {
      case EOptionType.RESCHEDULE_INSPECTION_REQUEST:
        this.languageOriginContent = requestItemToDisplay.rescheduleInfo.reason;
        break;
      case EOptionType.FINAL_INSPECTION:
        this.languageOriginContent =
          requestItemToDisplay.finalInspectionRequest.availableTime;
        break;
      case EOptionType.VACATE_REQUEST:
        this.languageOriginContent = requestItemToDisplay.vacateInfo.note;
        break;
      default:
        this.languageOriginContent = requestItemToDisplay.originalContent;
        break;
    }
  }

  private mapActionItemOptions() {
    this.requestItem.options.response.payload.ticket = {
      ...this.requestItem.options.response.payload.ticket,
      firstName: this.currentUserOfConversation?.firstName,
      lastName: this.currentUserOfConversation?.lastName
    } as ITicket & {
      firstName: string;
      lastName: string;
    };
  }

  isChannelStatus(status, connectStatus) {
    return status?.status === connectStatus;
  }

  isDisconnectedAndArchived(channel, disconnectStatus, archiveStatus) {
    const isArchived = this.isChannelStatus(channel, archiveStatus);
    const isDisconnected =
      this.isChannelStatus(channel, disconnectStatus) &&
      this.isDisconnectedMailbox;
    return isArchived || isDisconnected;
  }

  get disableSendBtn() {
    const facebookMsg = this.isDisconnectedAndArchived(
      this.selectedFacebookMessenger,
      EPageMessengerConnectStatus.DISCONNECTED,
      EPageMessengerConnectStatus.ARCHIVED
    );

    const whatsappMsg = this.isDisconnectedAndArchived(
      this.selectedWhatsapp,
      WhatsAppConnectStatus.DISCONNECTED,
      WhatsAppConnectStatus.ARCHIVED
    );

    const otherMessage = [
      this.isDisconnectedMailbox,
      this.isArchiveMailbox
    ].includes(true);

    return facebookMsg || whatsappMsg || otherMessage;
  }

  async openSendMsgModal() {
    const tasks = [
      {
        taskId: this.currentConversation?.taskId,
        propertyId: [
          EConversationType.APP,
          EConversationType.VOICE_MAIL,
          EConversationType.EMAIL
        ].includes(this.currentConversation?.conversationType)
          ? this.currentConversation?.propertyId
          : this.message?.property?.id
      }
    ];
    this.sendMsgModalConfig['inputs.selectedTasksForPrefill'] = tasks;
    this.sendMsgModalConfig['footer.buttons.disableSendBtn'] =
      this.disableSendBtn;

    this.messageFlowService
      .openSendMsgModal(this.sendMsgModalConfig)
      .pipe(takeUntil(this.destroy$))
      .subscribe((rs) => {
        switch (rs.type) {
          case ESendMessageModalOutput.MessageSent:
            this.onSendMsg(rs.data);
            break;
          case ESendMessageModalOutput.Quit:
            this.resetConfig();
            break;
        }
      });
  }

  reloadMessageActionList() {
    this.converationSummaryService
      .getMessageSummary(this.currentConversation?.id)
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((pre, curr) => isEqual(pre, curr))
      )
      .subscribe((res) => {
        this.reloadMessageRequest.emit(res);
      });
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.resetConfig();
        this.reloadMessageActionList();
        this.widgetLinkedService.triggerRequestItem$.next(this.requestItem);
        if (!event.isDraft && event?.type !== ISendMsgType.SCHEDULE_MSG) {
          const dataForToast = {
            conversationId: event.data?.['conversation']?.id,
            taskId: event.data?.['task']?.id,
            isShowToast: true,
            type: SocketType.newTask,
            mailBoxId: event.mailBoxId,
            taskType: TaskType.MESSAGE,
            pushToAssignedUserIds: [],
            status:
              event.data?.['conversation']?.status || TaskStatusType.inprogress
          };
          const typeForToast = EToastCustomType.SUCCESS_WITH_VIEW_BTN;
          this.toastCustomService.openToastCustom(
            dataForToast,
            true,
            typeForToast
          );
        }
        if (event?.type === ISendMsgType.SCHEDULE_MSG) {
          this.toastCustomService.handleShowToastForScheduleMgsSend(
            event,
            (event?.data as ISendMsgSchedule)?.jobReminders[0]?.taskType,
            true
          );
        }
        break;
      default:
        break;
    }
  }

  handleNavigateLinkedTask(id) {
    this.navigatorService.setReturnUrl(this.router.url);
    this.showSidebarRightService.handleToggleSidebarRight(true);
    if (this.currentConversation?.conversationType === EConversationType.SMS) {
      this.headerService.headerState$.next({
        ...this.headerService.headerState$.value,
        currentTask: null
      });
    }
    this.router.navigate([stringFormat(AppRoute.TASK_DETAIL, id)], {
      replaceUrl: true,
      queryParams: {
        type: TaskType.TASK,
        keepReturnUrl: true
      }
    });
  }

  handleAddToTask() {
    this.stateModalAddToTask = EStateModalAddToTask.addItemToTask;
  }

  handleCloseModal() {
    this.stateModalAddToTask = null;
  }

  shouldHandleProcess(): boolean {
    return this.preventButtonService.shouldHandleProcess(
      EButtonTask.TASK_CREATE_MESSAGE,
      EButtonType.TASK
    );
  }

  handleReply() {
    if (!this.shouldHandleProcess()) return;
    if (this.isConsole) return;

    if (this.requestItem.draftMessages) {
      this.handleEditDraft(this.requestItem.draftMessages);
    } else {
      const dataReply = this.requestItem;
      this.sendMsgModalConfig['otherConfigs.isAutoPrefillDocument'] = true;
      if (
        this.currentConversation?.conversationType === EConversationType.EMAIL
      ) {
        this.setupReplyMessageConfigForEmail(dataReply);
      } else {
        this.setupReplyMessageConfigForOtherChannel(dataReply);
      }
      this.openSendMsgModal();
    }
  }

  private setupCommonReplyMessageConfig(
    message,
    isEditDraft: boolean,
    isEmail: boolean = false
  ) {
    if (!message) return;
    const { title, propertyId } = this.getTitlePropertyOfReplyRequest();
    const commonConfig = {
      'header.title': isEmail ? this.headerTitle : title,
      'body.prefillTitle':
        'Re: ' +
        (this.requestItem?.options?.response?.payload?.ticket
          ?.conversationTopic ||
          message?.options?.response?.payload?.ticket?.conversationTopic ||
          message?.options?.response?.payload?.ticket?.consoleTitle ||
          ''),
      'header.hideSelectProperty': true,
      'otherConfigs.disabledTitle': true,
      'otherConfigs.isForwardConversation': true,
      'otherConfigs.isValidSigContentMsg': true,
      'body.replyToMessageId': isEditDraft
        ? message?.replyToMessageId
        : message.messageId,
      'body.replyConversationId': isEmail
        ? this.currentConversation?.id
        : message.conversationId,
      'body.replyToMessageAI': isEmail
        ? this.currentConversation?.id
        : this.message?.conversationId,
      'body.sessionId': this.message?.sessionId,
      'otherConfigs.conversationPropertyId': isEmail
        ? this.getPropertyIdReplyForward()
        : propertyId,
      'body.ticketId': this.requestItem?.messageId,
      'body.isUrgentTicket':
        this.requestItem?.options?.response?.payload?.ticket?.isUrgent,
      'body.isReplyTicketOfConversation': true,
      'otherConfigs.isCreateMessageType': true,
      'body.isFromInlineMsg': false,
      'otherConfigs.replyViaEmailFrom':
        this.currentConversation?.conversationType,
      'otherConfigs.scheduleDraft':
        this.requestItem?.draftMessages?.sendOptions?.time,
      'body.typeSendMsg':
        this.requestItem?.draftMessages?.sendOptions?.type || SendOption.Send,
      'otherConfigs.isShowGreetingContent': true,
      'body.autoGenerateMessage': null,
      'body.replyQuote': this.mapQuoteMessageTicket()
    };

    const toFieldData =
      this.sendMsgModalConfig['body.prefillToCcBccReceiversList']?.to;
    if (
      this.currentConversation?.conversationType === EConversationType.EMAIL
    ) {
      if (!this.isPmSend && toFieldData?.length > 0 && !isEditDraft) {
        commonConfig['body.autoGenerateMessage'] = {
          receiverIds: toFieldData.map((receiver) => receiver.userId),
          description: ''
        };
      }
    } else {
      if (toFieldData?.length > 0 && !isEditDraft) {
        commonConfig['body.autoGenerateMessage'] = {
          receiverIds: toFieldData.map((receiver) => receiver.userId),
          description: ''
        };
      }
    }

    this.sendMsgModalConfig = {
      ...this.sendMsgModalConfig,
      ...commonConfig
    };
    this.mapActionItemOptions();
  }

  filterCurrentMailBox(listUser) {
    return (
      listUser?.filter(
        (one) => one.email !== this.currentMailBox.emailAddress
      ) || []
    );
  }

  private setupReplyMessageConfigForOtherChannel(
    message,
    isEditDraft: boolean = false
  ) {
    this.sendMsgModalConfig['body.prefillToCcBccReceiversList'] = this
      ?.emailMetaData?.to[0]?.email
      ? {
          to: this?.emailMetaData?.to
        }
      : null;
    this.setupCommonReplyMessageConfig(message, isEditDraft);
  }

  private setupReplyMessageConfigForEmail(
    message,
    isEditDraft: boolean = false
  ) {
    this.setupConfigFieldFrom(message.userId);
    this.rawMsg = '';
    this.sendMsgModalConfig['otherConfigs.replyMessage'] = message;
    this.sendMsgModalConfig['otherConfigs.filterSenderForReply'] =
      this.isTaskType || this.showMessageHasLinkedTask ? false : true;
    this.sendMsgModalConfig['otherConfigs.filterSenderForReplyInTask'] =
      this.isTaskType || this.showMessageHasLinkedTask ? true : false;

    if (!isEditDraft) {
      if (this.isPmSend) {
        const listPrefillTo = this.emailMetaData?.to || [];
        this.sendMsgModalConfig['body.prefillToCcBccReceiversList'] = {
          bcc: [],
          cc: this.emailMetaData?.cc.filter(
            (one) => !listPrefillTo.some((user) => user.email === one.email)
          ),
          to: listPrefillTo
        };
      } else {
        const listPrefillTo = this.emailMetaData?.from?.length
          ? this.emailMetaData?.from
          : [
              {
                email: this.message?.user?.email,
                userId: this.message?.user?.userId,
                firstName: this.message?.user?.firstName,
                lastName: this.message?.user?.lastName,
                propertyId:
                  this.currentConversation?.propertyId ||
                  this.currentTask?.property?.id,
                userType: this.message?.user?.userType,
                name: this.message?.user?.originalEmailName,
                userPropertyType: this.message?.user?.userPropertyType,
                secondaryEmailId: null
              }
            ];

        const listPrefillCc = this.filterCurrentMailBox([
          ...this.emailMetaData?.cc,
          ...this.emailMetaData?.to
        ]).filter(
          (one) => !listPrefillTo.some((user) => user.email === one.email)
        );

        const listPrefillBcc = this.filterCurrentMailBox(
          this.emailMetaData?.bcc
        ).filter(
          (one) =>
            !listPrefillTo.some((user) => user.email === one.email) &&
            !listPrefillCc.some((user) => user.email === one.email)
        );
        this.sendMsgModalConfig['body.prefillToCcBccReceiversList'] = this
          ?.emailMetaData?.to[0]?.email
          ? {
              bcc: listPrefillBcc,
              cc: listPrefillCc,
              to: listPrefillTo
            }
          : null;
      }
    }

    this.setupCommonReplyMessageConfig(message, isEditDraft, true);
  }

  checkReceiverInListMailbox(
    listMailBoxes: IMailBox[],
    listReceiver: IUserParticipant[]
  ) {
    return listReceiver?.find((receiver) =>
      listMailBoxes.some((mailBox) => {
        if (this.isTaskType || this.showMessageHasLinkedTask) {
          return (
            mailBox?.emailAddress === receiver?.email &&
            mailBox?.emailAddress === this.currentConversation?.mailBoxAddress
          );
        }
        return mailBox?.emailAddress === receiver?.email;
      })
    );
  }

  private getReceiverInListMailbox(
    listMailBoxes: IMailBox[],
    listReceiver: IParticipant[]
  ) {
    return listMailBoxes?.filter((receiver) =>
      listReceiver?.some((mailBox) => mailBox?.email === receiver?.emailAddress)
    );
  }

  private getTitlePropertyOfReplyRequest() {
    const isLastSession =
      this.message.sessionId === this.currentConversation.lastSessionId;

    if (isLastSession) {
      const {
        isTemporaryProperty,
        streetline: conversationStreetline,
        propertyId: conversationPropertyId
      } = this.currentConversation;
      return {
        title: isTemporaryProperty
          ? NO_PROPERTY
          : conversationStreetline || this.currentTask?.property?.streetline,
        propertyId: isTemporaryProperty ? null : conversationPropertyId
      };
    }

    const propertyId =
      !this.message?.property?.isTemporary && this.message?.property?.id;
    return {
      title: propertyId ? this.message.property.streetline : NO_PROPERTY,
      propertyId
    };
  }

  private mapQuoteMessageTicket() {
    const { displayName } = this.message;
    const { firstName, lastName } = this.emailMetaData?.to?.[0] || {};
    const { firstName: firstNameFrom, lastName: lastNameFrom } =
      this.emailMetaData?.from?.[0] || {};
    const channelUserName =
      displayName === 'Unrecognized'
        ? this.mapChannelUsernameUnrecognized
        : this.currentConversation?.conversationType === EConversationType.EMAIL
        ? combineNames(firstNameFrom, lastNameFrom)
        : combineNames(firstName, lastName);

    return this.messageService.mapReplyMessageTicket({
      ...this.requestItem,
      messageType: EMessageType.ticket,
      channelUserName: channelUserName
    });
  }

  get mapChannelUsernameUnrecognized() {
    const { phoneNumber, channelUser } = this.currentConversation;
    const phoneNumberSMS = this.phoneFormatPipe.transform(
      (channelUser?.externalId || phoneNumber) as string
    );

    switch (this.currentConversation?.conversationType) {
      case EConversationType.MESSENGER:
      case EConversationType.WHATSAPP:
      case EConversationType.APP:
        return this.channelUserName;
      case EConversationType.SMS:
        return phoneNumberSMS;
      case EConversationType.VOICE_MAIL:
        return phoneNumber;
      default:
        return '';
    }
  }

  handleEditDraft(message) {
    this.sendMsgModalConfig = {
      ...this.sendMsgModalConfig,
      'body.draftMessageId': message.id,
      'body.prefillSender':
        message.userId === trudiUserId
          ? trudiUserId
          : message.emailMetaData?.from?.[0]?.userId,
      'body.prefillSenderEmail': message.emailMetadata?.from?.[0]?.email,
      'body.prefillToCcBccReceiversList': {
        bcc: message.emailMetaData?.bcc,
        cc: message.emailMetaData?.cc,
        to: message.emailMetaData?.to
      }
    };
    this.sendMsgModalConfig['otherConfigs.isFromDraftFolder'] =
      this.router.url?.includes(ERouterLinkInbox.MSG_DRAFT);
    this.sendMsgModalConfig['otherConfigs.filterSenderForReplyInTask'] =
      this.isTaskType || this.showMessageHasLinkedTask ? true : false;

    if (message?.replyToMessageId) {
      if (
        this.currentConversation?.conversationType === EConversationType.EMAIL
      ) {
        this.setupReplyMessageConfigForEmail(message, true);
      } else {
        this.setupReplyMessageConfigForOtherChannel(message, true);
      }
    } else {
      this.sendMsgModalConfig = {
        ...this.sendMsgModalConfig,
        'otherConfigs.filterSenderForReply': false,
        'otherConfigs.isCreateMessageType': true,
        'header.title':
          this.isTaskType && !this.currentTask?.property?.isTemporary
            ? this.headerTitle
            : '',
        autoGenerateMessage: null,
        'header.isPrefillProperty': true,
        'body.isFromInlineMsg': false,
        'body.prefillTitle': message.title,
        'header.hideSelectProperty':
          this.isTaskType && !this.currentTask?.property?.isTemporary,
        'otherConfigs.conversationPropertyId': this.getPropertyIdEditDraft()
      };
    }

    this.listOfFiles = message.files || [];
    this.setupConfigContentMessage(message, true);

    this.contactsList = message?.options
      ?.contacts as unknown as ISelectedReceivers[];
    this.sendMsgModalConfig['inputs.listOfFiles'] = this.listOfFiles;
    this.sendMsgModalConfig['inputs.listContactCard'] = this.contactsList;
    this.sendMsgModalConfig['inputs.rawMsg'] = this.rawMsg;
    this.sendMsgModalConfig['otherConfigs.isShowGreetingContent'] = true;
    this.openSendMsgModal();
  }

  private getPropertyIdEditDraft() {
    const { isTemporary, id } = this.message?.property;
    const { isTemporaryProperty, propertyId } = this.currentConversation;

    if (
      [
        EConversationType.MESSENGER,
        EConversationType.SMS,
        EConversationType.WHATSAPP
      ].includes(this.currentConversation?.conversationType)
    ) {
      return !isTemporary ? id : null;
    }
    return !isTemporaryProperty ? propertyId : null;
  }

  setupConfigContentMessage(message, isEditDraft = false) {
    const messageText = message.message;
    const { msgContent, quote } = extractQuoteAndMessage(
      messageText || messageText === '' ? messageText : message.message || '',
      true
    );

    if (isEditDraft) {
      this.rawMsg = messageText;
      this.sendMsgModalConfig['body.replyQuote'] = null;
    } else {
      this.rawMsg = msgContent;
      this.sendMsgModalConfig['body.replyQuote'] = `${
        this.getTimestampAndSenderNameForQuote(message) + quote
      }`;
    }
  }

  getTimestampAndSenderNameForQuote({
    firstName,
    lastName,
    createdAt
  }: IMessage) {
    if (!createdAt || (!firstName && !lastName)) return '';
    const timeStamp = this.agencyDateFormatService.formatTimezoneDate(
      createdAt,
      this.agencyDateFormatService.getDateFormat().DATE_AND_TIME_FORMAT_DAYJS
    );
    return `<p>${timeStamp} from ${combineNames(firstName, lastName)}</p></br>`;
  }

  resetConfig() {
    this.listOfFiles = [];
    this.contactsList = [];
    this.sendMsgModalConfig = cloneDeep(defaultConfigsButtonAction);
    this.sendMsgModalConfig['body.replyQuote'] =
      this.messageService.mapReplyMessageTicket(this.requestItem);
  }

  handleForward() {
    if (!this.shouldHandleProcess()) return;
    if (this.isConsole) return;
    this.setupForwardMessageConfig();
    this.openSendMsgModal();
  }

  setupForwardMessageConfig() {
    this.sendMsgModalConfig = cloneDeep(
      this.isTaskType
        ? taskForwardConfigsButtonAction
        : defaultConfigsButtonAction
    );
    this.sendMsgModalConfig['otherConfigs.conversationPropertyId'] =
      this.getPropertyIdReplyForward();
    this.sendMsgModalConfig['autoGenerateMessage'] = null;
    this.sendMsgModalConfig['header.title'] =
      this.isTaskType && this.isTemporaryPropertyByConversationType()
        ? this.headerTitle
        : '';
    this.sendMsgModalConfig['header.hideSelectProperty'] =
      this.isTaskType && this.isTemporaryPropertyByConversationType();
    this.sendMsgModalConfig['header.isPrefillProperty'] = true;
    this.sendMsgModalConfig['otherConfigs.isCreateMessageType'] = true;
    this.sendMsgModalConfig['body.sessionId'] = this.message?.sessionId;
    this.sendMsgModalConfig['body.isFromInlineMsg'] = false;
    this.sendMsgModalConfig['body.prefillTitle'] =
      'Fwd: ' +
      (this.requestItem?.options?.response?.payload?.ticket
        ?.conversationTopic || '');
    this.sendMsgModalConfig['otherConfigs.isValidSigContentMsg'] = false;
    this.sendMsgModalConfig['otherConfigs.replyViaEmailFrom'] =
      this.currentConversation?.conversationType;

    this.mapActionItemOptions();
    this.sendMsgModalConfig['body.replyQuote'] = this.mapQuoteMessageTicket();
    this.sendMsgModalConfig['body.ticketId'] = this.requestItem?.messageId;
    this.sendMsgModalConfig['body.isReplyTicketOfConversation'] = false;
    this.sendMsgModalConfig['otherConfigs.isShowGreetingContent'] = true;
    this.sendMsgModalConfig['inputs.listOfFiles'] =
      this.requestItemToDisplay.ticketFiles;
    this.sendMsgModalConfig['otherConfigs.filterSenderForReply'] = this
      .isTaskType
      ? false
      : true;
    this.sendMsgModalConfig['otherConfigs.filterSenderForReplyInTask'] =
      this.isTaskType || this.showMessageHasLinkedTask ? true : false;
    this.setupConfigFieldFrom(this.message?.user?.userId);
    this.openSendMsgModal();
  }

  setupConfigFieldFrom(userId) {
    this.mailBoxShared = this.checkReceiverInListMailbox(
      this.listMailBoxes,
      this.emailMetaData?.to?.concat(this.emailMetaData?.cc)
    );
    const companyMailbox = this.listMailBoxes.find(
      (mailbox) =>
        isMailboxCompany(mailbox) && mailbox?.status === EMailBoxStatus.ACTIVE
    );
    this.sendMsgModalConfig['body.prefillSender'] =
      userId === trudiUserId
        ? trudiUserId
        : this.mailBoxShared
        ? this.mailBoxShared?.userId
        : this.emailMetaData?.from?.[0]?.userId;
    this.sendMsgModalConfig['body.prefillSenderEmail'] = this.mailBoxShared
      ? this.mailBoxShared?.email
      : this.emailMetaData?.from?.[0]?.email;
    this.sendMsgModalConfig['otherConfigs.replyMessageInTask'] = [
      this.currentMailBox?.emailAddress,
      companyMailbox?.emailAddress
    ];
  }

  private isTemporaryPropertyByConversationType() {
    if (
      [EConversationType.MESSENGER, EConversationType.WHATSAPP].includes(
        this.currentConversation?.conversationType
      )
    ) {
      return !this.message?.property?.isTemporary;
    }
    return !this.currentTask?.property?.isTemporary;
  }

  private getPropertyIdReplyForward() {
    const { isTemporary, id } = this.message?.property;
    const { isTemporaryProperty, propertyId } = this.currentConversation;

    if (
      [EConversationType.MESSENGER, EConversationType.WHATSAPP].includes(
        this.currentConversation?.conversationType
      )
    ) {
      return !isTemporary ? id : null;
    }
    return !isTemporaryProperty ? propertyId : null;
  }

  loadFile(file) {
    let resultsFile = { ...file };
    const fileTypeDot = this.filesService.getFileTypeDot(file.name);
    resultsFile.fileType =
      this.filesService.getFileTypeSlash(file?.fileType?.name) || fileTypeDot;
    resultsFile.fileType = file?.fileType?.name;
    resultsFile.fileName = file?.name;
    if (listThumbnailExtension.includes(fileTypeDot)) {
      resultsFile.fileType = fileTypeDot;
    }
    resultsFile.fileIcon = this.filesService.getFileIcon(file.name);
    resultsFile.extension = this.filesService.getFileExtensionWithoutDot(
      file.name
    );
    resultsFile.isUnsupportedFile = !ACCEPT_ONLY_SUPPORTED_FILE.includes(
      this.filesService.getFileExtensionWithoutDot(file?.fileName || file?.name)
    );
    this.dialogService.createDialog(ImagesCarouselModalComponent, {
      currentConversation: this.currentConversation,
      files: this.requestItemToDisplay.ticketFiles,
      file: resultsFile,
      ignore: true
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
