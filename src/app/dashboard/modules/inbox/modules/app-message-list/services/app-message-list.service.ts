import { SendOption } from '@shared/components/tiny-editor/tiny-editor.component';
import { IFile } from '@shared/types/file.interface';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { IReadTicket } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';

export interface sendOptions {
  time: string;
  type: SendOption;
}

@Injectable({
  providedIn: 'root'
})
export class AppMessageListService {
  private isCreateNewMessage = new BehaviorSubject<boolean>(false);
  public isCreateNewMessage$ = this.isCreateNewMessage.asObservable();
  private isMoveToExistingTask = new BehaviorSubject<boolean>(false);
  public isMoveToExistingTask$ = this.isMoveToExistingTask.asObservable();
  private prefillDataAppMessage = new BehaviorSubject<{
    receivers?: ISelectedReceivers[];
    title?: string;
    content?: string;
    isCreateMessageFromUserProfile?: boolean;
    draftMessageId?: string;
    attachments?: IFile[];
    contacts?: ISelectedReceivers[];
    sendOptions: sendOptions;
  }>(null);
  public prefillDataAppMessage$ = this.prefillDataAppMessage.asObservable();
  private isHiddenPanel = new BehaviorSubject<boolean>(false);
  public isHiddenPanel$ = this.isHiddenPanel.asObservable();
  public triggerRemoveMsgDraftFromOpen = new Subject();
  public triggerAutoGenChatGpt$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  public triggerFilterScratchTicket: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public triggerSaveDraftFirstReply = new BehaviorSubject<boolean>(false);

  constructor() {}
  setIsCreateNewMessage(value: boolean) {
    this.isCreateNewMessage.next(value);
  }

  setIsMoveToExistingTask(value: boolean) {
    this.isMoveToExistingTask.next(value);
  }

  setPreFillCreateNewMessage(value) {
    this.prefillDataAppMessage.next(value);
  }

  setIsHiddenPanel(value: boolean) {
    this.isHiddenPanel.next(value);
  }
}
