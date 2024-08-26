import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ITaskFolder } from '@/app/dashboard/modules/inbox/interfaces/inbox.interface';
import { ApiService } from '@services/api.service';
import { PreviewConversation } from '@shared/types/conversation.interface';
import { IUpdateTaskDefaultPayload } from '@shared/types/task.interface';
import { conversations } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CreateNewTaskPopUpService {
  public triggerAddNewFolder$ = new Subject<ITaskFolder>();
  private focusedConversation: PreviewConversation;

  constructor(private apiService: ApiService) {}

  setTriggerAddNewFolder(value: ITaskFolder) {
    this.triggerAddNewFolder$.next(value);
  }

  saveRememberFolder(payload: IUpdateTaskDefaultPayload) {
    return this.apiService.postAPI(
      conversations,
      'tasks/v2/update-default-task-folder',
      payload
    );
  }

  setFocusedConversation(conversation: PreviewConversation) {
    this.focusedConversation = conversation;
  }

  getFocusedConversation() {
    return this.focusedConversation;
  }

  clear() {
    this.focusedConversation = null;
  }
}
