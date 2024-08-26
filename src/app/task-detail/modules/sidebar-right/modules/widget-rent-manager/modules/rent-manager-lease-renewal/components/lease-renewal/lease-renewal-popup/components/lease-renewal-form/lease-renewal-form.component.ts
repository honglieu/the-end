import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  Pipe,
  PipeTransform
} from '@angular/core';
import dayjs from 'dayjs';
import {
  Subject,
  distinctUntilChanged,
  filter,
  finalize,
  takeUntil
} from 'rxjs';
import { AgencyService as DashboardAgencyService } from '@/app/dashboard/services/agency.service';
import { TIME_FORMAT } from '@services/constants';
import { PropertiesService } from '@services/properties.service';
import { TaskService } from '@services/task.service';
import {
  LeaseRenewalSyncDateType,
  LeaseRenewalSyncStatus
} from '@shared/enum/lease-renewal-Request.enum';
import {
  FrequencyRental,
  LeasePeriodType
} from '@shared/types/trudi.interface';
import { Personal } from '@shared/types/user.interface';
import { LeaseRenewalFormRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/services/lease-renewal-form.service';
import {
  ESyncStatus,
  FORMAT_ICON_SYNC,
  IWidgetLease
} from '@/app/task-detail/utils/functions';
import { EWeekly } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/enums/rent-manager-lease-renewal.enum';

import { isEqual } from 'lodash-es';
import { InboxService } from '@/app/dashboard/modules/inbox/services/inbox.service';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { EEntityType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import {
  getFilteredAndMappedTenancies,
  tenancyRMFilter
} from '@/app/user/utils/user.type';
import {
  RENT_PERIOD_OPTION,
  WEEKLY_OPTION
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/constants/rent-manager-lease-renewal.constamts';
import {
  EChargeType,
  ELeaseTerm,
  ERecurringCharge
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { LeaseRenewalRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/services/lease-renewal.service';
import { SharedService } from '@services/shared.service';
import { ShowSidebarRightService } from '@/app/task-detail/services/task-detail.service';

@Pipe({
  name: 'formatAmount'
})
export class FormatAmountPipe implements PipeTransform {
  transform(value?: unknown) {
    if (!isNaN(value as number) && value !== '' && value !== null) {
      return `$${Intl.NumberFormat('en-US').format(+value)}`;
    }
    return '';
  }
}

@Component({
  selector: 'lease-renewal-form',
  templateUrl: './lease-renewal-form.component.html',
  styleUrls: ['./lease-renewal-form.component.scss']
})
export class LeaseRenewalFormRMComponent implements OnInit, OnDestroy {
  public syncRMStatus: LeaseRenewalSyncStatus = LeaseRenewalSyncStatus.NOT_SYNC;
  public lastTimeSynced: string | Date;
  public dataDateType = LeaseRenewalSyncDateType;
  public entityType = EEntityType;
  public frequencyRental = FrequencyRental;
  public recurringChargeList: ERecurringCharge[] = [];
  public tenanciesOptions = [];
  public listTenancies: Personal[];
  public submitted = false;
  private componentDestroyed$ = new Subject<void>();
  private currentAgencyId: string;

  public chargeTypeOption: EChargeType[] = [];
  public leaseTermOptions: ELeaseTerm[] = [];
  public syncStatus: string = ESyncStatus.NOT_SYNC;
  public selectedLeaseRenewal: IWidgetLease;
  public disableField = false;
  public disableTenancy = false;

  readonly LeaseRenewalSyncStatus = LeaseRenewalSyncStatus;
  readonly synData = FORMAT_ICON_SYNC;
  readonly TIME_FORMAT = TIME_FORMAT;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$;
  @Output() handleOpenRecurringCharges = new EventEmitter<number>();
  @Output() handleCloseModal = new EventEmitter<void>();
  @Output() handleSync = new EventEmitter<any>();

  public listRent = RENT_PERIOD_OPTION;

  public listWeekly = WEEKLY_OPTION;
  private timeIntervalOption = {
    [LeasePeriodType.Weeks]: 'W',
    [LeasePeriodType.Months]: 'M',
    [LeasePeriodType.Years]: 'Y'
  };
  isArchiveMailbox: boolean;
  isConsole: boolean;

  constructor(
    private leaseRenewalFormRMService: LeaseRenewalFormRMService,
    private widgetRMService: WidgetRMService,
    private leaseRenewalService: LeaseRenewalRMService,
    private propertyService: PropertiesService,
    private taskService: TaskService,
    private dashboardAgencyService: DashboardAgencyService,
    private inboxService: InboxService,
    private agencyDateFormatService: AgencyDateFormatService,
    private showSidebarRightService: ShowSidebarRightService,
    private sharedService: SharedService
  ) {}

  get leaseRenewalForm() {
    return this.leaseRenewalFormRMService.leaseRenewalForm;
  }

  get tenancyControl() {
    return this.leaseRenewalForm.get('tenancy');
  }

  get leaseStartControl() {
    return this.leaseRenewalForm.get('leaseStart');
  }

  get leaseEndControl() {
    return this.leaseRenewalForm.get('leaseEnd');
  }

  get leaseSignControl() {
    return this.leaseRenewalForm.get('leaseSign');
  }

  get leaseTermControl() {
    return this.leaseRenewalForm.get('leaseTerm');
  }

  get rentPeriodControl() {
    return this.leaseRenewalForm.get('rentPeriod');
  }

  get dueDayControl() {
    return this.leaseRenewalForm.get('dueDay');
  }

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.inboxService.isArchiveMailbox$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(
        (isArchiveMailbox) => (this.isArchiveMailbox = isArchiveMailbox)
      );
    this.leaseRenewalFormRMService.buildFormLeaseRenewalRM();
    this.subscribeRentPeriodChange();
    this.getData();
    this.subscribeLeaseRenewalFormChange();
    this.subscribeLeaseRenewalSelected();
    this.getSelectTenancy();
    this.subscribeTimeAndStatusSync();
  }

  subscribeRentPeriodChange() {
    this.rentPeriodControl.valueChanges
      .pipe(takeUntil(this.componentDestroyed$), distinctUntilChanged())
      .subscribe((res) => {
        if (res) {
          this.dueDayControl.reset();
          if (res === FrequencyRental.WEEKLY)
            this.dueDayControl.patchValue(EWeekly.MONDAY);
          else if (res === FrequencyRental.MONTHLY)
            this.dueDayControl.patchValue(1);
          this.dueDayControl.markAsUntouched();
        }
      });
  }

  subscribeLeaseRenewalFormChange() {
    this.leaseRenewalForm.valueChanges
      .pipe(
        takeUntil(this.componentDestroyed$),
        distinctUntilChanged((pre, curr) => isEqual(pre, curr))
      )
      .subscribe((res) => {
        if (
          res &&
          [
            LeaseRenewalSyncStatus.COMPLETED,
            LeaseRenewalSyncStatus.FAILED
          ].includes(this.syncRMStatus)
        ) {
          this.updateSyncStatus(
            LeaseRenewalSyncStatus.UN_SYNC,
            new Date().toISOString()
          );
        }
      });
  }

  subscribeTimeAndStatusSync() {
    this.leaseRenewalService.getTimeAndStatusSync
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        if (res) {
          const { status, lastTimeSync } = res;
          this.updateSyncStatus(status, lastTimeSync);
          this.disableField = status === LeaseRenewalSyncStatus.INPROGRESS;
          this.disableTenancy =
            this.selectedLeaseRenewal?.isSuccessful ||
            this.syncRMStatus === LeaseRenewalSyncStatus.COMPLETED;
        }
      });
  }

  handleChangeLeaseStart(value) {
    const newEndDate = this.updateLeaseEnd(this.leaseTermControl.value);
    if (newEndDate != this.leaseEndControl.value)
      this.leaseEndControl.patchValue(
        this.updateLeaseEnd(this.leaseTermControl.value)
      );
  }

  getData() {
    this.leaseRenewalService
      .getChargeTypeList()
      .pipe(
        filter((r) => !!r),
        takeUntil(this.componentDestroyed$)
      )
      .subscribe((res) => {
        this.chargeTypeOption = res.filter((r) => r.isActive);
      });

    this.leaseRenewalService
      .getLeaseTermList()
      .pipe(
        filter((r) => !!r),
        takeUntil(this.componentDestroyed$)
      )
      .subscribe((res) => {
        this.leaseTermOptions = res.map((r) => ({
          ...r,
          value: r.id,
          label: r.name
        }));
      });
  }

  subscribeLeaseRenewalSelected() {
    this.leaseRenewalService
      .getSelectedLeaseRenewal()
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((data) => {
        if (data) {
          this.setValueFormLeaseRenewal(data);
          this.recurringChargeList = [...(data?.recurringCharges || [])];
          this.selectedLeaseRenewal = data;
        }
      });
  }

  getSelectTenancy() {
    const dataWidgetLease = this.widgetRMService.leaseRenewals.value || [];
    if (dataWidgetLease.length && !this.selectedLeaseRenewal?.tenancyId) {
      const {
        startDate,
        endDate,
        tenancyId,
        leaseSign,
        leaseTerm,
        frequency,
        source,
        status,
        recurringCharges,
        lastTimeSync
      } = dataWidgetLease[0];

      this.leaseRenewalService.setSelectedLeaseRenewal({
        tenancyId,
        startDate,
        endDate,
        frequency,
        leaseTerm,
        recurringCharges,
        source,
        leaseSign,
        status,
        lastTimeSync
      });
      if (status !== LeaseRenewalSyncStatus.FAILED) {
        this.leaseRenewalFormRMService.leaseRenewalForm
          .get('tenancy')
          .disable();
      }
      this.leaseRenewalService.updateTimeAndStatusSync = {
        status: status,
        lastTimeSync: lastTimeSync
      };
    }

    this.propertyService.peopleList$
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        this.listTenancies = res?.tenancies || [];
        this.tenanciesOptions = getFilteredAndMappedTenancies(
          res,
          tenancyRMFilter
        );
      });
  }

  onTenancyChanged(value) {
    this.leaseRenewalForm.reset();
    const tenancySelected = this.listTenancies.find(
      (tenancy) => tenancy.id === value.id
    );
    this.tenancyControl.patchValue(value.id);
    const { id, userPropertyGroupLeases, userProperties } = tenancySelected;
    let result = {
      tenancyId: id
    } as IWidgetLease;
    if (userPropertyGroupLeases?.[0]) {
      const { endDate, frequency, leasePeriod, dueDay, startDate } =
        userPropertyGroupLeases[0];
      const leaseStart =
        (endDate || startDate) &&
        dayjs(endDate || startDate)
          .add(1, 'd')
          .toString();
      result = {
        ...result,
        startDate: leaseStart,
        endDate: this.updateLeaseEnd(leasePeriod, leaseStart),
        frequency,
        leaseTerm: leasePeriod,
        source: {
          rentDueDay: dueDay
        }
      };
    }

    this.leaseRenewalService
      .getRecurringChargesByTenancy({
        tenancyId: id,
        propertyId: userProperties[0]?.propertyId
      })
      .pipe(
        finalize(() => {
          this.leaseRenewalService.setSelectedLeaseRenewal(result);
        }),
        takeUntil(this.componentDestroyed$)
      )
      .subscribe((res) => {
        result = {
          ...result,
          recurringCharges: this.mapRecurringCharges(res)
        } as IWidgetLease;
      });
  }

  onLeaseTermChanged(value) {
    this.leaseEndControl.patchValue(this.updateLeaseEnd(value.id));
  }

  handleDeleteRecurringCharge(index) {
    const recurringCharge = this.recurringChargeList[index];
    recurringCharge?.id &&
      this.leaseRenewalService.setRecurringChargesDeleted([
        ...this.leaseRenewalService.getRecurringChargesDeleted(),
        recurringCharge?.id
      ]);
    this.recurringChargeList.splice(index, 1);
    if (this.syncRMStatus !== LeaseRenewalSyncStatus.NOT_SYNC) {
      this.updateSyncStatus(
        LeaseRenewalSyncStatus.UN_SYNC,
        new Date().toISOString()
      );
    }
  }

  updateLeaseEnd(leaseTermId: number, leaseStart?: string) {
    const termOpt = this.leaseTermOptions.find(
      (opt) => opt.id === +leaseTermId
    );
    const startDate = leaseStart || this.leaseStartControl.value;
    if (!startDate) return null;
    if (termOpt) {
      if (!termOpt.isMTM) {
        return dayjs(startDate)
          .add(
            termOpt.duration || 0,
            this.timeIntervalOption[termOpt.timeInterval]
          )
          .subtract(1, 'day')
          .toDate()
          .toString();
      }
      return null;
    }
    return this.leaseEndControl.value;
  }

  cancel() {
    this.handleCloseModal.emit();
  }

  onOpenRecurringCharges(index?: number) {
    this.leaseRenewalService.updateTimeAndStatusSync = {
      status: this.syncRMStatus,
      lastTimeSync: this.lastTimeSynced?.toString()
    };
    this.leaseRenewalService.setSelectedLeaseRenewal({
      ...this.selectedLeaseRenewal,
      tenancyId: this.tenancyControl.value,
      startDate: this.leaseStartControl.value,
      endDate: this.leaseEndControl.value,
      leaseSign: this.leaseSignControl.value,
      leaseTerm: this.leaseTermControl.value,
      frequency: this.rentPeriodControl.value,
      source: {
        rentDueDay: this.dueDayControl.value
      },
      recurringCharges:
        this.recurringChargeList?.map((item) => ({
          ...item,
          chargeTypeId:
            +item.chargeTypeId || +(item.chargeType as EChargeType)?.id
        })) || []
    });
    this.handleOpenRecurringCharges.emit(index);
  }

  onSync() {
    if (this.isArchiveMailbox) return;
    this.submitted = true;
    if (this.leaseRenewalForm.invalid) {
      this.leaseRenewalForm.markAllAsTouched();
      return;
    }
    this.showSidebarRightService.handleToggleSidebarRight(true);
    const body = {
      agencyId: this.currentAgencyId,
      taskId: this.taskService.currentTaskId$.value,
      variable: {
        ...this.leaseRenewalFormRMService.generateLeaseRenewal(
          this.recurringChargeList
        ),
        deleteRecurringChargeIds:
          this.leaseRenewalService.getRecurringChargesDeleted()
      }
    };
    this.handleSync.emit(body);
  }

  setValueFormLeaseRenewal(value: IWidgetLease) {
    const defaultValue = {
      tenancy: value.tenancyId,
      leaseStart: this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        value.startDate
      ),
      leaseEnd: this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        value.endDate
      ),
      leaseSign: this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
        value.leaseSign
      ),
      rentPeriod: value.frequency,
      leaseTerm: value.leaseTerm ? +value.leaseTerm : null,
      ...(value.source?.rentDueDay && { dueDay: value.source?.rentDueDay })
    };
    this.leaseRenewalForm.patchValue(defaultValue);
  }

  mapRecurringCharges = (recurringCharges) => {
    return (
      this.leaseRenewalService
        .sortRecurringCharge(recurringCharges)
        ?.map((item) => {
          const chargeTypeId = (item.chargeType as EChargeType)?.id;
          return {
            ...item,
            chargeType: this.chargeTypeOption.find(
              (option) => option.id === chargeTypeId
            ),
            chargeTypeId: chargeTypeId
          };
        }) || []
    );
  };

  updateSyncStatus(statusSync: LeaseRenewalSyncStatus, lastTimeSync: string) {
    this.syncRMStatus = statusSync;
    this.lastTimeSynced = lastTimeSync;
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
