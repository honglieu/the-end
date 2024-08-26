import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  ISelectedRequestSummary,
  MenuOption
} from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';
import { ISocketQueue } from '@/app/dashboard/modules/inbox/modules/whatsapp-view/interfaces/whatsapp.interface';
import { TaskItem } from '@/app/shared/types/task.interface';
import { IReadTicket } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/interfaces/voice-mail.interface';
import { PreviewConversation } from '@/app/shared';
import { PageWhatsAppType } from '@/app/dashboard/shared/types/whatsapp-account.interface';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {
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
  private whatsappConnected = new BehaviorSubject<boolean>(false);
  private listArchiveWhatsApp = new BehaviorSubject<PageWhatsAppType[]>([]);
  private whatsappSelected = new BehaviorSubject<PageWhatsAppType>(null);
  private dataMap: ISocketQueue = new Map(null);
  public socketExtenalQueue: BehaviorSubject<ISocketQueue> =
    new BehaviorSubject(this.dataMap);
  private reloadWhatsappDetail = new Subject<void>();
  private currentWhatsappTask = new BehaviorSubject<TaskItem>(null);
  public reloadWhatsappDetail$ = this.reloadWhatsappDetail.asObservable();

  constructor() {}

  get menuRightClick$() {
    return this.handleMenuRightClick.asObservable();
  }

  setMenuRightClick(value) {
    this.handleMenuRightClick.next(value);
  }

  get whatsappConnected$() {
    return this.whatsappConnected.asObservable();
  }

  get listArchiveWhatsApp$() {
    return this.listArchiveWhatsApp.asObservable();
  }

  get whatsappSelected$() {
    return this.whatsappSelected.asObservable();
  }

  setWhatsappConnected(value) {
    this.whatsappConnected.next(value);
  }

  setListArchiveWhatsApp(value) {
    this.listArchiveWhatsApp.next(value);
  }

  setWhatsAppSelected(value) {
    this.whatsappSelected.next(value);
  }

  setSocketExtenal(id, value) {
    this.dataMap.set(id, value);
    this.socketExtenalQueue.next(this.dataMap);
  }

  setReloadWhatsappDetail() {
    this.reloadWhatsappDetail.next();
  }

  setCurrentWhatsappTask(currentWhatsappTask) {
    this.currentWhatsappTask.next(currentWhatsappTask);
  }

  get currentWhatsappTask$() {
    return this.currentWhatsappTask.asObservable();
  }

  get currentWhatsappTaskValue$() {
    return this.currentWhatsappTask.getValue();
  }

  public channelArchived(channelId: string): boolean {
    if (this.listArchiveWhatsApp.value?.length) {
      return !!this.listArchiveWhatsApp.value.find(
        (item) => item.id === channelId
      );
    }
    return false;
  }
}
