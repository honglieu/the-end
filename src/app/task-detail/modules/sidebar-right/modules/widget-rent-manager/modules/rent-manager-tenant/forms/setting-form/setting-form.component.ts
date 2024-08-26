import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { combineLatest, takeUntil } from 'rxjs';
import { IOptionPill } from '@shared/components/dropdown-pill/dropdown-pill';
import { FrequencyRental } from '@shared/types/trudi.interface';
import { ESyncStatus } from '@/app/task-detail/utils/functions';
import {
  RENT_PERIOD_OPTION,
  WEEKLY_OPTION
} from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/constants/rent-manager-lease-renewal.constamts';
import { EWeekly } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/enums/rent-manager-lease-renewal.enum';
import { dueDayValidator } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/validators/rent-manager-lease-renewal.validator';
import { SETTING_OPTION } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/constants';
import { TenantOptionsStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-options-state.service';
import { TenantStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-state.service';
import { TenantFormBase } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-base';
import { TenantFormMasterService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-master.service';
import { TenantSettingForm } from './tenant-setting-form';
import { ETooltipNewTenantText } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/types';

@Component({
  selector: 'setting-form',
  templateUrl: './setting-form.component.html',
  styleUrls: ['./setting-form.component.scss']
})
export class SettingFormComponent
  extends TenantFormBase<TenantSettingForm>
  implements OnInit, OnDestroy
{
  public settingForm: TenantSettingForm;
  @Input() syncStatus: ESyncStatus;
  constructor(
    private tenantFormMaster: TenantFormMasterService,
    private tenantOptionsStateService: TenantOptionsStateService,
    private tenantStateService: TenantStateService
  ) {
    super();
  }
  public listRent = RENT_PERIOD_OPTION;
  public listWeekly = WEEKLY_OPTION;
  public settingCheckbox = SETTING_OPTION;
  public frequencyRental = FrequencyRental;
  public taxTypeList: IOptionPill[];
  public subsidiesList: IOptionPill[];
  public titleTooltipRemoved = ETooltipNewTenantText.TITLE_TOOLTIP_REMOVED;
  public readonly ESyncStatus = ESyncStatus;

  override ngOnInit(): void {
    super.ngOnInit();
    this.settingForm = this.form;
    combineLatest([
      this.tenantOptionsStateService.optionsSync$,
      this.tenantStateService.tenant$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([options, tenant]) => {
        const { subsidies, taxTypes } = options ?? {};
        this.taxTypeList = taxTypes;
        this.subsidiesList = subsidies;
        if (tenant && tenant.syncStatus === ESyncStatus.COMPLETED) {
          const currentSubsidiesTenant = tenant.data?.subsidyTenants?.map(
            (sub) => sub?.subsidy
          );
          this.subsidiesList = this.subsidiesList?.map((item) => {
            if (
              currentSubsidiesTenant?.some(
                (subsidy) => subsidy?.id === item?.value
              )
            ) {
              return { ...item, disabled: true };
            }
            return item;
          });
        }
      });

    this.rentPeriodControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this._handleUpdateValidator(value);
      });
  }

  handleClickLabel(formControl) {
    if (this.syncStatus === ESyncStatus.INPROGRESS) return;
    const getControl = this.settingForm.get(formControl);
    getControl.setValue(!getControl.value);
  }

  handleChangeRentPeriod(event) {
    switch (event.value) {
      case FrequencyRental.WEEKLY:
        this.rentDueDayControl.setValue(EWeekly.MONDAY);
        break;
      case FrequencyRental.MONTHLY:
        this.rentDueDayControl.setValue(1);
        break;
      case FrequencyRental.DAILY:
        this.rentDueDayControl.setValue(null);
        break;
      default:
        break;
    }
  }

  private _handleUpdateValidator(value) {
    if (value === FrequencyRental.DAILY) {
      this.settingForm.removeControl('rentDueDay');
    } else {
      this.settingForm.addControl(
        'rentDueDay',
        new FormControl('', [Validators.required, dueDayValidator()])
      );
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.settingForm.reset();
  }

  get rentPeriodControl() {
    return this.settingForm.get('rentPeriod');
  }

  get rentDueDayControl() {
    return this.settingForm.get('rentDueDay');
  }

  get subsidiesControl() {
    return this.settingForm.get('subsidies');
  }

  get isProgressStatus() {
    return this.syncStatus === ESyncStatus.INPROGRESS;
  }
}
