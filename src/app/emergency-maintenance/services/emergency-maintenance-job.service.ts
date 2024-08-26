import { Injectable } from '@angular/core';
import { TaskService } from '@services/task.service';
import { AgencyService } from '@services/agency.service';
import { PropertiesService } from '@services/properties.service';
import { EInvoiceTaskType } from '@shared/enum/share.enum';

@Injectable({
  providedIn: 'root'
})
export class EmergencyMaintenanceJobService {
  constructor(
    private taskService: TaskService,
    private agencyService: AgencyService,
    private propertiesService: PropertiesService
  ) {}

  getPayloadSyncPT() {
    return {
      taskId: this.taskService.currentTask$.value?.id,
      agencyId: this.taskService.currentTask$.value?.agencyId,
      propertyId: this.propertiesService.currentPropertyId.value,
      invoiceTaskType: EInvoiceTaskType.EMERGENCY
    };
  }
}
