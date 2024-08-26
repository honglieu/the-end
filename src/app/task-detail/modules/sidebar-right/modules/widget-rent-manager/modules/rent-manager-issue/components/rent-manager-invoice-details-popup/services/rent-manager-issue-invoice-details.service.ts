import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  FormattedRmIssueInvoice,
  IRMIssueInvoice
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/interfaces/rent-manager-issue-invoice-details.interface';
import { GetListUserPayload } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/services/rent-manager-issue-api.service';
import {
  EAccountType,
  EUserPayloadType
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/enums/rent-manager-issue.enum';
import { formatNumber } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-issue/components/rent-manager-invoice-details-popup/services/rent-manager-issue-invoice-details-form.service';

@Injectable()
export class RentManagerIssueInvoiceDetailsService {
  private currentInvoiceDetailsBS = new BehaviorSubject<IRMIssueInvoice>(null);
  public currentInvoiceDetails$ = this.currentInvoiceDetailsBS.asObservable();
  private userPayloadBS = new BehaviorSubject<GetListUserPayload>(null);
  public userPayload$ = this.userPayloadBS.asObservable();
  constructor() {}

  public setInvoiceDetails(data) {
    this.currentInvoiceDetailsBS.next(data);
  }

  public setGetListUserPayload(payload: Partial<GetListUserPayload>) {
    this.userPayloadBS.next({
      ...this.userPayloadBS.value,
      ...payload
    });
  }

  public getUserPayloadType(invoiceType: EAccountType) {
    switch (invoiceType) {
      case EAccountType.PROSPECT:
        return [EUserPayloadType.TENANT_PROSPECT];
      case EAccountType.TENANT:
        return [EUserPayloadType.TENANT_PROPERTY, EUserPayloadType.TENANT_UNIT];
      case EAccountType.OWNER:
        return [EUserPayloadType.LANDLORD];
      default:
        return [EUserPayloadType.TENANT_PROPERTY, EUserPayloadType.TENANT_UNIT];
    }
  }

  public formatInvoice(invoice: IRMIssueInvoice): FormattedRmIssueInvoice {
    const value: FormattedRmIssueInvoice = {
      accountId: invoice.accountId,
      accountType: invoice.accountType,
      comment: invoice.comment || null,
      dueDate: invoice.dueDate,
      id: invoice.id,
      invoiceDate: invoice.invoiceDate,
      isTaxable: !!invoice.isTaxable,
      jobId: invoice.jobId,
      taxTypeId: invoice.taxTypeId,
      termId: invoice.termId,
      workOrderId: invoice.workOrderId,
      invoiceDetails: invoice.invoiceDetails.map((detail) => {
        const newDetail = {
          ...detail,
          markup: formatNumber(detail.markup),
          quantity: formatNumber(detail.quantity),
          totalPrice: formatNumber(detail.totalPrice),
          unitCost: formatNumber(detail.unitCost),
          isTaxable: !!detail.isTaxable,
          comment: detail.comment || null
        };
        delete newDetail.source;
        delete newDetail.createdAt;
        delete newDetail.invoiceId;
        return newDetail;
      }),
      balanceDue: formatNumber(invoice.balanceDue),
      externalId: invoice.source?.externalId || null,
      concurrencyId: invoice.source?.concurrencyId || null,
      subTotal: formatNumber(invoice.subTotal),
      markupTotal: formatNumber(invoice.markupTotal),
      totalAmount: formatNumber(invoice.totalAmount),
      chargeAmountPaid: formatNumber(invoice.chargeAmountPaid),
      taxPercent: formatNumber(invoice.taxPercent),
      tax: formatNumber(invoice.tax)
    };
    return value;
  }
}
