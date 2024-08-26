import { TaskService } from '@services/task.service';
import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { EComplianceType } from '@shared/enum/compliance.enum';
import { conversations, users } from 'src/environments/environment';
import { ISyncPropertyNote } from '@/app/compliance/utils/compliance.type';
import { IInvoice } from '@shared/types/invoice.interface';
import { IPropertyNoteForm } from '@/app/smoke-alarm/utils/smokeAlarmType';

@Injectable({
  providedIn: 'root'
})
export class ComplianceApiService {
  constructor(
    private apiService: ApiService,
    public taskService: TaskService
  ) {}

  syncPropertyNoteToPT(
    complianceType: EComplianceType,
    complianceId: string,
    body: ISyncPropertyNote
  ) {
    return this.apiService.putAPI(
      conversations,
      `compliance/sync-to-property-tree/${complianceType}${
        complianceId ? `?complianceId=${complianceId}` : ''
      }`,
      body
    );
  }

  saveVariable(
    taskId: string,
    invoice: IInvoice,
    dataComplaine?: IPropertyNoteForm,
    compliance?: IPropertyNoteForm[]
  ) {
    return this.apiService.postAPI(conversations, 'smoke-alarm/save-variable', {
      taskId,
      invoice,
      dataComplaine,
      compliance
    });
  }

  cancelInvoice(payload) {
    return this.apiService.postAPI(
      conversations,
      'invoice/cancel-invoice',
      payload
    );
  }

  getListSupplierFromPT(agencyId: string) {
    return this.apiService.getAPI(users, `get-all-suppliers-pt`, { agencyId });
  }

  syncComplianceToPT(body: ISyncPropertyNote) {
    return this.apiService.putAPI(
      conversations,
      `compliance/sync-to-property-tree`,
      body
    );
  }

  getListCategoryByAgencyId(propertyId: string) {
    return this.apiService.getAPI(
      conversations,
      `get-list-compliance-category/${propertyId}`
    );
  }

  getListComplianceByTask(taskId: string) {
    return this.apiService.getAPI(
      conversations,
      `get-list-compliance-by-taskId/${taskId}`
    );
  }

  removeComplianceFallId(payload) {
    return this.apiService.postAPI(
      conversations,
      'remove-compliance-fail',
      payload
    );
  }
}
