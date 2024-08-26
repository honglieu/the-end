import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import { TaskSummary } from '@/app/task-detail/modules/app-chat/components/ai-summary/models';

@Injectable()
export class AISummaryApiService {
  constructor(private apiService: ApiService) {}

  public getSummary(
    taskId: string,
    conversationId?: string
  ): Observable<TaskSummary> {
    return this.apiService.getAPI(
      conversations,
      `task/ai-summary?taskId=${taskId}${
        conversationId ? '&conversationId=' + conversationId : ''
      }`
    );
  }

  public generateSummaryContent(
    conversationId: string,
    currentUserId: string,
    receiveUserId: string,
    toneOfVoice = 'Conversational',
    mailBoxId
  ) {
    type TResponse = { content: unknown; taskSummary: TaskSummary };
    return this.apiService.post<any, TResponse>(
      `${conversations}generate-summary-by-chat-gpt`,
      {
        conversationId,
        currentUserId,
        receiveUserId,
        toneOfVoice,
        mailBoxId
      }
    );
  }

  public updateSummaryMedia(
    taskId: string,
    conversationId: string,
    propertyDocumentIds: string[]
  ) {
    return this.apiService.putAPI(`${conversations}/task/ai-summary`, '', {
      taskId,
      conversationId,
      propertyDocumentIds
    });
  }
}
