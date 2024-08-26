import { IMessage } from '@shared/types/message.interface';
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import {
  IIgnoreMessageReminder,
  IMessageReminder,
  IReminderFilterParam
} from '@/app/dashboard/modules/inbox/interfaces/reminder-message.interface';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReminderMessageService {
  public reminderSetting$ = new Subject<IMessageReminderSetting>();
  public isShowReminderSetting$: Subject<boolean> = new Subject<boolean>();
  public reloadMessageReminder$: Subject<boolean> = new Subject<boolean>();
  public messageReminderSetting$ = new BehaviorSubject(null);
  public triggerMessageItemReminder$ = new Subject<IMessageReminderItem>();
  public triggerIgnoreMessage$: Subject<IIgnoreMessageReminder> =
    new Subject<IIgnoreMessageReminder>();
  public totalMessageReminderByType = new Subject<number>();
  public triggerGoToMessage$: Subject<boolean> = new Subject<boolean>();
  public triggerDataMessageReminder$ = new Subject();
  public assignToAgentMessageReminder$ = new Subject();
  constructor(private apiService: ApiService) {}

  public getMessReminderSetting() {
    return this.messageReminderSetting$.asObservable();
  }
  public setMessReminderSetting(data) {
    this.messageReminderSetting$.next(data);
  }

  public getListMessageApi(payload: IReminderFilterParam) {
    return this.apiService.postAPI(
      conversations,
      `list-message-reminder`,
      payload
    );
  }

  updateMessageReminderSetting(payload) {
    return this.apiService.postAPI(
      conversations,
      'update-message-reminder-setting',
      payload
    );
  }

  getMessageReminderSetting(mailBoxId: string) {
    return this.apiService
      .getAPI(
        conversations,
        `get-message-reminder-setting?mailBoxId=${mailBoxId}`
      )
      .subscribe((data) => {
        this.setMessReminderSetting(data);
      });
  }

  updateStatusMessageReminder(payload: IMessageReminderUpdateStatus) {
    return this.apiService.postAPI(
      conversations,
      `update-status-message-reminder`,
      payload
    );
  }

  getSuggestedProperty(conversationId: string) {
    return this.apiService.getAPI(
      conversations,
      `get-suggested-property?conversationId=${conversationId}`
    );
  }
}

interface IMessageReminderSetting {
  isIgnore: boolean;
  reminderTime: number;
}

interface IMessageReminderUpdateStatus {
  messageId: string;
  status: string;
}

interface IMessageReminderItem {
  messageReminder: IMessageReminder;
  messageDraft?: IMessage;
  sendMsgModalConfig: any;
}
