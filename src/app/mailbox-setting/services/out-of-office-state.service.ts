import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
  ISelectedReceivers,
  IPopupState
} from '@/app/mailbox-setting/utils/out-of-office.interface';
import { ConversationService } from '@services/conversation.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { UserService } from '@services/user.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
@Injectable({
  providedIn: 'root'
})
export class OutOfOfficeService {
  private popupState: IPopupState = {
    addContactCardOutside: false,
    isEdit: true
  };
  private listReceiver$: BehaviorSubject<ISelectedReceivers[]> =
    new BehaviorSubject<ISelectedReceivers[]>([]);
  private resetOutOfOfficeContent = new Subject<void>();

  constructor(
    private conversationService: ConversationService,
    private taskService: TaskService,
    private trudiService: TrudiService,
    private agencyService: AgencyService,
    private userService: UserService
  ) {}

  get resetOutOfOfficeContent$() {
    return this.resetOutOfOfficeContent.asObservable();
  }

  triggerResetOutOfOfficeContent() {
    this.resetOutOfOfficeContent.next();
  }

  getPopupState() {
    return this.popupState;
  }

  setPopupState(state: Partial<typeof this.popupState>) {
    this.popupState = {
      ...this.popupState,
      ...state
    };
  }

  getListReceiver(): ISelectedReceivers[] {
    return this.listReceiver$.value;
  }

  setListReceiver(value: ISelectedReceivers[]) {
    this.listReceiver$.next(value);
  }

  getIDsFromOtherService() {
    const propertyId =
      this.conversationService.currentConversation?.getValue()?.propertyId ||
      this.taskService.currentTask$?.value?.property?.id;
    const taskId = this.taskService.currentTask$.getValue()?.id;
    const categoryId =
      this.trudiService.getTrudiResponse.value?.setting?.categoryId;
    const tenancyId = this.userService.tenancyId$.value;

    return {
      propertyId,
      taskId,
      categoryId,
      tenancyId
    };
  }
}
