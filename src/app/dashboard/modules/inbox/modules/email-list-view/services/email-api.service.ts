import { Injectable } from '@angular/core';
import { conversations, email } from 'src/environments/environment';
import { ApiService } from '@services/api.service';
import { LoadingService } from '@services/loading.service';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  finalize,
  map,
  of,
  switchMap
} from 'rxjs';
import { MessageIdSetService } from '@/app/dashboard/modules/inbox/modules/message-list-view/services/message-id-set.service';
import {
  EmailItem,
  IEmailQueryParams,
  IGetAllMessage,
  IMailFolderQueryParams,
  IMessagesResponse,
  IReportSpamQueryParams
} from '@/app/dashboard/modules/inbox/modules/email-list-view/interfaces/email.interface';
import { TaskItem } from '@shared/types/task.interface';

@Injectable({
  providedIn: 'root'
})
export class EmailApiService {
  private refreshedListMessage = new Subject<void>();
  private refreshListMessage = new BehaviorSubject<IEmailQueryParams>(null);
  private newMessageFromSocket = new Subject<void>();
  public movedEmails$: BehaviorSubject<EmailItem[] | TaskItem[]> =
    new BehaviorSubject<EmailItem[] | TaskItem[]>(null);
  public listEmailFolder: BehaviorSubject<string[]> = new BehaviorSubject([]);
  get refreshedListMesasge$(): Observable<void> {
    return this.refreshedListMessage.asObservable();
  }

  get refreshListMessage$(): Observable<IEmailQueryParams> {
    return this.refreshListMessage.asObservable();
  }

  get newMessageFromSocket$() {
    return this.newMessageFromSocket.asObservable();
  }

  setlistEmailFolder(value) {
    this.listEmailFolder.next(value);
  }

  constructor(
    private apiService: ApiService,
    private loadingService: LoadingService,
    private messageIdSetService: MessageIdSetService
  ) {}

  public handleEmailActionTriggered() {
    this.refreshedListMessage.next();
  }

  getListMessageApi(payload: IEmailQueryParams): Observable<IMessagesResponse> {
    return this.apiService
      .postAPI(email, `mailbox/get-all-message`, payload)
      .pipe(
        catchError(() => {
          return of(null);
        }),
        map((res) => {
          if (!res || !res.messages) return null;
          res.messages = res.messages.filter((message) => {
            return !this.messageIdSetService.has(message.id);
          });
          res.messages.forEach((message) => {
            this.messageIdSetService.insert(message.id);
          });
          return res;
        }),
        finalize(() => this.refreshedListMessage.next())
      );
  }

  getListMessageMailbox() {
    return this.refreshListMessage.pipe(
      switchMap((res) => {
        if (res) {
          if (res.page === 0 && res.isLoading) {
            this.loadingService.onLoading();
          }
          const payload = this.generateParams(res);
          return this.getListMessageApi(payload);
        }
        return of([]);
      })
    );
  }

  generateParams(queryParams): IEmailQueryParams {
    const {
      mailBoxId,
      search,
      pageLimit,
      page,
      externalId,
      currentMailMessageId
    } = queryParams;
    return {
      search: search || '',
      limit: pageLimit,
      page: page,
      mailBoxId,
      externalId,
      currentMailMessageId
    };
  }

  getDetailMessage(threadId: string, mailBoxId: string) {
    threadId = encodeURIComponent(threadId);
    return this.apiService.getAPI(
      email,
      `mailbox/get-message-detail?mailBoxId=${mailBoxId}&threadId=${threadId}`
    );
  }

  modifyReadMessage(mailMessageId: string) {
    return this.apiService.postAPI(email, 'mailbox/modify-read-message', {
      mailMessageId
    });
  }

  moveMailToMessage(messageIds: string[], mailBoxId: string) {
    return this.apiService.postAPI(conversations, 'mailbox/move-message', {
      messageIds,
      mailBoxId
    });
  }

  checkMoveMailFolder(body: {
    mailBoxId?: string;
    threadIds?: string[] | string;
    conversationIds?: string[];
    labelId?: string;
    status?: string;
  }) {
    return this.apiService.postAPI(
      conversations,
      `move-conversation/check-move-mail-folder`,
      body
    );
  }

  refreshMessageList(params) {
    this.refreshListMessage.next({
      ...(this.refreshListMessage.value || {}),
      ...params
    });
  }

  triggerNewMessage() {
    this.newMessageFromSocket.next();
  }

  moveMailFolder(payload: IMailFolderQueryParams) {
    return this.apiService.postAPI(
      conversations,
      'move-conversation/move-mail-folder',
      payload
    );
  }

  reportSpamFolder(payload: IReportSpamQueryParams) {
    return this.apiService.postAPI(email, 'mailbox/report-spam', payload);
  }

  handleNotSpam(payload: IReportSpamQueryParams) {
    return this.apiService.postAPI(email, 'mailbox/not-spam', payload);
  }

  handleUndoSpam(payload: IReportSpamQueryParams) {
    return this.apiService.postAPI(email, 'mailbox/undo-spam', payload);
  }

  getAllMessage(payload: IGetAllMessage) {
    return this.apiService.postAPI(email, 'mailbox/get-all-message', payload);
  }

  getSyncMailboxStatus(mailBoxId: string) {
    return this.apiService.getAPI(
      email,
      `mailbox/get-sync-mailbox-status?mailBoxId=${mailBoxId}`
    );
  }

  getConversationDetail(
    threadId: string,
    mailBoxId: string,
    externalId: string
  ) {
    threadId = encodeURIComponent(threadId);
    return this.apiService.getAPI(
      email,
      `mailbox/get-conversation-detail?mailBoxId=${mailBoxId}&threadId=${threadId}&externalId=${externalId}`
    );
  }
}
