import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Subject, of, switchMap, takeUntil, catchError } from 'rxjs';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import {
  EInvoice,
  EInvoiceType,
  EStatusPaid
} from '@shared/enum/creditor-invoicing.enum';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import {
  EInvoiceStatus,
  EInvoiceTypeBS,
  InvoiceDataReq
} from '@shared/types/tenancy-invoicing.interface';
import { Personal } from '@shared/types/user.interface';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TenancyInvoiceService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/tenancy-invoice.service';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import {
  InvoiceType,
  PropertyTreeAccount
} from '@/app/invoicing/tenancy-invoicing/utils/invoiceTypes';
import { getCreditorName } from '@/app/invoicing/tenancy-invoicing/utils/functions';
import { TenancyInvoiceFormService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/tenancy-invoice-form.service';
import { CreditorInvoicingService } from '@services/creditor-invoicing.service';
import { CreditorInvoicingPropertyService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/creditor-invoice.service';
import {
  PTWidgetDataField,
  mapComponentToTitleKey
} from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { TenancyInvoicingService } from '@services/tenancy-invoicing.service';
import { GeneralComplianceAPIService } from '@/app/general-compliance/services/general-compliance-api.service';
import { SmokeAlarmAPIService } from '@/app/smoke-alarm/services/smoke-alarm-api.service';
import { TrudiService } from '@services/trudi.service';
import { InvoiceWidgetComponent } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/components/invoice-widget/invoice-widget.component';
import { TenantVacateApiService } from '@/app/tenant-vacate/services/tenant-vacate-api.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import {
  EButtonAction,
  EPropertyTreeButtonComponent
} from '@/app/task-detail/modules/steps/utils/property-tree.enum';

@Component({
  selector: 'tenancy-invoice-widget',
  templateUrl: './tenancy-invoice-widget.component.html',
  styleUrls: ['./tenancy-invoice-widget.component.scss']
})
export class TenancyInvoiceWidgetComponent
  extends InvoiceWidgetComponent
  implements OnInit, OnChanges
{
  @Input() invoice: InvoiceDataReq;
  public creditorInvoiceList: InvoiceDataReq[] = [];
  public unsubscribe = new Subject<void>();
  public syncStatus: string = ESyncStatus.UN_SYNC;
  public arrTenancyInvoice: InvoiceDataReq[] = [];
  public listTenance: Personal[] = [];
  public ESTATUSPAID = EStatusPaid;
  public invoiceType: EInvoice;
  public invoiceId = '';
  public saveUrlEmbed: SafeResourceUrl;
  public selectedDocumentId = '';
  public typePropertyTree = EPropertyTreeType;
  public override syncPropertyTree = ESyncStatus;
  public selectedDeleteId: string = null;
  public currentData;
  public currentAgencyId = '';

  readonly EInvoiceStatus = EInvoiceStatus;
  readonly EStatusInvoice = EStatusPaid;
  readonly SYNCTYPE = ESyncStatus;
  public isShowpopupCreditor = false;
  public currentTaskId: string;
  public mapComponentToTitleKey = mapComponentToTitleKey;

  constructor(
    public override tenancyInvoicingService: TenancyInvoiceService,
    public override taskService: TaskService,
    private propertyService: PropertiesService,
    public cdr: ChangeDetectorRef,
    private invoiceFormService: TenancyInvoiceFormService,
    public widgetPTService: WidgetPTService,
    public sanitizer: DomSanitizer,
    public override creditorInvoicingService: CreditorInvoicingService,
    private creditorService: CreditorInvoicingPropertyService,
    public override smokeAlarmAPIService: SmokeAlarmAPIService,
    public override tenancyInvoiceService: TenancyInvoicingService,
    public override generalComplianceAPIService: GeneralComplianceAPIService,
    public override trudiService: TrudiService,
    public override tenantVacateApiService: TenantVacateApiService,
    public stepService: StepService
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
        PTWidgetDataField.TENANCY_INVOICES
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.mapDataTenancy();
      });

    this.widgetPTService
      .getPTWidgetStateByType<InvoiceDataReq[]>(
        PTWidgetDataField.CREDITOR_INVOICES
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.creditorInvoiceList = data;
      });

    this.taskService.currentTask$
      .pipe(
        takeUntil(this.unsubscribe),
        switchMap((rs) => {
          if (rs) {
            this.currentTaskId = rs?.id;
            this.currentAgencyId = rs?.agencyId;
            if (!rs.property?.isTemporary) {
              return this.tenancyInvoicingService.getListSupplierById(
                EInvoiceType.TENANCY_INVOICE,
                this.currentAgencyId
              );
            }
            return of(null);
          }
          return of(null);
        })
      )
      .subscribe((rs: PropertyTreeAccount[]) => {
        if (!rs) return;
        const creditorOptions = rs.reduce((acc, ptAccount) => {
          const users = ptAccount.users.map((user) => ({
            id: user.id,
            label: getCreditorName(user.firstName, user.lastName)
          }));
          return [...acc, ...users];
        }, []);
        this.invoiceFormService.creditorOptions.next(creditorOptions);
      });

    this.taskService.currentTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        if (!rs) return;
        this.currentTaskId = rs?.id;
        this.currentAgencyId = rs?.agencyId;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.appendFieldForInvoice();
  }

  mapDataTenancy() {
    this.propertyService.peopleList
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.listTenance = res.tenancies;
          this.appendFieldForInvoice();
        }
      });
  }

  appendFieldForInvoice = () => {
    const foundElement = this.listTenance.find(
      (element2) => element2.id === this.invoice.tenancyInvoice.tenancyId
    );
    if (foundElement) {
      this.invoice = {
        ...this.invoice,
        tenancyName: foundElement?.name
      } as InvoiceDataReq;
    }
  };

  handleEditInvoice(data) {
    if (
      data.invoiceWidgetType === EInvoiceTypeBS.CREDITOR &&
      data.isLinkInvoice
    ) {
      this.creditorService.setSelectedCreditorInvoice(data);
      this.widgetPTService.setPopupWidgetState(
        this.typePropertyTree.CREDITOR_INVOICE
      );
    } else {
      this.widgetPTService.setTenanciesID(data?.tenancyInvoice?.tenancyId);
      this.tenancyInvoicingService.setSelectedTenancyInvoice(data);
      this.invoiceFormService.invoiceData.next(data);
      const isCreditorInvoice =
        data?.creditorInvoice &&
        Object.keys(data?.creditorInvoice).length > 0 &&
        Object.keys(data?.tenancyInvoice).length > 0;

      if (isCreditorInvoice) {
        this.invoiceFormService.selectedInvoiceType.next(
          InvoiceType.CreditorInvoice
        );
        this.widgetPTService.setPopupWidgetState(
          this.typePropertyTree.CREDITOR_INVOICE
        );
      } else {
        this.tenancyInvoicingService.isShowModalSync.next(true);
        this.invoiceFormService.selectedInvoiceType.next(
          InvoiceType.TenancyInvoice
        );
        this.widgetPTService.setPopupWidgetState(
          this.typePropertyTree.TENANCY_INVOICE
        );
      }
    }
  }

  handleRemove(item: InvoiceDataReq) {
    this.selectedDeleteId = item.id;
    this.widgetPTService.setPopupWidgetState(null);

    this.tenancyInvoicingService
      .removeTenancyInvoice(this.selectedDeleteId, this.currentTaskId)
      .pipe(takeUntil(this.unsubscribe))
      .pipe(
        catchError(() => of(null)),
        switchMap(() => {
          return this.widgetPTService.getFullDataPTWidget(this.currentTaskId);
        })
      )
      .subscribe({
        next: (res) => {
          this._updateListOfTenant();
          this.widgetPTService.setPTWidgetState(res);
        }
      });
  }

  handleRetryInvoice(item: InvoiceDataReq) {
    item.syncStatus = ESyncStatus.INPROGRESS;
    this.tenancyInvoicingService.updateListTenancyInvoice(item, item.id);
    const isLinkInvoice =
      item.invoiceWidgetType === EInvoiceTypeBS.CREDITOR && item.isLinkInvoice;
    if (isLinkInvoice) {
      this.creditorService.updateListCreditorInvoice(item, item.id);
    }
    this.tenancyInvoicingService
      .reTryTenancyInvoice({
        agencyId: this.currentAgencyId,
        invoiceId: item?.id,
        taskId: this.taskService.currentTaskId$.getValue(),
        propertyId: this.propertyService.currentPropertyId?.value,
        stepId: item?.stepId
      })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.tenancyInvoicingService.updateListTenancyInvoice(
          {
            ...res,
            firstTimeSyncSuccess: res.syncStatus !== ESyncStatus.FAILED
          },
          item.id
        );
        if (
          this.tenancyInvoicingService.isShowModalSync.getValue() &&
          this.tenancyInvoicingService?.selectedTenancyInvoice$?.getValue()
            ?.id === res?.id
        ) {
          this.tenancyInvoicingService.setSelectedTenancyInvoice(res);
        }
        if (isLinkInvoice) {
          this.creditorService.updateListCreditorInvoice(
            {
              ...res,
              firstTimeSyncSuccess:
                res.syncStatus === SyncMaintenanceType.COMPLETED
            },
            res.id
          );
          if (
            this.creditorService.selectedCreditorInvoice$.getValue()?.id ===
            res.id
          ) {
            this.creditorService.setSelectedCreditorInvoice(res);
          }
        }
        const trudiResponeTemplate =
          this.trudiService.getTrudiResponse?.getValue();

        if (res?.syncStatus === this.syncPropertyTree.COMPLETED) {
          this._updateListOfTenant();

          if (trudiResponeTemplate?.isTemplate) {
            this.stepService.updateButtonStatusTemplate(
              res?.stepId,
              EPropertyTreeButtonComponent.TENANCY_INVOICE,
              EButtonAction.PT_NEW_COMPONENT
            );
          }

          if (!item?.tenancyInvoice?.status) {
            super.updateButtonStatus();
          }
        }
      });
  }

  get disabled() {
    return this.syncStatus === SyncMaintenanceType.INPROGRESS;
  }

  private _updateListOfTenant() {
    const propertyId = this.propertyService.currentPropertyId.getValue();
    this.propertyService.getPeople(propertyId);
  }

  trackById(_index: number, item: InvoiceDataReq) {
    return item.id;
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
