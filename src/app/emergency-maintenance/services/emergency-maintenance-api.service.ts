import { Observable, of, switchMap } from 'rxjs';
import { Injectable } from '@angular/core';
import { TrudiResponse } from '@shared/types/trudi.interface';
import { ApiService } from '@services/api.service';
import { conversations } from 'src/environments/environment';
import {
  EEmergencyButtonAction,
  IEmergencyTaskDetail
} from '@/app/emergency-maintenance/utils/emergencyType';
import { NewTaskOptions } from '@shared/types/task.interface';
import { TrudiService } from '@services/trudi.service';
import { EmergencyMaintenanceJobService } from './emergency-maintenance-job.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';

@Injectable({
  providedIn: 'root'
})
export class EmergencyMaintenanceAPIService {
  constructor(
    private apiService: ApiService,
    private trudiService: TrudiService,
    private emergencyMaintenanceJobService: EmergencyMaintenanceJobService
  ) {}

  confirmEmergencyDecision(
    taskId: string,
    decisionIndex: number
  ): Observable<TrudiResponse> {
    return this.apiService.postAPI(
      conversations,
      'emergency-maintenance/confirm-decision',
      {
        taskId,
        decisionIndex
      }
    );
  }

  updateButtonStatus(
    taskId: string,
    action: EEmergencyButtonAction,
    status: TrudiButtonEnumStatus
  ) {
    return this.apiService
      .postAPI(conversations, 'emergency-maintenance/update-status-button', {
        taskId,
        action,
        status
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
    taskDetail?: IEmergencyTaskDetail,
    description?: string
  ) {
    return this.apiService.postAPI(
      conversations,
      'emergency-maintenance/save-variable',
      {
        taskId,
        receivers,
        taskDetail,
        description
      }
    );
  }

  editSummary(taskId: string, body) {
    return this.apiService.putAPI(
      conversations,
      `task/edit-summary/${taskId}`,
      body
    );
  }

  cancelInvoice(payload) {
    return this.apiService.postAPI(
      conversations,
      '/maintenance-request/cancel-invoice',
      payload
    );
  }

  convertToMaintenanceTask(
    taskId: string,
    propertyId: string,
    options: NewTaskOptions
  ) {
    return this.apiService.postAPI(
      conversations,
      'emergency-maintenance/convert-to-maintenance-task',
      {
        taskId,
        propertyId,
        options
      }
    );
  }

  sendMaintenanceJob(
    propertyId: string,
    agencyId: string,
    taskId: string,
    summary: string,
    description: string
  ) {
    return this.apiService.postAPI(
      conversations,
      'pm-portal/create-pt-maintenance',
      {
        propertyId,
        agencyId,
        taskId,
        summary,
        description
      }
    );
  }

  syncInvoiceToPT() {
    const payload = this.emergencyMaintenanceJobService.getPayloadSyncPT();
    return this.apiService.postAPI(
      conversations,
      'maintenance-request/sync-invoice',
      payload
    );
  }
}
