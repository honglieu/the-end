import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { ApiService } from '@services/api.service';
import {
  ITenancyInvoiceResponse,
  InvoiceDataReq
} from '@shared/types/tenancy-invoicing.interface';
import { conversations } from 'src/environments/environment';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { WidgetPTService } from './widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class TenancyInvoiceService {
  public listTenancyInvoice$: BehaviorSubject<InvoiceDataReq[]> =
    new BehaviorSubject([]);
  public tenancyInvoicingResponse =
    new BehaviorSubject<ITenancyInvoiceResponse>(null);
  private unsubscribe$ = new Subject<void>();
  public currentAgencyId: string;
  public selectedTenancyInvoice$: BehaviorSubject<InvoiceDataReq> =
    new BehaviorSubject<InvoiceDataReq>(null);
  public tenancyInvoiceSyncStatus = new BehaviorSubject<ESyncStatus | string>(
    ''
  );
  isShowModalSync = new BehaviorSubject(false);

  constructor(
    private apiService: ApiService,
    private dashboardAgencyService: DashboardAgencyService,
    public widgetPTService: WidgetPTService,
    public toastrService: ToastrService
  ) {}

  getListTenancyInvoiceResponseByTaskId(taskId: string) {
    return this.apiService.getAPI(
      conversations,
      `widget/invoice/list-invoice?taskId=${taskId}`
    );
  }

  syncTenancyInvoice(data) {
    return this.apiService
      .postAPI(conversations, 'widget/invoice/create-invoice', data)
      .pipe(
        tap((response) => {
          if (!!response?.externalError?.errorMessSync) {
            this.toastrService.error(response.externalError?.errorMessSync);
          }
        })
      );
  }

  getListSupplierById(invoiceIndex, agencyId: string) {
    return this.apiService.getAPI(
      conversations,
      'get-pt-account/' + `?requiredSupplier=${invoiceIndex}`,
      { agencyId }
    );
  }

  updateTenancyInvoice(tenancyInvoice, id: string) {
    return this.apiService
      .putAPI(
        conversations,
        `widget/invoice/update-invoice/${id}`,
        tenancyInvoice
      )
      .pipe(
        tap((response) => {
          if (!!response?.externalError?.errorMessSync) {
            this.toastrService.error(response.externalError?.errorMessSync);
          }
        })
      );
  }

  reTryTenancyInvoice(data) {
    return this.apiService
      .postAPI(conversations, 'widget/invoice/retry', data)
      .pipe(
        tap((response) => {
          if (!!response?.externalError?.errorMessSync) {
            this.toastrService.error(response.externalError?.errorMessSync);
          }
        })
      );
  }

  removeTenancyInvoice(id: string, taskId: string) {
    return this.apiService.deleteAPI(conversations, `widget/invoice/${id}`, {
      taskId
    });
  }

  cancelInvoice(payload, invoiceId: string) {
    return this.apiService
      .putAPI(conversations, `widget/invoice/${invoiceId}/cancel`, payload)
      .pipe(
        tap((response) => {
          if (!!response?.externalError?.errorMessSync) {
            this.toastrService.error(response.externalError?.errorMessSync);
          }
        })
      );
  }

  setListTenancyInvoice(data: InvoiceDataReq[]) {
    this.listTenancyInvoice$.next(data);
  }

  getListTenancyInvoice() {
    return this.listTenancyInvoice$.asObservable();
  }

  updateListTenancyInvoice(data: InvoiceDataReq, id: string) {
    const prevData = this.widgetPTService.tenancyInvoices.getValue();
    let newData = [...prevData.filter((one) => one.id !== id)].map((item) => {
      if (item?.firstTimeSyncSuccess) {
        return { ...item, firstTimeSyncSuccess: false };
      }
      return item;
    });
    if (data) {
      newData = [data, ...newData];
      this.widgetPTService.setPTWidgetStateByType(
        PTWidgetDataField.TENANCY_INVOICES,
        'UPDATE',
        newData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      return;
    }
    this.widgetPTService.setPTWidgetStateByType(
      PTWidgetDataField.TENANCY_INVOICES,
      'REMOVE',
      newData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  }

  setSelectedTenancyInvoice(data: InvoiceDataReq) {
    this.selectedTenancyInvoice$.next(data);
  }

  getSelectedTenancyInvoice(): Observable<InvoiceDataReq> {
    return this.selectedTenancyInvoice$.asObservable();
  }
}
