import { TaskService } from '@/app/services/task.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { debounceTime, filter, of, Subject, switchMap, takeUntil } from 'rxjs';
import { WidgetLinkedService } from '@/app/task-detail/modules/sidebar-right/services/widget-linked.service';
import {
  ILinkedActions,
  ITicketLinked,
  IUserMessage
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-linked/widget-linked.interface';
import { ToastCustomService } from '@/app/toast-custom/toast-custom.service';
import { EToastCustomType } from '@/app/toast-custom/toastCustomType';
import {
  EConversationType,
  EMailBoxStatus,
  IMailBox,
  ITicketFile,
  SocketType,
  TaskStatusType,
  TaskType
} from '@/app/shared';
import { Router } from '@angular/router';
import { AppRoute } from '@/app/app.route';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { SharedService } from '@/app/services/shared.service';
import { UserService } from '@/app/services/user.service';
import {
  combineNames,
  EMailBoxType,
  EMessageType,
  FileMessage,
  IMessage,
  SendOption
} from '@/app/shared';
import {
  ESendMessageModalOutput,
  MessageFlowService
} from '@/app/dashboard/modules/message-flow/services/message-flow.service';
import { cloneDeep } from 'lodash-es';
import { defaultConfigsButtonAction } from '@/app/task-detail/modules/app-chat/components/button-action/utils/constant';
import {
  extractQuoteAndMessage,
  isMailboxCompany
} from '@/app/trudi-send-msg/utils/helper-functions';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ERouterLinkInbox } from '@/app/dashboard/modules/inbox/enum/inbox.enum';
import { ISelectedReceivers } from '@/app/mailbox-setting/utils/out-of-office.interface';
import { trudiUserId } from '@/app/services/constants';
import { MessageService } from '@/app/services/message.service';
import {
  EMessageConversationType,
  ESentMsgEvent,
  ISendMsgSchedule,
  ISendMsgTriggerEvent,
  ISendMsgType
} from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { ITicket } from '@/app/dashboard/modules/inbox/modules/app-message-list/interfaces/message.interface';
import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { ECreateMessageFrom } from '@/app/trudi-send-msg/utils/trudi-send-msg.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { CompanyService } from '@/app/services/company.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { EButtonTask, EButtonType, PreventButtonService } from '@trudi-ui';
import { ImagesCarouselModalComponent } from '@/app/shared/components/images-carousel-modal/images-carousel-modal.component';
import { DialogService, FontSetting } from '@/app/services';
import { FilesService } from '@/app/services';

@Component({
  selector: 'widget-linked',
  templateUrl: './widget-linked.component.html',
  styleUrls: ['./widget-linked.component.scss']
})
export class WidgetLinkedComponent implements OnInit, OnDestroy {
  constructor(
    private widgetLinkedService: WidgetLinkedService,
    private router: Router,
    private userService: UserService,
    private sharedService: SharedService,
    private inboxService: InboxService,
    private widgetRMService: WidgetRMService,
    private companyService: CompanyService,
    private agencyService: AgencyService,
    private taskService: TaskService,
    public filesService: FilesService,
    private toastCustomService: ToastCustomService,
    private messageService: MessageService,
    private agencyDateFormatService: AgencyDateFormatService,
    private preventButtonService: PreventButtonService,
    private messageFlowService: MessageFlowService,
    private trudiSaveDraftService: TrudiSaveDraftService,
    private dialogService: DialogService<ImagesCarouselModalComponent>
  ) {}

