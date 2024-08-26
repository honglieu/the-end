import { Component, Input, OnInit } from '@angular/core';
import {
  Subject,
  defaultIfEmpty,
  filter,
  find,
  from,
  map,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { PropertiesService } from '@services/properties.service';
import { CreditorInvoiceFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/creditor-invoice-form.service';
import { TenancyInvoiceFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/tenancy-invoice-form.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import {
  EInvoiceTypeBS,
  InvoiceDataReq
} from '@shared/types/tenancy-invoicing.interface';
import { UserProperty } from '@shared/types/users-by-property.interface';

@Component({
  selector: 'email-automatic-invoices',
  templateUrl: './email-automatic-invoices.component.html',
  styleUrls: ['./email-automatic-invoices.component.scss']
})
export class EmailAutomaticInvoicesComponent implements OnInit {
  @Input() dataInvoice: InvoiceDataReq;
  public unsubscribe = new Subject<void>();
  public listContactUsers: UserProperty[] = [];
  constructor(
    private propertiesService: PropertiesService,
    private widgetPTService: WidgetPTService,
    private invoiceFormService: TenancyInvoiceFormService,
    private creditorInvoiceFormService: CreditorInvoiceFormService
  ) {}

  get tenantInvoiceForm() {
    return this.invoiceFormService?.invoiceForm?.get('tenantInvoice');
  }

  get tenantFormWithinCreditor() {
    return this.creditorInvoiceFormService?.myForm;
  }

  ngOnInit(): void {
    this.getListContactUsers();
  }

  getListContactUsers() {
    this.widgetPTService
      .getTenanciesID()
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((tenanciesID) => {
          if (!tenanciesID) return of([]);

          return this.propertiesService.peopleList$.pipe(
            takeUntil(this.unsubscribe),
            switchMap((res) =>
              from(res.tenancies).pipe(
                find((item) => item.id === tenanciesID),
                defaultIfEmpty(null)
              )
            ),
            filter(Boolean),
            map((tenancy) =>
              tenancy.userProperties.filter(
                (property) => property.isReceiveAutomaticInvoices
              )
            )
          );
        })
      )
      .subscribe((listContact) => {
        this.listContactUsers = listContact.sort((a, b) =>
          a.email.localeCompare(b.email)
        );
        this.toggleEmailControls(!this.listContactUsers.length);
      });
  }

  isConditionDisabled(isDisabled: boolean): boolean {
    const { isLinkInvoice, syncStatus, invoiceWidgetType } =
      this.dataInvoice || {};

    const isSyncInProgressOrCompleted =
      syncStatus === ESyncStatus.INPROGRESS ||
      syncStatus === ESyncStatus.COMPLETED;

    const isTenancyAndSyncInProgress =
      invoiceWidgetType === EInvoiceTypeBS.TENANCY &&
      syncStatus === ESyncStatus.INPROGRESS;

    return (
      isDisabled ||
      (isLinkInvoice && isSyncInProgressOrCompleted) ||
      isTenancyAndSyncInProgress
    );
  }

  toggleEmailControls(isDisabled: boolean) {
    const method = this.isConditionDisabled(isDisabled) ? 'disable' : 'enable';
    this.tenantInvoiceForm?.get('sendEmailTenancyInvoice')[method]();
    this.tenantFormWithinCreditor?.get('sendEmailTenancyInvoice')[method]();
  }
}
