import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { properties } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';
import {
  EActionSyncResolveMessage,
  IListMessageResolve
} from '@/app/dashboard/modules/inbox/modules/message-list-view/interfaces/message.interface';
import { TaskItem } from '@shared/types/task.interface';
import { ISocketSyncConversationToCRM } from '@shared/types/socket.interface';

@Injectable({
  providedIn: 'root'
})
export class SyncResolveMessageService {
  private listConversationStatus$: BehaviorSubject<ISocketSyncConversationToCRM> =
    new BehaviorSubject(null);
  public isSyncToRM$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public triggerSyncResolveMessage$: BehaviorSubject<{
    action: EActionSyncResolveMessage;
    messageResolve: TaskItem[];
  }> = new BehaviorSubject(null);

  constructor(private apiService: ApiService) {}

  setListConversationStatus(data: ISocketSyncConversationToCRM) {
    this.listConversationStatus$.next(data);
  }

  getListConversationStatus() {
    return this.listConversationStatus$.asObservable();
  }

  syncResolveMessageNoteProperties(listConversation: IListMessageResolve[]) {
    return this.apiService.postAPI(
      properties,
      `resolve-note`,
      listConversation
    );
  }
}
