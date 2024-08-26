import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from '@services/api.service';
import { TaskService } from '@services/task.service';
import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import {
  ITimeSyncLease,
  IWidgetLease
} from '@/app/task-detail/utils/functions';
import { conversations } from 'src/environments/environment';

import dayjs from 'dayjs';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { StepService } from '@/app/task-detail/modules/steps/services/step.service';
import { ERentManagerAction } from '@/app/task-detail/modules/steps/utils/property-tree.enum';
import { EActionType } from '@/app/task-detail/modules/steps/utils/stepType.enum';
import {
  EEntityType,
  ERentManagerType,
  RMWidgetDataField
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import {
  EChargeType,
  ELeaseTerm,
  ERecurringCharge
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';

@Injectable({
  providedIn: 'root'
})
export class LeaseRenewalRMService {
  public openRMPopupWidgetState$: BehaviorSubject<ERentManagerType> =
    new BehaviorSubject<ERentManagerType>(null);
  private indexRecurringCharge$: BehaviorSubject<number> =
    new BehaviorSubject<number>(null);
  private chargeTypeList: BehaviorSubject<EChargeType[]> = new BehaviorSubject(
    null
  );
  private leaseTermList: BehaviorSubject<ELeaseTerm[]> = new BehaviorSubject(
    null
  );
  public selectedLeaseRenewal$: BehaviorSubject<IWidgetLease> =
    new BehaviorSubject<IWidgetLease>(null);
  private openTimeStatusSyncLease: BehaviorSubject<ITimeSyncLease> =
    new BehaviorSubject<ITimeSyncLease>(null);
  private recurringChargesDeleted: BehaviorSubject<string[]> =
    new BehaviorSubject<string[]>([]);

  constructor(
    private apiService: ApiService,
    private widgetRMService: WidgetRMService,
    private taskService: TaskService,
    private stepService: StepService
  ) {}

  public getChargeTypeList() {
    return this.chargeTypeList.asObservable().pipe();
  }

  public setChargeTypeList(value: EChargeType[]) {
    return this.chargeTypeList.next(value);
  }

  public getLeaseTermList() {
    return this.leaseTermList.asObservable().pipe();
  }

  public setLeaseTermList(value: ELeaseTerm[]) {
    return this.leaseTermList.next(value);
  }

  getOpenPopupWidgetState() {
    return this.openRMPopupWidgetState$.value;
  }

  setOpenRMPopupWidgetState(value: ERentManagerType) {
    this.openRMPopupWidgetState$.next(value);
  }

  setIndexRecurringCharge(index: number) {
    this.indexRecurringCharge$.next(index);
  }

  getRecurringChargesDeleted(): string[] {
    return this.recurringChargesDeleted.value;
  }

  setRecurringChargesDeleted(index: string[]) {
    this.recurringChargesDeleted.next(index);
  }

  getIndexRecurringCharge(): Observable<number> {
    return this.indexRecurringCharge$.asObservable();
  }

  combinePeriodAndPeriodType(leasePeriod: string, leasePeriodType: string) {
    if (leasePeriod || leasePeriodType) {
      const term = leasePeriod + ' ' + leasePeriodType;
      return (this.leaseTermList.getValue() || []).find(
        (opt) => opt.name.toLowerCase() === term.toLowerCase()
      )?.id;
    }
    return null;
  }

  sortRecurringCharge(recurringCharges: ERecurringCharge[]) {
    return recurringCharges.sort((a, b) => {
      const indexKeyA = Object.keys(EEntityType).indexOf(
        a.entityType.toUpperCase()
      );
      const indexKeyB = Object.keys(EEntityType).indexOf(
        b.entityType.toUpperCase()
      );
      return (
        indexKeyA - indexKeyB ||
        dayjs(a?.createdAt).valueOf() - dayjs(b?.createdAt).valueOf()
      );
    });
  }

  getRecurringChargesByTenancy(data: {
    tenancyId?: string;
    propertyId?: string;
  }) {
    return this.apiService.getAPI(
      conversations,
      'lease-renewal/recurring-charge',
      { tenancyId: data.tenancyId || '', propertyId: data.propertyId || '' }
    );
  }

  addRecurringCharge(recurringCharge: ERecurringCharge) {
    let newRecurringCharge = [];
    if (typeof this.indexRecurringCharge$.value === 'number') {
      this.selectedLeaseRenewal$.value.recurringCharges.splice(
        this.indexRecurringCharge$.value,
        1,
        recurringCharge
      );
      newRecurringCharge = this.selectedLeaseRenewal$.value.recurringCharges;
      this.indexRecurringCharge$.next(null);
    } else {
      newRecurringCharge = [
        ...(this.selectedLeaseRenewal$.value.recurringCharges || []),
        recurringCharge
      ];
    }
    this.setSelectedLeaseRenewal({
      ...this.selectedLeaseRenewal$.value,
      recurringCharges: newRecurringCharge
    });
  }

  updateRecurringCharge(recurringCharge: ERecurringCharge[]) {
    this.setSelectedLeaseRenewal({
      ...this.selectedLeaseRenewal$.value,
      recurringCharges: [...recurringCharge]
    });
  }

  formatDataLease(
    status: LeaseRenewalSyncStatus,
    startDate: string,
    endDate: string,
    frequency: string,
    tenancyId: string,
    leaseTerm: number,
    leaseSign: string,
    dueDay: number,
    nameTenancy: string,
    recurringCharges: any[],
    lastTimeSync?: string,
    firstTimeSyncSuccess?: boolean
  ) {
    return {
      status,
      startDate,
      endDate,
      frequency,
      tenancyId,
      userPropertyGroup: { name: nameTenancy },
      recurringCharges,
      ...(lastTimeSync && { lastTimeSync }),
      firstTimeSyncSuccess,
      leaseTerm,
      leaseSign,
      source: { rentDueDay: dueDay }
    };
  }

  getTermChargeTypes(propertyId): Observable<{
    leaseTerms: ELeaseTerm[];
    chargeTypes: EChargeType[];
  }> {
    return this.apiService.getAPI(
      conversations,
      `lease-renewal/term-charge-types?propertyId=${propertyId}`
    );
  }

  syncLeaseRenewal(body) {
    return this.apiService.postAPI(
      conversations,
      'lease-renewal/sync-rm-fixed-term-lease',
      body
    );
  }

  updateListLeaseRenewal(data: IWidgetLease) {
    const preData = this.widgetRMService.leaseRenewals.value;
    this.widgetRMService.setRMWidgetStateByType(
      RMWidgetDataField.LEASE_RENEWAL,
      'UPDATE',
      [data]
    );
  }

  setSelectedLeaseRenewal(data: IWidgetLease) {
    this.selectedLeaseRenewal$.next(data);
  }

  getSelectedLeaseRenewal(): Observable<IWidgetLease> {
    return this.selectedLeaseRenewal$.asObservable();
  }

  updateRecurringChargeList(recurringCharges) {
    this.setSelectedLeaseRenewal({
      ...this.selectedLeaseRenewal$.value,
      recurringCharges: recurringCharges
    });
  }

  removeLeaseRenewalSync(body: { taskId: string }) {
    return this.apiService.deleteAPI(
      conversations,
      'lease-renewal/remove-sync-to-property-tree',
      body
    );
  }

  get getTimeAndStatusSync() {
    return this.openTimeStatusSyncLease;
  }

  set updateTimeAndStatusSync(data: ITimeSyncLease) {
    this.openTimeStatusSyncLease.next(data);
  }

  updateButtonStatus() {
    const currentStep = this.stepService.currentRMStep.getValue();
    this.stepService
      .updateStep(
        this.taskService.currentTask$.value?.id,
        currentStep?.id,
        currentStep
          ? ERentManagerAction[currentStep?.action.toUpperCase()]
          : ERentManagerAction.RM_NEW_COMPONENT,
        TrudiButtonEnumStatus.COMPLETED,
        ECRMSystem.RENT_MANAGER,
        ERentManagerType.LEASE_RENEWAL
      )
      .subscribe((data) => {
        this.stepService.updateTrudiResponse(data, EActionType.UPDATE_RM);
        this.stepService.setChangeBtnStatusFromRMWidget(false);
      });
  }
}
