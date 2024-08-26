import { TaskItem } from '@shared/types/task.interface';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  IReadTicket,
  ISocketQueue
} from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { UserConversation } from '@shared/types/conversation.interface';
import { IMessage } from '@shared/types/message.interface';

@Injectable({
  providedIn: 'root'
})
export class VoiceMailService {
  public readonly suspenseTrigger$ = new Subject();
  private isVoicemailDetailLoading = new BehaviorSubject<boolean>(false);
  private currentVoicemailTask = new BehaviorSubject<TaskItem>(null);
  private currentVoicemailConversation = new BehaviorSubject<UserConversation>(
    null
  );
  private handleMenuRightClick = new BehaviorSubject<{
    taskId: string;
    conversationId: string;
    field: string;
    value: string;
  }>({
    taskId: '',
    conversationId: '',
    field: '',
    value: ''
  });
  public readTicketConversation$ = new Subject<IReadTicket>();
  private dataMap: ISocketQueue = new Map(null);

  public socketExtenalQueue: BehaviorSubject<ISocketQueue> =
    new BehaviorSubject(this.dataMap);
  public isCalculationHeight = new BehaviorSubject<boolean>(false);
  private reloadVoicemailDetail = new Subject<void>();
  public reloadVoicemailDetail$ = this.reloadVoicemailDetail.asObservable();

  constructor() {}

  get menuRightClick$() {
    return this.handleMenuRightClick.asObservable();
  }

  get isVoicemailDetailLoading$() {
    return this.isVoicemailDetailLoading.asObservable();
  }

  get currentVoicemailTask$() {
    return this.currentVoicemailTask.asObservable();
  }

  get currentVoicemailTaskValue$() {
    return this.currentVoicemailTask.getValue();
  }

  get currentVoicemailConversation$() {
    return this.currentVoicemailConversation.asObservable();
  }

  get currentVoicemailConversationValue$() {
    return this.currentVoicemailConversation.getValue();
  }

  setReloadVoicemailDetail() {
    this.reloadVoicemailDetail.next();
  }

  setSocketExtenal(id, value) {
    this.dataMap.set(id, value);
    this.socketExtenalQueue.next(this.dataMap);
  }

  setMenuRightClick(value) {
    this.handleMenuRightClick.next(value);
  }

  setIsVoicemailDetailLoading(isLoading: boolean) {
    this.isVoicemailDetailLoading.next(isLoading);
  }

  setCurrentVoicemailTask(currentVoicemailTask: TaskItem) {
    this.currentVoicemailTask.next(currentVoicemailTask);
  }

  setUpdatedConversation(field, taskId: string, data) {
    const currentTask = this.currentVoicemailTask.getValue();
    if (!currentTask) return;
    const newTask = {
      ...currentTask,
      conversations: currentTask.conversations.map((cov) =>
        cov.id === taskId
          ? {
              ...cov,
              [field]: data
            }
          : cov
      )
    };
    this.currentVoicemailTask.next(newTask);

    this.currentVoicemailConversation.next({
      ...this.currentVoicemailConversation.getValue(),
      [field]: data
    });
  }

  setCurrentVoicemailConversation(
    currentVoicemailConversation: UserConversation
  ) {
    this.currentVoicemailConversation.next(currentVoicemailConversation);
  }
}
