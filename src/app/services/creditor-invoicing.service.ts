import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { conversations } from 'src/environments/environment';
import {
  CreditorInvoicingButtonAction,
  EInvoiceType
} from '@shared/enum/creditor-invoicing.enum';
import { CreditorInvoicingResponseInterface } from '@shared/types/creditor-invoicing.interface';
import {
  bodySaveInvoice,
  bodySaveTenancyInvoice,
  bodySyncInvoice,
  bodySyncTenancyInvoice
} from '@shared/types/task.interface';
import { ApiService } from './api.service';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { TenancyInvoice } from '@shared/types/tenancy-invoicing.interface';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';

@Injectable({
  providedIn: 'root'
})
export class CreditorInvoicingService {
  public creditorInvoicingResponse =
    new BehaviorSubject<CreditorInvoicingResponseInterface>(null);
  public isCollapsePopupPT$ = new BehaviorSubject(false);
  public resetSyncPopupCreateTask$ = new BehaviorSubject(false);
  public isStatusSyncFail$ = new BehaviorSubject(false);
  public dataSavedFromModal = new BehaviorSubject(null);
  public dataSyncedFromModal = new BehaviorSubject(null);
  public stopProcess = new BehaviorSubject(false);
  public dataResponse = new BehaviorSubject(null);
  public statusSync = new BehaviorSubject(null);
  public syncFromModal = new BehaviorSubject(false);
  public syncing = new BehaviorSubject(false);
  public creditorInvoiceSyncStatus = new BehaviorSubject<
    SyncMaintenanceType | string
  >('');
  public invoices = new BehaviorSubject<TenancyInvoice[]>([]);
  public currentDataEdit = new BehaviorSubject<any>({});
  public currentAgencyId: string;
  private unsubscribe$ = new Subject<void>();

  constructor(
    public apiService: ApiService,
    private dashboardAgencyService: DashboardAgencyService
  ) {}
  updateResponseData(action: string, data: any) {
    if (!action) throw new Error('there must be action');
    this.creditorInvoicingResponse.next(data);
  }

  changeButtonStatus(
    taskId: string,
    action: CreditorInvoicingButtonAction,
    status: TrudiButtonEnumStatus
  ) {
    return this.apiService.postAPI(
      conversations,
      'creditor-invoice/update-status-button',
      {
        taskId,
        action,
        status
      }
    );
  }

  saveCreditorInvoice(body: bodySaveInvoice | bodySaveTenancyInvoice) {
    return this.apiService.postAPI(
      conversations,
      'creditor-invoice/save-variable',
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

  syncInvoicesToProperty(body: bodySyncInvoice | bodySyncTenancyInvoice) {
    return this.apiService.postAPI(conversations, 'invoice/sync-to-pt', body);
  }

  getListSupplierById(invoiceIndex = EInvoiceType.CREDITOR_INVOICE) {
    return this.apiService.getAPI(
      conversations,
      'get-pt-account/' + `?requiredSupplier=${invoiceIndex}`
    );
  }

  get agencyIdFromLocalStorage() {
    return localStorage.getItem('agencyId') || null;
  }
}
