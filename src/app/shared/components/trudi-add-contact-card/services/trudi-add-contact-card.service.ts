import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { ConversationService } from '@services/conversation.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { UserService } from '@services/user.service';
import { ISelectedReceivers } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';

type AddContactCardPopupState = {
  addContactCard?: boolean;
  addContactCardOutside?: boolean;
  handleCallback?: (cards: ISelectedReceivers[]) => void;
  isClickedAddButton?: boolean;
};
@Injectable({
  providedIn: 'root'
})
export class TrudiAddContactCardService {
  private listReceiverOutside$: BehaviorSubject<ISelectedReceivers[]> =
    new BehaviorSubject<ISelectedReceivers[]>([]);
  private selectedContactCard: BehaviorSubject<ISelectedReceivers[]> =
    new BehaviorSubject<ISelectedReceivers[]>([]);
  public selectedContactCard$ = this.selectedContactCard.asObservable();

  private agencyId: string;
  private popupState: BehaviorSubject<AddContactCardPopupState> =
    new BehaviorSubject<AddContactCardPopupState>({
      addContactCard: false,
      addContactCardOutside: false,
      handleCallback: null
    });

  public popupState$ = this.popupState.asObservable();

  private formGroup: FormGroup = null;

  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private conversationService: ConversationService,
    private trudiService: TrudiService,
    private agencyService: AgencyService
  ) {}

  // getter setter

  getPopupState() {
    return this.popupState.value;
  }

  setPopupState(state: Partial<AddContactCardPopupState>) {
    const nextState = {
      ...this.popupState.value,
      ...state
    };
    this.popupState.next(nextState);
  }

  setContactCardList(value: ISelectedReceivers[]) {
    this.listReceiverOutside$.next(value);
  }

  getContactCardList() {
    return this.listReceiverOutside$.value;
  }

  getSelectedContactCard() {
    return this.selectedContactCard.value;
  }

  setSelectedContactCard(value: ISelectedReceivers[]) {
    this.selectedContactCard.next(value);
  }

  getIDsFromOtherService() {
    const propertyId = this.taskService.currentTask$?.value?.property?.id;
    const taskId = this.taskService.currentTask$.getValue()?.id;
    const categoryId =
      this.trudiService.getTrudiResponse.value?.setting?.categoryId;
    const tenancyId = this.userService.tenancyId$.value;
    const propertyType =
      this.conversationService.currentConversation?.getValue()?.propertyType;
    const taskType = this.taskService.currentTask$.getValue()?.taskType;
    return {
      propertyId,
      taskId,
      categoryId,
      agencyId: this.agencyId,
      tenancyId,
      propertyType,
      taskType
    };
  }

  setFormGroup(form: FormGroup) {
    this.formGroup = form;
  }

  removeFormGroup() {
    this.formGroup = null;
  }

  resetSelectedContactCard() {
    this.selectedContactCard.next([]);
    if (this.formGroup && this.formGroup.get('selectedContactCard')) {
      this.formGroup.get('selectedContactCard').setValue([]);
    }
  }
}
