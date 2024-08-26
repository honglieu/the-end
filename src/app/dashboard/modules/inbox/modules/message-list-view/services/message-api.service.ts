import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  of,
  map,
  switchMap,
  Subject,
  Observable,
  finalize,
  tap
} from 'rxjs';
import { ApiService } from '@services/api.service';
import { TaskStatusType } from '@shared/enum/task.enum';
import { conversations } from 'src/environments/environment';
import {
  EMessageType,
  IMessageQueryParams,
  IPayloadForwardMailBox
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { MessageIdSetService } from './message-id-set.service';

@Injectable({
  providedIn: 'root'
})
export class MessageApiService {
  private refreshListMessage = new BehaviorSubject<IMessageQueryParams>(null);

  private refreshedListMessage = new Subject<void>();

  get refreshListMessage$(): Observable<IMessageQueryParams> {
    return this.refreshListMessage.asObservable();
  }

  get refreshedListMessage$(): Observable<void> {
    return this.refreshedListMessage.asObservable();
  }

  constructor(
    private apiService: ApiService,
    private messageIdSetService: MessageIdSetService
  ) {}

  public getMessages(payload: IMessageQueryParams) {
    const composedPayload = this.generateParams(payload);
    return this.apiService
      .postAPI(conversations, `v2/list-message`, composedPayload)
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
            if (!this.messageIdSetService.has(message.conversationId)) {
              this.messageIdSetService.insert(message.conversationId);
            }
          });
        })
      );
  }

  private getListMessageApi(payload: IMessageQueryParams) {
    return this.apiService
      .postAPI(conversations, `v2/list-message`, payload)
      .pipe(
        map((res) => {
          if (!res && !res.tasks) return [];
          // TODO: make condition for ignore filter message
          res.tasks = res.tasks.filter((message) => {
            return !this.messageIdSetService.has(message.conversationId);
          });
          res.tasks.forEach((message) => {
            this.messageIdSetService.insert(message.conversationId);
          });
          return { ...res, payload };
        }),
        finalize(() => this.refreshedListMessage.next())
      );
  }

  /**
   * @deprecated
   */
  public getListMessage() {
    return this.refreshListMessage.pipe(
      switchMap((res) => {
        if (res) {
          const payload = this.generateParams(res);
          return this.getListMessageApi(payload);
        }
        return of([]);
      })
    );
  }

  public forwardMessageToNewMailbox(payload: IPayloadForwardMailBox) {
    return this.apiService.postAPI(
      conversations,
      'forward-multiple-message-to-new-mail-box',
      payload
    );
  }

  public generateParams(payload): IMessageQueryParams {
    const { type, status, showMessageInTask } = payload;
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
      excludeConversation: false,
      showMessageInTask
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
  public getNewMessages(queryParams, messageIds: string[]) {
    const payload = this.generateParams(queryParams);
    payload['taskIds'] = messageIds;
    return this.getListMessageApi(payload);
  }

  public refreshMessageList(params) {
    this.refreshListMessage.next({
      ...(this.refreshListMessage.value || {}),
      ...params
    });
  }

  getDraftMessage(messageId: string) {
    return this.apiService.getAPI(conversations, 'draft-message', {
      messageId
    });
  }
}
