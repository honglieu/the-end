import { ApiService } from './api.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of, switchMap } from 'rxjs';
import { TrudiReceivers, TrudiResponse } from '@shared/types/trudi.interface';
import { conversations } from 'src/environments/environment';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { ITaskDetail } from '@shared/types/task.interface';
import { SendBulkMessageResponse } from '@shared/types/conversation.interface';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { SyncInvoiceSocketData } from '@shared/types/socket.interface';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceRequestService {
  public syncMaintenanceInvoiceModalStatus = new BehaviorSubject(false);
  public maintenanceRequestResponse: BehaviorSubject<TrudiResponse> =
    new BehaviorSubject(null);
  public conversationIdTrigger = new BehaviorSubject('');
  public maintenanceInvoiceSyncStatus = new BehaviorSubject<
    SyncMaintenanceType | string
  >('');
  public maintenanceInvoiceSocketData =
    new BehaviorSubject<SyncInvoiceSocketData>(null);

  constructor(private apiService: ApiService) {}

  updateMaintenanceResponseData(action: string, data: any) {
    if (!action) throw new Error('there must be action');
    this.maintenanceRequestResponse.next(data);
  }

  confirmMaintenanceDecision(taskId: string, decisionIndex: number) {
    return this.apiService.postAPI(
      conversations,
      'maintenance-request/confirm-decision',
      {
        taskId,
        decisionIndex
      }
    );
  }

  changeButtonStatus(
    taskId: string,
    action: string,
    stepIndex: number,
    status: TrudiButtonEnumStatus
  ) {
    return this.apiService
      .postAPI(conversations, 'maintenance-request/update-status-button', {
        taskId,
        action,
        stepIndex,
        status
      })
      .pipe(
        switchMap((el) => {
          if (status === TrudiButtonEnumStatus.PENDING) {
            const newReceivers =
              this.maintenanceRequestResponse.value?.data[0].variable.receivers.filter(
                (el) => el.action !== action
              );
            return this.saveVariableResponseData(taskId, newReceivers);
          }
          return of(el);
        })
      );
  }

  saveVariableResponseData(
    taskId: string,
    receivers: any[],
    taskDetail?: ITaskDetail,
    invoice?: any,
    description?: string
  ) {
    return this.apiService.postAPI(
      conversations,
      'maintenance-request/save-variable',
      {
        taskId,
        receivers,
        taskDetail,
        invoice,
        description
      }
    );
  }

  findConversationIdByPersonUserId(
    personUserId: string,
    sendBulkResponse: SendBulkMessageResponse[]
  ) {
    return sendBulkResponse.find((el) => el.personUserId === personUserId)
      .conversationId;
  }

  mapConversationToUser(
    receivers: TrudiReceivers[],
    newUsers: TrudiReceivers[],
    res: SendBulkMessageResponse[],
    action?: ForwardButtonAction
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
        userPropertyType: el.type,
        conversationId: this.findConversationIdByPersonUserId(el.id, res),
        action: action,
        raiseBy: EUserPropertyType.AGENT
      }));

    return [...oldReceivers, ...newReceiver];
  }

  cancelInvoice(payload) {
    return this.apiService.postAPI(
      conversations,
      '/maintenance-request/cancel-invoice',
      payload
    );
  }

  syncMaintenanceInvoiceToProperty(
    taskId: string,
    agencyId: string,
    propertyId: string,
    isMaintenanceInvoice: boolean,
    invoices
  ) {
    return this.apiService.postAPI(conversations, 'invoice/sync-to-pt', {
      taskId,
      agencyId,
      propertyId,
      isMaintenanceInvoice,
      invoices
    });
  }
}
