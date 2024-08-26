import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, of, Subject } from 'rxjs';
import { ApiService } from '@services/api.service';
import { ConversationService } from '@services/conversation.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';

import { UserService } from '@services/user.service';
import { conversations } from 'src/environments/environment';
import {
  ITrudiEditScheduledMsgBody,
  ITrudiScheduledMsgCount,
  ITrudiScheduledMsgInfo
} from '@/app/trudi-scheduled-msg/utils/trudi-scheduled-msg.inteface';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

@Injectable({
  providedIn: null
})
export class TrudiScheduledMsgService {
  // handle request schedule msg, format body
  private popupState = {
    sendMessage: true,
    scheduledMessage: false,
    sendNowMessage: false,
    deleteScheduledMessage: false,
    editScheduledMessage: false,
    rescheduleMsg: false,
    rescheduleMsgInline: false
  };

  public listScheduledMsg = new BehaviorSubject<ITrudiScheduledMsgInfo[]>(null);
  public listScheduledMsg$ = this.listScheduledMsg.asObservable();
  public scheduleMessageCount = new BehaviorSubject<ITrudiScheduledMsgCount>(
    null
  );
  public scheduleMessageCount$ = this.scheduleMessageCount.asObservable();
  private selectedScheduledMsg$ = new BehaviorSubject<ITrudiScheduledMsgInfo>(
    null
  );
  private selectedReceiverName$ = new BehaviorSubject<string>(null);
  private selectedReceiver$ = new BehaviorSubject<ISelectedReceivers[]>(null);
  public triggerEventSendNow = new Subject();

  constructor(
    private apiService: ApiService,
    private conversationService: ConversationService,
    private taskService: TaskService,
    private trudiService: TrudiService,
    private userService: UserService
  ) {}

  // getter setter

  getPopupState() {
    return this.popupState;
  }

  setPopupState(state: Partial<typeof this.popupState>) {
    this.popupState = {
      ...this.popupState,
      ...state
    };
  }

  get selectedScheduledMsg() {
    return this.selectedScheduledMsg$.asObservable();
  }

  setSelectedScheduledMsg(value: ITrudiScheduledMsgInfo) {
    this.selectedScheduledMsg$.next(value);
  }

  get selectedReceiverName() {
    return this.selectedReceiverName$.asObservable();
  }

  setSelectedReceiverName(value: string) {
    this.selectedReceiverName$.next(value);
  }

  get selectedReceiver() {
    return this.selectedReceiver$.asObservable();
  }

  setSelectedReceiver(value: ISelectedReceivers[]) {
    this.selectedReceiver$.next(value);
  }

  // utils
  getIDsFromOtherService() {
    const propertyId =
      this.conversationService.currentConversation?.getValue()?.propertyId ||
      this.taskService.currentTask$?.value?.property?.id;
    const taskId = this.taskService.currentTask$.getValue()?.id;
    const categoryId =
      this.trudiService.getTrudiResponse.value?.setting?.categoryId;
    const agencyId = this.taskService.currentTask$.value.agencyId;
    const tenancyId = this.userService.tenancyId$.value;
    return {
      propertyId,
      taskId,
      categoryId,
      agencyId,
      tenancyId
    };
  }

  getListScheduledMsg(taskId: string, conversationId: string) {
    return this.apiService
      .getAPI(
        conversations,
        `message/scheduled-messages/${taskId}?conversationId=${conversationId}`
      )
      .pipe(
        catchError(() => of<ITrudiScheduledMsgInfo[]>()),
        map((res) => {
          if (res) {
            this.listScheduledMsg.next(res);
          }
        })
      );
  }

  jobRemindersCount(conversationId: string) {
    return this.apiService
      .getAPI(
        conversations,
        `job-reminder/count?conversationId=${conversationId ?? ''}`
      )
      .pipe(
        map((res) => {
          if (res) {
            this.scheduleMessageCount.next({
              count: res.count,
              conversationId
            });
          }
        })
      );
  }

  sendNowMsg(scheduledMessageId: string, mailBoxId: string) {
    return this.apiService.postAPI(
      conversations,
      `message/scheduled-messages/force-send/${scheduledMessageId}/${mailBoxId}`,
      {}
    );
  }

  deleteScheduledMsg(scheduledMessageId: string) {
    return this.apiService.deleteAPI(
      conversations,
      `message/scheduled-messages/${scheduledMessageId}`
    );
  }

  editScheduledMsg(
    scheduledMessageId: string,
    body: ITrudiEditScheduledMsgBody
  ) {
    return this.apiService.putAPI(
      conversations,
      `message/scheduled-messages/${scheduledMessageId}`,
      body
    );
  }
}
