import { ConversationService } from './conversation.service';
import { AgencyService } from '@services/agency.service';
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  of,
  map,
  tap,
  Subscription
} from 'rxjs';
import { IMessage, EScheduledStatus } from '@shared/types/message.interface';
import { agencies, conversations } from 'src/environments/environment';
import { UserService } from './user.service';
import { EMessageType } from '@shared/enum/index.enum';
import { EConversationType } from '@shared/enum/conversationType.enum';
import { EAddOn } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { EOptionType } from '@shared/enum/optionType.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import dayjs from 'dayjs';
import {
  extractTextFromQuote,
  formatMessageInLine
} from '@shared/feature/function.feature';
import { ICompany } from '@shared/types/company.interface';
import { EUserSendType } from '../dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.enum';

@Injectable({
  providedIn: 'root'
})
export class ChatGptService {
  // data share for multiple instance
  static enableSuggestReplySetting: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  static aiSettings: BehaviorSubject<AISetting[]> = new BehaviorSubject([]);

  public actionLimited: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public enableGenerate: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public replyContent: BehaviorSubject<string> = new BehaviorSubject(null);
  public replyFrom: BehaviorSubject<string> = new BehaviorSubject(null);
  public cancelChatGpt: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public onGenerate: BehaviorSubject<onGenerateType> = new BehaviorSubject(
    null
  );
  public onLoading: BehaviorSubject<IStatusType> = new BehaviorSubject(null);
  public onGenerated: BehaviorSubject<IStatusType> = new BehaviorSubject(null);
  public showPopover$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public generateBody: BehaviorSubject<generateGptBody> = new BehaviorSubject({
    toneOfVoice: 'Professional',
    currentUserId: this.userService.userInfo$.getValue()?.id,
    message: null,
    receiveUserId: null,
    conversationId: null,
    agencyId: null,
    description: null
  });
  public listMsgInCurrentConversation: IMessage[] = [];
  public chatGptSubscription = new Subscription();
  // any define type after code option define
  public codeOptions: BehaviorSubject<any> = new BehaviorSubject([]);

