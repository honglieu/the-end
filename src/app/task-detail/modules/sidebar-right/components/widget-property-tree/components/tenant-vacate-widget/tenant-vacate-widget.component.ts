import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import {
  EPropertyTreeType,
  ESyncStatus,
  IWidgetVacate,
  TypeVacate
} from '@/app/task-detail/utils/functions';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { TenancyInvoicingService } from '@services/tenancy-invoicing.service';
import { WidgetFormPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property-form.service';
import { TrudiService } from '@services/trudi.service';
import { TaskService } from '@services/task.service';
import { TenantVacateApiService } from '@/app/tenant-vacate/services/tenant-vacate-api.service';
import { PropertiesService } from '@services/properties.service';
import { AgencyService } from '@services/agency.service';
import { Subject, switchMap, takeUntil } from 'rxjs';
import dayjs from 'dayjs';
import { FormHelper } from '@trudi-ui';
import { ActivatedRoute } from '@angular/router';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import { VacateDetailService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/vacate-detail.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { RxWebsocketService } from '@services/rx-websocket.service';
import { ISocketPullNewArrear } from '@shared/types/socket.interface';
import { IPersonalInTab } from '@shared/types/user.interface';
import { EButtonStepKey } from '@trudi-ui';

@Component({
  selector: 'tenant-vacate-widget',
  templateUrl: './tenant-vacate-widget.component.html',
  styleUrls: ['./tenant-vacate-widget.component.scss']
})
export class TenantVacateWidgetComponent implements OnInit, OnDestroy {
  @Input() tenantVacate: IWidgetVacate;
  public syncPTStatus: LeaseRenewalSyncStatus = LeaseRenewalSyncStatus.WAITING;
  private componentDestroyed$ = new Subject<void>();
  public syncPropertyTree = ESyncStatus;
  public isExpandAttachments: boolean = true;
  public isShowWidget: boolean = false;
  public isDropdownOpen: boolean = false;
  public typePropertyTree = EPropertyTreeType;
  public listWidgetTenantVacate: IWidgetVacate[];
  public tenanciesOptions = [];
  readonly EButtonStepKey = EButtonStepKey;

  public socketPullNewArrear: ISocketPullNewArrear;
  public peopleList: IPersonalInTab;

  constructor(
    public widgetPTService: WidgetPTService,
    public tenancyInvoicingService: TenancyInvoicingService,
    public widgetFormPTService: WidgetFormPTService,
    public trudiService: TrudiService,
    public taskService: TaskService,
    public tenantVacateApiService: TenantVacateApiService,
    public propertyService: PropertiesService,
    public agencyService: AgencyService,
    private route: ActivatedRoute,
    private vacateDetailService: VacateDetailService,
    public stepService: StepService,
    private websocketService: RxWebsocketService
  ) {}

  ngOnInit(): void {
    this.widgetFormPTService.buildFormTenantVacatePT();
    this.route.paramMap.subscribe((paramMap) => {
      if (paramMap) {
        this.vacateDetailService.syncStatusPtWidgetTenantVacate.next(
          LeaseRenewalSyncStatus.WAITING
        );
        this.listWidgetTenantVacate = [];
        FormHelper.resetFormGroup(this.widgetFormPTService.tenantVacateForm);
      }
    });

    this.widgetPTService
      .getPTWidgetStateByType<IWidgetVacate[]>(PTWidgetDataField.TENANT_VACATES)
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((data) => {
        this.listWidgetTenantVacate = data.slice(0, 1);
      });
    this.propertyService.peopleList$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        this.peopleList = res;
      });
    this.websocketService.onSocketPullNewArrear
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((socketPullNewArrear) => {
        this.peopleList.tenancies.forEach((tenancy) => {
          if (tenancy.id === socketPullNewArrear?.tenancyId) {
            tenancy.arrears = socketPullNewArrear?.arrears || [];
          }
        });
      });
  }

  retryPtWidgetTenantVacate(item) {
    const terminationDate = item?.terminationDate
      ? dayjs(item?.terminationDate).toISOString()
      : '';
    const noticeDate = item?.noticeDate
      ? dayjs(item?.noticeDate).toISOString()
      : '';
    const chargeToDate = item?.chargeToDate
      ? dayjs(item?.chargeToDate).toISOString()
      : '';
    const vacateDate = item?.vacateDate
      ? dayjs(item?.vacateDate).toISOString()
      : '';
    const payload = {
      taskId: this.taskService.currentTaskId$.getValue(),
      propertyId: this.propertyService.currentPropertyId.getValue(),
      tenantVacateDetail: {
        terminationDate: terminationDate || null,
        noticeDate: noticeDate,
        vacateDate: vacateDate,
        chargeToDate: chargeToDate || null,
        description: item?.description,
        tenancyId: item?.tenancy?.id
      },
      tenantVacateType: TypeVacate.find(
        (type) => type.text === item?.tenantVacateType
      )?.value
    };
    this.vacateDetailService.handleSyncPtWidgetTenantVacate(payload);
  }

  showModalTenantVacate(data) {
    this.vacateDetailService.popupStateVacateDetails.next({
      showTenantVacateModal: true
    });
    this.widgetFormPTService.setFormModal(data);
    this.syncPTStatus = data?.status;
    this.widgetFormPTService.tenantVacateForm.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        if (
          res &&
          [
            LeaseRenewalSyncStatus.FAILED,
            LeaseRenewalSyncStatus.COMPLETED
          ].includes(this.syncPTStatus)
        ) {
          this.syncPTStatus = LeaseRenewalSyncStatus.UN_SYNC;
          this.vacateDetailService.syncStatusPtWidgetTenantVacate.next(
            this.syncPTStatus
          );
        }
      });
    this.vacateDetailService.syncStatusPtWidgetTenantVacate.next(data?.status);
  }

  removePtWidgetTenantVacate() {
    this.vacateDetailService.syncStatusPtWidgetTenantVacate.next(
      LeaseRenewalSyncStatus.WAITING
    );
    FormHelper.resetFormGroup(this.widgetFormPTService.tenantVacateForm);
    this.tenantVacateApiService
      .removePtWidgetVacateDetail(this.taskService.currentTaskId$.getValue())
      .pipe(
        switchMap((rs) => {
          return this.tenantVacateApiService.getTaskVacateDetail(
            this.taskService.currentTaskId$.getValue()
          );
        })
      )
      .subscribe((res) => {
        if (!res) return;
        this.widgetPTService.setPTWidgetStateByType(
          PTWidgetDataField.TENANT_VACATES,
          'REMOVE',
          res
        );
      });
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
