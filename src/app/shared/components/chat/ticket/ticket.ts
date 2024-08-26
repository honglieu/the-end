import { EExcludedUserRole, EUserPropertyType } from '@shared/enum/user.enum';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import dayjs from 'dayjs';
import {
  EStatusTicket,
  FileMessage,
  IEmitNavigateTaskParams,
  IMessage,
  IPropertyDocument,
  ITicketFile,
  MessageObject
} from '@shared/types/message.interface';
import { TIME_FORMAT } from '@services/constants';
import { CdkDropList } from '@angular/cdk/drag-drop';
import { EMessageComeFromType } from '@shared/enum/messageType.enum';
import { Router } from '@angular/router';
import { EInboxQueryParams } from '@shared/enum/inbox.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { collapseMotion } from '@core';
import { Subject, combineLatest, of, switchMap, takeUntil } from 'rxjs';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { setTranslatedContent } from '@shared/feature/function.feature';
import { EButtonAction } from '@/app/task-detail/interfaces/task-detail.interface';
import {
  ESentMsgEvent,
  ETypeMessage,
  ISelectedReceivers,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TaskService } from '@services/task.service';
import { IMailBox, IUserParticipant } from '@shared/types/user.interface';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  IParticipantContact,
  UserConversation
} from '@shared/types/conversation.interface';
import { ConversationService } from '@services/conversation.service';
import { TaskItem } from '@shared/types/task.interface';
import { MessageService } from '@services/message.service';
import {
  defaultConfigsButtonAction,
  taskForwardConfigsButtonAction
} from '@/app/task-detail/modules/app-chat/components/button-action/utils/constant';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { cloneDeep } from 'lodash-es';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { extractQuoteAndMessage } from '@/app/trudi-send-msg/utils/helper-functions';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { EOptionType } from '@shared/enum';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { EButtonTask, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';

@Component({
  selector: 'app-chat-ticket',
  templateUrl: 'ticket.html',
  styleUrls: ['./ticket.scss'],
  animations: [collapseMotion]
})
export class ChatTicketComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('fileList1', { static: true }) fileList1:
    | string
    | CdkDropList
    | (string | CdkDropList);
  @Input() message;
  @Input() createdFrom: EMessageComeFromType;
  @Input() ticketCreator: any;
  @Input() timeCreated: Date;
  @Input() subtitle: string;
  @Input() status: string;
  @Input() sessionEnded: boolean;
  @Input() ticketCategoryInfo: {
    color: string;
    svg: string;
    name: string;
    consoleTitle: string;
    languageCode: string;
    ticketTrans: string;
    ticketLanguageCode: string;
    conversationId?: string;
    taskId?: string;
    taskType?: string;
  };
  @Input() fileList: ITicketFile[];
  @Input() widthInPercent?: number = 100;
  @Input() grayBorder? = false;
  @Input() showBoxShadow? = true;
  @Input() isUrgent: boolean = false;
  @Input() taskId: string = '';
  @Input() conversationLogId: string = '';
  @Input() isReadonly: boolean = false;
  @Output() fileOnClicked = new EventEmitter<{
    state: boolean;
    imageId: string;
  }>();
  @Output() viewConversation = new EventEmitter();
  @Output() emitNavigateTask = new EventEmitter<IEmitNavigateTaskParams>();
  @Output() updateDraftMsg = new EventEmitter();
  @Input() draftMsg: IMessage = null;
  @Input() type: string;
  @Input() isAppMessageLog: boolean = false;
  @Input() countListTicket: number;

  timeStamp: string;
  dateStamp: string;
  firstLetterFirstName: string = '';
  firstLetterLastName: string = '';
  EUserPropertyType = EUserPropertyType;
  isAiAsistantPage: boolean = false;
  EStatusTicket = EStatusTicket;
  isOpenDescription: boolean = false;
  isLanguageTranslationDisabled: boolean = false;
  updatedSubtitle: string = '';
  public headerTitle: string = '';
  public sendMsgModalConfig: any = cloneDeep(defaultConfigsButtonAction);
  public isTaskType: boolean = false;
  public currentMailBoxId: string;
  public currentMailBox: IMailBox;
  public isShowSendMsgModal: boolean = false;
  public isFowarding: boolean = false;
  readonly TaskType = TaskType;
  public readonly typeMessage = ETypeMessage;
  public readonly taskStatusType = TaskStatusType;
  public countMetaDataLength: number = 0;
  public isUnidentifiedProperty: boolean;
  public currentConversation: UserConversation;
  public currentTask: TaskItem;
  public listFileMessage: IPropertyDocument[];
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
  public isReplyAction: boolean;
  public rawMsg: string = '';
  public listOfFiles: FileMessage[] = [];
  public contactsList: ISelectedReceivers[] = [];
  public isDraftPage: boolean = false;

  readonly EOptionType = EOptionType;
  readonly TIME_FORMAT = TIME_FORMAT;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  readonly EMessageComeFromType = EMessageComeFromType;
  private destroy$ = new Subject<void>();
  public senderOfMessage: {
    senderName?: string;
    senderRole?: EExcludedUserRole | string;
    pmName?: string;
  } & IUserParticipant = null;

  public excludedUserRole = [
    EExcludedUserRole.BELONGS_TO_OTHER_PROPERTIES,
    EExcludedUserRole.UNRECOGNIZED,
    EExcludedUserRole.EMPTY
  ];

  constructor(
    private agencyDateFormatService: AgencyDateFormatService,
    private router: Router,
    private inboxFilterService: InboxFilterService,
    private taskService: TaskService,
    public inboxService: InboxService,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private toastCustomService: ToastCustomService,
    private messageFlowService: MessageFlowService,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private readonly userProfileDrawerService: UserProfileDrawerService,
    private readonly voicemailInboxService: VoiceMailService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['createdFrom']) {
      this.createdFrom = changes['createdFrom']?.currentValue?.replace(
        /_/g,
        ''
      );
      if (this.createdFrom === EMessageComeFromType.MOBILE) {
        this.createdFrom = EMessageComeFromType.APP;
      }
    }
    if (changes['message']?.currentValue) {
      this.countMetaDataLength = this.countMetaData(
        this.message?.emailMetadata
      );
      this.setSenderOfMessageValue();
    }
    if (changes['fileList']?.currentValue) {
      this.listFileMessage = this.fileList?.map((item) => {
        return {
          ...item.propertyDocument
        };
      });
    }
  }

  ngOnInit() {
    this.isAiAsistantPage = this.router.url.includes(
      EInboxQueryParams.AI_ASSISTANT
    );
    this.isDraftPage = this.router.url.includes(ERouterLinkInbox.MSG_DRAFT);
    this.timeStamp = dayjs(this.timeCreated).format('HH:mm');
    this.dateStamp = dayjs(this.timeCreated).format('ll');
    this.handleSetAvatarName();
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((mailBoxId) => {
          if (mailBoxId) {
            this.currentMailBoxId = mailBoxId;
            return this.inboxService.listMailBoxs$;
          } else {
            return of(null);
          }
        })
      )
      .subscribe((listMailBoxs) => {
        if (listMailBoxs.length) {
          this.currentMailBox = listMailBoxs.find(
            (mailBox) => mailBox.id === this.currentMailBoxId
          );
        }
      });
    this.taskService.currentTask$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res) return;
        this.headerTitle = res?.property?.streetline || 'No property';
        this.currentTask = res;
        this.isTaskType = res.taskType === TaskType.TASK;
      });
    this.conversationService.listConversationByTask
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (!res?.length) return;
        const isUnidentifiedContact = res?.[0]?.participants.some(
          (participant) =>
            !participant.type ||
            participant.type === EUserPropertyType.EXTERNAL ||
            !participant.email
        );
        this.isUnidentifiedProperty =
          res?.[0]?.createdFrom === EMessageComeFromType.VOICE_MAIL &&
          isUnidentifiedContact;
      });

    this.sendMsgModalConfig['body.replyQuote'] =
      this.messageService.mapReplyMessageTicket(this.message);
    this.subscribeCurrentConversation();
  }

  subscribeCurrentConversation() {
    combineLatest([
      this.conversationService.currentConversation,
      this.voicemailInboxService.currentVoicemailConversation$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([conversation, currentVoicemailConversation]) => {
        this.currentConversation = currentVoicemailConversation || conversation;
        this.setSenderOfMessageValue();
      });
  }

  handleQuit() {
    this.isShowSendMsgModal = false;
    this.resetConfig();
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.resetConfig();
        this.checkDraftMsg(event.data);
        this.isShowSendMsgModal = false;
        if (
          !event.isDraft &&
          (event?.type !== ISendMsgType.SCHEDULE_MSG || this.isReplyAction)
        ) {
          this.toastCustomService.handleShowToastMessSend(event);
        }
        if (event?.type === ISendMsgType.SCHEDULE_MSG && !this.isReplyAction) {
          this.toastCustomService.handleShowToastForScheduleMgsSend(event);
        }
        this.isReplyAction = false;
        break;
      default:
        break;
    }
  }

  checkDraftMsg(data) {
    if (data.message?.isDraft) {
      this.updateDraftMsg.emit();
    }
  }

  resetConfig() {
    this.listOfFiles = [];
    this.contactsList = [];
    this.sendMsgModalConfig = cloneDeep(defaultConfigsButtonAction);
    this.sendMsgModalConfig['body.replyQuote'] =
      this.messageService.mapReplyMessageTicket(this.message);
  }

  setupReplyMessageConfig(message) {
    const toFieldData =
      this.sendMsgModalConfig['body.prefillToCcBccReceiversList']?.to;
    this.sendMsgModalConfig['header.title'] = this.headerTitle;
    this.sendMsgModalConfig['body.prefillTitle'] =
      'Re: ' + (this.currentConversation.categoryName || '');
    this.sendMsgModalConfig['header.hideSelectProperty'] = true;
    this.sendMsgModalConfig['otherConfigs.disabledTitle'] = true;
    this.sendMsgModalConfig['otherConfigs.isForwardConversation'] = true;
    this.sendMsgModalConfig['otherConfigs.isValidSigContentMsg'] = true;
    this.sendMsgModalConfig['body.replyToMessageId'] = message.draft
      ? message.replyToMessageId
      : message.id;
    this.sendMsgModalConfig['body.autoGenerateMessage'] = null;
    this.sendMsgModalConfig['otherConfigs.conversationPropertyId'] = this
      .isTaskType
      ? this.currentTask?.property?.isTemporary
        ? this.currentConversation?.propertyId
        : null
      : null;
    if (toFieldData?.length > 0 && !message.isDraft) {
      this.sendMsgModalConfig['body.autoGenerateMessage'] = {
        receiverIds: toFieldData.map((receiver) => receiver.userId),
        description: ''
      };
    }
  }

  updateSubtitle(isLanguageTranslationDisabled: boolean) {
    this.updatedSubtitle = setTranslatedContent(
      this.ticketCategoryInfo?.ticketLanguageCode,
      isLanguageTranslationDisabled,
      this.ticketCategoryInfo?.ticketTrans,
      this.subtitle
    );
  }

  loadFile(document: any) {
    // this.propertyService.openFile(document);
    this.fileOnClicked.emit({ state: true, imageId: document.id });
  }

  getThumbnailMP4(link: string) {
    return link + '#t=5';
  }

  getFileType(type: string) {
    const fileType = type;
    if (fileType.includes('/pdf')) {
      return 'pdf';
    }
    if (fileType.includes('/mp4')) {
      return 'mp4';
    }
    if (fileType.includes('image/')) {
      return 'image';
    }
    if (fileType.includes('video/')) {
      return 'video';
    }
    return 'other';
  }

  shouldHandleProcess(): boolean {
    return this.preventButtonService.shouldHandleProcess(
      EButtonTask.NAVIGATE_CONVERSATION,
      EButtonType.TASK
    );
  }

  handleViewConversation() {
    if (!this.shouldHandleProcess()) return;
    this.inboxFilterService.setSearchDashboard(null);
    const { taskId, conversationType, conversationId, taskStatus, taskType } =
      this.currentConversation?.linkedConversationAppLog?.[0];
    const statusUrl = {
      [TaskStatusType.inprogress]: 'all',
      [TaskStatusType.completed]: 'resolved',
      [TaskStatusType.deleted]: 'deleted'
    };
    if (taskType === TaskType.TASK) {
      this.router.navigate(['dashboard', 'inbox', 'detail', taskId], {
        queryParams: {
          type: 'TASK',
          conversationType: conversationType,
          conversationId: conversationId,
          tab: null,
          fromScratch: null,
          appMessageCreateType: null,
          tempConversationId: null,
          pendingSelectFirst: null
        },
        queryParamsHandling: 'merge'
      });
      this.conversationService.currentConversation.next(null);
      this.inboxService.triggerConversationId$.next(conversationId);
    } else {
      this.router.navigate(
        ['dashboard/inbox/app-messages', statusUrl[taskStatus]],
        {
          queryParams: {
            status: taskStatus,
            taskId: taskId,
            conversationId: conversationId,
            taskTypeID: null,
            inboxType: TaskStatusType.team_task,
            fromScratch: null,
            appMessageCreateType: null,
            tempConversationId: null,
            pendingSelectFirst: null
          },
          queryParamsHandling: 'merge'
        }
      );
      this.conversationService.triggerGoToAppMessage$.next(true);
    }
  }

  handleNavigateToTask() {
    if (this.isAppMessageLog && this.countListTicket > 0) {
      this.conversationService.setSelectedAppMessageTicketId(this.message?.id);
    } else {
      this.emitNavigateTask.emit({
        taskId: this.taskId,
        status: this.status,
        ticket: this.ticketCategoryInfo
      });
    }
  }

  handleViewTicket() {
    this.isOpenDescription = !this.isOpenDescription;
  }

  handleSetAvatarName() {
    this.firstLetterFirstName = this.ticketCreator?.firstName?.charAt(0);
    this.firstLetterLastName = this.ticketCreator?.lastName?.charAt(0);
  }

  countMetaData(metaData) {
    return metaData?.to?.length + metaData?.cc?.length + metaData?.bcc?.length;
  }

  handleReply() {
    this.isReplyAction = true;
    const dataReply = this.draftMsg ? this.draftMsg : this.message;
    if (!this.draftMsg) {
      this.sendMsgModalConfig['body.prefillToCcBccReceiversList'] = {
        bcc: [],
        cc: [],
        to: dataReply?.emailMetadata?.from || []
      };
    } else {
      this.setupConfigContentMessage(this.draftMsg);
      this.sendMsgModalConfig['body.prefillToCcBccReceiversList'] = {
        bcc: dataReply?.emailMetadata?.bcc || [],
        cc: dataReply?.emailMetadata?.cc || [],
        to: dataReply?.emailMetadata?.to || []
      };
    }
    this.setupReplyMessageConfig(dataReply);
    this.openSendMsgModal();
  }

  setupConfigContentMessage(message) {
    const { msgContent, quote } = extractQuoteAndMessage(
      (message.message as MessageObject[])[0].value || message.message,
      true
    );
    this.rawMsg = msgContent;
    this.sendMsgModalConfig['body.replyQuote'] = `${quote}`;
    this.listOfFiles = [
      ...(message.files?.fileList || []),
      ...(message.files?.mediaList || [])
    ];
    this.contactsList = message?.options
      ?.contacts as unknown as ISelectedReceivers[];
    this.sendMsgModalConfig['inputs.listOfFiles'] = this.listOfFiles;
    this.sendMsgModalConfig['inputs.listContactCard'] = this.contactsList;
    this.sendMsgModalConfig['inputs.rawMsg'] = this.rawMsg;
  }

  async openSendMsgModal() {
    const tasks = [
      {
        taskId: this.currentTask?.id,
        propertyId:
          this.currentConversation?.propertyId || this.currentTask?.property?.id
      }
    ];
    this.sendMsgModalConfig['inputs.selectedTasksForPrefill'] = tasks;
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

  handleButton(event: { type: EButtonAction; show: boolean }) {
    this.isFowarding = false;
    if (event.show) {
      switch (event.type) {
        case EButtonAction.REPLY:
          this.handleReply();
          break;
        case EButtonAction.FORWARD:
          this.handleReplyForward();
          break;
        default:
          break;
      }
    }
  }

  handleReplyForward() {
    this.isReplyAction = false;
    this.sendMsgModalConfig = cloneDeep(
      this.isTaskType
        ? taskForwardConfigsButtonAction
        : defaultConfigsButtonAction
    );
    this.sendMsgModalConfig['otherConfigs.conversationPropertyId'] = this
      .isTaskType
      ? this.currentTask?.property?.isTemporary
        ? this.currentConversation?.propertyId
        : null
      : null;
    this.sendMsgModalConfig['autoGenerateMessage'] = null;
    this.sendMsgModalConfig['header.title'] =
      this.isTaskType && !this.currentTask?.property?.isTemporary
        ? this.headerTitle
        : '';
    this.sendMsgModalConfig['header.hideSelectProperty'] =
      this.isTaskType && !this.currentTask?.property?.isTemporary;
    this.sendMsgModalConfig['header.isPrefillProperty'] = true;
    this.sendMsgModalConfig['otherConfigs.isCreateMessageType'] =
      !this.isTaskType;
    this.sendMsgModalConfig['body.isFromInlineMsg'] = false;
    this.sendMsgModalConfig['body.prefillTitle'] =
      'Fwd: ' + (this.currentConversation.categoryName || '');
    this.sendMsgModalConfig['otherConfigs.isValidSigContentMsg'] = false;
    this.sendMsgModalConfig['body.replyQuote'] =
      this.messageService.mapReplyMessageTicket(this.message);
    this.sendMsgModalConfig['inputs.listOfFiles'] = this.listFileMessage;
    this.isFowarding = true;
    this.openSendMsgModal();
  }

  setSenderOfMessageValue() {
    if (!this.message?.emailMetadata?.from?.length) return;
    this.senderOfMessage = this.message.emailMetadata.from[0];

    if (this.senderOfMessage.userType === EUserPropertyType.MAILBOX) {
      this.senderOfMessage = {
        ...this.senderOfMessage,
        pmName: this.message.firstName || this.message.lastName || ''
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

  handleClickAvatar(event: MouseEvent) {
    event.stopPropagation();
    const dataUser = {
      ...this.senderOfMessage,
      createdFrom: this.message.createdFrom,
      fromPhoneNumber: this.message.fromPhoneNumber
    };
    this.userProfileDrawerService.toggleUserProfileDrawerVisibility(
      true,
      dataUser as unknown as UserProperty
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
