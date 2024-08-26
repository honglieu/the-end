import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { conversations } from 'src/environments/environment';
import { CreditorInvoicingButtonAction } from '@shared/enum/creditor-invoicing.enum';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { SendBulkMessageResponse } from '@shared/types/conversation.interface';
import { TypeWithTForConversationMap } from '@shared/types/share.model';
import {
  EInvoiceStatus,
  ITenancyInvoiceResponse,
  Receivers,
  ScheduleSendMessage
} from '@shared/types/tenancy-invoicing.interface';
import {
  BankAccount,
  UserItemInMessagePopup
} from '@shared/types/user.interface';
import { ApiService } from './api.service';
import { SharedService } from './shared.service';
import { AgentSettingInfo } from '@shared/types/agency.interface';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import { AgencyService } from '@/app/dashboard/services/agency.service';

@Injectable({
  providedIn: 'root'
})
export class TenancyInvoicingService {
  public syncTenancyInvoiceModalStatus = new BehaviorSubject(false);
  public tenancyInvoicingResponse =
    new BehaviorSubject<ITenancyInvoiceResponse>(null);
  public bankAccountResponse: BankAccount[] = [];
  public agencyDetail: AgentSettingInfo;
  public tenancyInvoiceSyncStatus = new BehaviorSubject<
    SyncMaintenanceType | string
  >('');
  public showPopupTenancyInvoice = new BehaviorSubject(false);

  constructor(
    private apiService: ApiService,
    private sharedService: SharedService,
    private agencyService: AgencyService
  ) {}

  updateTenancyInvoicingResponseData(action: string, data) {
    if (!action) throw new Error('there must be action');
    this.tenancyInvoicingResponse.next(data);
  }

  scheduleSendMessage(variable: ScheduleSendMessage) {
    return this.apiService.postAPI(
      conversations,
      'message/schedule-send-message',
      variable
    );
  }

  changeButtonStatus(
    taskId: string,
    action: string,
    status: TrudiButtonEnumStatus
  ) {
    return this.apiService
      .postAPI(conversations, 'tenancy-invoice/update-status-btn', {
        taskId,
        action,
        status
      })
      .pipe(
        switchMap((el) => {
          if (status === TrudiButtonEnumStatus.PENDING) {
            const newReceivers =
              this.tenancyInvoicingResponse.value?.data[0].variable.receivers.filter(
                (el) => el.action !== action
              );
            return this.saveVariableResponseData(taskId, newReceivers);
          }
          return of(el);
        })
      );
  }

  saveVariableResponseData(taskId: string, receivers: Receivers[]) {
    return this.apiService.postAPI(
      conversations,
      'tenancy-invoice/save-variable',
      {
        taskId,
        receivers
      }
    );
  }

  cancelInvoice(payload) {
    return this.apiService.postAPI(
      conversations,
      'invoice/cancel-invoice',
      payload
    );
  }

  mapConversationToUser(
    receivers: TypeWithTForConversationMap<
      Receivers,
      CreditorInvoicingButtonAction
    >[],
    newUsers: TypeWithTForConversationMap<
      Receivers,
      CreditorInvoicingButtonAction
    >[],
    res: SendBulkMessageResponse[],
    action: CreditorInvoicingButtonAction
  ) {
    return this.sharedService.mapConversationToUser<
      Receivers,
      CreditorInvoicingButtonAction
    >(receivers, newUsers, res, action);
  }

  mapUserItemInMessagePopupToReceiver(
    list: UserItemInMessagePopup[]
  ): Receivers[] {
    return list?.map((el) => {
      return {
        id: el.id,
        firstName: el.firstName,
        lastName: el.lastName,
        userPropertyType: el.type as EUserPropertyType,
        email: el.email,
        isPrimary: el.isPrimary,
        inviteSent: el.inviteSent,
        offBoarded: el.offBoarded,
        lastActivity: el.lastActivity
      };
    });
  }

  syncTenancyInvoiceToProperty(
    taskId: string,
    agencyId: string,
    propertyId: string,
    invoices
  ) {
    return this.apiService.postAPI(conversations, 'invoice/sync-to-pt', {
      taskId,
      agencyId,
      propertyId,
      invoices
    });
  }

  syncTenancyV2InvoiceToProperty(
    taskId: string,
    agencyId: string,
    propertyId: string,
    invoices
  ) {
    return this.apiService.postAPI(conversations, 'invoice/v2/sync-to-pt', {
      taskId,
      agencyId,
      propertyId,
      invoices
    });
  }

  confirmDecision(
    taskId: string,
    status: EInvoiceStatus
  ): Observable<ITenancyInvoiceResponse> {
    return this.apiService.postAPI(
      conversations,
      'tenant-invoice/confirm-decision',
      {
        taskId,
        status
      }
    );
  }
}
