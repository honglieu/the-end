import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Subject, Observable, finalize, tap } from 'rxjs';
import { ApiService } from '@services/api.service';
import { TaskStatusType } from '@shared/enum/task.enum';
import { auth, conversations } from 'src/environments/environment';
import {
  EMessageType,
  IMessageQueryParams
} from '@/app/dashboard/modules/inbox/modules/app-message-list/interfaces/message.interface';
import { SmsMessageConversationIdSetService } from '@/app/dashboard/modules/inbox/modules/sms-view/services/sms-message-id-set.service';
import { IPayloadGetSummary } from '@/app/dashboard/modules/inbox/modules/sms-view/utils/sms.interface';

@Injectable({
  providedIn: 'root'
})
export class SmsMessageApiService {
  private refreshListAppMessage = new BehaviorSubject<IMessageQueryParams>(
    null
  );
  private refreshedListAppMessage = new Subject<void>();

  get refreshListAppMessage$(): Observable<IMessageQueryParams> {
    return this.refreshListAppMessage.asObservable();
  }

  get refreshedListAppMessage$(): Observable<void> {
    return this.refreshedListAppMessage.asObservable();
  }

  constructor(
    private apiService: ApiService,
    private messageConversationIdSetService: SmsMessageConversationIdSetService
  ) {}

  public getAppMessages(payload: IMessageQueryParams) {
    const composedPayload = this.generateParams(payload);
    return this.apiService
      .postAPI(conversations, `list-sms-message`, composedPayload)
      .pipe(
        map((response) => {
          const { mailBoxId, status, type } = payload;
          const tasks =
            response?.tasks?.map((task) => ({
              ...task,
              mailBoxId,
              status,
              type
            })) ?? [];
          return { ...response, tasks, payload };
        }),
        tap((response) => {
          response.tasks.forEach((message) => {
            if (
              !this.messageConversationIdSetService.has(message?.conversationId)
            ) {
              this.messageConversationIdSetService.insert(
                message?.conversationId
              );
            }
          });
        })
      );
  }

  private getListAppMessageApi(payload: IMessageQueryParams) {
    return this.apiService
      .postAPI(conversations, `list-sms-message`, payload)
      .pipe(
        map((res) => {
          if (!res && !res.tasks) return [];
          // TODO: make condition for ignore filter message
          res.tasks = res.tasks.filter((message) => {
            return !this.messageConversationIdSetService.has(
              message?.conversationId
            );
          });
          res.tasks.forEach((message) => {
            this.messageConversationIdSetService.insert(
              message?.conversationId
            );
          });
          return { ...res, payload };
        }),
        finalize(() => this.refreshedListAppMessage.next())
      );
  }

  public generateParams(payload): IMessageQueryParams {
    const { type, status } = payload;
    const messageType = this.getMessageType(type);
    return {
      search: payload?.search || '',
      type: messageType || EMessageType.MY_MESSAGES,
      assignedTo: payload?.assignedTo ?? payload?.assignedTo,
      propertyManagerId: payload?.propertyManagerId ?? [],
      messageStatus: payload?.messageStatus ?? [],
      taskDeliveryFailIds: payload?.taskDeliveryFailIds ?? [],
      currentTaskId: payload?.currentTaskId ?? '',
      limit: payload.pageLimit,
      page: payload.page,
      status: status?.toUpperCase() || TaskStatusType.inprogress,
      mailBoxId: payload?.mailBoxId,
      labelId: payload?.labelId,
      onlyTask: false,
      topicId: '',
      propertyId: '',
      excludeUnHappyPath: false,
      excludeConversation: false
    };
  }

  private getMessageType(queryParamType: TaskStatusType) {
    switch (queryParamType) {
      case TaskStatusType.my_task:
        return EMessageType.MY_MESSAGES;
      case TaskStatusType.team_task:
        return EMessageType.TEAM_MESSAGES;
      case TaskStatusType.unassigned:
        return EMessageType.UNASSIGNED;
      default:
        return EMessageType.MY_MESSAGES;
    }
  }

  // handle new message when catch socket type NEW_MESSAGES
  public getNewSMSMessages(queryParams, messageIds: string[]) {
    const payload = this.generateParams(queryParams);
    payload['taskIds'] = messageIds;
    return this.getListAppMessageApi(payload);
  }

  public refreshMessageList(params) {
    this.refreshListAppMessage.next({
      ...(this.refreshListAppMessage.value || {}),
      ...params
    });
  }

  getActionDetail(
    conversationId: string,
    mailBoxId: string,
    companyId: string
  ) {
    return this.apiService.postAPI(conversations, 'get-action-detail', {
      conversationId,
      mailBoxId,
      companyId
    });
  }

  getSummaryOfConversation(payload: IPayloadGetSummary) {
    const { conversationId, currentUserId, receiveUserId, taskId } =
      payload || {};
    return this.apiService.postAPI(conversations, 'get-conversation-summary', {
      conversationId,
      currentUserId,
      receiveUserId,
      taskId
    });
  }

  getContactSummarySession(conversationId: string, sessionId: string) {
    return this.apiService.getAPI(
      conversations,
      `get-contact-summary-session?conversationId=${conversationId}&sessionId=${sessionId}`
    );
  }

  getMediaLinkTracking(shortLink: string) {
    return this.apiService.getAPI(
      auth,
      `media-link-tracking?shortLink=${shortLink}`
    );
  }
}
