import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {
  EPropertyTreeType,
  ESyncStatus,
  IWidgetVacate,
  MenuItem
} from '@/app/task-detail/utils/functions';
import { WidgetPTService } from './services/widget-property.service';
import {
  combineLatest,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  of,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs';
import { WidgetNoteService } from './services/widget-note.service';
import { LeasingWidgetService } from './services/leasing.service';
import { LeaseRenewalService } from '@services/lease-renewal.service';
import { WidgetFormPTService } from './services/widget-property-form.service';
import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import { TrudiService } from '@services/trudi.service';
import { TaskService } from '@services/task.service';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { TenancyInvoiceService } from './services/tenancy-invoice.service';
import { MaintenanceSyncPtService } from './services/maintenance-sync-pt.service';
import { IMaintenanceSyncData } from './interface/maintenance/maintenance-sync-data.interface';
import { SendMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import {
  PTWidgetData,
  PTWidgetDataField
} from './interface/widget-property-tree/widget-property-tree.interface';
import { LoadingService } from '@/app/services/loading.service';
import {
  ICreditor,
  IMaintenanceInvoice
} from './interface/maintenance/maintenance-invoice.interface';
import { IMaintenanceRequest } from './interface/maintenance/maintenance-request.interface';
import { CreditorInvoicingPropertyService } from './services/creditor-invoice.service';
import { LeasingWidgetRequestTrudiResponse } from '@shared/types/trudi.interface';
import {
  EInvoiceTypeBS,
  InvoiceDataReq
} from '@shared/types/tenancy-invoicing.interface';
import { TaskNameId } from '@shared/enum/task.enum';
import { TrudiDynamicParameterService } from '@/app/trudi-send-msg/services/trudi-dynamic-paramater.service';
import { ApiStatusService, EApiNames } from '@services/api-status.service';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { ESelectInvoiceType } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/enum/popup.enum';
import { InvoicePopupManagerService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/invoice-popup-manager.service';
import { WIDGET_DESCRIPTION } from '@/app/task-detail/modules/steps/constants/widget.constants';
import { EWidgetSectionType } from '@shared/enum/widget.enum';
import { EButtonWidget, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { WidgetLinkedService } from '@/app/task-detail/modules/sidebar-right/services/widget-linked.service';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import { isEqual } from 'lodash-es';
import { ComplianceApiService } from '@/app/compliance/services/compliance-api.service';
import { displayName } from '@/app/shared/feature/function.feature';

@Component({
  selector: 'widget-property-tree',
  templateUrl: './widget-property-tree.component.html',
  styleUrls: ['./widget-property-tree.component.scss'],
  providers: [LoadingService]
})
export class WidgetPropertyTreeComponent implements OnInit, OnDestroy {
  @Input() isNoPropertyTask: boolean;
  @ViewChild('container')
  container: ViewContainerRef;
  public PTWidgetDataField = PTWidgetDataField;
  public isExpandAttachments: boolean = true;
  public isShowWidget: boolean = false;
  public isDropdownOpen: boolean = false;
  public lastTimeSynced: string;
  public typePropertyTree = EPropertyTreeType;
  public ESyncPropertyTree = ESyncStatus;
  public creditorOptions: ICreditor[] = [];
  public ESelectInvoiceType = ESelectInvoiceType;
  public showSelectInvoiceModal = false;
  menuItems: MenuItem[] = [
    {
      label: 'Notes',
      type: 'CREATE_NOTES'
    },
    {
      label: 'Invoice',
      subMenu: [
        {
          label: 'Creditor invoice',
          type: 'CREDITOR_INVOICE'
        },
        {
          label: 'Tenancy invoice',
          type: 'TENANCY_INVOICE'
        }
      ]
    },
    {
      label: 'Maintenance',
      subMenu: [
        {
          label: 'Maintenance request',
          type: 'MAINTENANCE_REQUEST'
        },
        {
          label: 'Maintenance invoice',
          type: 'MAINTENANCE_INVOICE'
        }
      ]
    },
    {
      label: 'Inspection',
      subMenu: [
        {
          label: 'Routine inspection',
          type: 'ROUTINE_INSPECTION'
        },
        {
          label: 'Outgoing inspection',
          type: 'OUTGOING_INSPECTION'
        },
        {
          label: 'Ingoing inspection',
          type: 'INGOING_INSPECTION'
        }
      ]
    },
    {
      label: 'Lease renewal',
      type: 'LEASE_RENEWAL'
    },
    {
      label: 'Vacate details',
      type: 'VACATE_DETAIL'
    },
    {
      label: 'New tenancy',
      type: 'NEW_TENANCY'
    },
    {
      label: 'Compliance',
      type: 'CREATE_COMPLIANCE'
    }
  ];

  private unsubscribe = new Subject<void>();
  public listInvoices;
  public leasingData;
  public configs = {
    visible: false,
    title: 'Are you sure you want to remove this Property Tree card?',
    okText: 'Yes, cancel',
    cancelText: 'No, keep it',
    colorBtn: 'danger',
    iconName: 'warning',
    subTitle: ''
  };
  public lastTimeSyncedTenantVacate: string;
  public listTenantVacate: IWidgetVacate[];
  public noData: boolean = false;
  public currentTaskNameId: string = '';
  public currentPropertyId: string;
  public paragraph: object = { rows: 0 };
  public itemsCounts: number = 0;
  public currentTaskId: string;
  public readonly WIDGET_DESCRIPTION = WIDGET_DESCRIPTION;
  public readonly EWidgetSectionType = EWidgetSectionType;
  public EButtonType = EButtonType;
  public EButtonWidget = EButtonWidget;
  public isProcessStep: boolean = false;
  public visibleDropdown: boolean = false;
  public propertyTreeArray = [];

  private maintenanceSyncData: IMaintenanceSyncData =
    this.maintenanceSyncPtService.getMaintenanceRequestDefaultValue;

  private readonly _currentTask$ = this.taskService.currentTask$
    .asObservable()
    .pipe(
      filter(Boolean),
      distinctUntilChanged(
        (prev, cur) =>
          prev?.id === cur?.id && prev?.property?.id === cur?.property?.id
      )
    );

  constructor(
    public widgetPTService: WidgetPTService,
    public tenancyInvoicingService: TenancyInvoiceService,
    public leasingWidgetService: LeasingWidgetService,
    public widgetNoteService: WidgetNoteService,
    private taskService: TaskService,
    public leaseRenewalService: LeaseRenewalService,
    public widgetFormPTService: WidgetFormPTService,
    public trudiService: TrudiService,
    public agencyService: AgencyService,
    private maintenanceSyncPtService: MaintenanceSyncPtService,
    public loadingService: LoadingService,
    public creditorInvoicingService: CreditorInvoicingPropertyService,
    public trudiDynamicParamater: TrudiDynamicParameterService,
    private apiStatusService: ApiStatusService,
    public inboxService: InboxService,
    public invoicePopupManager: InvoicePopupManagerService,
    private widgetLinkedService: WidgetLinkedService,
    private PreventButtonService: PreventButtonService,
    private rxStrategyProvider: RxStrategyProvider,
    private complianceApiService: ComplianceApiService
  ) {}

  ngOnInit(): void {
    combineLatest(this.widgetPTService.ptWidgetFields$())
      .pipe(
        takeUntil(this.unsubscribe),
        distinctUntilChanged((prev, cur) => isEqual(prev, cur))
      )
      .subscribe((rs) => {
        this.propertyTreeArray = rs
          .flatMap((r, index) =>
            r.map((item) => ({
              ...item,
              componentType: Object.values(PTWidgetDataField)[index]
            }))
          )
          .sort(
            (a, b) =>
              new Date(a.createdAt || a.updatedAt)?.getTime() -
              new Date(b.createdAt || b.updatedAt)?.getTime()
          );
      });
    this.loadingService.onLoading();
    this.getCreditors();
    this.getMaintenanceRequest();
    this.getTotalWidgetData();
    this.rxStrategyProvider
      .schedule(
        () => {
          this.getWidgetData();
        },
        { strategy: 'low' }
      )
      .pipe(takeUntil(this.unsubscribe), take(1))
      .subscribe();

    this.onCurrentTaskChanged();
    this.widgetPTService
      .getEmptyPTWidgetState()
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribe))
      .subscribe((isEmpty) => {
        this.noData = isEmpty;
      });

    this.widgetPTService
      .getOpenWidget()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.isExpandAttachments = true;
      });

    this.widgetPTService
      .getPTWidgetStateByType<InvoiceDataReq[]>(
        PTWidgetDataField.TENANCY_INVOICES
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.listInvoices = data?.filter(
          (item) =>
            item?.invoiceWidgetType === EInvoiceTypeBS.TENANCY ||
            (item?.invoiceWidgetType === EInvoiceTypeBS.CREDITOR &&
              item?.isLinkInvoice)
        );
      });

    this.checkLeasingData();

    this.widgetPTService
      .getPTWidgetStateByType<IWidgetVacate[]>(PTWidgetDataField.TENANT_VACATES)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.listTenantVacate = data;
      });

    this.onTriggerChangeProcess();

    this.taskService.currentTask$
      .pipe(
        takeUntil(this.unsubscribe),
        filter(Boolean),
        distinctUntilKeyChanged('id'),
        switchMap((currentTask) => {
          if (!currentTask?.property?.isTemporary) {
            return this.complianceApiService.getListSupplierFromPT(
              currentTask.agencyId
            );
          }
          return of(null);
        })
      )
      .subscribe((suppliers) => {
        if (!suppliers) return;
        const transformedSuppliers =
          suppliers?.map((supplier) => ({
            ...supplier,
            label: displayName(supplier?.firstName, supplier?.lastName)
          })) || [];
        this.creditorInvoicingService.setAllSupplier(transformedSuppliers);
        return this.agencyService.setCreditor(transformedSuppliers);
      });

    this.taskService.currentTask$
      .pipe(
        filter((res) => Boolean(res)),
        switchMap((value) => {
          if (!value.property?.isTemporary) {
            return this.taskService.getListSupplier(value?.agencyId).pipe(
              tap((creditor) => {
                this.creditorInvoicingService.setListSupplier(creditor);
              })
            );
          }
          return of(null);
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe();
  }

  private onCurrentTaskChanged() {
    this._currentTask$.pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (res) => {
        if (res) {
          const { trudiResponse } = res;
          this.currentTaskNameId = trudiResponse?.setting?.taskNameId;
          this.isNoPropertyTask = res.property?.isTemporary;
        }
      }
    });
  }

  //exclude linkedActions
  IsEmptyPTWidget(data: PTWidgetData) {
    const newData = { ...data };
    delete newData.linkedActions;
    delete newData.noPTWidgetData;
    return Object.values(newData).every(
      (field) => Array.isArray(field) && !field.length
    );
  }

  handleChangeProperty(data: PTWidgetData) {
    //reassign property reset all pt widget data except for linkedActions
    Object.keys(data).forEach((key) => {
      if (
        Array.isArray(data[key]) &&
        key !== PTWidgetDataField.LINKED_ACTIONS
      ) {
        data[key] = [];
      }
    });
    data.noPTWidgetData = true;
    return data;
  }

  private getWidgetData() {
    let _data = null;
    this._currentTask$
      .pipe(
        switchMap((task) => {
          task?.id &&
            this.apiStatusService.setApiStatus(
              EApiNames.GetFullDataPTWidget,
              false
            );
          this.currentTaskId = task?.id;
          let isChangeProperty =
            _data && task?.property?.id !== this.currentPropertyId;
          this.currentPropertyId = task?.property?.id;

          if (isChangeProperty) {
            return of(this.handleChangeProperty(_data));
          }

          return task?.id
            ? this.widgetPTService.getFullDataPTWidget(task?.id).pipe(
                map((data) => {
                  data.noPTWidgetData = this.IsEmptyPTWidget(data);
                  return data;
                })
              )
            : of(null);
        }),
        takeUntil(this.unsubscribe)
      )
      .subscribe({
        next: (data) => {
          _data = data;
          this.widgetLinkedService.setLinkedActionBS(data.linkedActions);
          this.apiStatusService.setApiStatus(
            EApiNames.GetFullDataPTWidget,
            true
          );
          if (data) {
            this.widgetPTService.setPTWidgetState(data as any);
            if (data.noPTWidgetData) {
              this.widgetPTService.setEmptyPTWidgetState(true);
            } else {
              this.widgetPTService.setEmptyPTWidgetState(false);
            }
            this.loadingService.stopLoading();
          }
        },
        error: () => {
          this.apiStatusService.setApiStatus(
            EApiNames.GetFullDataPTWidget,
            true
          );
          this.loadingService.stopLoading();
        }
      });
  }

  getNormalizedType(menuItemType): string {
    if (!menuItemType) {
      return '';
    }
    return menuItemType?.trim().toLowerCase().replace(/_/g, '-');
  }

  onTriggerChangeProcess() {
    this.PreventButtonService.triggerChangeProcess$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((rs) => {
        this.isProcessStep = !this.PreventButtonService.shouldHandleProcess(
          EButtonWidget.PROPERTY_TREE,
          EButtonType.WIDGET,
          false
        );
      });
  }

  getTotalWidgetData() {
    this.widgetPTService.totalWidgetData$.subscribe((res) => {
      this.itemsCounts = res;
    });
  }

  private getCreditors() {
    this.agencyService
      .getCreditor()
      .pipe(
        switchMap((creditor) =>
          this.widgetPTService
            .getPTWidgetStateByType<IMaintenanceInvoice[]>(
              PTWidgetDataField.MAINTENANCE_INVOICE
            )
            .pipe(
              map((maintenanceInvoices: IMaintenanceInvoice[]) => {
                maintenanceInvoices.map((item) => {
                  item['supplier'] = creditor.find(
                    (val) => val.id === item.supplierId
                  );
                  return item;
                });
                return [...maintenanceInvoices];
              }),
              tap((maintenanceInvoice) => {
                this.maintenanceSyncData.maintenanceInvoice.data =
                  maintenanceInvoice;
                this.maintenanceSyncPtService.setMaintenanceInvoiceData(
                  maintenanceInvoice
                );
              }),
              takeUntil(this.unsubscribe)
            )
        ),
        takeUntil(this.unsubscribe)
      )
      .subscribe();
  }

  mapPropertyTreeWidget(data: PTWidgetData) {
    let allItems = [];

    Object.keys(data).forEach((key) => {
      if (Array.isArray(data[key])) {
        data[key].forEach((item) => {
          const isTenancyInvoice =
            item?.invoiceWidgetType === EInvoiceTypeBS.TENANCY;
          item.dataType =
            key === 'invoices'
              ? isTenancyInvoice
                ? PTWidgetDataField.TENANCY_INVOICES
                : PTWidgetDataField.CREDITOR_INVOICES
              : key;
          allItems.push(item);
        });
      }
    });

    return allItems.sort(
      (a, b) =>
        new Date(a.createdAt || a.updatedAt)?.getTime() -
        new Date(b.createdAt || b.updatedAt)?.getTime()
    );
  }

  private getMaintenanceRequest(): void {
    this.widgetPTService
      .getPTWidgetStateByType<IMaintenanceRequest[]>(
        PTWidgetDataField.MAINTENANCE_REQUEST
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((maintenanceRequest: IMaintenanceRequest[]) => {
        this.maintenanceSyncData.maintenanceRequest.data = maintenanceRequest;
        this.maintenanceSyncPtService.setMaintenanceRequestData(
          maintenanceRequest
        );
      });
  }

  checkLeasingData() {
    this.widgetPTService
      .getPTWidgetStateByType<LeasingWidgetRequestTrudiResponse[]>(
        PTWidgetDataField.LEASING
      )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        this.leasingData = res;
      });
  }

  handleCreateNew(e: MouseEvent) {
    e.stopPropagation();
    this.visibleDropdown = !this.visibleDropdown;
  }

  widgetPTTrackBy(_: number, widget: any) {
    return widget?.id;
  }

  trigerPropertyTree(type: EPropertyTreeType) {
    let isBreakFunction = false;
    switch (type) {
      case EPropertyTreeType.TENANCY_INVOICE: {
        if (
          this.listInvoices?.length > 0 &&
          this.currentTaskNameId === TaskNameId.invoiceTenant
        ) {
          isBreakFunction = true;
        } else {
          this.openSelectInvoiceModal(ESelectInvoiceType.TENANCY_INVOICE);
          isBreakFunction = true;
        }

        break;
      }
      case EPropertyTreeType.CREDITOR_INVOICE:
        this.openSelectInvoiceModal(ESelectInvoiceType.CREDITOR_INVOICE);
        isBreakFunction = true;
        break;
      case EPropertyTreeType.LEASE_RENEWAL: {
        if (this.widgetPTService.leaseRenewals?.value?.length > 0) {
          isBreakFunction = true;
        }
        break;
      }
      case EPropertyTreeType.VACATE_DETAIL: {
        if (this.listTenantVacate?.length > 0) {
          isBreakFunction = true;
        }
        break;
      }
      case EPropertyTreeType.MAINTENANCE_REQUEST: {
        if (this.maintenanceSyncData.maintenanceRequest.data.length > 0) {
          isBreakFunction = true;
        }
        break;
      }
      case EPropertyTreeType.CREATE_COMPLIANCE: {
        this.widgetPTService.setPopupWidgetState(
          EPropertyTreeType.CREATE_COMPLIANCE
        );
        break;
      }
      case EPropertyTreeType.NEW_TENANCY: {
        if (this.leasingData?.length > 0) {
          isBreakFunction = true;
        }
        break;
      }
      case EPropertyTreeType.MAINTENANCE_INVOICE: {
        if (
          !this.maintenanceSyncData.maintenanceRequest.data[0]?.resultId ||
          this.maintenanceSyncData.maintenanceRequest.data[0]?.status !==
            SendMaintenanceType.OPEN
        ) {
          isBreakFunction = true;
        } else {
          this.openSelectInvoiceModal(ESelectInvoiceType.MAINTENANCE_INVOICE);
          isBreakFunction = true;
        }
        break;
      }
      default:
        isBreakFunction = false;
        break;
    }
    if (isBreakFunction) {
      return;
    }
    this.widgetPTService.setPopupWidgetState(type);
    this.leasingWidgetService.syncPTStatus.next(LeaseRenewalSyncStatus.WAITING);
  }

  openSelectInvoiceModal(type: ESelectInvoiceType) {
    this.invoicePopupManager.buildSelectForm();
    this.invoicePopupManager.setShowSelectInvoiceModal(true);
    this.invoicePopupManager.setCurrentPopup(type);
  }

  getMenuClass(type: EPropertyTreeType): string {
    var className = 'disabled-widget-text';
    switch (type) {
      case EPropertyTreeType.TENANCY_INVOICE: {
        if (
          !this.listInvoices?.length &&
          this.currentTaskNameId !== TaskNameId.invoiceTenant
        ) {
          className = '';
        }
        break;
      }
      case EPropertyTreeType.LEASE_RENEWAL: {
        if (!this.widgetPTService.leaseRenewals?.value?.length) {
          className = '';
        }
        break;
      }
      case EPropertyTreeType.MAINTENANCE_REQUEST: {
        if (this.maintenanceSyncData.maintenanceRequest.data.length === 0) {
          className = '';
        }
        break;
      }
      case EPropertyTreeType.VACATE_DETAIL: {
        if (!this.listTenantVacate?.length) {
          className = '';
        }
        break;
      }
      case EPropertyTreeType.NEW_TENANCY: {
        if (!this.leasingData?.length) {
          className = '';
        }
        break;
      }
      case EPropertyTreeType.MAINTENANCE_INVOICE: {
        if (
          !!this.maintenanceSyncData.maintenanceRequest.data[0]?.resultId &&
          this.maintenanceSyncData.maintenanceRequest.data[0]?.status ===
            SendMaintenanceType.OPEN
        ) {
          className = '';
        }
        break;
      }
      default: {
        className = '';
        break;
      }
    }
    return className;
  }

  isMenuDisable(type: EPropertyTreeType): boolean {
    var isDisable = true;
    switch (type) {
      case EPropertyTreeType.TENANCY_INVOICE: {
        if (
          this.listInvoices?.length &&
          this.currentTaskNameId === TaskNameId.invoiceTenant
        ) {
          isDisable = true;
        } else {
          isDisable = false;
        }
        break;
      }
      case EPropertyTreeType.LEASE_RENEWAL: {
        if (!this.widgetPTService.leaseRenewals?.value?.length) {
          isDisable = false;
        }
        break;
      }
      case EPropertyTreeType.MAINTENANCE_REQUEST: {
        if (this.maintenanceSyncData.maintenanceRequest.data.length === 0) {
          isDisable = false;
        }
        break;
      }
      case EPropertyTreeType.NEW_TENANCY: {
        if (this.leasingData?.length) {
          isDisable = true;
        } else isDisable = false;
        break;
      }
      case EPropertyTreeType.VACATE_DETAIL: {
        if (!this.listTenantVacate?.length) {
          isDisable = false;
        }
        break;
      }
      case EPropertyTreeType.MAINTENANCE_INVOICE: {
        if (
          !!this.maintenanceSyncData.maintenanceRequest.data[0]?.resultId &&
          this.maintenanceSyncData.maintenanceRequest.data[0]?.status ===
            SendMaintenanceType.OPEN
        ) {
          isDisable = false;
        }
        break;
      }
      default: {
        isDisable = false;
      }
    }
    return isDisable;
  }

  getTooltipText(type: EPropertyTreeType): string {
    var tooltipText = '';
    switch (type) {
      case EPropertyTreeType.TENANCY_INVOICE: {
        if (
          this.listInvoices?.length > 0 &&
          this.currentTaskNameId === TaskNameId.invoiceTenant
        ) {
          tooltipText = 'Tenancy invoice is already linked to this task';
        }
        break;
      }
      case EPropertyTreeType.LEASE_RENEWAL: {
        if (this.widgetPTService.leaseRenewals?.value?.length > 0) {
          tooltipText = 'Lease renewal is already linked to this task';
        }
        break;
      }
      case EPropertyTreeType.MAINTENANCE_REQUEST: {
        if (this.maintenanceSyncData.maintenanceRequest.data.length > 0) {
          tooltipText = 'Maintenance request is already linked to this task.';
        }
        break;
      }
      case EPropertyTreeType.VACATE_DETAIL: {
        if (this.listTenantVacate.length > 0) {
          tooltipText = 'A vacate details is already existed in this task';
        }
        break;
      }
      case EPropertyTreeType.MAINTENANCE_INVOICE: {
        if (
          this.maintenanceSyncData.maintenanceRequest.data.length === 0 ||
          !this.maintenanceSyncData.maintenanceRequest.data[0]?.resultId
        ) {
          tooltipText =
            'You must complete the following action first: add Maintenance request.';
        }
        if (
          this.maintenanceSyncData.maintenanceRequest.data[0]?.status ===
          SendMaintenanceType.CANCELLED
        ) {
          tooltipText = 'Maintenance request is cancelled.';
        }
        if (
          this.maintenanceSyncData.maintenanceRequest.data[0]?.status ===
          SendMaintenanceType.COMPLETE
        ) {
          tooltipText = 'Maintenance request is completed.';
        }
        break;
      }
      case EPropertyTreeType.NEW_TENANCY: {
        if (this.leasingData?.length) {
          tooltipText = 'A new tenancy is already created in this task';
        }
        break;
      }
    }
    return tooltipText;
  }

  protected readonly EPropertyTreeType = EPropertyTreeType;

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.widgetPTService.setPopupWidgetState(null);
    this.widgetPTService.refreshWidgetFields();
  }
}
