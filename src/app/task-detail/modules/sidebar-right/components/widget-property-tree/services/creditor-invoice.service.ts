import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { conversations } from 'src/environments/environment';
import { CreditorInvoicingResponseInterface } from '@shared/types/creditor-invoicing.interface';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { ApiService } from '@services/api.service';
import {
  CreditorInvoicingButtonAction,
  EInvoiceType
} from '@shared/enum/creditor-invoicing.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import {
  IBodyCancelInvoice,
  IBodyRetryInvoice,
  bodySyncInvoice,
  bodySyncTenancyInvoice
} from '@shared/types/task.interface';
import { InvoiceDataReq } from '@shared/types/tenancy-invoicing.interface';
import { WidgetPTService } from './widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { ToastrService } from 'ngx-toastr';
@Injectable({
  providedIn: 'root'
})
export class CreditorInvoicingPropertyService {
  public creditorInvoicingResponse =
    new BehaviorSubject<CreditorInvoicingResponseInterface>(null);
  public listCreditorInvoice$: BehaviorSubject<InvoiceDataReq[]> =
    new BehaviorSubject([]);
  public isStatusSyncFail$ = new BehaviorSubject(false);
  public dataResponse = new BehaviorSubject(null);
  public creditorInvoiceSyncStatus = new BehaviorSubject<
    SyncMaintenanceType | string
  >('');
  public creditorInvoiceSync = new BehaviorSubject(null);
  public updateCreditorInvoiceSync = new BehaviorSubject(null);
  public setTypeTaskInvoice = new BehaviorSubject(null);
  public removeInvoicebyId = new BehaviorSubject<string>(null);
  private readonly listSupplier$: BehaviorSubject<InvoiceDataReq[]> =
    new BehaviorSubject([]);
  public listAllSupplier$: BehaviorSubject<[]> = new BehaviorSubject([]);
  public selectedCreditorInvoice$: BehaviorSubject<InvoiceDataReq> =
    new BehaviorSubject<InvoiceDataReq>(null);
  public isInvoiceSync = new BehaviorSubject<boolean>(false);

  constructor(
    public apiService: ApiService,
    public widgetPTService: WidgetPTService,
    private toastrService: ToastrService
  ) {}

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

  cancelInvoice(payload: IBodyCancelInvoice, id: string) {
    return this.apiService
      .putAPI(conversations, `/widget/invoice/${id}/cancel`, payload)
      .pipe(
        tap((response) => {
          if (!!response?.externalError?.errorMessSync) {
            this.toastrService.error(response.externalError?.errorMessSync);
          }
        })
      );
  }

  syncInvoicesToProperty(body: bodySyncInvoice | bodySyncTenancyInvoice) {
    return this.apiService
      .postAPI(conversations, 'widget/invoice/create-invoice', body)
      .pipe(
        tap((response) => {
          if (!!response?.externalError?.errorMessSync) {
            this.toastrService.error(response.externalError?.errorMessSync);
          }
        })
      );
  }

  updateInvoicesToProperty(
    body: bodySyncInvoice | bodySyncTenancyInvoice,
    id: string
  ) {
    return this.apiService
      .putAPI(conversations, `widget/invoice/update-invoice/${id}`, body)
      .pipe(
        tap((response) => {
          if (!!response?.externalError?.errorMessSync) {
            this.toastrService.error(response.externalError?.errorMessSync);
          }
        })
      );
  }

  retryInvoicesToProperty(body: IBodyRetryInvoice) {
    return this.apiService
      .postAPI(conversations, 'widget/invoice/retry', body)
      .pipe(
        tap((response) => {
          if (!!response?.externalError?.errorMessSync) {
            this.toastrService.error(response.externalError?.errorMessSync);
          }
        })
      );
  }

  updateListCreditorInvoice(data: InvoiceDataReq, id: string) {
    const list = this.widgetPTService.creditorInvoices.getValue();
    let newData = [
      ...list
        .filter((one) => one.id !== id)
        .map((e) => {
          if (e?.firstTimeSyncSuccess) {
            return { ...e, firstTimeSyncSuccess: false };
          }
          return e;
        })
    ];
    if (data) {
      newData = [data, ...newData];
      this.widgetPTService.setPTWidgetStateByType(
        PTWidgetDataField.CREDITOR_INVOICES,
        'UPDATE',
        newData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      return;
    }
    this.widgetPTService.setPTWidgetStateByType(
      PTWidgetDataField.CREDITOR_INVOICES,
      'REMOVE',
      newData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  }

  getListCreditoInvoiceById(taskId: string) {
    return this.apiService.getAPI(
      conversations,
      `widget/invoice/list-invoice?taskId=${taskId}`
    );
  }

  removeInvoicesToProperty(id: string, taskId: string) {
    return this.apiService.deleteAPI(conversations, `widget/invoice/${id}`, {
      taskId
    });
  }

  setListSupplier(data) {
    this.listSupplier$.next(data);
  }

  getListSupplier() {
    return this.listSupplier$.asObservable();
  }

  setAllSupplier(data) {
    this.listAllSupplier$.next(data);
  }

  getAllSupplier() {
    return this.listAllSupplier$.asObservable();
  }

  getListSupplierById(invoiceIndex = EInvoiceType.CREDITOR_INVOICE) {
    return this.apiService.getAPI(
      conversations,
      'get-pt-account/' + `?requiredSupplier=${invoiceIndex}`
    );
  }

  setSelectedCreditorInvoice(data: InvoiceDataReq) {
    this.selectedCreditorInvoice$.next(data);
  }

  getSelectedCreditorInvoice(): Observable<InvoiceDataReq> {
    return this.selectedCreditorInvoice$.asObservable();
  }
}
