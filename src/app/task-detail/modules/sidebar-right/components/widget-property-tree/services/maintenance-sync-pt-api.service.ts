import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { Observable } from 'rxjs';
import { conversations } from 'src/environments/environment';
import { IMaintenanceRequest } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-request.interface';
import { IMaintenanceSyncData } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-sync-data.interface';
import { TaskService } from '@services/task.service';
import { PropertiesService } from '@services/properties.service';
import { AgencyService } from '@services/agency.service';
import {
  IInputSyncMaintenanceInvoice,
  IInputUpdateSyncMaintenanceInvoice
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import { pluck } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceSyncPtApiService {
  constructor(
    private taskService: TaskService,
    private agencyService: AgencyService,
    private propertyService: PropertiesService,
    private apiService: ApiService
  ) {}

  public getSyncData(taskId): Observable<IMaintenanceSyncData> {
    return this.apiService.getAPI(
      conversations,
      ['maintenance', 'data-sync-pt', taskId].join('/')
    );
  }

  public syncToPT(
    payload: IMaintenanceRequest
  ): Observable<IMaintenanceRequest> {
    const propertyId = this.propertyService.currentPropertyId.value;
    const { id, agencyId } = this.taskService.currentTask$.value;
    const params = {
      ...payload,
      propertyId,
      taskId: id,
      agencyId
    };
    return this.apiService
      .postAPI(conversations, ['maintenance-request', 'sync-to-pt'].join('/'), {
        ...params
      })
      .pipe(pluck('data'));
  }

  public updateSyncToPT(
    payload: IMaintenanceRequest
  ): Observable<IMaintenanceRequest> {
    const propertyId = this.propertyService.currentPropertyId.value;
    const { agencyId, id } = this.taskService.currentTask$.value;
    const params = {
      ...payload,
      propertyId,
      agencyId,
      taskId: id
    };
    return this.apiService
      .putAPI(
        conversations,
        ['maintenance-request', 'update-sync-to-pt'].join('/'),
        { ...params }
      )
      .pipe(pluck('data'));
  }

  public removeSync(): Observable<Object> {
    const taskId = this.taskService.currentTask$.value?.id;
    const propertyId = this.propertyService.currentPropertyId.value;
    const agencyId = this.taskService.currentTask$.value?.agencyId;
    const params = {
      agencyId,
      propertyId
    };
    return this.apiService
      .deleteAPI(
        conversations,
        ['maintenance', 'remove-sync-pt', taskId].join('/'),
        { ...params }
      )
      .pipe(pluck('data'));
  }

  public retrySync(): Observable<IMaintenanceRequest> {
    const propertyId = this.propertyService.currentPropertyId.value;
    const taskId = this.taskService.currentTask$.value?.id;
    const agencyId = this.taskService.currentTask$.value?.agencyId;
    const params = {
      agencyId,
      propertyId,
      taskId
    };
    return this.apiService
      .postAPI(
        conversations,
        ['maintenance-request', 'retry-sync-to-pt'].join('/'),
        { ...params }
      )
      .pipe(pluck('data'));
  }

  public syncMaintenanceInvoiceToPT(payload: IInputSyncMaintenanceInvoice) {
    return this.apiService
      .postAPI(
        conversations,
        ['maintenance-invoice', 'sync-to-pt'].join('/'),
        payload
      )
      .pipe(pluck('data'));
  }

  public updateSyncMaintenanceInvoiceToPT(
    invoice: IInputUpdateSyncMaintenanceInvoice,
    invoiceId: string
  ) {
    return this.apiService
      .putAPI(
        conversations,
        `maintenance-invoice/update-sync-to-pt/${invoiceId}`,
        invoice
      )
      .pipe(pluck('data'));
  }
  public reTryMaintenanceInvoice(
    invoiceId: string,
    taskId: string,
    propertyId: string
  ) {
    return this.apiService
      .postAPI(conversations, `maintenance-invoice/retry-sync-to-pt`, {
        invoiceId,
        taskId,
        propertyId
      })
      .pipe(pluck('data'));
  }

  public removeMaintenanceInvoice(invoiceId: string, taskId: string) {
    return this.apiService
      .deleteAPI(
        conversations,
        `maintenance-invoice/remove-sync-pt/${invoiceId}`,
        {
          taskId
        }
      )
      .pipe(pluck('data'));
  }

  public cancelInvoice(invoiceId: string, payload) {
    return this.apiService
      .postAPI(
        conversations,
        `maintenance-invoice/cancel-invoice/${invoiceId}`,
        payload
      )
      .pipe(pluck('data'));
  }
}
