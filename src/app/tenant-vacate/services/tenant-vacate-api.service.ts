import { Injectable } from '@angular/core';
import {
  ETenantVacateButtonAction,
  ISyncPropertyVacate,
  ITenantVacateForm
} from '@/app/tenant-vacate/utils/tenantVacateType';
import { conversations } from 'src/environments/environment';
import { of, switchMap } from 'rxjs';
import { ApiService } from '@services/api.service';
import { TrudiService } from '@services/trudi.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';

@Injectable({
  providedIn: 'root'
})
export class TenantVacateApiService {
  constructor(
    private apiService: ApiService,
    private trudiService: TrudiService
  ) {}

  updateButtonStatus(
    taskId: string,
    action: ETenantVacateButtonAction,
    status: TrudiButtonEnumStatus,
    agencyId: string,
    widgetId?: string
  ) {
    return this.apiService
      .postAPI(conversations, 'tenant-vacate/update-button-status', {
        taskId,
        action,
        status,
        agencyId,
        widgetId
      })
      .pipe(
        switchMap((el) => {
          if (status === TrudiButtonEnumStatus.PENDING) {
            const newReceivers =
              this.trudiService.getTrudiResponse.value?.data[0]?.variable?.receivers.filter(
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
    taskDetail?: any,
    vacateDetail?: ITenantVacateForm,
    vacateDateVariable?: {}
  ) {
    return this.apiService.postAPI(
      conversations,
      'tenant-vacate/save-variable',
      {
        taskId,
        receivers,
        taskDetail,
        vacateDetail,
        vacateDateVariable
      }
    );
  }

  confirmTenantVacateDecision(taskId: string, decisionIndex: string) {
    return this.apiService.postAPI(
      conversations,
      'tenant-vacate/confirm-decision',
      {
        taskId,
        decisionIndex
      }
    );
  }

  scheduleSendMessage(body) {
    return this.apiService.postAPI(
      conversations,
      'message/schedule-send-message',
      body
    );
  }

  syncPropertyNoteToPT(body: ISyncPropertyVacate) {
    return this.apiService.putAPI(
      conversations,
      'tenant-vacate/sync-to-property-tree',
      body
    );
  }

  cancelInvoice(payload) {
    return this.apiService.postAPI(
      conversations,
      'invoice/cancel-invoice',
      payload
    );
  }

  getTaskVacateDetail(taskId: string) {
    return this.apiService.getAPI(conversations, `task/${taskId}/task-vacate`);
  }

  markOutgoingInspectionNotesAsRead(taskId: string) {
    return this.apiService.postAPI(
      conversations,
      'leasing/update-status-general-notes',
      { taskId }
    );
  }

  removePtWidgetVacateDetail(taskId: string) {
    return this.apiService.deleteAPI(
      conversations,
      'tenant-vacate/remove-sync-to-property-tree',
      { taskId }
    );
  }
}
