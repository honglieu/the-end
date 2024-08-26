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
import { ActivatedRoute, Router } from '@angular/router';
import dayjs from 'dayjs';
import { ToastrService } from 'ngx-toastr';
import { Subject, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ConversationService } from '@services/conversation.service';
import { PropertiesService } from '@services/properties.service';
import { RoutineInspectionService } from '@services/routine-inspection.service';
import { TaskService } from '@services/task.service';
import { EInboxQueryParams } from '@shared/enum/inbox.enum';
import { EMessageComeFromType } from '@shared/enum/messageType.enum';
import { TaskStatusType, TaskType } from '@shared/enum/task.enum';
import {
  EStatusTicket,
  FileMessage,
  IEmitNavigateTaskParams,
  IMessage,
  MessageObject,
  IMessageOptions,
  EScheduledStatus,
  ITicket
} from '@shared/types/message.interface';
import { InspectionSyncData } from '@shared/types/routine-inspection.interface';
import { RoutineInspectionSyncService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/routine-inspection.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { TIME_FORMAT } from '@services/constants';
import { collapseMotion } from '@core';
import { InboxFilterService } from '@/app/dashboard/modules/inbox/services/inbox-filter.service';
import { setTranslatedContent } from '@shared/feature/function.feature';
import {
  ESentMsgEvent,
  ETypeMessage,
  ISelectedReceivers,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  IParticipantContact,
  UserConversation
} from '@shared/types/conversation.interface';
import { IMailBox, IUserParticipant } from '@shared/types/user.interface';
import { EButtonAction } from '@/app/task-detail/interfaces/task-detail.interface';
import { TaskItem } from '@shared/types/task.interface';
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
import { ButtonKey, EButtonTask, EButtonType } from '@trudi-ui';
import { EOptionType } from '@shared/enum';

@Component({
  selector: 'app-message-rescheduled-request',
  templateUrl: './message-rescheduled-request.html',
  styleUrls: ['./message-rescheduled-request.scss'],
  animations: [collapseMotion]
})
export class MessageRescheduledRequestComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() isCreatedViaLink: boolean = false;
  @Input() createdFrom: EMessageComeFromType;
  @Input() message: IMessage;
  @Input() listRoutineInspection: InspectionSyncData[] = [];
  @Input() isReadonly: boolean = false;
  @Input() isHideCancelledButton: boolean = false;
  @Input() taskId: string = '';
  @Input() sessionEnded: boolean;
  @Output() triggerTicket = new EventEmitter<{
    conversationId: string;
    status: EScheduledStatus;
    cancelAIGenerate?: boolean;
  }>();
  @Output() viewConversation = new EventEmitter();
  @Output() emitNavigateTask = new EventEmitter<IEmitNavigateTaskParams>();
  @Output() updateDraftMsg = new EventEmitter();
  @Input() draftMsg: IMessage = null;
  @Input() isAppMessageLog: boolean = false;
  @Input() isUrgent: boolean = false;
  @Input() isConversationTypeApp: boolean = false;
  @Input() isRmEnvironment: boolean = false;
  @Input() countListTicket: number;

  showNextBtn = false;
  unsubscribe = new Subject<void>();
  scheduledStatus = EScheduledStatus;
  typePropertyTree = EPropertyTreeType;
  isRescheduleInspection = false;
  options: IMessageOptions;
  ticket: ITicket;
  title = 'Reschedule inspection';
  suggestedDate = '';
  suggestedTime = '';
  reason = '';
  updatedReason: string;
  status: EScheduledStatus;
  taskType: TaskType;
  isAiAsistantPage: boolean = false;
  EStatusTicket = EStatusTicket;
  isOpenDescription: boolean = false;
  isLanguageTranslationDisabled: boolean = false;
  public headerTitle: string = '';
  public isTaskType: boolean = false;
  public isReplyAction: boolean;
  public rawMsg: string = '';

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
  public listOfFiles: FileMessage[] = [];
  public contactsList: ISelectedReceivers[] = [];
  public isDraftPage: boolean = false;

  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$.pipe(
    map((format) => TIME_FORMAT + ', ' + format)
  );
  readonly EMessageComeFromType = EMessageComeFromType;
  public selectedTasks: ITasksForPrefillDynamicData[] = [];
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
    private routineInspectionService: RoutineInspectionService,
    private toastService: ToastrService,
    private taskService: TaskService,
    public widgetPTService: WidgetPTService,
    private activatedRoute: ActivatedRoute,
    public routineInspectionSyncService: RoutineInspectionSyncService,
    public inboxService: InboxService,
    public conversationService: ConversationService,
    private propertyService: PropertiesService,
    private router: Router,
    private agencyDateFormatService: AgencyDateFormatService,
    private inboxFilterService: InboxFilterService,
    private messageService: MessageService,
    private toastCustomService: ToastCustomService,
    private messageFlowService: MessageFlowService,
    private contactTitleByConversationPropertyPipe: ContactTitleByConversationPropertyPipe,
    private readonly userProfileDrawerService: UserProfileDrawerService,
    private readonly voicemailInboxService: VoiceMailService,
    private preventButtonService: PreventButtonService
  ) {
    this.activatedRoute.queryParamMap
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((queryParams) => {
        if (!this.taskType) {
          this.taskType = queryParams.get('type') as TaskType;
        }
      });
  }

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
  }

  ngOnInit(): void {
    this.isAiAsistantPage = this.router.url.includes(
      EInboxQueryParams.AI_ASSISTANT
    );
    this.isDraftPage = this.router.url.includes(ERouterLinkInbox.MSG_DRAFT);
    this.options = this.message.options;
    this.ticket = this.options?.response?.payload?.ticket;
    if (this.options.hasOwnProperty('response')) {
      const { availability, time_availability, reschedule_reason } =
        this.message.options.response.payload.ticket;
      this.suggestedDate = availability ? this.formatDateRes(availability) : '';
      this.suggestedTime = time_availability;
      this.reason = reschedule_reason;
    } else {
      this.suggestedDate = this.options?.startTime
        ? this.formatDate(this.options.startTime)
        : '';
      this.suggestedTime =
        this.options?.startTime && this.options?.endTime
          ? `${this.formatDate(
              this.options?.startTime,
              'hh:mm a'
            )} - ${this.formatDate(this.options?.endTime, 'hh:mm a')}`
          : '';
      this.reason = this.options?.reason;
    }
    this.status = this.options?.status?.toUpperCase() as EScheduledStatus;
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
    this.sendMsgModalConfig['header.title'] = this.headerTitle;
    this.sendMsgModalConfig['body.prefillTitle'] =
      'Re: ' + (this.currentConversation.categoryName || '');
    this.sendMsgModalConfig['header.hideSelectProperty'] = true;
    this.sendMsgModalConfig['otherConfigs.disabledTitle'] = true;
    this.sendMsgModalConfig['otherConfigs.isForwardConversation'] = true;
    this.sendMsgModalConfig['body.replyToMessageId'] = message.isDraft
      ? message.replyToMessageId
      : message.id;
    this.sendMsgModalConfig['otherConfigs.conversationPropertyId'] = this
      .isTaskType
      ? this.currentTask?.property?.isTemporary
        ? this.currentConversation?.propertyId
        : null
      : null;
    this.sendMsgModalConfig['body.autoGenerateMessage'] = null;
    if (toFieldData?.length > 0 && !message.isDraft) {
      this.sendMsgModalConfig['body.autoGenerateMessage'] = {
        receiverIds: toFieldData.map((receiver) => receiver.userId),
        description: ''
      };
    }
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
    this.rawMsg = msgContent;
    this.listOfFiles = [
      ...(message.files?.fileList || []),
      ...(message.files?.mediaList || [])
    ];
    this.contactsList = message?.options
      ?.contacts as unknown as ISelectedReceivers[];
    this.sendMsgModalConfig['body.replyQuote'] = `${quote}`;
    this.sendMsgModalConfig['inputs.listOfFiles'] = this.listOfFiles;
    this.sendMsgModalConfig['inputs.listContactCard'] = this.contactsList;
    this.sendMsgModalConfig['inputs.rawMsg'] = this.rawMsg;
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
    this.sendMsgModalConfig['inputs.openFrom'] = TaskType.MESSAGE;
    this.openSendMsgModal();
  }

  updateReason(isLanguageTranslationDisabled: boolean) {
    this.updatedReason = setTranslatedContent(
      this.ticket?.ticketLanguageCode,
      isLanguageTranslationDisabled,
      this.ticket?.ticketTrans,
      this.reason
    );
  }

  shouldHandleProcess(buttonKey: ButtonKey): boolean {
    return this.preventButtonService.shouldHandleProcess(
      buttonKey,
      EButtonType.TASK
    );
  }

  changeStatusRescheduleRequest(status: EScheduledStatus) {
    if (!this.shouldHandleProcess(EButtonTask.CHANGE_STATUS_RESCHEDULE_REQUEST))
      return;
    this.taskService.hasRescheduleRequest$.next(true);
    if (
      status === EScheduledStatus.APPROVED &&
      this.taskType === TaskType.TASK &&
      !this.isRmEnvironment
    ) {
      this.openWidgetRoutineInspection();
      if (
        this.message?.options?.response?.type ===
        EOptionType.RESCHEDULE_INSPECTION_REQUEST
      ) {
        this.handleChangStatus(status, true);
      }
      return;
    }
    this.handleChangStatus(status);
  }

  handleViewConversation() {
    if (!this.shouldHandleProcess(EButtonTask.NAVIGATE_CONVERSATION)) return;
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
        status: this.options?.response?.payload?.ticket?.status,
        ticket: this.ticket
      });
    }
  }

  handleViewTicket() {
    this.isOpenDescription = !this.isOpenDescription;
  }

  openWidgetRoutineInspection() {
    const item = this.listRoutineInspection.find(
      (routineInspection) =>
        routineInspection.id === this.message.options.inspectionId
    );
    this.routineInspectionSyncService.isSyncRoutineInSpection.next(true);
    if (item) {
      this.routineInspectionSyncService.setSelectedRoutineInspection({
        ...item,
        message: this.message
      });
    }

    this.widgetPTService.setPopupWidgetState(
      EPropertyTreeType.ROUTINE_INSPECTION
    );

    this.routineInspectionService.triggerSyncRoutineInSpection$.subscribe(
      (status) => {
        if (status === ESyncStatus.COMPLETED) {
          this.status = EScheduledStatus.APPROVED;
          this.handleTriggerTicket(this.message.conversationId, this.status);
        }
      }
    );
  }

  checkIfAgentJoined() {
    if (!this.conversationService.agentJoined()) {
      const currentConversationId =
        this.conversationService.currentConversation?.getValue()?.id;
      const propertyId = this.propertyService.newCurrentProperty.value.id;

      this.conversationService
        .agentJoinToConversation(currentConversationId, propertyId)
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((el) => {
          this.reloadTaskDetail();
        });
    } else {
      this.reloadTaskDetail();
    }
  }

  reloadTaskDetail() {
    this.taskService.reloadTrudiResponseReschedule.next(true);
    this.taskService.reloadTaskArea$.next(true);
    this.taskService.reloadTaskDetail.next(true);
  }

  handleChangStatus(status: EScheduledStatus, isCancelReload = false) {
    this.routineInspectionService
      .changeStatusRecheduled({ messageId: this.message.id, status: status })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          if (!res) return;
          this.status = status;
          this.handleTriggerTicket(
            this.message.conversationId,
            status,
            isCancelReload
          );
        },
        error: (err) => this.toastService.error(err.message)
      });
  }

  handleTriggerTicket(
    conversationId: string,
    status: EScheduledStatus,
    cancelAIGenerate = false
  ) {
    this.triggerTicket.emit({
      conversationId,
      status,
      cancelAIGenerate
    });
  }

  formatDate(time: string, regex?: string) {
    return this.agencyDateFormatService.formatTimezoneDate(
      time,
      regex ??
        'dddd ' +
          this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS
    );
  }

  formatDateRes(date: string) {
    return dayjs(date.split(' ')?.[0].substring(0, 19)).format(
      `dddd ${this.agencyDateFormatService.dateFormat$.value.DATE_FORMAT_DAYJS}`
    );
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
