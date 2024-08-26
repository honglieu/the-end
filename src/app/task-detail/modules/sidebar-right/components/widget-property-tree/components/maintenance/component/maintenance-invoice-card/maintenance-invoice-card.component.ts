import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IMaintenanceInvoice } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/maintenance/maintenance-invoice.interface';
import { MaintenanceSyncPtService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-sync-pt.service';
import { Subject } from 'rxjs';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { MaintenanceInvoiceFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-invoice-form.service';
import { MaintenanceSyncPtApiService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/maintenance-sync-pt-api.service';
import {
  EMaintenanceInvoiceAction,
  EMaintenanceInvoiceStatus
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/maintenance/maintenance-invoice.enum';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TrudiService } from '@services/trudi.service';
import { TaskService } from '@services/task.service';
import { EButtonStepKey } from '@trudi-ui';

@Component({
  selector: 'maintenance-invoice-card',
  templateUrl: './maintenance-invoice-card.component.html',
  styleUrls: ['./maintenance-invoice-card.component.scss']
})
export class MaintenanceInvoiceCardComponent implements OnInit, OnDestroy {
  @Input() invoiceCard: IMaintenanceInvoice;
  private unsubscribe: Subject<void> = new Subject<void>();
  public EMaintenanceInvoiceAction = EMaintenanceInvoiceAction;
  public ESyncPropertyTree = ESyncStatus;
  public EMaintenanceInvoiceStatus = EMaintenanceInvoiceStatus;
  public firstTimeSyncedSuccess: boolean = false;
  public isStatusPaid: boolean = false;
  public errorTitle: string = '';
  readonly EButtonStepKey = EButtonStepKey;

  constructor(
    private maintenanceSyncPTService: MaintenanceSyncPtService,
    private widgetPTService: WidgetPTService,
    private maintenanceInvoiceFormService: MaintenanceInvoiceFormService,
    private maintenanceSyncPtApiService: MaintenanceSyncPtApiService,
    public stepService: StepService,
    public trudiService: TrudiService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.handleDataWhenStatusPaid();
  }
  get firstTimeSyncSuccess(): boolean {
    return (
      this.invoiceCard?.updateFromSocket &&
      this.invoiceCard.syncStatus === ESyncStatus.COMPLETED
    );
  }

  handleRemove() {
    const { id: taskId } = this.taskService.currentTask$.value;
    this.maintenanceSyncPtApiService
      .removeMaintenanceInvoice(this.invoiceCard.invoiceId, taskId)
      .subscribe((res) => {
        const currentInvoices =
          this.maintenanceSyncPTService.getMaintenanceSyncData()
            .maintenanceInvoice.data;
        let invoices = currentInvoices.filter(
          (item) => item.id !== this.invoiceCard.id
        );
        if (res) {
          invoices = [...invoices, res];
        }
        this.widgetPTService.setPTWidgetStateByType(
          PTWidgetDataField.MAINTENANCE_INVOICE,
          'REMOVE',
          invoices
        );
      });
  }

  handleRetryCard(data) {
    const { id: taskId, property } = this.taskService.currentTask$.value;
    this.maintenanceSyncPtApiService
      .reTryMaintenanceInvoice(this.invoiceCard.invoiceId, taskId, property.id)
      .subscribe((maintenanceInvoice) => {
        const currentInvoices =
          this.maintenanceSyncPTService.getMaintenanceSyncData()
            .maintenanceInvoice.data;
        const invoices = currentInvoices.map((item) =>
          item.invoiceId === maintenanceInvoice.invoiceId
            ? maintenanceInvoice
            : item
        );
        this.widgetPTService.setPTWidgetStateByType(
          PTWidgetDataField.MAINTENANCE_INVOICE,
          'UPDATE',
          invoices
        );
      });
  }
  handleClickCard() {
    this.maintenanceInvoiceFormService.setSelectedMaintenanceInvoice(
      this.invoiceCard
    );
    this.widgetPTService.setPopupWidgetState(
      EPropertyTreeType.MAINTENANCE_INVOICE
    );
  }
  handleDataWhenStatusPaid() {
    if (
      this.invoiceCard.action === EMaintenanceInvoiceAction.CANCEL &&
      this.invoiceCard.status === EMaintenanceInvoiceStatus.PAID &&
      this.invoiceCard.syncStatus === ESyncStatus.FAILED
    ) {
      this.errorTitle = "The invoice can't be cancelled";
      this.isStatusPaid = true;
    }
    if (
      this.invoiceCard.action === EMaintenanceInvoiceAction.UPDATE &&
      this.invoiceCard.status === EMaintenanceInvoiceStatus.PAID &&
      this.invoiceCard.syncStatus === ESyncStatus.FAILED
    ) {
      this.errorTitle = "The invoice can't be edited";
      this.isStatusPaid = true;
    }
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
