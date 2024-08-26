import { map, tap } from 'rxjs';
import { Injectable } from '@angular/core';
import { ApiService } from '@/app/services/api.service';
import { WhatsappIdSetService } from './whatsapp-id-set.service';
import {
  WhatsappType,
  IWhatsappQueryParams
} from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';
import { agencies, conversations } from '@/environments/environment';
import { TaskStatusType } from '@/app/shared/enum';
import { SharedService } from '@/app/services/shared.service';

@Injectable({
  providedIn: 'root'
})
export class WhatsappApiService {
  constructor(
    private readonly apiService: ApiService,
    private readonly whatsappIdSetService: WhatsappIdSetService,
    private readonly sharedService: SharedService
  ) {}

  getWhatsappMessage(payload: IWhatsappQueryParams) {
    const composedPayload = this.generateParams(payload);

    if (payload?.['taskIds']) {
      composedPayload['taskIds'] = payload['taskIds'];
    }

    return this.apiService
      .postAPI(conversations, `list-whatsapp-message`, composedPayload)
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
            if (!this.whatsappIdSetService.has(message.conversationId)) {
              this.whatsappIdSetService.insert(message.conversationId);
            }
          });
        })
      );
  }

  public generateParams(payload): IWhatsappQueryParams {
    const { type, status } = payload || {};

    return {
      type: this.getMessageType(type) || WhatsappType.MY_MESSAGES,
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
        return WhatsappType.TEAM_MESSAGES;
      default:
        return WhatsappType.MY_MESSAGES;
    }
  }

  getInfoWhatsAppIntegrate() {
    return this.apiService.getAPI(agencies, 'get-current-whatsapp-channel');
  }

  getMessageHistory(
    conversationId: string,
    isRead: boolean = true,
    before: string = null,
    after: string = null,
    isViewMostRecent: boolean = false,
    useMaster: boolean = false,
    messageId?: string
  ) {
    const isConsole = this.sharedService.isConsoleUsers();
    let queryString = `history-whatsapp/${conversationId}?isRead=${
      !isConsole && isRead
    }&isViewMostRecent=${isViewMostRecent}`;
    if (after && !before) queryString += `&after=${after}`;
    if (before && !after) queryString += `&before=${before}`;
    if (useMaster) queryString += `&useMaster=${useMaster}`;
    if (messageId) queryString += `&messageId=${messageId}`;
    return this.apiService.getAPI(conversations, queryString);
  }

  getAllMessageHistory(conversationId: string) {
    return this.apiService.getAPI(
      conversations,
      `history-whatsapp/${conversationId}/all`
    );
  }
}
