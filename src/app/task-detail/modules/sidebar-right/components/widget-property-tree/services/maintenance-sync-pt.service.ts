import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { IMaintenanceRequest } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-request.interface';
import { IMaintenanceSyncData } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-sync-data.interface';
import { SendMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { TaskService } from '@services/task.service';
import { PropertiesService } from '@services/properties.service';
import { AgencyService } from '@services/agency.service';
import { MaintenanceSyncPtApiService } from './maintenance-sync-pt-api.service';
import { IMaintenanceInvoice } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import { WidgetPTService } from './widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { ShareValidators } from '@shared/validators/share-validator';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceSyncPtService {
  private maintenanceRequestForm: FormGroup;
  private maintenanceDataSubject: BehaviorSubject<void> =
    new BehaviorSubject<void>(null);
  private maintenanceSyncData$: IMaintenanceSyncData = {
    maintenanceRequest: {
      groupTitle: 'MAINTENANCE REQUEST',
      data: []
    },
    maintenanceInvoice: {
      groupTitle: 'MAINTENANCE INVOICE',
      data: []
    }
  };

  constructor(
    private widgetPTService: WidgetPTService,
    private taskService: TaskService,
    private agencyService: AgencyService,
    private propertyService: PropertiesService,
    private formBuiler: FormBuilder,
    private maintenanceSyncAPI: MaintenanceSyncPtApiService
  ) {}

  public setMaintenanceRequestData(
    maintenanceRequests: IMaintenanceRequest[]
  ): void {
    this.maintenanceSyncData$.maintenanceRequest.data = maintenanceRequests;
  }

  public setMaintenanceInvoiceData(
    maintenanceInvoices: IMaintenanceInvoice[]
  ): void {
    this.maintenanceSyncData$.maintenanceInvoice.data = maintenanceInvoices;
  }

  public getMaintenanceSyncData(): IMaintenanceSyncData {
    return this.maintenanceSyncData$;
  }

  public handleSuccessMaintenanceCard(data): void {
    const cardSuccess: IMaintenanceRequest = {
      ...data,
      updateFromSocket: true,
      updatedAt: data.lastTimeSync || data.updatedAt
    };
    this.maintenanceSyncData$.maintenanceRequest.data = [cardSuccess];
    this.widgetPTService.setPTWidgetStateByType(
      PTWidgetDataField.MAINTENANCE_REQUEST,
      'UPDATE',
      this.maintenanceSyncData$.maintenanceRequest.data
    );
  }

  public handleSuccessMaintenanceInvoiceCard(data): void {
    const cardSuccess: IMaintenanceInvoice = {
      ...(data?.invoice || {}),
      syncStatus: data.syncStatus,
      updateFromSocket: true,
      updatedAt: data.lastTimeSync || data.updatedAt
    };
    this.maintenanceSyncData$.maintenanceInvoice.data =
      this.maintenanceSyncData$.maintenanceInvoice.data.map((invoice) =>
        invoice.id === data.invoice.id ? cardSuccess : invoice
      );
    this.widgetPTService.setPTWidgetStateByType(
      PTWidgetDataField.MAINTENANCE_INVOICE,
      'UPDATE',
      this.maintenanceSyncData$.maintenanceInvoice.data
    );
  }

  public getMaintenanceForm(): FormGroup {
    return this.maintenanceRequestForm;
  }

  public get getMaintenanceRequestDefaultValue() {
    return {
      maintenanceRequest: {
        groupTitle: 'MAINTENANCE REQUEST',
        data: []
      },
      maintenanceInvoice: {
        groupTitle: 'MAINTENANCE INVOICE',
        data: []
      }
    };
  }

  public initMaintenanceForm(maintenanceRequest?: IMaintenanceRequest): void {
    this.maintenanceRequestForm = this.formBuiler.group({
      status: [
        maintenanceRequest?.status || SendMaintenanceType.OPEN,
        Validators.required
      ],
      summary: [
        maintenanceRequest?.summary || '',
        [Validators.required, ShareValidators.trimValidator]
      ],
      syncStatus: [
        maintenanceRequest?.syncStatus || ESyncStatus.NOT_SYNC,
        Validators.required
      ],
      updatedAt: [maintenanceRequest?.updatedAt || null]
    });
  }

  public patchMaintenanceForm(maintenanceRequest: IMaintenanceRequest): void {
    if (!maintenanceRequest) {
      return;
    }
    Object.keys(maintenanceRequest).forEach((item) => {
      if (!!maintenanceRequest[item]) {
        this.maintenanceRequestForm.patchValue({
          [item]: maintenanceRequest[item]
        });
      }
    });
  }

  updateListMaintenanceInvoice(data: IMaintenanceInvoice, id: string) {
    const list = this.widgetPTService.maintenanceInvoice.getValue();
    let newData = [...list.filter((one) => one.id !== id)];
    if (data) {
      newData = [data, ...newData];
      this.widgetPTService.setPTWidgetStateByType(
        PTWidgetDataField.MAINTENANCE_INVOICE,
        'UPDATE',
        newData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      return;
    }
    this.widgetPTService.setPTWidgetStateByType(
      PTWidgetDataField.MAINTENANCE_INVOICE,
      'REMOVE',
      newData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  }
}
