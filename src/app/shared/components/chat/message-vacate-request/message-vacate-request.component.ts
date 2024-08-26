import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Router } from '@angular/router';
import dayjs from 'dayjs';
import { TIME_FORMAT } from '@services/constants';
import { EInboxQueryParams } from '@shared/enum/inbox.enum';
import { EMessageComeFromType } from '@shared/enum/messageType.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import {
  EStatusTicket,
  FileMessage,
  IEmitNavigateTaskParams,
  IMessage,
  MessageObject,
  IMessageOptions,
  ITicket
} from '@shared/types/message.interface';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { Subject, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';
import { collapseMotion } from '@core';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { setTranslatedContent } from '@shared/feature/function.feature';
import { TaskType, TaskStatusType } from '@shared/enum/task.enum';
import {
  IParticipantContact,
  UserConversation
} from '@shared/types/conversation.interface';
import { TaskItem } from '@shared/types/task.interface';
import { IMailBox, IUserParticipant } from '@shared/types/user.interface';
import {
  ETypeMessage,
  ESentMsgEvent,
  ISendMsgTriggerEvent,
  ISendMsgType,
  ISelectedReceivers
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { TaskService } from '@services/task.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ConversationService } from '@services/conversation.service';
import { EButtonAction } from '@/app/task-detail/interfaces/task-detail.interface';
import { MessageService } from '@services/message.service';
import {
  defaultConfigsButtonAction,
  taskForwardConfigsButtonAction
} from '@/app/task-detail/modules/app-chat/components/button-action/utils/constant';
import { cloneDeep } from 'lodash-es';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EExcludedUserRole, EUserPropertyType } from '@shared/enum/user.enum';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { extractQuoteAndMessage } from '@/app/trudi-send-msg/utils/helper-functions';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { ContactTitleByConversationPropertyPipe } from '@shared/pipes/contact-title-by-property.pipe';
import { UserProfileDrawerService } from '@/app/task-detail/services/task-detail.service';
import { UserProperty } from '@shared/types/users-by-property.interface';
import { VoiceMailService } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/services/voice-mail.service';
import { PreventButtonService } from '@trudi-ui';
import { EButtonTask, EButtonType } from '@trudi-ui';

@Component({
  selector: 'vacate-request-ticket',
  templateUrl: './message-vacate-request.component.html',
  styleUrls: ['./message-vacate-request.component.scss'],
  animations: [collapseMotion]
})
export class MessageVacateRequestComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() data: IMessageOptions;
  @Input() createdFrom: EMessageComeFromType;
  @Input() taskId: string = '';
  @Input() isReadonly: boolean = false;
  @Input() message: IMessage;
  @Output() viewConversation = new EventEmitter();
  @Input() sessionEnded: boolean;
  @Output() emitNavigateTask = new EventEmitter<IEmitNavigateTaskParams>();
  @Output() updateDraftMsg = new EventEmitter();
  @Input() draftMsg: IMessage = null;
  @Input() isAppMessageLog: boolean = false;
  @Input() isUrgent: boolean = false;
  @Input() isConversationTypeApp: boolean = false;
  @Input() countListTicket: number;

  submitText: string;
  moveOutDate: string;
  note: string;
  updatedNote: string;
  type: string;
  updatedAt: string;
  ticket: ITicket;
  isLanguageTranslationDisabled: boolean = false;
  isAiAsistantPage: boolean = false;
  EStatusTicket = EStatusTicket;
  status: string;
  isOpenDescription: boolean = false;
  unsubscribe = new Subject<void>();
  public headerTitle: string = '';
  public sendMsgModalConfig: any = cloneDeep(defaultConfigsButtonAction);
  public currentMailBoxId: string;
  public currentMailBox: IMailBox;
  public isShowSendMsgModal: boolean = false;
  readonly TaskType = TaskType;
  public readonly typeMessage = ETypeMessage;
  public readonly taskStatusType = TaskStatusType;
  public countMetaDataLength: number = 0;
  public isUnidentifiedProperty: boolean;
  public currentConversation: UserConversation;
  public currentTask: TaskItem;
  public isTaskType: boolean = false;
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
  public isReplyAction: boolean;
  public rawMsg: string = '';
  public listOfFiles: FileMessage[] = [];
  public contactsList: ISelectedReceivers[] = [];
  public isDraftPage: boolean = false;

  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$.pipe(
    map((format) => TIME_FORMAT + ', ' + format)
  );
  readonly EMessageComeFromType = EMessageComeFromType;
  readonly EUserPropertyType = EUserPropertyType;

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
    public conversationService: ConversationService,
    private messageService: MessageService,
    private toastCustomService: ToastCustomService,
    private messageFlowService: MessageFlowService,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private readonly userProfileDrawerService: UserProfileDrawerService,
    private readonly voicemailInboxService: VoiceMailService,
    private preventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.isAiAsistantPage = this.router.url.includes(
      EInboxQueryParams.AI_ASSISTANT
    );
    this.isDraftPage = this.router.url.includes(ERouterLinkInbox.MSG_DRAFT);
    this.ticket = this.data?.response?.payload?.ticket;
    const { updatedAt, move_out_date, note, vacate_type, status } =
      this.data?.response?.payload?.ticket;
    this.status = status;
    this.submitText = this.getSubmitText(updatedAt, status);
    const isInvalidMoveOutDate =
      !move_out_date || move_out_date === 'Invalid date';
    this.updatedAt = updatedAt;
    this.moveOutDate = !isInvalidMoveOutDate
      ? dayjs(move_out_date, 'DD/MM/YYYY').format(
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
        )
      : '';
    this.note = note;
    this.type = vacate_type?.[0]?.value;
    this.inboxService
      .getCurrentMailBoxId()
      .pipe(
        takeUntil(this.unsubscribe),
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
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.headerTitle = res?.property?.streetline || 'No property';
        this.currentTask = res;
        this.isTaskType = res.taskType === TaskType.TASK;
      });
    this.conversationService.listConversationByTask
      .pipe(takeUntil(this.unsubscribe))
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
    this.subscribeCurrentConversation();
    this.sendMsgModalConfig['body.replyQuote'] =
      this.messageService.mapReplyMessageTicket(this.message);
  }

  ngOnChanges(changes: SimpleChanges) {
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
  }

  subscribeCurrentConversation() {
    combineLatest([
      this.conversationService.currentConversation,
      this.voicemailInboxService.currentVoicemailConversation$
    ])
      .pipe(takeUntil(this.unsubscribe))
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
        this.isShowSendMsgModal = false;
        this.checkDraftMsg(event.data);
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
    this.rawMsg = '';
    this.sendMsgModalConfig['body.replyQuote'] =
      this.messageService.mapReplyMessageTicket(this.message);
  }

  setupReplyMessageConfig(message) {
    const toFieldData =
      this.sendMsgModalConfig['body.prefillToCcBccReceiversList']?.to;
    this.sendMsgModalConfig['inputs.openFrom'] = TaskType.MESSAGE;
    this.sendMsgModalConfig['header.title'] = this.headerTitle;
    this.sendMsgModalConfig['body.prefillTitle'] =
      'Re: ' + (this.currentConversation.categoryName || '');
    this.sendMsgModalConfig['header.hideSelectProperty'] = true;
    this.sendMsgModalConfig['otherConfigs.disabledTitle'] = true;
    this.sendMsgModalConfig['otherConfigs.isForwardConversation'] = true;
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
    this.sendMsgModalConfig['inputs.openFrom'] = TaskType.MESSAGE;
    this.setupReplyMessageConfig(dataReply);
    this.openSendMsgModal();
  }

  setupConfigContentMessage(message) {
    const { msgContent, quote } = extractQuoteAndMessage(
      (message.message as MessageObject[])[0].value || message.message,
      true
    );
    this.listOfFiles = [
      ...(message.files?.fileList || []),
      ...(message.files?.mediaList || [])
    ];
    this.contactsList = message?.options
      ?.contacts as unknown as ISelectedReceivers[];
    this.rawMsg = msgContent;
    this.sendMsgModalConfig['body.replyQuote'] = `${quote}`;
    this.sendMsgModalConfig['inputs.rawMsg'] = this.rawMsg;
    this.sendMsgModalConfig['inputs.listOfFiles'] = this.listOfFiles;
    this.sendMsgModalConfig['inputs.listContactCard'] = this.contactsList;
  }

  handleButton(event: { type: EButtonAction; show: boolean }) {
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
      ? this.currentConversation?.propertyId
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
    this.openSendMsgModal();
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
      .pipe(takeUntil(this.unsubscribe))
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

  updateNote(isLanguageTranslationDisabled: boolean) {
    this.updatedNote = setTranslatedContent(
      this.ticket?.ticketLanguageCode,
      isLanguageTranslationDisabled,
      this.ticket?.ticketTrans,
      this.note
    );
  }

  getSubmitText(date: string, status: EStatusTicket): string {
    let text: string;
    switch (status) {
      case EStatusTicket.SUBMIT:
        text = 'Submitted';
        break;
      case EStatusTicket.CANCEL:
        text = 'Cancelled';
        break;
    }
    return `${text} at ${dayjs(date).format(
      'hh:mm a, ' +
        this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
    )}`;
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
          tempConversationId: null
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
            tempConversationId: null
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
        ticket: this.ticket
      });
    }
  }

  handleViewTicket() {
    this.isOpenDescription = !this.isOpenDescription;
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

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
