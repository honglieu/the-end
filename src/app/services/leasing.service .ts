import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConversationService } from '@services/conversation.service';
import { conversations } from 'src/environments/environment';
import { SendBulkMessageResponse } from '@shared/types/conversation.interface';
import {
  FrequencyRental,
  LeasePeriodType,
  LeasingRequestTrudiVariable,
  LeaseRenewalRequestTrudiVariableReceiver,
  LeasingRequestTrudiResponse,
  LeasingRequestTrudiVariableReceiver
} from '@shared/types/trudi.interface';
import { UserItemInMessagePopup } from '@shared/types/user.interface';
import { ApiService } from './api.service';
import { TaskService } from './task.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { ReiFormData } from '@shared/types/rei-form.interface';
import {
  LeasingRequestButtonAction,
  LeasingStepIndex
} from '@shared/enum/leasing-request.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
@Injectable({
  providedIn: 'root'
})
export class LeasingService {
  public leasingRequestResponse: BehaviorSubject<LeasingRequestTrudiResponse> =
    new BehaviorSubject(null);
  public leasingFloatingDisplayStatus$: BehaviorSubject<boolean> =
    new BehaviorSubject(false);
  public trudiConversationId: BehaviorSubject<string> = new BehaviorSubject('');
  public statusVacating: BehaviorSubject<string> = new BehaviorSubject('');
  public editedLeaseTermFormData$: BehaviorSubject<LeasingRequestTrudiVariable> =
    new BehaviorSubject(null);
  public taskId: string = '';
  public mapKeyword: BehaviorSubject<any> = new BehaviorSubject({});
  public getStatusReiForm: BehaviorSubject<any> = new BehaviorSubject({});
  public getFileTenant$: BehaviorSubject<any> = new BehaviorSubject(false);

  constructor(
    private apiService: ApiService,
    private conversationService: ConversationService,
    private taskService: TaskService
  ) {
    this.handleGetTrudiConversationId();
  }

  handleGetTrudiConversationId() {
    const currentConversationList =
      this.conversationService.listConversationByTask.getValue();
    if (currentConversationList && currentConversationList.length) {
      const trudiConversation = currentConversationList.find(
        (item) => item.trudiResponse
      );
      this.trudiConversationId.next(trudiConversation?.id);
    }
  }

  updateResponseData(action: string, data: LeasingRequestTrudiResponse) {
    if (!action) throw new Error('there must be action');
    this.leasingRequestResponse.next(data);
  }

  updateButtonStatus(
    action: string,
    status: TrudiButtonEnumStatus,
    buttonIndex: LeasingStepIndex
  ) {
    return this.apiService.postAPI(
      conversations,
      'leasing/update-button-status',
      {
        taskId: this.taskService.currentTask$.value.id,
        action,
        status,
        buttonIndex
      }
    );
  }

  saveVariable(bodySaveVariable: {
    taskId: string;
    leasePeriod: number;
    leasePeriodType: LeasePeriodType;
    rentAmount: number;
    frequency: FrequencyRental;
    leaseDuration: number;
    receivers?: LeaseRenewalRequestTrudiVariableReceiver[];
    reiFormInfor?: {
      action: string;
      formData: ReiFormData | {};
    };
  }) {
    const {
      taskId,
      leasePeriod,
      leasePeriodType,
      rentAmount,
      frequency,
      leaseDuration,
      receivers,
      reiFormInfor
    } = bodySaveVariable;
    return this.apiService.postAPI(conversations, 'leasing/save-variable', {
      taskId,
      leasePeriod,
      leasePeriodType,
      rentAmount,
      frequency,
      leaseDuration,
      receivers,
      reiFormInfor
    });
  }

  checkTaskHasConversationWithTypeAndAction(
    receivers: LeasingRequestTrudiVariableReceiver[],
    type: EUserPropertyType,
    action: LeasingRequestButtonAction
  ) {
    return receivers.some(
      (receiver) =>
        receiver.userPropertyType === type &&
        (receiver.raiseBy === 'USER' ||
          (receiver.action !== action && receiver.raiseBy === 'AGENT'))
    );
  }

  mapUserItemInMessagePopupToReceiver(
    list: UserItemInMessagePopup[]
  ): LeaseRenewalRequestTrudiVariableReceiver[] {
    return list.map((el) => {
      return {
        id: el.id,
        firstName: el.firstName,
        lastName: el.lastName,
        userPropertyType: el.type as EUserPropertyType,
        lastActivity: el.lastActivity,
        email: el.email,
        inviteSent: el.inviteSent,
        offBoardedDate: el.offBoarded,
        isPrimary: el.isPrimary
      };
    });
  }

  findConversationIdByPersonUserId(
    personUserId: string,
    sendBulkResponse: SendBulkMessageResponse[]
  ) {
    return sendBulkResponse.find((el) => el.personUserId === personUserId)
      .conversationId;
  }

  countUserInList(
    list: LeaseRenewalRequestTrudiVariableReceiver[],
    type: EUserPropertyType
  ) {
    return list.filter((item) => item.userPropertyType === type).length;
  }

  mapConversationToUser(
    receivers: LeaseRenewalRequestTrudiVariableReceiver[],
    newUsers: LeaseRenewalRequestTrudiVariableReceiver[],
    res: SendBulkMessageResponse[],
    action: LeasingRequestButtonAction
  ) {
    const oldReceivers = receivers.map((receiver) => ({
      ...receiver,
      conversationId:
        receiver.raiseBy !== 'USER' && !receiver.conversationId
          ? this.findConversationIdByPersonUserId(receiver.id, res)
          : receiver.conversationId
    }));
    const oldReceiverIds = oldReceivers.map((e) => e.id);
    const newReceiver = newUsers
      .filter((user) => !oldReceiverIds.includes(user.id))
      .map((el) => ({
        ...el,
        conversationId: this.findConversationIdByPersonUserId(el.id, res),
        action: action,
        raiseBy: EUserPropertyType.AGENT
      }));

    return [...oldReceivers, ...newReceiver];
  }

  refreshLeasingREIForm(taskId: string, action: string, buttonIndex: number) {
    return this.apiService.postAPI(conversations, 'leasing/refresh-rei-form', {
      taskId,
      action,
      buttonIndex
    });
  }

  updateLeasingReiFormInfor(
    taskId: string,
    action: string,
    reiFormInfor: ReiFormData,
    buttonIndex: number
  ) {
    return this.apiService.postAPI(
      conversations,
      'leasing/update-rei-form-info',
      { taskId, action, reiFormInfor, buttonIndex }
    );
  }
}
