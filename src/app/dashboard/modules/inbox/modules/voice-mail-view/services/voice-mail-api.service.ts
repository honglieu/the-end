import { ApiService } from '@services/api.service';
import { conversations } from '@/environments/environment';
import { Injectable } from '@angular/core';
import {
  IVoiceMailQueryParams,
  VoiceMailType
} from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { map, tap } from 'rxjs';
import { TaskStatusType } from '@shared/enum';
import { VoiceMailIdSetService } from './voice-mail-id-set.service';
import { SharedService } from '@/app/services';

@Injectable({
  providedIn: 'root'
})
export class VoiceMailApiService {
  constructor(
    private readonly apiService: ApiService,
    private readonly sharedService: SharedService,
    private readonly voiceMailIdSetService: VoiceMailIdSetService
  ) {}

  getVoiceMailMessage(payload: IVoiceMailQueryParams) {
    const composedPayload = this.generateParams(payload);

    if (payload?.['taskIds']) {
      composedPayload['taskIds'] = payload['taskIds'];
    }

    return this.apiService
      .postAPI(conversations, `list-voicemail-message`, composedPayload)
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
            if (!this.voiceMailIdSetService.has(message.conversationId)) {
              this.voiceMailIdSetService.insert(message.conversationId);
            }
          });
        })
      );
  }

  public generateParams(payload): IVoiceMailQueryParams {
    const { type, status } = payload || {};

    return {
      type: this.getMessageType(type) || VoiceMailType.MY_MESSAGES,
      search: payload?.search || '',
      assignedTo: payload?.assignedTo ?? payload?.assignedTo,
      currentTaskId: payload?.currentTaskId ?? '',
      propertyManagerId: payload?.propertyManagerId ?? [],
      messageStatus: payload?.messageStatus ?? [],
      limit: payload?.limit,
      page: payload?.page,
      taskIds: payload?.taskIds,
      status: status?.toUpperCase() || TaskStatusType.inprogress,
      mailBoxId: payload?.mailBoxId
    };
  }

  private getMessageType(queryParamType: TaskStatusType) {
    switch (queryParamType) {
      case TaskStatusType.team_task:
        return VoiceMailType.TEAM_MESSAGES;
      default:
        return VoiceMailType.MY_MESSAGES;
    }
  }

  readTicket(conversationId) {
    return this.apiService.putAPI(
      conversations,
      `read-ticket/${conversationId}`
    );
  }

  getVoiceMailHistory(
    conversationId: string,
    isRead: boolean = true,
    before: string = null,
    after: string = null,
    isViewMostRecent: boolean = false,
    useMaster: boolean = false,
    messageId?: string
  ) {
    const isConsole = this.sharedService.isConsoleUsers();
    let queryString = `history-voicemail/${conversationId}?isRead=${
      !isConsole && isRead
    }&isViewMostRecent=${isViewMostRecent}`;
    if (after && !before) queryString += `&after=${after}`;
    if (before && !after) queryString += `&before=${before}`;
    if (useMaster) queryString += `&useMaster=${useMaster}`;
    if (messageId) queryString += `&messageId=${messageId}`;
    return this.apiService.getAPI(conversations, queryString);
  }
}
