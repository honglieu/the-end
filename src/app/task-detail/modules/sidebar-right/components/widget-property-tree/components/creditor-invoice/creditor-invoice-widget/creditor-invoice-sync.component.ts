import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { catchError, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AgencyService } from '@services/agency.service';
import { ConversationService } from '@services/conversation.service';

import { TaskService } from '@services/task.service';
import { EStatusPaid } from '@shared/enum/creditor-invoicing.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import {
  TenancyInvoice,
  InvoiceDataReq
} from '@shared/types/tenancy-invoicing.interface';
import { CreditorInvoicingPropertyService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/creditor-invoice.service';
import { TenancyInvoiceService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/tenancy-invoice.service';
import { PropertiesService } from '@services/properties.service';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { InvoiceWidgetComponent } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/invoice-widget/invoice-widget.component';
import { SmokeAlarmAPIService } from '@/app/smoke-alarm/services/smoke-alarm-api.service';
import { TenancyInvoicingService } from '@services/tenancy-invoicing.service';
import { GeneralComplianceAPIService } from '@/app/general-compliance/services/general-compliance-api.service';
import { TrudiService } from '@services/trudi.service';
import { CreditorInvoicingService } from '@services/creditor-invoicing.service';
import { TenantVacateApiService } from '@/app/tenant-vacate/services/tenant-vacate-api.service';
import { TaskNameId } from '@shared/enum/task.enum';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { displayName } from '@shared/feature/function.feature';
import { EButtonStepKey } from '@trudi-ui';
@Component({
  selector: 'creditor-invoice-widget',
  templateUrl: './creditor-invoice-sync.component.html',
  styleUrls: ['./creditor-invoice-sync.component.scss']
})
export class CreditorInvoiceSyncComponent
  extends InvoiceWidgetComponent
  implements OnInit, OnChanges
{
  @Input() invoice: InvoiceDataReq;
  private unsubscribe = new Subject<void>();
  public agencyId: string = '';
  public taskId: string = '';
  public propertyId: string = '';
  public isOpenModalEdit: boolean = false;
  public isOpenTenancyModalEdit: boolean = false;
  public isOpenModalAdd: boolean = false;
  public currentData: InvoiceDataReq;
  public TYPE_SYNC_MAINTENANCE = SyncMaintenanceType;
  public ESTATUSPAID = EStatusPaid;
  public arrCreditorInvoice: InvoiceDataReq[] = [];
  public listSupplier;
  public invoiceItem: TenancyInvoice;
  public isShowpopupCreditor: boolean = false;
  public typePropertyTree = EPropertyTreeType;
  public listTennacy: InvoiceDataReq[] = [];
  readonly SYNCTYPE = SyncMaintenanceType;
  readonly EButtonStepKey = EButtonStepKey;

  constructor(
    public creditorInvoicePropertyService: CreditorInvoicingPropertyService,
    public agencyService: AgencyService,
    public override taskService: TaskService,
    public conversationService: ConversationService,
    public override tenancyInvoicingService: TenancyInvoiceService,
    private propertyService: PropertiesService,
    public widgetPTService: WidgetPTService,
    public override smokeAlarmAPIService: SmokeAlarmAPIService,
    public override tenancyInvoiceService: TenancyInvoicingService,
    public override generalComplianceAPIService: GeneralComplianceAPIService,
    public override trudiService: TrudiService,
    public override creditorInvoicingService: CreditorInvoicingService,
    public override tenantVacateApiService: TenantVacateApiService,
    public stepService: StepService,
    public trudiDynamicParamater: TrudiDynamicParameterService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {
    super(
      taskService,
      tenancyInvoicingService,
      trudiService,
      creditorInvoicingService,
      smokeAlarmAPIService,
      tenancyInvoiceService,
      generalComplianceAPIService,
      tenantVacateApiService
    );
  }

  ngOnInit(): void {
    this.widgetPTService
      .getPTWidgetStateByType<InvoiceDataReq[]>(
        PTWidgetDataField.CREDITOR_INVOICES
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (data) this.handleMapDataCreditor();
      });
    this.widgetPTService
      .getPTWidgetStateByType<InvoiceDataReq[]>(
        PTWidgetDataField.TENANCY_INVOICES
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        if (data) {
          this.listTennacy = data;
        }
      });
    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (!res) return;
        this.agencyId = res?.agencyId;
        this.taskId = res?.id;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.handleMapDataCreditor();
  }

  mapPrefillData(item) {
    return {
      ...item,
      creditorInvoice: {
        ...item?.creditorInvoice,
        ...this.creditorInvoicePropertyService,
        dueDate: item?.creditorInvoice?.dueDate
          ? this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
              item?.creditorInvoice?.dueDate
            )
          : null
      }
    };
  }

  handleEditCreditor(data) {
    const item = this.mapPrefillData(this.invoice);

    this.creditorInvoicePropertyService.setSelectedCreditorInvoice(item);
    this.creditorInvoicePropertyService.isInvoiceSync.next(true);
    this.widgetPTService.setPopupWidgetState(
      this.typePropertyTree.CREDITOR_INVOICE
    );
  }

  handleRetryCreditor(id) {
    this.creditorInvoicePropertyService.updateListCreditorInvoice(
      { ...this.invoice, syncStatus: ESyncStatus.INPROGRESS },
      this.invoice.id
    );

    if (this.invoice.isLinkInvoice) {
      this.tenancyInvoicingService.updateListTenancyInvoice(
        { ...this.invoice, syncStatus: ESyncStatus.INPROGRESS },
        this.invoice.id
      );
    }

    const bodyRetryInvoice = {
      agencyId: this.agencyId,
      invoiceId: this.invoice.id,
      taskId: this.taskId,
      propertyId: this.propertyService.currentPropertyId?.value,
      stepId: this.invoice?.stepId
    };

    this.creditorInvoicePropertyService
      .retryInvoicesToProperty(bodyRetryInvoice)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (res) => {
          this.creditorInvoicePropertyService.updateListCreditorInvoice(
            {
              ...res,
              firstTimeSyncSuccess:
                res.syncStatus === SyncMaintenanceType.COMPLETED
            },
            res.id
          );
          if (
            this.creditorInvoicePropertyService.isInvoiceSync.getValue() &&
            this.creditorInvoicePropertyService.selectedCreditorInvoice$.getValue()
              ?.id === res.id
          ) {
            this.creditorInvoicePropertyService.setSelectedCreditorInvoice(res);
          }
          if (res.isLinkInvoice) {
            this.tenancyInvoicingService.updateListTenancyInvoice(
              {
                ...res,
                firstTimeSyncSuccess:
                  res.syncStatus === SyncMaintenanceType.COMPLETED
              },
              res.id
            );
          }
          const taskNameId =
            this.taskService.currentTask$.value?.trudiResponse?.setting
              ?.taskNameId;
          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();
          if (
            trudiResponeTemplate?.isTemplate &&
            res.syncStatus === SyncMaintenanceType.COMPLETED
          ) {
            this.stepService.updateButtonStatusTemplate(
              res?.stepId,
              EPropertyTreeButtonComponent.CREDITOR_INVOICE,
              EButtonAction.PT_NEW_COMPONENT
            );
          }
          if (
            res?.syncStatus === this.syncPropertyTree.COMPLETED &&
            !this.invoice?.creditorInvoice?.status &&
            (taskNameId !== TaskNameId.invoiceTenant || res.isLinkInvoice)
          ) {
            super.updateButtonStatus();
          }
        }
      });
  }

  handleMapDataCreditor() {
    if (this.listSupplier) {
      this.setSupplierName();
    } else {
      this.creditorInvoicePropertyService
        .getAllSupplier()
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res.length > 0) {
            this.listSupplier = res;
            this.setSupplierName();
          }
        });
    }
  }

  setSupplierName() {
    if (!this.invoice) return;
    let supplierName;
    if (
      !!this.invoice?.supplier?.firstName ||
      !!this.invoice?.supplier?.lastName
    ) {
      supplierName = displayName(
        this.invoice?.supplier?.firstName,
        this.invoice?.supplier?.lastName
      );
    } else {
      const result = this.listSupplier.find(
        (element2) => element2?.id === this.invoice?.supplierId
      );
      if (result) {
        supplierName = result.firstName || result.lastName;
      }
    }
    this.invoice = {
      ...this.invoice,
      supplierName
    } as InvoiceDataReq;
  }

  handleRemoveCreditor(e) {
    this.invoiceItem = e;
    this.creditorInvoicePropertyService
      .removeInvoicesToProperty(this.invoiceItem.id, this.taskId)
      .pipe(
        catchError(() => of(null)),
        switchMap(() => {
          return this.widgetPTService.getFullDataPTWidget(this.taskId);
        })
      )
      .subscribe({
        next: (res) => {
          this.widgetPTService.setPTWidgetState(res);
        }
      });
  }

  trackById(_index: number, item: InvoiceDataReq) {
    return item.id;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