  constructor(
    private apiService: ApiService,
    private agencyService: AgencyService,
    private conversationService: ConversationService,
    private userService: UserService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  setSetting(companies: ICompany[]) {
    if (!companies?.length) return;
    const settings = companies.map((company) => ({
      agencyId: company.id,
      companyId: company.id,
      status: company.addOns.includes(EAddOn.SUGGESTED_REPLIES)
    }));
    ChatGptService.aiSettings.next(settings);
  }

  getSetting(): Observable<any> {
    return this.apiService
      .get(`${agencies}get-is-ai-setting-by-agency-id`)
      .pipe(
        tap((data) =>
          this.userService
            .checkIsPortalUser()
            .then(() =>
              ChatGptService.enableSuggestReplySetting.next(data?.isAISetting)
            )
        )
      );
  }

  // TODO: update next feature
  getActionLimitedApi(agencyId: string = null): Observable<any> {
    return of({}).pipe(
      tap((status) => this.setActionLimited('getActionLimitedApi', status))
    );
  }

  setActionLimited(action: string, value: boolean) {
    if (!action) throw Error('action not empty');
    this.enableGenerate.next(value);
  }

  get getActionLimited() {
    return this.enableGenerate.asObservable();
  }

  generateReply(
    listOfMessages: IMessage[],
    agencyId: string,
    isShow: boolean,
    isTellAIToGenerate: boolean = false,
    messageId?: string,
    sessionId?: string,
    userSendTypeFilterEnabled?: boolean
  ) {
    if (!isTellAIToGenerate) {
      const listOfMessagesClone = [...(listOfMessages || [])];
      const messages = this.validate(
        agencyId,
        listOfMessagesClone,
        false,
        userSendTypeFilterEnabled
      );
      if (messages.length < 1) return of(null);
      if (isShow) {
        this.onLoading.next({
          type: EBoxMessageType.INLINE_MESSAGE,
          status: true
        });
      }
      this.setGenerateBody(messages, messageId, sessionId);
    }

    this.enableGenerate.next(false);
    return this.generateReplyByChatGpt().pipe(
      finalize(() => {
        this.onLoading.next({
          type: EBoxMessageType.INLINE_MESSAGE,
          status: false
        });
        this.onGenerate.next(null);
      })
    );
  }

  generateMessageCopy(body) {
    this.onGenerate.next(null);
    this.onLoading.next({
      type: EBoxMessageType.TASK_EDITOR,
      status: true
    });
    this.enableGenerate.next(false);
    return this.apiService
      .postAPI(conversations, 'generate-for-task-editor-by-chat-gpt', body)
      .pipe(
        catchError(() => of(null)),
        finalize(() => {
          this.onLoading.next({
            type: EBoxMessageType.TASK_EDITOR,
            status: false
          });
        })
      );
  }

  generateSendMsg(body: IGenerateSendMsgBody) {
    return this.apiService.postAPI(
      conversations,
      'generate-for-send-message-model-by-chat-gpt',
      body
    );
  }

  callGenerateReplyByChatGpt(listOfMessages: IMessage[], agencyId: string) {
    const messages = this.validate(agencyId, listOfMessages, true);
    if (messages.length < 1) return of(null);

    this.setGenerateBody(messages);
    return this.generateReplyByChatGpt();
  }

  setGenerateBody(
    messages: IMessage[],
    messageId?: string,
    sessionId?: string
  ) {
    let message = '';
    const receiverId =
      this.conversationService.currentConversation.value?.userId ||
      messages[0].userId;
    if (
      messages &&
      messages.length === 1 &&
      messages[0]?.messageType === EMessageType.ticket
    ) {
      const ticketMessage = messages[0];
      message = this.getMessageContentOfTicketMessage(ticketMessage);
    } else {
      const currMessage =
        messages[messages.length - 1]?.textContent ||
        messages[messages.length - 1]?.message;
      //  fix above line. it has weird characters
      // worked when change to  const currMessage = messages[messages.length - 1]?.textContent;
      if (currMessage) {
        message = Array.isArray(currMessage)
          ? currMessage?.[0]?.value?.toString()
          : currMessage?.toString();
      }
    }
    const generatedBody = {
      ...this.generateBody.value,
      receiveUserId: receiverId,
      conversationId: messages[0].conversationId,
      message: message,
      sessionId
    };
    if (!!messageId) {
      generatedBody['messageId'] = messageId;
    }
    this.generateBody.next(generatedBody);
  }

  getMessageContentOfTicketMessage(ticketMessage: IMessage) {
    let message = '';
    const payloadTicket = ticketMessage?.options?.response?.payload?.ticket;
    const requestType =
      ticketMessage?.options?.response?.type || ticketMessage?.options?.type;
    const rescheduleInspectionStatus = ticketMessage?.options?.status || '';
    const ticketCategory = payloadTicket?.conversationTopic || '';
    switch (requestType) {
      case EOptionType.GENERAL_ENQUIRY:
        message = `${ticketCategory}. ${payloadTicket.general_inquiry}`;
        break;
      case EOptionType.MAINTENANCE_REQUEST:
        message = `${ticketCategory}. ${payloadTicket.maintenance_object}`;
        break;
      case EOptionType.RESCHEDULE_INSPECTION_REQUEST:
        message = `${ticketCategory}. Suggested date: ${this.formatDateForChatGpt(
          payloadTicket.date_availability
        )}. Suggested time: ${payloadTicket.time_availability}. Reason: ${
          payloadTicket.reschedule_reason
        }`;
        if (rescheduleInspectionStatus === EScheduledStatus.DECLINED) {
          message += `. This request is declined by property manager.`;
        }
        break;
      case EOptionType.RESCHEDULE_REQUEST:
        const optionData = ticketMessage?.options;
        message = `Reschedule request inspection. Start time: ${optionData.startTime}. End time: ${optionData.endTime}. Reason: ${optionData.reason}`;
        if (rescheduleInspectionStatus === EScheduledStatus.DECLINED) {
          message += `. This request is declined by property manager.`;
        }
        break;
      case EOptionType.VACATE_REQUEST:
        const vacateType = payloadTicket.vacate_type?.[0]?.value || '';
        message = `${ticketCategory}. Type: ${vacateType}. Intended move out date: ${this.formatDateForChatGpt(
          payloadTicket.move_out_date
        )}. Note: ${payloadTicket.note}`;
        break;
      default:
        break;
    }
    return message;
  }

  formatDateForChatGpt(date: string) {
    const { DATE_FORMAT_DAYJS } =
      this.agencyDateFormatService.dateFormat$.getValue();
    return dayjs(date, 'DD/MM/YYYY').format(DATE_FORMAT_DAYJS);
  }

  generateReplyByChatGpt() {
    let formattedMessage = formatMessageInLine(
      this.generateBody.value.message
    ).trim();
    if (!formattedMessage) {
      formattedMessage = extractTextFromQuote(this.generateBody.value.message);
    }
    this.generateBody.next({
      ...this.generateBody.value,
      message: formattedMessage
    });
    if (!this.generateBody.value.message) {
      return of(null);
    }
    if (!!this.generateBody.value.messageId) {
      return this.apiService.postAPI(
        conversations,
        'generate-for-send-message-model-by-chat-gpt',
        this.generateBody.value
      );
    }
    return this.apiService.postAPI(
      conversations,
      'generate-reply-by-chat-gpt',
      this.generateBody.value
    );
  }

  generateTaskTitle(message: any, agencyId: string) {
    if (!this.checkEnableSetting(agencyId)) {
      return of();
    }
    return this.apiService.postAPI(
      conversations,
      'generate-reply-by-chat-gpt',
      message
    );
  }

  checkEnableSetting(agencyId: string = null) {
    if (!agencyId) {
      agencyId = localStorage.getItem('companyId');
    }
    return ChatGptService.aiSettings.value.some(
      (item) => item.companyId === agencyId && item.status
    );
  }

  checkEnableSetting_v2(agencyId: string = null): Observable<boolean> {
    if (!agencyId) {
      agencyId = localStorage.getItem('agencyId');
    }
    return ChatGptService.aiSettings
      .asObservable()
      .pipe(
        map((settings) =>
          settings.some((item) => item.agencyId === agencyId && item.status)
        )
      );
  }

  validate(
    agencyId: string,
    listOfMessages: IMessage[],
    enableDefault: boolean = false,
    userSendTypeFilterEnabled: boolean = false
  ): IMessage[] {
    if (!this.checkEnableSetting(agencyId)) {
      return [];
    }

    if (
      !this.conversationService.currentConversation.value ||
      this.conversationService.currentConversation.value ==
        EConversationType.resolved.toString()
    ) {
      return [];
    }
    if (!enableDefault && !this.enableGenerate.value) {
      return [];
    }
    listOfMessages = listOfMessages.filter((item) => {
      return ![
        EMessageType.agentExpectation,
        EMessageType.agentJoin,
        EMessageType.agentStart,
        EMessageType.moveToTask,
        EMessageType.reopened,
        EMessageType.deleted,
        EMessageType.solved,
        EMessageType.changeProperty
      ].includes(item.messageType.toLocaleUpperCase() as EMessageType);
    });
    const lastMessage = listOfMessages[listOfMessages.length - 1];
    if (lastMessage.senderType === 'PM') {
      return [];
    }

    if (
      lastMessage?.messageType?.toUpperCase() === EMessageType.ticket &&
      (lastMessage?.options?.response?.type ===
        EOptionType.RESCHEDULE_INSPECTION_REQUEST ||
        lastMessage.options?.type === EOptionType.RESCHEDULE_REQUEST)
    ) {
      return [
        {
          ...lastMessage,
          message:
            lastMessage.options?.status +
            ' Reschedule requested ' +
            (lastMessage.options?.reason ||
              lastMessage.options?.response?.payload?.ticket
                ?.reschedule_reason ||
              '')
        }
      ];
    }
    if (
      lastMessage?.messageType?.toUpperCase() === EMessageType.ticket &&
      (lastMessage?.options?.response?.type === EOptionType.VACATE_REQUEST ||
        lastMessage.options?.response?.type ===
          EOptionType.MAINTENANCE_REQUEST ||
        lastMessage.options?.response?.type === EOptionType.GENERAL_ENQUIRY)
    ) {
      return [
        {
          ...lastMessage
        }
      ];
    }

    if (
      [EConversationType.WHATSAPP].includes(lastMessage.conversationType) &&
      lastMessage.userSendType === EUserSendType.USER
    ) {
      return [
        {
          ...lastMessage
        }
      ];
    }

    // Facebook Messenger user messages when the filter is enabled
    if (
      userSendTypeFilterEnabled &&
      lastMessage.userSendType === EUserSendType.USER
    ) {
      return this.filterRecentUserMessages(listOfMessages, 'userSendType');
    }

    const messageTypeText = EMessageType.defaultText.toString();
    const senderTypeAdmin = 'admin';
    const senderTypeTrudi = 'trudi';
    const messageExcluded = ['submit', 'yes', 'no', 'cancel'];
    // only get message after message PM reply
    const lastIndexMessagePMResponse = listOfMessages
      .map((mes) => mes.messageType + mes.senderType?.split(' ')[0])
      .lastIndexOf(messageTypeText + senderTypeAdmin);
    const lastIndexTrudiTextResponse = listOfMessages
      .map((mes) => mes.messageType + mes.senderType?.split(' ')[0])
      .lastIndexOf(messageTypeText + senderTypeTrudi);
    const indexForSliceMessage =
      lastIndexMessagePMResponse > lastIndexTrudiTextResponse
        ? lastIndexMessagePMResponse
        : lastIndexTrudiTextResponse;
    if (indexForSliceMessage > -1) {
      listOfMessages = listOfMessages.slice(
        indexForSliceMessage,
        listOfMessages.length
      );
    }
    const filteredMessages =
      listOfMessages.filter(({ messageType, senderType, message }) => {
        const isTextMessage = messageType === messageTypeText;
        const isUserSender =
          !senderType || senderType.split(' ')[0]?.includes('user');
        const isMessageExcluded = Array.isArray(message)
          ? messageExcluded.includes(message[0]?.value?.toString())
          : messageExcluded.includes(message?.toString());
        return isTextMessage && isUserSender && !isMessageExcluded;
      }) || [];
    return filteredMessages;
  }

  private filterRecentUserMessages(
    messages,
    senderField,
    defaultMessageType = EMessageType.defaultText.toString(),
    adminSenderType = 'admin',
    trudiSenderType = 'trudi',
    excludedMessages = ['submit', 'yes', 'no', 'cancel']
  ) {
    const findLastSenderIndex = (senderType) => {
      return messages
        .map(
          (msg) =>
            `${msg.messageType}${
              msg?.[senderField]?.toLowerCase().split(' ')[0]
            }`
        )
        .lastIndexOf(`${defaultMessageType}${senderType}`);
    };

    const lastAdminIndex = findLastSenderIndex(adminSenderType);
    const lastTrudiIndex = findLastSenderIndex(trudiSenderType);

    const sliceIndex = Math.max(lastAdminIndex, lastTrudiIndex);
    const relevantMessages =
      sliceIndex > -1 ? messages.slice(sliceIndex) : messages;

    return relevantMessages.filter((msg) => {
      const isDefaultType =
        msg?.messageType.toUpperCase() === defaultMessageType;
      const isFromUser =
        !msg?.[senderField] ||
        msg?.[senderField].toLowerCase().split(' ')[0]?.includes('user');
      const isExcluded = excludedMessages.includes(
        Array.isArray(msg.message)
          ? msg.message[0]?.value?.toString()
          : msg.message?.toString()
      );

      return isDefaultType && isFromUser && !isExcluded;
    });
  }

  getLastMsgFromCurrentConversation(agencyId: string = null) {
    return this.validate(agencyId, this.listMsgInCurrentConversation, true);
  }

  updateEnableGenerate(
    canSend: boolean,
    boxMessageType: EBoxMessageType = null
  ) {
    if (canSend) {
      this.enableGenerate.next(false);
    } else {
      this.onGenerated.next({
        type: boxMessageType,
        status: false
      });
      this.enableGenerate.next(true);
    }
  }

  reset() {
    this.replyContent.next(null);
    this.replyFrom.next(null);
    this.onGenerated.next(null);
    this.generateBody.next({
      ...this.generateBody.value,
      receiveUserId: null,
      message: null,
      conversationId: null,
      description: null
    });
  }

  setSendMessageConfigAIGenerate(sendMessageConfigs, data) {
    sendMessageConfigs['body.taskData'] = {
      ...(sendMessageConfigs['body.taskData'] || {}),
      essentialData: {
        noteId: data.notes,
        creditorInvoiceId: data.creditorInvoices,
        tenancyInvoiceId: data.tenancyInvoices,
        maintenanceInvoiceId: data.maintenanceInvoice,
        routineInspectionId: data.routineInspections,
        ingoingInspectionId: data.ingoingInspections,
        outgoingInspectionId: data.outgoingInspections,
        complianceId: data.compliances,
        calendarEventBreachRemedyId: data.calendarEventBreachRemedy,
        calendarEventEntryId: data.calendarEventEntry
      }
    };
  }

  processContentAI(content: string): string[] {
    let lines = content?.split('\n');
    const delimiter = 'Hi user_first_name,';
    if (lines[0]?.trim()?.length !== delimiter?.length) {
      const parts = lines[0]?.split(delimiter);
      const list = [delimiter, '', parts[1]?.trim()];
      lines = [...list, ...lines?.slice(1)];
    } else {
      lines[0] = lines[0]?.trim();
    }
    return lines;
  }
}

export interface generateGptBody {
  toneOfVoice: 'Professional' | 'Friendly';
  currentUserId: string;
  message: string;
  receiveUserId: string;
  conversationId: string;
  description: string;
  messageId?: string;
}

export interface IGenerateSendMsgBody {
  propertyId: string;
  currentUserId: string;
  receiveUserIds: string[];
  toneOfVoice: 'Professional' | 'Friendly';
  description: string;
  taskData: any;
  messageId?: string;
  sendToType?: string[];
  isSendBulkMessage?: boolean;
  sessionId?: string;
}

export interface onGenerateType {
  enable: boolean;
  skipValidate: boolean;
  show: boolean;
  isTellAIToGenerate?: boolean;
  messageId?: string;
}

export interface IStatusType {
  type: EBoxMessageType;
  status: boolean;
}

export enum EBoxMessageType {
  INLINE_MESSAGE = 'InlineMessage',
  POPUP = 'Popup',
  TASK_EDITOR = 'TASK_EDITOR'
}

export interface AISetting {
  agencyId: string;
  status: boolean;
  companyId: string;
}
