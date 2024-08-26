import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { ESelectInvoiceType } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/popup.enum';
import { conversations } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InvoiceApiService {
  constructor(private apiService: ApiService) {}
  public getAllInvoiceByProperty(
    body: IGetAllInvoiceByPropertyPayload
  ): Observable<IInvoiceProperty[]> {
    return this.apiService.postAPI(
      conversations,
      'widget/invoice/get-list-invoice-by-property',
      body
    );
  }

  public linkInvoiceToTask(body: ILinkInvoiceToTaskPayload) {
    return this.apiService.postAPI(
      conversations,
      'widget/invoice/link-invoice-to-task',
      body
    );
  }
}

export interface IGetAllInvoiceByPropertyPayload {
  taskId: string;
  search: string;
  invoiceType: ESelectInvoiceType;
  propertyId: string;
}

export interface IInvoiceProperty {
  invoiceDescription: string;
  tenancyName: string;
  invoiceAmount: number;
  invoiceStatus: string;
  invoiceDueDate: string;
  invoiceType: string;
  createdAt: string;
}

export interface ILinkInvoiceToTaskPayload {
  taskId: string;
  invoiceId: string;
  isMaintenanceInvoice: boolean;
}
