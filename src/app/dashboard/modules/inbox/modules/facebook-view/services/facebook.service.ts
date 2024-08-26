import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  ISelectedRequestSummary,
  MenuOption
} from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { ISocketQueue } from '@/app/dashboard/modules/inbox/modules/facebook-view/interfaces/facebook.interface';
import { PageFacebookMessengerType } from '@/app/dashboard/shared/types/facebook-account.interface';
import { TaskItem } from '@/app/shared/types/task.interface';
import { IReadTicket } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { PreviewConversation } from '@/app/shared';

@Injectable({
  providedIn: 'root'
})
export class FacebookService {
  public readonly suspenseTrigger$ = new Subject();
  private handleMenuRightClick = new BehaviorSubject<{
    taskId: string;
    conversationId: string;
    field: string;
    value: string;
    option: MenuOption;
  }>({
    taskId: '',
    conversationId: '',
    field: '',
    value: '',
    option: MenuOption.READ
  });
  private facebookConnected = new BehaviorSubject<boolean>(false);
  private listArchiveMessenger = new BehaviorSubject<
    PageFacebookMessengerType[]
  >([]);
  private facebookMessengerSelected =
    new BehaviorSubject<PageFacebookMessengerType>(null);
  private dataMap: ISocketQueue = new Map(null);
  public socketExtenalQueue: BehaviorSubject<ISocketQueue> =
    new BehaviorSubject(this.dataMap);
  private reloadFacebookDetail = new Subject<void>();
  private currentFacebookTask = new BehaviorSubject<TaskItem>(null);
  public reloadFacebookDetail$ = this.reloadFacebookDetail.asObservable();
  public triggerExpandConversationSummary$ = new Subject<boolean>();
  public selectedTicketId$ = new BehaviorSubject<string>('');
  public triggerCountTicketConversation$ = new Subject<IReadTicket>();
  public contactSummaryTrigger$ = new Subject<void>();
  public triggerUpdateConv$ = new Subject<PreviewConversation>();

  constructor() {}

  get menuRightClick$() {
    return this.handleMenuRightClick.asObservable();
  }

  setMenuRightClick(value) {
    this.handleMenuRightClick.next(value);
  }

  get facebookConnected$() {
    return this.facebookConnected.asObservable();
  }

  get listArchiveMessenger$() {
    return this.listArchiveMessenger.asObservable();
  }

  get facebookMessengerSelected$() {
    return this.facebookMessengerSelected.asObservable();
  }

  setFacebookConnected(value) {
    this.facebookConnected.next(value);
  }

  setListArchiveMessenger(value) {
    this.listArchiveMessenger.next(value);
  }

  setFacebookMessengerSelected(value) {
    this.facebookMessengerSelected.next(value);
  }

  setSocketExtenal(id, value) {
    this.dataMap.set(id, value);
    this.socketExtenalQueue.next(this.dataMap);
  }

  setReloadFacebookDetail() {
    this.reloadFacebookDetail.next();
  }

  setCurrentFacebookTask(currentFacebookTask) {
    this.currentFacebookTask.next(currentFacebookTask);
  }

  get currentFacebookTask$() {
    return this.currentFacebookTask.asObservable();
  }

  get currentFacebookTaskValue$() {
    return this.currentFacebookTask.getValue();
  }

  public checkIsArchivedMessenger(channelId: string): boolean {
    if (this.listArchiveMessenger.value?.length) {
      return !!this.listArchiveMessenger.value.find(
        (item) => item.id === channelId
      );
    }
    return false;
  }
}