  private unsubscribe = new Subject<void>();
  private currentTaskId: string;
  public isRmEnvironment: boolean;
  public linkedAction: ILinkedActions[] = [];
  public isConsole: boolean;
  public userMessage: IUserMessage;
  public inboxType: TaskStatusType;
  public ticketLinked: ITicketLinked;
  public ticketFiles: ITicketFile[];
  private rawMsg: string = '';
  private listOfFiles: FileMessage[] = [];
  private contactsList: ISelectedReceivers[] = [];
  private actionItem;
  public isOpenMenuAction: false;
  public isDisabledReply: boolean = false;
  public messageType = {
    VOICE_MAIL: 'voicemail',
    SMS: 'SMS',
    MESSENGER: 'FB messenger',
    WHATSAPP: 'Whatsapp',
    MOBILE: 'Trudi® app',
    EMAIL: 'Email'
  };
  private messageRouter = {
    [EConversationType.VOICE_MAIL]: AppRoute.VOICE_MAIL_MESSAGE_INDEX,
    [EConversationType.SMS]: AppRoute.SMS_MESSAGE_INDEX,
    [EConversationType.MESSENGER]: AppRoute.FACEBOOK_MESSAGE_INDEX,
    [EConversationType.APP]: AppRoute.APP_MESSAGE_INDEX,
    [EConversationType.WHATSAPP]: AppRoute.WHATSAPP_MESSAGE_INDEX,
    [EConversationType.EMAIL]: AppRoute.MESSAGE_INDEX
  };
  private sendMsgModalConfig = cloneDeep(defaultConfigsButtonAction);
  private requestSummaryAdditionalData;
  private currentMailbox: IMailBox;
  public isActionItemReplied: boolean;
  public listMailBoxes: IMailBox[] = [];
  public currentMailBoxId: string;
  public readonly EButtonTask = EButtonTask;
  public readonly EButtonType = EButtonType;
  public readonly FILE_UNSUPPORTED: string = 'question-mark.svg';
  public readonly EConversationType = EConversationType;

