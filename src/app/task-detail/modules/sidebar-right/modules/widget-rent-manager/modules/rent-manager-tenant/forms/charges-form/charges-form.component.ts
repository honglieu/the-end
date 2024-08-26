import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { NgxMaskPipe } from 'ngx-mask';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  startWith,
  takeUntil
} from 'rxjs';
import { CURRENCYNUMBER } from '@services/constants';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import {
  EChargeType,
  ERecurringCharge
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { PopupVisibleStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/popup-visible-state.service';
import { TenantOptionsStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-options-state.service';
import { TenantStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-state.service';
import { TenantFormName } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';
import { TenantFormBase } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-base';
import { TenantFormMasterService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-master.service';
import {
  EChargeTypes,
  TenantOneTimeChargeForm,
  TenantRecurringChargeForm
} from './tenant-charges-form';

type ChargesRecurring = FormArray & {
  controls: TenantRecurringChargeForm[];
};

type ChargesOneTime = FormArray & {
  controls: TenantOneTimeChargeForm[];
};

type ChargesForm = FormGroup & {
  recurring: ChargesRecurring;
  oneTime: ChargesOneTime;
};

@Pipe({
  name: 'formatAmount'
})
export class FormatAmountPipe implements PipeTransform {
  constructor(private ngMask: NgxMaskPipe) {}
  transform(value?: string | number) {
    return this.ngMask.transform(value, CURRENCYNUMBER, {
      thousandSeparator: ',',
      separatorLimit: '9999999999',
      leadZero: true,
      prefix: '$'
    });
  }
}

@Component({
  selector: 'charges-form',
  templateUrl: './charges-form.component.html',
  styleUrls: ['./charges-form.component.scss']
})
export class ChargesFormComponent
  extends TenantFormBase<ChargesForm>
  implements OnInit
{
  public chargeTypes = null;
  public currentRecurringForm: TenantRecurringChargeForm;
  public currentOnetimeForm: TenantOneTimeChargeForm;
  public EChargeTypes = EChargeTypes;
  public syncStatus: string = ESyncStatus.NOT_SYNC;
  public ESyncStatus = ESyncStatus;
  public chargeTypeOptions: EChargeType[] = [];
  public recurringChargeList: ERecurringCharge[] = [];
  public oneTimeChargeList = [];
  public index = undefined;
  public recurringChargeDisabled: boolean;
  public hiddenBtn: boolean;
  public oneTimeChargeDisabled: boolean;
  public isSyncing = false;
  constructor(
    private popupVisibleStateService: PopupVisibleStateService,
    private tenantFormMasterService: TenantFormMasterService,
    private tenantOptionsStateService: TenantOptionsStateService,
    private tenantStateService: TenantStateService
  ) {
    super();
  }

  get chargeForm() {
    return this.form;
  }

  get oneTimeChargeFormList() {
    return this.chargeForm?.get('oneTime');
  }

  get recurringChargeFormList() {
    return this.chargeForm?.get('recurring');
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this._setOptions();
    this._setDisable();
    this._setDataTable();
  }

  private _setOptions() {
    this.tenantOptionsStateService.optionsSync$
      .pipe(takeUntil(this.destroy$))
      .subscribe((options) => {
        this.chargeTypeOptions = options?.chargeTypes?.filter(
          (item) => item.isActive
        );
      });
  }

  private _setDisable() {
    combineLatest([
      this.tenantFormMasterService.isSyncing$,
      this.tenantStateService.tenant$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([isSyncing, tenant]) => {
        this.recurringChargeDisabled = !tenant?.data.lease?.id || isSyncing;
        this.oneTimeChargeDisabled = !tenant?.idUserPropertyGroup || isSyncing;
        this.hiddenBtn = !tenant?.idUserPropertyGroup;
        this.isSyncing = isSyncing;
      });
  }

  private _setDataTable() {
    this.chargeForm?.valueChanges
      .pipe(
        startWith(this.chargeForm?.getRawValue()),
        takeUntil(this.destroy$),
        map(() => this.chargeForm.getRawValue()),
        distinctUntilChanged(
          (previous, current) =>
            JSON.stringify(previous) === JSON.stringify(current)
        )
      )
      .subscribe((chargeFormValue) => {
        this._mapDataTable(chargeFormValue);
      });
  }

  private _mapDataTable(chargeFormValue: any) {
    if (!Object.keys(chargeFormValue).length) return;
    this.recurringChargeList = this.mapChargeList(chargeFormValue?.recurring);
    this.oneTimeChargeList = this.mapChargeList(chargeFormValue?.oneTime);
  }

  mapChargeList(list) {
    return list?.map((item) => {
      return {
        ...item,
        amount:
          typeof item.amount === 'string'
            ? parseFloat(item.amount.replace(/,/g, ''))
            : item.amount,
        chargeType: this.formatChargeType(
          this.chargeTypeOptions.find(
            (i) => i.id === item.chargeTypeId || i.id === item.type
          )
        )
      };
    });
  }

  formatChargeType(data: EChargeType) {
    return [data?.name, data?.description].filter(Boolean).join(' - ');
  }

  removeFirstControl() {
    this.tenantFormMasterService.removeControl('charges.recurring', 0);
    this.tenantFormMasterService.removeControl('charges.oneTime', 0);
  }

  handleAddRecurringCharges() {
    this.currentRecurringForm = new TenantRecurringChargeForm(
      false,
      undefined,
      'Tenant'
    );
  }

  handleAddOneTimeCharges() {
    this.currentOnetimeForm = new TenantOneTimeChargeForm();
  }

  handleEditRecurringCharges(index: number) {
    const control = (this.recurringChargeFormList as FormArray).controls[
      index
    ] as TenantRecurringChargeForm;
    this.currentRecurringForm = control;
  }

  handleEditOneTimeCharges(index: number) {
    const control = (this.oneTimeChargeFormList as FormArray).controls[
      index
    ] as TenantOneTimeChargeForm;
    this.currentOnetimeForm = control;
  }

  handleClickCheckBox(event) {
    const form = this.tenantFormMasterService
      .getRawForm()
      .get(TenantFormName.Charges)
      .get(TenantFormName.Recurring) as FormArray;
    const control = form.controls[event.index];
    control.patchValue(
      { isException: event?.isException },
      { emitEvent: true, onlySelf: false }
    );
  }

  handleAddCharges(event) {
    const { type, index } = event;
    this.index = index;
    this.chargeTypes = type;
    switch (type) {
      case EChargeTypes.RECURRING_CHARGES:
        if (index !== undefined) {
          this.handleEditRecurringCharges(index);
        } else {
          this.handleAddRecurringCharges();
        }
        break;

      default:
        if (index !== undefined) {
          this.handleEditOneTimeCharges(index);
        } else {
          this.handleAddOneTimeCharges();
        }
        break;
    }
    this.popupVisibleStateService.setPopupSync(false);
  }

  handleBack() {
    this.chargeTypes = null;
    this.popupVisibleStateService.setPopupSync(true);
  }

  handleSave(event) {
    if (this.index !== undefined) {
      this.tenantFormMasterService.updateControl(
        `charges.${this.chargeTypes}`,
        event,
        this.index
      );
      // trigger value changes to update the list in the table
      this.chargeForm.updateValueAndValidity();
    } else {
      this.tenantFormMasterService.addControl(
        `charges.${this.chargeTypes}`,
        event
      );
    }
    this.chargeTypes = null;
    this.popupVisibleStateService.setPopupSync(true);
  }

  handleDeleteCharges(event) {
    const { type, index } = event;
    this.tenantFormMasterService.removeControl(`charges.${type}`, index);
  }

  override ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    super.ngOnDestroy();
  }
}
