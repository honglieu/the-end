import { Component } from '@angular/core';
import dayjs from 'dayjs';
import { takeUntil } from 'rxjs';
import { LeasePeriodType } from '@shared/types/trudi.interface';
import { ELeaseTerm } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-lease-renewal/interfaces/rent-manager-lease-renewal.interface';
import { PopupSyncTenantService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/popup-sync-tenant/popup-sync-tenant.service';
import { TenantOptionsStateService } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/state/tenant-options-state.service';
import { TenantFormBase } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/modules/rent-manager-tenant/forms/tenant-form-base';
import { TenantLeaseForm } from './tenant-lease-form';
import { scrollSelectedIntoView } from '@shared/utils/helper-functions';

@Component({
  selector: 'lease-form',
  templateUrl: './lease-form.component.html',
  styleUrls: ['./lease-form.component.scss']
})
export class LeaseFormComponent extends TenantFormBase<TenantLeaseForm> {
  public disableField = true;
  public leaseDetailsControl: TenantLeaseForm;
  public leaseTermOptions: ELeaseTerm[] = [];
  private timeIntervalOption = {
    [LeasePeriodType.Weeks]: 'W',
    [LeasePeriodType.Months]: 'M',
    [LeasePeriodType.Years]: 'Y'
  };
  public paragraph: object = { rows: 0 };

  constructor(
    private tenantOptionsStateService: TenantOptionsStateService,
    private popupSyncTenantService: PopupSyncTenantService
  ) {
    super();
  }

  get moveInDateControl() {
    return this.leaseDetailsControl.get('moveInDate');
  }

  get moveOutDateControl() {
    return this.leaseDetailsControl.get('moveOutDate');
  }

  get noticeDateControl() {
    return this.leaseDetailsControl.get('noticeDate');
  }

  get expectedMoveOutDateControl() {
    return this.leaseDetailsControl.get('expectedMoveOutDate');
  }

  get startDateControl() {
    return this.leaseDetailsControl.get('startDate');
  }

  get endDateControl() {
    return this.leaseDetailsControl.get('endDate');
  }

  get signDateControl() {
    return this.leaseDetailsControl.get('signDate');
  }

  get termControl() {
    return this.leaseDetailsControl.get('term');
  }

  override ngOnInit() {
    super.ngOnInit();
    this.leaseDetailsControl = this.form;

    this.getLeaseTermList();
    this.onFormControlValueChanges();
  }

  onLeaseTermChanged(value) {
    this.endDateControl.setValue(this.updateLeaseEnd(value.id), {
      emitEvent: false
    });
  }

  getLeaseTermList() {
    this.tenantOptionsStateService.optionsSync$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ leaseTerms }) => {
        this.leaseTermOptions = leaseTerms?.map((r) => ({
          ...r,
          value: r.id,
          label: r.name
        }));
      });
  }

  handleOnOpenedLeaseTermSelect() {
    setTimeout(() => {
      scrollSelectedIntoView();
    }, 100);
  }

  updateLeaseEnd(leaseTermId: number, leaseStart?: string) {
    const termOpt = this.leaseTermOptions?.find(
      (opt) => opt.id === +leaseTermId
    );
    const startDate = leaseStart || this.startDateControl.value;
    if (!startDate) return null;
    if (termOpt) {
      if (!termOpt.isMTM) {
        return dayjs(startDate)
          .add(
            termOpt.duration || 0,
            this.timeIntervalOption[termOpt.timeInterval]
          )
          .subtract(1, 'day')
          .toDate();
      }
      return null;
    }
    return this.endDateControl.value;
  }

  private onFormControlValueChanges() {
    const dateControls = [
      this.moveInDateControl,
      this.moveOutDateControl,
      this.noticeDateControl,
      this.expectedMoveOutDateControl,
      this.startDateControl,
      this.endDateControl,
      this.signDateControl
    ];
    for (const control of dateControls) {
      control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
        if (value) {
          if (control == this.startDateControl) {
            const newEndDate = this.updateLeaseEnd(this.termControl.value);
            if (newEndDate != this.endDateControl.value)
              this.endDateControl.setValue(newEndDate, { emitEvent: false });
          }
        }
      });
    }
  }
}
