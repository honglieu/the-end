import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyService } from '@services/agency.service';
import { LeaseRenewalService } from '@services/lease-renewal.service';
import { LoadingService } from '@services/loading.service';
import { TrudiService } from '@services/trudi.service';
import {
  EPropertyTreeOption,
  EPropertyTreeType,
  IWidgetVacate
} from '@/app/task-detail/utils/functions';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CreditorInvoicingPropertyService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/creditor-invoice.service';
import { InvoicePopupManagerService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/invoice-popup-manager.service';
import { LeasingWidgetService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/leasing.service';
import { MaintenanceInvoiceFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-invoice-form.service';
import { MaintenanceSyncPtService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-sync-pt.service';
import { TenancyInvoiceService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/tenancy-invoice.service';
import { WidgetNoteService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-note.service';
import { WidgetFormPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-form.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { ESelectInvoiceType } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/popup.enum';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { InvoiceDataReq } from '@shared/types/tenancy-invoicing.interface';
import { INextSelectInvoice } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/select-existing-invoice/select-existing-invoice.component';
import { LeaseRenewalSyncStatus } from '@shared/enum';
import { PreventButtonService } from '@trudi-ui';
import { EButtonType, EButtonWidget } from '@trudi-ui';
import { VacateDetailService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/vacate-detail.service';
import { ActivatedRoute } from '@angular/router';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';

@Component({
  selector: 'popup-widget-property-tree',
  templateUrl: './popup-widget-property-tree.component.html'
})
export class PopupWidgetPropertyTreeComponent implements OnInit, OnDestroy {
  @Input() public typePopup: EPropertyTreeType | EPropertyTreeOption = null;
  @Input() public optionPopup: {} = null;
  public typePropertyTree = EPropertyTreeType;
  public showSelectInvoiceModal = false;
  public selectInvoicePopupType: ESelectInvoiceType = null;
  private unsubscribe = new Subject<void>();
  public syncPTStatus: LeaseRenewalSyncStatus;
  public lastTimeSynced: string;
  public popupState = {
    showTenantVacateModal: false
  };
  public lastTimeSyncedTenantVacate: string;

  constructor(
    public widgetPTService: WidgetPTService,
    public tenancyInvoicingService: TenancyInvoiceService,
    public leasingWidgetService: LeasingWidgetService,
    public widgetNoteService: WidgetNoteService,
    public leaseRenewalService: LeaseRenewalService,
    public widgetFormPTService: WidgetFormPTService,
    public trudiService: TrudiService,
    public agencyService: AgencyService,
    private maintenanceSyncPtService: MaintenanceSyncPtService,
    public loadingService: LoadingService,
    public creditorInvoicingService: CreditorInvoicingPropertyService,
    public trudiDynamicParamater: TrudiDynamicParameterService,
    public inboxService: InboxService,
    public invoicePopupManager: InvoicePopupManagerService,
    private maintenanceInvoiceForm: MaintenanceInvoiceFormService,
    private preventButtonService: PreventButtonService,
    public vacateDetailService: VacateDetailService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.invoicePopupManager.currentPopup$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.selectInvoicePopupType = rs;
      });

    combineLatest([
      this.leaseRenewalService.getTimeAndStatusSync,
      this.leasingWidgetService.syncPTStatus
    ])
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(([timeAndStatusSyncRes, syncPTStatusRes]) => {
        this.syncPTStatus = timeAndStatusSyncRes?.status || syncPTStatusRes;
      });

    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap) {
        this.lastTimeSyncedTenantVacate = '';
      }
    });

    this.widgetPTService
      .getPTWidgetStateByType<IWidgetVacate[]>(PTWidgetDataField.TENANT_VACATES)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.lastTimeSyncedTenantVacate = data[0]?.updatedAt;
      });

    this.vacateDetailService.popupStateVacateDetails
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((showTenantVacateModal) => {
        this.popupState = showTenantVacateModal;
      });
  }

  handleSyncPtWidgetTenantVacate(payload) {
    this.vacateDetailService.handleSyncPtWidgetTenantVacate(payload);
  }

  handleCancel() {
    this.showSelectInvoiceModal = false;
    this.invoicePopupManager.setCurrentPopup(null);
    this.widgetPTService.setPopupWidgetState(null);
  }

  handleCancelSyncVacateDetail(e) {
    this.vacateDetailService.syncStatusPtWidgetTenantVacate.next(
      LeaseRenewalSyncStatus.WAITING
    );
    this.vacateDetailService.popupStateVacateDetails.next({
      showTenantVacateModal: false
    });
  }

  backToSelect() {
    this.widgetPTService.setPopupWidgetState(null);
    this.showSelectInvoiceModal = true;
  }

  handleOpenSelectNote($event) {
    if ($event && typeof $event === 'object') {
      this.widgetPTService.setPopupWidgetState({
        type: EPropertyTreeType.SYNC_PROPERTY_TREE,
        option: $event
      });
    } else {
      this.widgetPTService.setPopupWidgetState(
        EPropertyTreeType.SYNC_PROPERTY_TREE
      );
    }
  }

  handleBack() {
    this.widgetPTService.setPopupWidgetState(EPropertyTreeType.CREATE_NOTES);
  }

  handleClose() {
    this.widgetPTService.setPopupWidgetState(null);
  }

  handleCloseSyncNote() {
    this.widgetNoteService.isEditNote.next(false);
    this.preventButtonService.deleteProcess(
      EButtonWidget.PROPERTY_TREE,
      EButtonType.WIDGET
    );
  }

  nextSelectInvoice(payload: INextSelectInvoice) {
    const { value: invoice, action } = payload;
    this.invoicePopupManager.setShowSelectInvoiceModal(false);
    switch (action) {
      case ESelectInvoiceType.TENANCY_INVOICE:
        if (!invoice) {
          this.widgetPTService.setPopupWidgetState(
            EPropertyTreeType.TENANCY_INVOICE
          );
          return;
        }
        this.tenancyInvoicingService.updateListTenancyInvoice(
          invoice,
          invoice.id
        );
        if (invoice.isLinkInvoice) {
          this.creditorInvoicingService.updateListCreditorInvoice(
            invoice,
            invoice.id
          );
          this.widgetPTService.setPopupWidgetState(
            EPropertyTreeType.CREDITOR_INVOICE
          );
          this.creditorInvoicingService.setSelectedCreditorInvoice(invoice);
        } else {
          this.widgetPTService.setPopupWidgetState(
            EPropertyTreeType.TENANCY_INVOICE
          );
          this.tenancyInvoicingService.setSelectedTenancyInvoice(
            invoice as InvoiceDataReq
          );
        }
        break;
      case ESelectInvoiceType.CREDITOR_INVOICE:
        this.widgetPTService.setPopupWidgetState(
          EPropertyTreeType.CREDITOR_INVOICE
        );
        if (!invoice) return;
        this.creditorInvoicingService.updateListCreditorInvoice(
          invoice,
          invoice.id
        );
        this.creditorInvoicingService.setSelectedCreditorInvoice(invoice);
        if (!invoice.isLinkInvoice) return;
        this.tenancyInvoicingService.updateListTenancyInvoice(
          invoice,
          invoice.id
        );
        break;
      case ESelectInvoiceType.MAINTENANCE_INVOICE:
        this.widgetPTService.setPopupWidgetState(
          EPropertyTreeType.MAINTENANCE_INVOICE
        );
        if (!invoice) return;
        this.maintenanceInvoiceForm.setSelectedMaintenanceInvoice(invoice);
        this.maintenanceSyncPtService.updateListMaintenanceInvoice(
          invoice,
          invoice.id
        );
        break;
      default:
        break;
    }
  }

  cancelSelectInvoice() {
    this.widgetPTService.setPopupWidgetState(null);
    this.invoicePopupManager.setCurrentPopup(null);
    this.invoicePopupManager.setShowSelectInvoiceModal(false);
    this.tenancyInvoicingService.setSelectedTenancyInvoice(null);
    this.creditorInvoicingService.setSelectedCreditorInvoice(null);
    this.maintenanceInvoiceForm.setSelectedMaintenanceInvoice(null);
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.widgetPTService.setPopupWidgetState(null);
  }
}
