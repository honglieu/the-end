import { map, tap } from 'rxjs';
import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { FacebookIdSetService } from './facebook-id-set.service';
import {
  FacebookType,
  IFacebookQueryParams
} from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { agencies, conversations } from '@/environments/environment';
import { TaskStatusType } from '@/app/shared/enum';
import { SharedService } from '@/app/services/shared.service';

@Injectable({
  providedIn: 'root'
})
export class FacebookApiService {
  constructor(
    private readonly apiService: ApiService,
    private readonly facebookIdSetService: FacebookIdSetService,
    private readonly sharedService: SharedService
  ) {}

  getFacebookMessage(payload: IFacebookQueryParams) {
    const composedPayload = this.generateParams(payload);

    if (payload?.['taskIds']) {
      composedPayload['taskIds'] = payload['taskIds'];
    }

    return this.apiService
      .postAPI(conversations, `list-messenger-message`, composedPayload)
      .pipe(
        map((response) => {
          const { mailBoxId, status } = payload;
          const tasks =
            response?.tasks?.map((task) => ({
              ...task,
              mailBoxId,
              status
            })) ?? [];
          return { ...response, tasks, payload };
        }),
        tap((response) => {
          response.tasks.forEach((message) => {
            if (!this.facebookIdSetService.has(message.conversationId)) {
              this.facebookIdSetService.insert(message.conversationId);
            }
          });
        })
      );
  }

  public generateParams(payload): IFacebookQueryParams {
    const { type, status } = payload || {};

    return {
      type: this.getMessageType(type) || FacebookType.MY_MESSAGES,
      search: payload?.search || '',
      assignedTo: payload?.assignedTo ?? payload?.assignedTo,
      currentTaskId: payload?.currentTaskId ?? '',
      propertyManagerId: payload?.propertyManagerId ?? [],
      messageStatus: payload?.messageStatus ?? [],
      limit: payload?.limit,
      page: payload?.page,
      channelId: payload?.channelId,
      status: status?.toUpperCase() || TaskStatusType.inprogress,
      mailBoxId: payload?.mailBoxId
    };
  }

  private getMessageType(queryParamType: TaskStatusType) {
    switch (queryParamType) {
      case TaskStatusType.team_task:
        return FacebookType.TEAM_MESSAGES;
      default:
        return FacebookType.MY_MESSAGES;
    }
  }

  getInfoFacebookMessengerintegrate() {
    return this.apiService.getAPI(agencies, 'get-current-facebook-channel');
  }

  getMessengerHistory(
    conversationId: string,
    isRead: boolean = true,
    before: string = null,
    after: string = null,
    isViewMostRecent: boolean = false,
    useMaster: boolean = false,
    messageId?: string
  ) {
    const isConsole = this.sharedService.isConsoleUsers();
    let queryString = `history-messenger/${conversationId}?isRead=${
      !isConsole && isRead
    }&isViewMostRecent=${isViewMostRecent}`;
    if (after && !before) queryString += `&after=${after}`;
    if (before && !after) queryString += `&before=${before}`;
    if (useMaster) queryString += `&useMaster=${useMaster}`;
    if (messageId) queryString += `&messageId=${messageId}`;
    return this.apiService.getAPI(conversations, queryString);
  }

  getAllMessengerHistory(conversationId: string) {
    return this.apiService.getAPI(
      conversations,
      `history-messenger/${conversationId}/all`
    );
  }

  getConversationSummary(conversationId: string) {
    return this.apiService.getAPI(
      conversations,
      `get-message-summary-time-line?conversationId=${conversationId}`
    );
  }

  getContactSummarySession(conversationId: string, sessionId: string) {
    return this.apiService.getAPI(
      conversations,
      `get-contact-summary-session?conversationId=${conversationId}&sessionId=${sessionId}`
    );
  }
}
