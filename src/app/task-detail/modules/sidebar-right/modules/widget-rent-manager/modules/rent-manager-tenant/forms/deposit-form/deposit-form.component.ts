import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { distinctUntilChanged, map, merge, takeUntil } from 'rxjs';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { CURRENCYNUMBER } from '@services/constants';
import { IOptionPill } from '@shared/components/dropdown-pill/dropdown-pill';
import { TenantOptionsStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-options-state.service';
import { TenantStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-state.service';
import { TenantFormBase } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-base';
import { TenantFormMasterService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-master.service';
import { TenantDepositeForm } from './tenant-deposite-form';

@Component({
  selector: 'deposit-form',
  templateUrl: './deposit-form.component.html',
  styleUrls: ['./deposit-form.component.scss']
})
export class DepositFormComponent extends TenantFormBase<TenantDepositeForm> {
  public depositForm: TenantDepositeForm;
  public maskPattern = CURRENCYNUMBER;
  public depositTypeList: IOptionPill[];
  public glStartDate: string;
  public disableDepositDate: boolean = false;
  public readonly MAX_6_DIGIT_BEFORE_DECIMAL = '999999';
  public tenantId: string;
  readonly dateFormatPipe$ = this.agencyDateFormatService.dateFormatPipe$.pipe(
    map((format) => format.toLowerCase())
  );

  constructor(
    private tenantFormMaster: TenantFormMasterService,
    private tenantOptionsStateService: TenantOptionsStateService,
    private agencyDateFormatService: AgencyDateFormatService,
    private tenantState: TenantStateService
  ) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.depositForm = this.form;
    this.handleChangeAmount(this.amountControl);
    this.tenantOptionsStateService.optionsSync$
      .pipe(takeUntil(this.destroy$))
      .subscribe((options) => {
        this.glStartDate = options?.glStartDate;
        this.depositTypeList = options.securityDepositTypes;
      });
    this.handleValidator();
  }

  handleValidator() {
    const controls = [this.amountControl, this.typeControl, this.dateControl];
    merge(
      ...controls.map((control) =>
        control.valueChanges.pipe(distinctUntilChanged())
      )
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        controls.forEach((control) => {
          const shouldValidate = controls.some((control) => control.value);
          if (shouldValidate) {
            control.addValidators(Validators.required);
          } else {
            control.removeValidators(Validators.required);
          }
          control.updateValueAndValidity();
        });
      });
  }

  handleChangeAmount(event) {
    const hasValue = event?.target?.value || event?.value;
    hasValue
      ? this.typeControl.addValidators(Validators.required)
      : this.typeControl.clearValidators();
    this.typeControl.updateValueAndValidity();
  }

  handleChangeCheckbox(event) {
    const isChecked = this.isDepositPriorControl.value;
    this.dateControl.setValue(isChecked ? this.glStartDate : null);
    if (isChecked) {
      this.dateControl.disable();
    } else {
      this.dateControl.enable();
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.depositForm.reset();
  }

  get typeControl() {
    return this.depositForm.get('type');
  }

  get amountControl() {
    return this.depositForm.get('amount');
  }

  get isDepositPriorControl() {
    return this.depositForm.get('isDepositPrior');
  }

  get dateControl() {
    return this.depositForm.get('date');
  }
}
