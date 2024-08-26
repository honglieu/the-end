import { SendOption } from '@shared/components/tiny-editor/tiny-editor.component';
import { IFile } from '@shared/types/file.interface';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  EConfirmContactType,
  EConversationAction,
  ERecognitionStatus,
  GroupType
} from '@/app/shared/enum';
import { ESmsActionTriggerFrom } from '@/app/dashboard/modules/inbox/modules/sms-view/utils/sms.enum';
import { Params } from '@angular/router';
import {
  EInboxFilterSelected,
  EMessageQueryType,
  IMessageQueryParams
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { SharedService } from '@/app/services/shared.service';
import { UserConversation } from '@/app/shared';
import { IReadTicket } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';

export interface sendOptions {
  time: string;
  type: SendOption;
}

export interface ISmsAction {
  option: EConversationAction;
  isTriggeredFrom: ESmsActionTriggerFrom;
  conversationIds?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SmsMessageListService {
  private isCreateNewMessage = new BehaviorSubject<boolean>(false);
  public isCreateNewMessage$ = this.isCreateNewMessage.asObservable();
  private isMoveToExistingTask = new BehaviorSubject<boolean>(false);
  public isMoveToExistingTask$ = this.isMoveToExistingTask.asObservable();
  private prefillDataAppMessage = new BehaviorSubject<{
    receivers?: ISelectedReceivers[];
    title?: string;
    content?: string;
    isCreateMessageFromUserProfile?: boolean;
    draftMessageId?: string;
    attachments?: IFile[];
    contacts?: ISelectedReceivers[];
    sendOptions: sendOptions;
  }>(null);
  public prefillDataAppMessage$ = this.prefillDataAppMessage.asObservable();
  public triggerRemoveMsgDraftFromOpen = new Subject();
  public triggerAutoGenChatGpt$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public triggerFilterScratchTicket: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public triggerSaveDraftFirstReply = new BehaviorSubject<boolean>(false);

  private smsAction$ = new BehaviorSubject<ISmsAction>(null);
  public smsAction = this.smsAction$.asObservable();

  private triggerExpandConversationSummary = new Subject<boolean>();

  public triggerExpandConversationSummary$ =
    this.triggerExpandConversationSummary.asObservable();

  public triggerCountTicketConversation = new BehaviorSubject<IReadTicket>(
    null
  );

  public triggerCountTicketConversation$ =
    this.triggerCountTicketConversation.asObservable();

  public selectedTicketId$ = new BehaviorSubject<string>('');

  constructor(private sharedService: SharedService) {}

  setTriggerCountTicketConversation(value: IReadTicket) {
    this.triggerCountTicketConversation.next(value);
  }

  setIsCreateNewMessage(value: boolean) {
    this.isCreateNewMessage.next(value);
  }

  setTriggerExpandConversationSummary(value: boolean) {
    this.triggerExpandConversationSummary.next(value);
  }

  setIsMoveToExistingTask(value: boolean) {
    this.isMoveToExistingTask.next(value);
  }

  setPreFillCreateNewMessage(value) {
    this.prefillDataAppMessage.next(value);
  }

  triggerSmsAction(value: ISmsAction) {
    this.smsAction$.next(value);
  }

  getUserRaiseMsgFromParticipants(conversation: UserConversation) {
    if (!conversation) return null;
    const {
      participants,
      propertyId: conversationPropertyId,
      userId,
      isTemporaryProperty
    } = conversation;
    const participant =
      participants?.find(
        (item) =>
          item.userId === userId && item.propertyId === conversationPropertyId
      ) || participants?.find((item) => item.userId === userId);
    if (!participant) return null;
    const { propertyId, isTemporary, type, recognitionStatus } =
      participant || {};
    const { SUPPLIER, OTHER } = EConfirmContactType;
    const noPropertyUser = [SUPPLIER, OTHER].includes(
      type as EConfirmContactType
    );
    const conversationHadNoProperty =
      isTemporaryProperty || !conversationPropertyId;
    const smsUserFromOtherProperty =
      !isTemporary && !noPropertyUser && propertyId !== conversationPropertyId;

    const isBelongToOtherProperties = conversationHadNoProperty
      ? false
      : smsUserFromOtherProperty ||
        (isTemporary &&
          recognitionStatus === ERecognitionStatus.MULTIPLE_CONTACT);

    return {
      ...participant,
      isBelongToOtherProperties,
      showUserName:
        (!isTemporary && !isBelongToOtherProperties) || //For user in property
        noPropertyUser //For supplier or other contact
    };
  }

  private isValidUUID(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );
  }
  mapPayloadSmsMessageList(
    queryParams: Params,
    ignoreParams: boolean = false,
    state
  ): IMessageQueryParams {
    const isConsole = this.sharedService.isConsoleUsers();

    const type = isConsole
      ? GroupType.TEAM_TASK
      : state?.selectedInboxType || queryParams[EMessageQueryType.INBOX_TYPE];
    const status = queryParams[EMessageQueryType.MESSAGE_STATUS];

    const assignedTo =
      !ignoreParams && type === GroupType.TEAM_TASK
        ? state?.selectedAgency?.length > 0
          ? state.selectedAgency
          : queryParams[EInboxFilterSelected.ASSIGNED_TO] || ''
        : [];

    const queryMessageStatus =
      state?.selectedStatus?.length > 0
        ? state.selectedStatus
        : queryParams[EInboxFilterSelected.MESSAGE_STATUS];
    const messageStatus = Array.isArray(queryMessageStatus)
      ? queryMessageStatus
      : queryMessageStatus
      ? [queryMessageStatus]
      : [];
    const propertyManagerId =
      state?.selectedPortfolio?.length > 0
        ? state.selectedPortfolio
        : queryParams[EInboxFilterSelected.PROPERTY_MANAGER_ID];

    const currentTaskId = this.isValidUUID(
      queryParams[EInboxFilterSelected.TASK_ID]
    )
      ? queryParams[EInboxFilterSelected.TASK_ID]
      : null;

    return {
      type,
      status,
      page: 0,
      pageLimit: 20,
      search: queryParams[EInboxFilterSelected.SEARCH],
      assignedTo,
      currentTaskId,
      messageStatus,
      propertyManagerId,
      mailBoxId:
        state?.mailBoxId ||
        state?.queryParams[EMessageQueryType.MAILBOX_ID] ||
        '',
      isLoading: true,
      labelId: queryParams[EInboxFilterSelected.EXTERNAL_ID]
    } as IMessageQueryParams;
  }
}
