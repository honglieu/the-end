import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { startWith } from 'rxjs/operators';

import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { LeaseRenewalSyncStatus } from '@shared/enum/lease-renewal-Request.enum';
import { FORMAT_ICON_SYNC } from '@/app/task-detail/utils/functions';

import { AbstractControl, FormGroup } from '@angular/forms';
import { isEqualWith } from 'lodash-es';
import { CURRENCYNUMBER } from '@services/constants';
import { EChargeType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager//modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { EEntityType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
import {
  EChargeTypes,
  TenantOneTimeChargeForm,
  TenantRecurringChargeForm,
  validateAmountFn
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/charges-form/tenant-charges-form';
@Component({
  selector: 'charges-detail-pop-up',
  templateUrl: './charges-detail-pop-up.component.html',
  styleUrls: ['./charges-detail-pop-up.component.scss']
})
export class ChargesDetailPopUpComponent implements OnInit, OnDestroy {
  public syncPTStatus: LeaseRenewalSyncStatus = LeaseRenewalSyncStatus.WAITING;
  public submitted = false;
  private componentDestroyed$ = new Subject<void>();
  public chargeForm: FormGroup;
  private _originalForm: FormGroup;
  @Input() set form(form: TenantRecurringChargeForm | TenantOneTimeChargeForm) {
    this._originalForm = form;
    const formValue = form.getRawValue();
    if (this.chargeTypes == EChargeTypes.ONE_TIME_CHARGES) {
      const { id, type, amount, comment, date, reference } = formValue;
      this.chargeForm = new TenantOneTimeChargeForm(
        id,
        type,
        amount,
        comment,
        date,
        reference
      );
    }
    if (this.chargeTypes == EChargeTypes.RECURRING_CHARGES) {
      const {
        isException,
        id,
        charge,
        type,
        amount,
        comment,
        frequency,
        fromDate,
        toDate,
        calculation
      } = formValue;
      this.chargeForm = new TenantRecurringChargeForm(
        isException,
        id,
        charge,
        type,
        amount,
        comment,
        frequency,
        fromDate,
        toDate,
        calculation
      );
    }
  }
  @Input() chargeTypeOptions: EChargeType[] = [];
  @Input() chargeTypes = EChargeTypes.RECURRING_CHARGES;
  @Output() handleBackModal = new EventEmitter<void>();
  @Output() handleSave = new EventEmitter<
    TenantRecurringChargeForm | TenantOneTimeChargeForm
  >();
  readonly LeaseRenewalSyncStatus = LeaseRenewalSyncStatus;
  readonly synData = FORMAT_ICON_SYNC;
  public recurringCharge;
  public EEntityType = EEntityType;
  public EChargeTypes = EChargeTypes;
  public messageTooltip = '';
  public maskPattern = CURRENCYNUMBER;
  public maskPatternFrequency = '000';
  public defaultValue;
  public isShowAmountTooltip = false;
  public isShowCalculationTooltip = false;
  readonly separatorLimitAmount = '9999999999';

  public chargeTypeOption: EChargeType[] = [];

  get chargeTypeControl() {
    return this.chargeForm?.get('type');
  }

  get amountControl() {
    return this.chargeForm?.get('amount');
  }

  get frequencyControl() {
    return this.chargeForm?.get('frequency');
  }

  get fromControl() {
    return this.chargeForm?.get('fromDate');
  }

  get toControl() {
    return this.chargeForm?.get('toDate');
  }

  get commentControl() {
    return this.chargeForm?.get('comment');
  }

  get calculationControl() {
    return this.chargeForm?.get('calculation');
  }

  get dateControl() {
    return this.chargeForm?.get('date');
  }

  get referenceControl() {
    return this.chargeForm?.get('reference');
  }
  constructor(private agencyDateFormatService: AgencyDateFormatService) {}

  ngOnInit(): void {
    this.setDefaultFormValue();
    this.disabledFormWhenViewDetails();
    this.validateAmountAndCalculation();

    this.amountControl?.valueChanges
      .pipe(takeUntil(this.componentDestroyed$))
      .subscribe(() => {
        if (!this.submitted) this.amountControl?.clearValidators();
      });
  }

  setDefaultFormValue() {
    switch (this.chargeTypes) {
      case EChargeTypes.RECURRING_CHARGES:
        this.defaultValue = {
          type: this.chargeTypeControl.value,
          amount: this.amountControl.value,
          frequency: this.frequencyControl.value,
          fromDate: this.fromControl.value,
          toDate: this.toControl.value,
          calculation: this.calculationControl.value,
          comment: this.commentControl.value
        };
        break;
      default:
        this.defaultValue = {
          type: this.chargeTypeControl.value,
          date: this.dateControl.value,
          comment: this.commentControl.value,
          reference: this.referenceControl.value,
          amount: this.amountControl.value
        };
        break;
    }
  }

  disabledFormWhenViewDetails() {
    if (
      this.chargeForm?.get('charge')?.value === EEntityType.PROPERTY ||
      this.chargeForm?.get('charge')?.value === EEntityType.UNIT
    ) {
      this.chargeForm.disable({ onlySelf: true, emitEvent: false });
    }
  }

  validateAmountAndCalculation() {
    if (
      this.chargeForm?.get('charge')?.value !== EEntityType.PROPERTY &&
      this.chargeForm?.get('charge')?.value !== EEntityType.UNIT
    ) {
      this.calculationControl?.valueChanges
        .pipe(
          startWith(this.calculationControl?.value),
          takeUntil(this.componentDestroyed$),
          distinctUntilChanged()
        )
        .subscribe((value) => {
          this.disableController(this.amountControl, !!value);
        });

      this.amountControl?.valueChanges
        .pipe(
          startWith(this.amountControl?.value),
          takeUntil(this.componentDestroyed$),
          distinctUntilChanged()
        )
        .subscribe((value) => {
          this.disableController(this.calculationControl, !!value);
        });
      this.messageTooltip =
        'A recurring charge cannot have both amount and calculation.';
    }
  }

  disableController(controller: AbstractControl, isDisabled: boolean) {
    if (!controller) return;
    if (isDisabled) {
      controller.disable({ onlySelf: true, emitEvent: false });
    } else {
      controller.enable({ onlySelf: true, emitEvent: false });
    }
  }

  customListSearchFn(term: string, item: any) {
    term = term.toLowerCase();
    return (
      item?.name?.toLowerCase()?.includes(term) ||
      item?.description?.toLowerCase()?.includes(term)
    );
  }

  cancel() {
    this.chargeForm?.enable({ onlySelf: true, emitEvent: false });
    this.handleBackModal.emit();
  }

  onSave() {
    this.submitted = true;
    this.amountControl?.setValidators(validateAmountFn());
    this.amountControl?.updateValueAndValidity();
    if (this.chargeForm.invalid) {
      this.chargeForm.markAllAsTouched();
      return;
    }
    const originValue = this._originalForm.getRawValue();
    const newVale = this.chargeForm.getRawValue();

    switch (this.chargeTypes) {
      case EChargeTypes.RECURRING_CHARGES:
        this.fromControl.setValue(
          this.agencyDateFormatService.expectedTimezoneStartOfDay(
            this.fromControl?.value
          ),
          { onlySelf: true, emitEvent: false }
        );
        this.toControl.setValue(
          this.agencyDateFormatService.expectedTimezoneStartOfDay(
            this.toControl?.value
          ),
          { onlySelf: true, emitEvent: false }
        );
        break;
      default:
        this.dateControl.setValue(
          this.agencyDateFormatService.expectedTimezoneStartOfDay(
            this.dateControl?.value
          ),
          { onlySelf: true, emitEvent: false }
        );
        break;
    }

    if (this._compareFormValue(originValue, newVale)) {
      this.handleSave.emit(this.chargeForm);
    }
    this.handleBackModal.emit();
  }

  private _compareFormValue(originValue: any, newVale: any): boolean {
    const customizer = (first, second, key) => {
      if (key === 'amount') {
        return parseFloat(first) === parseFloat(second);
      }
      return undefined;
    };
    return !isEqualWith(originValue, newVale, customizer);
  }

  ngOnDestroy(): void {
    this.componentDestroyed$.next();
    this.componentDestroyed$.complete();
  }
}
