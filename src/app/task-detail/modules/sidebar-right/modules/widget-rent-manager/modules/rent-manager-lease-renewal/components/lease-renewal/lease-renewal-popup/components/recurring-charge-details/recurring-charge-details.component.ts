import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';

import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import { FORMAT_ICON_SYNC } from '@/app/task-detail/utils/functions';

import { AbstractControl } from '@angular/forms';
import { CURRENCYNUMBER } from '@services/constants';
import { EEntityType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import { WidgetRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/services/widget-rent-manager.service';
import {
  EChargeType,
  ERecurringCharge
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { LeaseRenewalFormRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/services/lease-renewal-form.service';
import { LeaseRenewalRMService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/services/lease-renewal.service';

@Component({
  selector: 'recurring-charge-details',
  templateUrl: './recurring-charge-details.component.html',
  styleUrls: ['./recurring-charge-details.component.scss']
})
export class RecurringChargeDetailsComponent implements OnInit, OnDestroy {
  public syncPTStatus: LeaseRenewalSyncStatus = LeaseRenewalSyncStatus.WAITING;
  public submitted = false;
  private componentDestroyed$ = new Subject<void>();
  public disableField = false;
  private syncStatus;
  @Output() handleBackModal = new EventEmitter<void>();
  readonly LeaseRenewalSyncStatus = LeaseRenewalSyncStatus;
  readonly synData = FORMAT_ICON_SYNC;
  public recurringCharge;
  public EEntityType = EEntityType;
  public messageTooltip = '';
  public maskPatternFrequency = '000';
  public maskPattern = CURRENCYNUMBER;
  readonly separatorLimitAmount = '9999999999';

  constructor(
    private leaseRenewalFormRMService: LeaseRenewalFormRMService,
    private leaseRenewalService: LeaseRenewalRMService,
    private widgetRMService: WidgetRMService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  get recurringChargeForm() {
    return this.leaseRenewalFormRMService.recurringChargeForm;
  }

  get chargeTypeControl() {
    return this.recurringChargeForm.get('chargeType');
  }

  get amountControl() {
    return this.recurringChargeForm.get('amount');
  }

  get frequencyControl() {
    return this.recurringChargeForm.get('frequency');
  }

  get fromControl() {
    return this.recurringChargeForm.get('from');
  }

  get toControl() {
    return this.recurringChargeForm.get('to');
  }

  get commentControl() {
    return this.recurringChargeForm.get('comment');
  }

  get calculationControl() {
    return this.recurringChargeForm.get('caculation');
  }

  public chargeTypeOption: EChargeType[] = [];

  ngOnInit(): void {
    this.leaseRenewalFormRMService.buildFormRecurringChargeRM();

    this.initRecurringCharge();

    this.leaseRenewalService.getChargeTypeList().subscribe((res) => {
      this.chargeTypeOption = res.sort((a, b) => (a.name < b.name ? -1 : 1));
    });

    this.leaseRenewalService.getTimeAndStatusSync
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        if (res) {
          this.syncStatus = res.status;
        }
      });

    this.validateAmountAndCalculation();

    this.leaseRenewalService.getChargeTypeList().subscribe((res) => {
      this.chargeTypeOption = res.sort((a, b) => (a.name < b.name ? -1 : 1));
    });
  }

  initRecurringCharge() {
    this.leaseRenewalService
      .getIndexRecurringCharge()
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe((res) => {
        if (res !== null) {
          this.recurringCharge =
            this.leaseRenewalService.selectedLeaseRenewal$.value.recurringCharges[
              res
            ];
          this.amountControl.patchValue(this.recurringCharge?.amount ?? '');
          this.calculationControl.patchValue(this.recurringCharge?.calculation);
          this.frequencyControl.patchValue(this.recurringCharge?.frequency);
          this.fromControl.patchValue(
            this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
              this.recurringCharge?.fromDate
            )
          );
          this.toControl.patchValue(
            this.agencyDateFormatService.combineDateAndTimeFromUTCToLocal(
              this.recurringCharge?.toDate
            )
          );
          this.commentControl.patchValue(this.recurringCharge?.comment);
          this.chargeTypeControl.patchValue(this.recurringCharge?.chargeTypeId);
          if (
            this.recurringCharge?.entityType === EEntityType.PROPERTY ||
            this.recurringCharge?.entityType === EEntityType.UNIT
          ) {
            this.recurringChargeForm.disable();
            this.disableField = false;
          }
        }
      });
  }

  validateAmountAndCalculation() {
    if (
      this.recurringCharge?.entityType !== EEntityType.PROPERTY &&
      this.recurringCharge?.entityType !== EEntityType.UNIT
    ) {
      this.calculationControl.valueChanges
        .pipe(takeUntil(this.componentDestroyed$), distinctUntilChanged())
        .subscribe((value) => {
          this.disableController(this.amountControl, !!value);
        });

      this.amountControl.valueChanges
        .pipe(takeUntil(this.componentDestroyed$), distinctUntilChanged())
        .subscribe((value) => {
          this.disableController(this.calculationControl, !!value);
        });
      this.messageTooltip =
        'A recurring charge cannot have both amount and calculation.';
    }
  }

  cancel() {
    this.leaseRenewalService.setIndexRecurringCharge(null);
    this.handleBackModal.emit();
  }

  onSave() {
    this.submitted = true;
    if (this.recurringChargeForm.invalid) {
      this.recurringChargeForm.markAllAsTouched();
      return;
    }
    const amount = this.amountControl.value;
    const recurringCharge = {
      chargeTypeId: this.chargeTypeControl.value,
      chargeType: this.chargeTypeOption?.find(
        (option) => option.id === this.chargeTypeControl.value
      ),
      amount:
        typeof amount === 'string' && amount !== ''
          ? +this.amountControl.value?.replace(/,/g, '')
          : undefined,
      calculation: this.calculationControl.value,
      fromDate: this.fromControl?.value
        ? this.agencyDateFormatService.expectedTimezoneStartOfDay(
            this.fromControl?.value
          )
        : '',
      toDate: this.toControl?.value
        ? this.agencyDateFormatService.expectedTimezoneStartOfDay(
            this.toControl?.value
          )
        : '',
      comment: this.commentControl.value,
      frequency: this.frequencyControl.value || undefined,
      entityType: this.recurringCharge?.id
        ? this.recurringCharge?.entityType
        : 'Tenant',
      id: this.recurringCharge?.id,
      createdAt: this.recurringCharge?.createdAt || new Date().toISOString()
    } as ERecurringCharge;

    this.leaseRenewalService.addRecurringCharge(recurringCharge);
    if (this.syncStatus !== LeaseRenewalSyncStatus.NOT_SYNC) {
      this.leaseRenewalService.updateTimeAndStatusSync = {
        status: LeaseRenewalSyncStatus.UN_SYNC,
        lastTimeSync: new Date().toString()
      };
    }
    this.handleBackModal.emit();
  }

  customListSearchFn(term: string, item: any) {
    term = term.toLowerCase();
    return (
      item?.name?.toLowerCase()?.includes(term) ||
      item?.description?.toLowerCase()?.includes(term)
    );
  }

  disableController(controller: AbstractControl, isDisabled: boolean) {
    isDisabled ? controller.disable() : controller.enable();
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
