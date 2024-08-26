import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { IExportConversationFilePayload } from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { TaskItem } from '@shared/types/task.interface';
import { ISocketSyncConversationToCRM } from '@shared/types/socket.interface';
import { conversations } from '@/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class SyncMessagePropertyTreeService {
  private triggerSyncMessagePT: BehaviorSubject<{
    messages: TaskItem[];
    isDownloadPDFAction: boolean;
  }> = new BehaviorSubject(null);
  public triggerSyncMessagePT$ = this.triggerSyncMessagePT.asObservable();
  private storeExportConversationFilePayload =
    new BehaviorSubject<IExportConversationFilePayload>(null);
  private triggerExportConversationHistoryAction: BehaviorSubject<{
    payload: IExportConversationFilePayload;
    isDownloadPDFAction: boolean;
  }> = new BehaviorSubject(null);
  public triggerExportConversationHistoryAction$ =
    this.triggerExportConversationHistoryAction.asObservable();

  constructor(private apiService: ApiService) {}

  public setTriggerSyncMessagePT(
    messages: TaskItem[],
    isDownloadPDFAction = false
  ) {
    this.triggerSyncMessagePT.next({ messages, isDownloadPDFAction });
  }

  public setTriggerExportHistoryAction(
    payload: IExportConversationFilePayload,
    isDownloadPDFAction = false
  ) {
    this.triggerExportConversationHistoryAction.next({
      payload,
      isDownloadPDFAction
    });
  }

  checkToEnableDownloadPDFOption(
    isArchiveMailbox: boolean,
    isConsoleUser: boolean,
    downloadingPDFFile: boolean
  ) {
    return isArchiveMailbox || isConsoleUser || downloadingPDFFile;
  }

  setStoreExportConversationFilePayload(value: IExportConversationFilePayload) {
    this.storeExportConversationFilePayload.next(value);
  }

  filterStoreExportConversationFilePayload(conversationIds: string[]) {
    const data = this.storeExportConversationFilePayload.value;
    this.storeExportConversationFilePayload.next({
      ...data,
      conversations: data.conversations.filter((conversation) =>
        conversationIds.some((id) => conversation.conversationId === id)
      )
    });
  }

  exportConversationFileWithStoreData() {
    if (!this.storeExportConversationFilePayload.value) return;
    return this.setTriggerExportHistoryAction(
      this.storeExportConversationFilePayload.value,
      true
    );
  }

  private isSyncToPT: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public isSyncToPT$ = this.isSyncToPT.asObservable();
  public setIsSyncToPT(value: boolean) {
    this.isSyncToPT.next(value);
  }

  //handle change type socket
  private listConversationStatus$: BehaviorSubject<ISocketSyncConversationToCRM> =
    new BehaviorSubject(null);
  public listConversationStatus = this.listConversationStatus$.asObservable();
  setListConversationStatus(data: ISocketSyncConversationToCRM) {
    this.listConversationStatus$.next(data);
  }

  syncMessagePropertyTree(data: IExportConversationFilePayload) {
    return this.apiService.postAPI(
      conversations,
      'export-conversation-file',
      data
    );
  }
}
