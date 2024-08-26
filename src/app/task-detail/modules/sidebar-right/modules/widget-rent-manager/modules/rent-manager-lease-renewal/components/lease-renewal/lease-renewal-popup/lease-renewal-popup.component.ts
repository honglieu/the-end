import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, filter, merge, takeUntil } from 'rxjs';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import { TrudiService } from '@services/trudi.service';
import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import { Personal } from '@shared/types/user.interface';
import { EventCalendarService } from '@/app/task-detail/modules/sidebar-right/services/event-calendar.service';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import { ERentManagerType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import { EChargeType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { LeaseRenewalRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/services/lease-renewal.service';

@Component({
  selector: 'lease-renewal-popup',
  templateUrl: './lease-renewal-popup.component.html',
  styleUrls: ['./lease-renewal-popup.component.scss']
})
export class LeaseRenewalRMPopupComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<void>();
  private currentAgencyId: string;
  public listTenancies: Personal[];
  private chargeTypeOption: EChargeType[] = [];
  public popupState = {
    showRMLeaseRenewalModal: false,
    showRecurringChargeDetails: false
  };

  constructor(
    private widgetRMService: WidgetRMService,
    private leaseRenewalService: LeaseRenewalRMService,
    private dashboardAgencyService: DashboardAgencyService,
    public toastService: ToastrService,
    public trudiService: TrudiService,
    public stepService: StepService,
    private propertyService: PropertiesService,
    private eventCalendarService: EventCalendarService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    const popupWidgetState$ = this.widgetRMService.getPopupWidgetState();
    const openRMPopupWidgetState$ =
      this.leaseRenewalService.openRMPopupWidgetState$;

    this.getTenancies();

    merge(popupWidgetState$, openRMPopupWidgetState$)
      .pipe(
        takeUntil(this.destroyed$),
        filter((state) => state === ERentManagerType.LEASE_RENEWAL)
      )
      .subscribe(() => {
        this.handlePopupState({ showRMLeaseRenewalModal: true });
      });

    this.leaseRenewalService
      .getTermChargeTypes(this.propertyService.currentPropertyId.getValue())
      .subscribe(({ leaseTerms, chargeTypes }) => {
        this.leaseRenewalService.setChargeTypeList(chargeTypes);
        this.leaseRenewalService.setLeaseTermList(leaseTerms);
        this.chargeTypeOption = chargeTypes.filter((c) => c.isActive);
      });

    this.propertyService.peopleList$
      .pipe(takeUntil(this.destroyed$))
      .subscribe((res) => {
        this.listTenancies = res?.tenancies || [];
      });
  }

  handlePopupState(state: {}) {
    this.popupState = { ...this.popupState, ...state };
  }

  handleOpenRecurringCharges(value) {
    this.leaseRenewalService.setIndexRecurringCharge(value);
    this.popupState = {
      showRMLeaseRenewalModal: false,
      showRecurringChargeDetails: true
    };
  }

  handleBackModal() {
    this.popupState = {
      showRMLeaseRenewalModal: true,
      showRecurringChargeDetails: false
    };
  }

  handleCloseModal() {
    this.widgetRMService.setPopupWidgetState(null);
    this.leaseRenewalService.setSelectedLeaseRenewal(null);
    this.leaseRenewalService.updateTimeAndStatusSync = null;
    this.resetPopupState();
  }

  resetPopupState() {
    for (const key in this.popupState) {
      if (Object.prototype.hasOwnProperty.call(this.popupState, key)) {
        this.popupState[key] = false;
      }
    }
  }

  private getTenancies() {
    this.propertyService.getPeopleInSelectPeople(
      this.propertyService.currentPropertyId.getValue()
    );
  }

  handleSync(value) {
    this.handleCloseModal();
    const {
      leaseEnd,
      leaseStart,
      tenancyId,
      rentPeriod,
      recurringCharges,
      leaseTerm,
      leaseSign,
      rentDueDay
    } = value.variable;
    const matchedItem = this.listTenancies.find(
      (item) => item.id === tenancyId
    );
    const dataLease = this.leaseRenewalService.formatDataLease(
      LeaseRenewalSyncStatus.INPROGRESS,
      leaseStart,
      leaseEnd,
      rentPeriod,
      tenancyId,
      leaseTerm,
      leaseSign,
      rentDueDay,
      matchedItem?.name,
      recurringCharges
    );

    this.leaseRenewalService.updateListLeaseRenewal(dataLease);
    const payload = {
      ...value,
      variable: {
        ...value.variable,
        leaseStart: leaseStart,
        leaseEnd: leaseEnd,
        leaseSign: leaseSign
      }
    };
    this.leaseRenewalService.syncLeaseRenewal(payload).subscribe({
      next: (res) => {
        const propertyId = this.propertyService.currentPropertyId.getValue();
        const { errorSync, status, tenancyId } = res.dataSync || {};
        if (errorSync) {
          this.toastService.error(errorSync);
        }
        this.leaseRenewalService.updateListLeaseRenewal({
          ...res.dataSync,
          recurringCharges:
            status === ESyncStatus.FAILED
              ? recurringCharges
              : res.dataSync.recurringCharges,
          userPropertyGroup: {
            name: this.listTenancies.find((item) => item.id === tenancyId)?.name
          },
          firstTimeSyncSuccess: status !== ESyncStatus.FAILED
        });

        this.leaseRenewalService.updateRecurringCharge(
          res.dataSync.recurringCharges
        );

        const trudiResponeTemplate =
          this.trudiService.getTrudiResponse?.getValue();
        if ([LeaseRenewalSyncStatus.COMPLETED].includes(status)) {
          this.eventCalendarService.refreshListEventCalendarWidget(
            this.taskService.currentTaskId$.getValue()
          );
          if (trudiResponeTemplate?.isTemplate) {
            this.stepService.setChangeBtnStatusFromRMWidget(true);
            this.leaseRenewalService.updateButtonStatus();
          }
          this.propertyService.getPeople(propertyId);
        }
      },
      error: (err) => {
        this.leaseRenewalService.updateListLeaseRenewal({
          ...dataLease,
          status: LeaseRenewalSyncStatus.FAILED,
          lastTimeSync: new Date().toISOString(),
          userPropertyGroup: {
            name: this.listTenancies.find((item) => item.id === tenancyId)?.name
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.leaseRenewalService.setLeaseTermList([]);
  }
}
