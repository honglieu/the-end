import { ApiService } from '@services/api.service';
import { conversations } from '@/environments/environment';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  ILoadFile,
  IMessageSummary
} from '@/app/task-detail/modules/summary-message-dialog/interface/message-summary.interface';
import { EConversationType } from '@/app/shared';
@Injectable({
  providedIn: 'root'
})
export class SummaryMessageDialogService {
  public triggerMessageSummary$ = new Subject<IMessageSummary>();
  public triggerSummaryCollapseMessage$ = new BehaviorSubject<IMessageSummary>(
    null
  );
  public triggerExpandMessageSummary$ = new Subject<boolean>();
  public loadingMessageSummary$: Subject<boolean> = new Subject();
  public triggerLoadFileMsgSummary$ = new Subject<ILoadFile>();

  constructor(private apiService: ApiService) {}

  generateMessageSummary({
    conversationId,
    mailBoxId,
    currentUserId = null,
    receiveUserId = null,
    taskId = null,
    conversationType = null
  }) {
    return this.apiService.postAPI(
      conversations,
      'generate-message-summary-time-line',
      {
        conversationId: conversationId,
        mailBoxId: mailBoxId,
        currentUserId: currentUserId,
        receiveUserId: receiveUserId,
        taskId: taskId,
        conversationType
      }
    );
  }

  getMessageSummary(conversationId: string) {
    return this.apiService.getAPI(
      conversations,
      `get-message-summary-time-line?conversationId=${conversationId}`
    );
  }
}