  ngOnInit() {
    const user = this.userService.userInfo$?.getValue();
    this.isConsole = this.sharedService.isConsoleUsers();

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
        if (listMailBoxs?.length) {
          this.listMailBoxes = listMailBoxs;
          this.currentMailbox = listMailBoxs?.find(
            (mailBox) => mailBox?.id === this.currentMailBoxId
          );
        }
      });

    this.trudiSaveDraftService
      .getIsSavedDraftMsg()
      .pipe(
        takeUntil(this.unsubscribe),
        debounceTime(300),
        filter((boolean) => boolean)
      )
      .subscribe((res) => {
        this.trudiSaveDraftService.setIsSavedDraftMsg(false);
        this.reloadLinkedAction();
      });

    this.widgetLinkedService.actionItemData$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.actionItem = rs?.actionItem;
        this.requestSummaryAdditionalData = rs?.additionalData;
        this.isActionItemReplied = this.actionItem?.linkedConversations?.some(
          (item) => !!item?.replyConversationId
        );
      });

    this.companyService
      .getCurrentCompany()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((company) => {
        this.isRmEnvironment = this.agencyService.isRentManagerCRM(company);
        if (this.isRmEnvironment) {
          this.subscribeCurrentTask();
        }
      });
    this.widgetLinkedService.linkedAction$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((value) => {
        const taskStatusType = value[0]?.conversation?.task?.agentTasks?.find(
          (value) => {
            value.userId.includes(user.id);
          }
        );
        this.inboxType = taskStatusType
          ? TaskStatusType.my_task
          : TaskStatusType.team_task;
        this.linkedAction = value;
        this.ticketFiles = []
          .concat(value[0]?.ticketFiles || [])
          .map((file) => {
            return {
              ...file,
              isFileUnsupported:
                this.filesService.getFileIcon(
                  file?.propertyDocument?.name || file.name
                ) === this.FILE_UNSUPPORTED
            };
          });
        this.userMessage = value[0]?.conversation?.user;
        this.ticketLinked = value[0]?.options?.response?.payload?.ticket;
        this.isDisabledReply = this.isConsole;
      });

    this.widgetLinkedService.triggerRequestItem$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.reloadLinkedAction();
      });
  }

  handleNavigateMessage() {
    const conversation = this.linkedAction[0].conversation;
    this.inboxService.triggerExpandedSummaryConversation$.next(true);
    this.linkedAction[0]?.sessionId &&
      this.inboxService.sessionIdLinkedTask$.next(
        this.linkedAction[0].sessionId
      );
    this.linkedAction[0]?.relatedMessageId &&
      this.inboxService.sessionIdLinkedTask$.next(
        this.linkedAction[0]?.relatedMessageId
      );
    this.inboxService.requestIdLinkedTask$.next(this.linkedAction[0].id);
    this.navigateToConversation(conversation);
  }

  navigateToConversation(conversation) {
    const baseQueryParams = {
      taskId: conversation.task.id,
      conversationType: conversation.conversationType,
      statusTask: conversation.status,
      status: conversation.task?.status,
      inboxType: this.inboxType,
      mailBoxId: conversation.mailBoxId,
      ...this.getChannelIdIfRequired(conversation),
      conversationId: conversation.id,
      lastSessionId:
        this.linkedAction?.[0]?.sessionId ||
        this.linkedAction?.[0]?.relatedMessageId
    };

    const route = this.messageRouter[conversation.conversationType];

    if (conversation.conversationType === EConversationType.EMAIL) {
      const statusUrl = {
        [TaskStatusType.open]: 'all',
        [TaskStatusType.resolved]: 'resolved',
        [TaskStatusType.deleted]: 'deleted'
      };

      this.router.navigate([route, statusUrl[conversation.status]], {
        queryParams: {
          ...baseQueryParams,
          showMessageInTask: true
        }
      });
    } else {
      this.router.navigate([route], {
        queryParams: baseQueryParams
      });
    }
  }

  subscribeCurrentTask() {
    this.taskService.currentTask$
      .pipe(
        takeUntil(this.unsubscribe),

        switchMap((task) => {
          this.currentTaskId = task?.id;
          return task?.id
            ? this.widgetRMService.getFullDataRMWidget(task?.id)
            : of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          this.widgetLinkedService.setLinkedActionBS(data.linkedActions);
        }
      });
  }

  handleUnlinkTask() {
    const conversation = this.linkedAction[0].conversation;
    const sessionId =
      this.linkedAction[0].sessionId ||
      this.linkedAction?.[0]?.relatedMessageId;
    const payload = {
      taskId: this.linkedAction[0].task.id,
      actionName: this.ticketLinked?.conversationTopic,
      isLinked: false,
      actionRequestId: this.linkedAction[0].id
    };

    this.widgetLinkedService.unLinkActionToTask(payload).subscribe(() => {
      this.widgetLinkedService.resetLinkedActionBS();
      this.toastCustomService
        .handleShowToastTaskDetailSubNav({
          title: 'Item unlinked from task'
        })
        .subscribe(() => {
          this.inboxService.triggerExpandedSummaryConversation$.next(true);
          sessionId && this.inboxService.sessionIdLinkedTask$.next(sessionId);
          this.navigateToConversation(conversation);
        });
    });
  }

  getChannelIdIfRequired(conversation) {
    const isRequired = [
      EConversationType.MESSENGER,
      EConversationType.WHATSAPP
    ].includes(conversation?.conversationType as EConversationType);
    return isRequired
      ? {
          channelId: conversation?.channelId
        }
      : {};
  }

  ngOnDestroy() {
    this.widgetLinkedService.resetLinkedActionBS();
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  private get linkedActionProperty() {
    return this.linkedAction?.[0]?.conversation?.property;
  }

  private get linkedActionPropertyId() {
    return this.linkedActionProperty?.isTemporary
      ? null
      : this.linkedActionProperty?.id;
  }

  private get linkedActionConversationType() {
    return this.linkedAction?.[0]?.conversation?.conversationType;
  }

  private get linkedActionUser() {
    return this.linkedAction?.[0]?.conversation?.user;
  }

  handleReply() {
    if (this.widgetLinkedService.isLoadingActionItem()) return;
    if (this.isConsole) return;

    if (this.actionItem?.draftMessages) {
      this.handleEditDraft(this.actionItem?.draftMessages);
    } else {
      const dataReply = this.actionItem;
      const conversation = this.linkedAction?.[0]?.conversation;
      this.sendMsgModalConfig['body.prefillReceiversList'] = [
        {
          id: conversation?.user?.id,
          propertyId: this.linkedActionPropertyId,
          ...(conversation?.user?.email &&
          conversation?.user?.secondaryEmails?.length
            ? {}
            : {
                secondaryEmailId: conversation?.user?.secondaryEmails?.[0]?.id
              })
        }
      ];
      this.sendMsgModalConfig['otherConfigs.isAutoPrefillDocument'] = true;
      this.setupReplyMessageConfig(dataReply);
      this.openSendMsgModal();
    }
  }

  handleForward() {
    if (this.widgetLinkedService.isLoadingActionItem()) return;
    if (this.isConsole) return;

    this.sendMsgModalConfig['otherConfigs.createMessageFrom'] =
      ECreateMessageFrom.TASK_HEADER;

    this.sendMsgModalConfig['autoGenerateMessage'] = null;

    this.sendMsgModalConfig['header.isPrefillProperty'] = true;
    this.sendMsgModalConfig['otherConfigs.isCreateMessageType'] = false;
    this.sendMsgModalConfig['body.isFromInlineMsg'] = false;
    this.sendMsgModalConfig['body.prefillTitle'] =
      'Fwd: ' + (this.ticketLinked?.conversationTopic || '');
    this.sendMsgModalConfig['otherConfigs.isValidSigContentMsg'] = false;
    this.sendMsgModalConfig['otherConfigs.replyViaEmailFrom'] =
      this.linkedActionConversationType;
    this.sendMsgModalConfig['inputs.listOfFiles'] = this.ticketFiles;
    this.mapActionItemOptions();
    this.sendMsgModalConfig['body.replyQuote'] =
      this.messageService.mapReplyMessageTicket({
        ...this.actionItem,
        messageType: EMessageType.ticket,
        ...(this.linkedActionConversationType ===
        EMessageConversationType.MESSENGER
          ? {
              displayName: this.requestSummaryAdditionalData.displayName,
              channelUserName: this.requestSummaryAdditionalData.channelUserName
            }
          : {})
      });
    this.sendMsgModalConfig['body.ticketId'] = this.linkedAction?.[0]?.id;
    this.sendMsgModalConfig['otherConfigs.isShowGreetingContent'] = true;

    this.setupConfigEmailMessage();
    this.openSendMsgModal();
  }

  setupConfigEmailMessage() {
    if (
      this.linkedAction[0]?.conversation?.conversationType ===
      EConversationType.EMAIL
    ) {
      this.sendMsgModalConfig['otherConfigs.filterSenderForReplyInTask'] = true;

      const companyMailbox = this.listMailBoxes.find(
        (mailbox) =>
          isMailboxCompany(mailbox) && mailbox?.status === EMailBoxStatus.ACTIVE
      );
      this.sendMsgModalConfig['body.prefillSender'] =
        this.linkedAction[0]?.conversation?.task?.agentTasks?.[0]?.userId;
      this.sendMsgModalConfig['body.prefillSenderEmail'] =
        this.currentMailbox?.emailAddress;
      this.sendMsgModalConfig['otherConfigs.replyMessageInTask'] = [
        this.currentMailbox?.emailAddress,
        companyMailbox?.emailAddress
      ];
    }
  }

  private openSendMsgModal() {
    const currentTask = this.taskService.currentTask$?.getValue();
    const propertyAddress =
      currentTask?.property?.streetline ||
      currentTask?.property?.shortenStreetline;
    if (propertyAddress) {
      this.sendMsgModalConfig['header.hideSelectProperty'] = true;
      this.sendMsgModalConfig['header.title'] = propertyAddress;
      this.sendMsgModalConfig['otherConfigs.conversationPropertyId'] =
        currentTask?.property?.id;
    } else {
      this.sendMsgModalConfig['header.hideSelectProperty'] = false;
      this.sendMsgModalConfig['header.title'] = null;
      this.sendMsgModalConfig['otherConfigs.conversationPropertyId'] =
        this.linkedActionPropertyId;
    }
    const tasks = [
      {
        taskId: currentTask?.id,
        propertyId: currentTask?.property?.id
      }
    ];
    this.sendMsgModalConfig['inputs.selectedTasksForPrefill'] = tasks;
    if (
      this.linkedAction[0].conversation?.conversationType !==
      EConversationType.EMAIL
    ) {
      this.sendMsgModalConfig['otherConfigs.senderTypes'] = [
        EMailBoxType.COMPANY
      ];
    }
    this.sendMsgModalConfig['otherConfigs.filterSenderForReply'] = false;

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

  private shouldHandleProcess(): boolean {
    return this.preventButtonService.shouldHandleProcess(
      EButtonTask.TASK_CREATE_MESSAGE,
      EButtonType.TASK
    );
  }

  setupReplyMessageConfig(message, isEditDraft: boolean = false) {
    if (!message) return;
    this.sendMsgModalConfig['body.prefillTitle'] =
      'Re: ' + (this.ticketLinked?.conversationTopic || '');
    this.sendMsgModalConfig['otherConfigs.disabledTitle'] = true;

    this.sendMsgModalConfig['otherConfigs.isForwardConversation'] = true;
    this.sendMsgModalConfig['otherConfigs.isValidSigContentMsg'] = true;
    this.sendMsgModalConfig['body.replyToMessageId'] = isEditDraft
      ? message?.replyToMessageId
      : this.linkedAction?.[0]?.id;
    this.sendMsgModalConfig['body.replyConversationId'] =
      message.conversationId;

    this.sendMsgModalConfig['body.ticketId'] = this.linkedAction?.[0]?.id;
    this.sendMsgModalConfig['body.isUrgentTicket'] =
      this.ticketLinked?.isUrgent;
    this.sendMsgModalConfig['body.isReplyTicketOfConversation'] = true;
    this.sendMsgModalConfig['otherConfigs.isCreateMessageType'] = false;
    this.sendMsgModalConfig['body.isFromInlineMsg'] = false;
    this.sendMsgModalConfig['otherConfigs.replyViaEmailFrom'] =
      this.linkedActionConversationType;
    this.sendMsgModalConfig['otherConfigs.scheduleDraft'] =
      this.actionItem?.draftMessages?.sendOptions?.time;
    this.sendMsgModalConfig['body.typeSendMsg'] =
      this.actionItem?.draftMessages?.sendOptions?.type || SendOption.Send;
    this.sendMsgModalConfig['body.taskReplyId'] =
      this.linkedAction[0]?.task?.id;
    this.sendMsgModalConfig['otherConfigs.isReplyTicket'] = true;
    this.sendMsgModalConfig['otherConfigs.isShowGreetingContent'] = true;

    if (this.linkedActionConversationType === EMessageConversationType.EMAIL) {
      this.sendMsgModalConfig['body.sessionId'] =
        this.requestSummaryAdditionalData.sessionId;
      this.sendMsgModalConfig['body.replyToMessageAI'] =
        this.linkedAction?.[0]?.conversation?.id;
    }

    if (
      this.linkedActionConversationType === EMessageConversationType.MESSENGER
    ) {
      this.sendMsgModalConfig['body.replyToMessageAI'] =
        this.linkedAction?.[0]?.conversation?.id;
      this.sendMsgModalConfig['body.sessionId'] =
        this.requestSummaryAdditionalData.sessionId;
      this.sendMsgModalConfig['body.prefillToCcBccReceiversList'] = this
        .requestSummaryAdditionalData.emailMetaData?.to[0]?.email
        ? {
            to: this.requestSummaryAdditionalData.emailMetaData?.to
          }
        : null;
    }

    this.mapActionItemOptions();
    this.sendMsgModalConfig['body.replyQuote'] =
      this.messageService.mapReplyMessageTicket({
        ...this.actionItem,
        messageType: EMessageType.ticket,
        ...(this.linkedActionConversationType ===
        EMessageConversationType.MESSENGER
          ? {
              displayName: this.requestSummaryAdditionalData.displayName,
              channelUserName: this.requestSummaryAdditionalData.channelUserName
            }
          : {})
      });

    const toFieldData = this.sendMsgModalConfig['body.prefillReceiversList'];

    if (toFieldData?.length > 0 && !isEditDraft) {
      this.sendMsgModalConfig['body.autoGenerateMessage'] = {
        receiverIds: toFieldData.map((receiver) => receiver?.id),
        description: ''
      };
    }

    this.setupConfigEmailMessage();
  }

  private handleEditDraft(message) {
    if (message?.replyToMessageId) {
      this.setupReplyMessageConfig(message, true);
    } else {
      this.sendMsgModalConfig = {
        ...this.sendMsgModalConfig,
        'otherConfigs.filterSenderForReply': false,
        'otherConfigs.isCreateMessageType': false,
        'body.isFromInlineMsg': false
      };
      this.sendMsgModalConfig['body.autoGenerateMessage'] = null;
      this.sendMsgModalConfig['header.isPrefillProperty'] = true;
      this.sendMsgModalConfig['body.prefillTitle'] = message.title;
    }

    this.listOfFiles = message.files || [];
    this.setupConfigContentMessage(message, true);

    this.contactsList = message?.options
      ?.contacts as unknown as ISelectedReceivers[];
    this.sendMsgModalConfig['inputs.listOfFiles'] = this.listOfFiles;
    this.sendMsgModalConfig['inputs.listContactCard'] = this.contactsList;
    this.sendMsgModalConfig['inputs.rawMsg'] = this.rawMsg;
    this.sendMsgModalConfig['body.draftMessageId'] = message.id;
    this.sendMsgModalConfig['body.prefillSender'] =
      message.userId === trudiUserId
        ? trudiUserId
        : message.emailMetaData?.from?.[0]?.userId;

    this.sendMsgModalConfig['body.prefillToCcBccReceiversList'] = message
      .emailMetaData?.to[0]?.email
      ? {
          bcc: message.emailMetaData?.bcc,
          cc: message.emailMetaData?.cc,
          to: message.emailMetaData?.to
        }
      : null;
    this.sendMsgModalConfig['otherConfigs.isFromDraftFolder'] =
      this.router.url?.includes(ERouterLinkInbox.MSG_DRAFT);
    this.openSendMsgModal();
  }

  private setupConfigContentMessage(message, isEditDraft = false) {
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

  private getTimestampAndSenderNameForQuote({
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

  private mapActionItemOptions() {
    this.actionItem.options.response.payload.ticket = {
      ...this.actionItem.options.response.payload.ticket,
      firstName: this.linkedActionUser?.firstName,
      lastName: this.linkedActionUser?.lastName
    } as ITicket & {
      firstName: string;
      lastName: string;
    };
  }

  onSendMsg(event: ISendMsgTriggerEvent) {
    switch (event.event) {
      case ESentMsgEvent.SUCCESS:
        this.resetConfig();
        this.reloadLinkedAction();
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
          const typeForToast = EToastCustomType.SUCCESS_WITHOUT_VIEW_BTN;
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

  resetConfig() {
    this.listOfFiles = [];
    this.contactsList = [];
    this.sendMsgModalConfig = cloneDeep(defaultConfigsButtonAction);
    this.sendMsgModalConfig['body.replyQuote'] =
      this.messageService.mapReplyMessageTicket(this.actionItem);
  }

  reloadLinkedAction() {
    this.widgetLinkedService.setLinkedActionBS(this.linkedAction);
  }

  loadFile(file) {
    this.dialogService.createDialog(ImagesCarouselModalComponent, {
      currentConversation: this.linkedAction[0].conversation,
      files: this.ticketFiles,
      file,
      ignore: true
    });
  }
}
