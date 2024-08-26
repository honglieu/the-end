import { ApiService } from '@services/api.service';
import { conversations } from '@/environments/environment';
import { Injectable } from '@angular/core';
import {
  IConversationSummary,
  ILoadFile,
  IMessageSummary,
  IReadTicket
} from '../interface/conversation-summary';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConverationSummaryService {
  public cacheConversationSummary: Map<string, IConversationSummary> =
    new Map();
  public triggerLoadFileMsgSummary$ = new Subject<ILoadFile>();
  public selectedTicketId$ = new BehaviorSubject<string>('');
  public triggerExpandConversationSummary$ = new Subject<boolean>();
  public triggerMessageSummary$ = new Subject<IMessageSummary>();
  public triggerSummaryCollapseMessage$ = new BehaviorSubject<IMessageSummary>(
    null
  );
  public loadingMessageSummary$: Subject<boolean> = new Subject();
  public triggerCountTicketConversation = new Subject<IReadTicket>();

  public triggerCountTicketConversation$ =
    this.triggerCountTicketConversation.asObservable();

  public triggerScroll$: Subject<boolean> = new Subject();

  constructor(private apiService: ApiService) {}

  setTriggerCountTicketConversation(value: IReadTicket) {
    this.triggerCountTicketConversation.next(value);
  }

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

  getContactSummarySession(conversationId: string, sessionId: string) {
    return this.apiService.getAPI(
      conversations,
      `get-contact-summary-session?conversationId=${conversationId}&sessionId=${sessionId}`
    );
  }

  readTicket(conversationId) {
    return this.apiService.putAPI(
      conversations,
      `read-ticket/${conversationId}`
    );
  }
}
