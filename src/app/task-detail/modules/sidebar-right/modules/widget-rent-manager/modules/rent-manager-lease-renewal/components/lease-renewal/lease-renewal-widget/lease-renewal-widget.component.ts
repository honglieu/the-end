import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import { Personal } from '@shared/types/user.interface';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ESyncStatus, IWidgetLease } from '@/app/task-detail/utils/functions';
import {
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import {
  EChargeType,
  ERecurringCharge
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { LeaseRenewalRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/services/lease-renewal.service';

@Component({
  selector: 'lease-renewal-rm-widget',
  templateUrl: './lease-renewal-widget.component.html',
  styleUrls: ['./lease-renewal-widget.component.scss']
})
export class LeaseRenewalRMWidgetComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  public listWidgetLeases: IWidgetLease[] = [];
  public popupState = {
    showConfirmRemove: false
  };
  public ChargeTypeGroup = {};
  public ChargeTypekeyGroup = [];
  private currentAgencyId: string;
  public listTenancies: Personal[];

  constructor(
    private leaseRenewalService: LeaseRenewalRMService,
    private widgetRMService: WidgetRMService,
    private taskService: TaskService,
    private dashboardAgencyService: DashboardAgencyService,
    private toastService: ToastrService,
    private propertyService: PropertiesService,
    private trudiService: TrudiService,
    private stepService: StepService,
    private eventCalendarService: EventCalendarService
  ) {}

  ngOnInit(): void {
    this.widgetRMService
      .getRMWidgetStateByType<IWidgetLease[]>(RMWidgetDataField.LEASE_RENEWAL)
      .pipe(takeUntil(this.destroyed$))
      .subscribe((data) => {
        this.listWidgetLeases = data || [];
        if (this.listWidgetLeases.length) {
          this.leaseRenewalService.updateTimeAndStatusSync = {
            status: this.listWidgetLeases[0]?.status as LeaseRenewalSyncStatus,
            lastTimeSync: this.listWidgetLeases[0]?.lastTimeSync
          };
          this.ChargeTypeGroup = this.groupChargeType(
            this.listWidgetLeases[0].recurringCharges
          );

          this.ChargeTypekeyGroup = Object.keys(this.ChargeTypeGroup);
        }
      });

    this.propertyService.peopleList$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((res) => {
        this.listTenancies = res?.tenancies || [];
      });
  }

  handleOpenModal(item) {
    this.leaseRenewalService.setSelectedLeaseRenewal(item);
    this.widgetRMService.setPopupWidgetState(ERentManagerType.LEASE_RENEWAL);
    this.leaseRenewalService.updateTimeAndStatusSync = {
      status: item?.status as LeaseRenewalSyncStatus,
      lastTimeSync: item?.lastTimeSync
    };
  }

  handleRetryWidget(item: IWidgetLease) {
    const body = {
      agencyId: this.currentAgencyId,
      taskId: this.taskService.currentTaskId$.value,
      variable: {
        leaseStart: item.startDate,
        leaseEnd: item.endDate,
        tenancyId: item.tenancyId,
        rentPeriod: item.frequency,
        recurringCharges:
          item.recurringCharges?.map((recurringCharge) => ({
            ...recurringCharge,
            chargeTypeId:
              (recurringCharge.chargeType as EChargeType)?.id ||
              recurringCharge.chargeTypeId
          })) || [],
        rentDueDay: +item.source?.rentDueDay || undefined,
        leaseSign: item.leaseSign,
        leaseTerm: item.leaseTerm,
        deleteRecurringChargeIds:
          this.leaseRenewalService.getRecurringChargesDeleted()
      }
    };

    const {
      leaseEnd,
      leaseStart,
      tenancyId,
      rentPeriod,
      recurringCharges,
      leaseTerm,
      leaseSign,
      rentDueDay
    } = body.variable;
    const matchedItem = this.listTenancies.find(
      (item) => item.id === tenancyId
    );
    const dataLease = this.leaseRenewalService.formatDataLease(
      LeaseRenewalSyncStatus.INPROGRESS,
      leaseStart,
      leaseEnd,
      rentPeriod,
      tenancyId,
      item.leaseTerm,
      leaseSign,
      rentDueDay,
      matchedItem.name,
      recurringCharges
    );
    this.leaseRenewalService.updateListLeaseRenewal(dataLease);

    const payload = {
      ...body,
      variable: {
        ...body.variable,
        leaseStart: this.widgetRMService.transformDate(leaseStart),
        leaseEnd: this.widgetRMService.transformDate(leaseEnd),
        leaseSign: this.widgetRMService.transformDate(leaseSign)
      }
    };

    this.leaseRenewalService.syncLeaseRenewal(payload).subscribe({
      next: (res) => {
        const { errorSync, status, tenancyId, lastTimeSync } =
          res.dataSync || {};
        if (errorSync) {
          this.toastService.error(errorSync);
        }
        this.leaseRenewalService.updateListLeaseRenewal({
          ...res.dataSync,
          recurringCharges:
            status == ESyncStatus.FAILED
              ? recurringCharges
              : res.dataSync.recurringCharges,
          userPropertyGroup: {
            name: this.listTenancies.find((item) => item.id === tenancyId).name
          },
          firstTimeSyncSuccess: status !== ESyncStatus.FAILED
        });
        this.leaseRenewalService.updateTimeAndStatusSync = {
          status: status as LeaseRenewalSyncStatus,
          lastTimeSync: lastTimeSync
        };
        if ([LeaseRenewalSyncStatus.COMPLETED].includes(status)) {
          const trudiResponeTemplate =
            this.trudiService.getTrudiResponse?.getValue();
          this.eventCalendarService.refreshListEventCalendarWidget(
            this.taskService.currentTaskId$.getValue()
          );
          if (trudiResponeTemplate?.isTemplate) {
            this.stepService.setChangeBtnStatusFromRMWidget(true);
            this.leaseRenewalService.updateButtonStatus();
          }
        }
      },
      error: () => {
        this.leaseRenewalService.updateListLeaseRenewal({
          ...dataLease,
          status: LeaseRenewalSyncStatus.FAILED,
          lastTimeSync: new Date().toISOString(),
          userPropertyGroup: {
            name: this.listTenancies.find((item) => item.id === tenancyId).name
          }
        });
      }
    });
  }

  handleRemoveWidget() {
    const widgetLeaseSynced = this.listWidgetLeases.find((item) => item?.id);
    if (widgetLeaseSynced) {
      this.leaseRenewalService
        .removeLeaseRenewalSync({
          taskId: this.taskService.currentTaskId$.value
        })
        .subscribe((res) => {
          if (res) {
            this.widgetRMService.setRMWidgetStateByType(
              RMWidgetDataField.LEASE_RENEWAL,
              'REMOVE',
              res
            );
          }
        });
    } else {
      this.widgetRMService.setRMWidgetStateByType(
        RMWidgetDataField.LEASE_RENEWAL,
        'REMOVE',
        []
      );
    }
  }

  groupChargeType(recurringCharges) {
    return this.leaseRenewalService
      .sortRecurringCharge(recurringCharges)
      .reduce((previousValue, currentValue: ERecurringCharge) => {
        const key = currentValue.entityType;
        if (!previousValue[key]) {
          previousValue[key] = [];
        }
        previousValue[key].push({
          ...currentValue,
          amount: Intl.NumberFormat('en-US').format(+currentValue.amount || 0)
        });
        return previousValue;
      }, {});
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.leaseRenewalService.updateTimeAndStatusSync = null;
    this.leaseRenewalService.setSelectedLeaseRenewal(null);
    this.leaseRenewalService.setRecurringChargesDeleted([]);
  }
}
