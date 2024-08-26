import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { differenceInCalendarDays } from 'date-fns';
import dayjs from 'dayjs';
import { SyncPropertyTreeLeasingFormService } from '@/app/leasing/services/sync-property-tree-leasing-form.service';

@Component({
  selector: 'lease-details',
  templateUrl: './lease-details.component.html',
  styleUrls: ['./lease-details.component.scss']
})
export class LeaseDetailsComponent implements OnInit {
  @Input() disable: boolean = null;
  public periodTypeItems = [
    { value: 'userDefined', text: 'User defined' },
    { value: 'weeks', text: 'Weeks' },
    { value: 'months', text: 'Months' },
    { value: 'years', text: 'Years' }
  ];
  public defaultPeriodTypeItems;

  constructor(
    public syncPropertyTreeLeasingFormService: SyncPropertyTreeLeasingFormService,
    private readonly elr: ElementRef
  ) {}

  get leasingForm(): FormGroup {
    return this.syncPropertyTreeLeasingFormService.leasingForm;
  }

  get originalLeaseStart(): AbstractControl {
    return this.leasingForm.get('originalLeaseStartDate');
  }

  get leaseStart(): AbstractControl {
    return this.leasingForm.get('leaseStartDate');
  }

  get leaseEnd(): AbstractControl {
    return this.leasingForm.get('leaseEndDate');
  }

  get leasePeriod(): AbstractControl {
    return this.leasingForm.get('leasePeriod');
  }

  get periodTypes(): AbstractControl {
    return this.leasingForm.get('leasePeriodType');
  }

  ngOnInit(): void {
    this.originalLeaseStart.valueChanges.subscribe(() =>
      this.handleTimeLeaseEnd()
    );

    this.leaseStart.valueChanges.subscribe(() => this.handleLeaseTimeChange());

    this.leaseEnd.valueChanges.subscribe(() => this.handleLeaseTimeChange());

    this.leasePeriod.valueChanges.subscribe(() => this.handleTimeLeaseEnd());

    this.periodTypes.valueChanges.subscribe(() => this.handleTimeLeaseEnd());
    this.defaultPeriodTypeItems = this.periodTypes.value
      ? this.periodTypes.value
      : this.periodTypeItems[0].value;
    if (this.defaultPeriodTypeItems !== this.periodTypeItems[0].value) {
      this.leasePeriod.enable();
    }
  }

  handleLeaseTimeChange() {
    if (!this.leasePeriod.value) return;
    if (this.periodTypes.value !== this.periodTypeItems[0].value) {
      const isWeeks = this.periodTypes.value === this.periodTypeItems[1].value;
      const leaseStart = new Date(
        dayjs(this.leaseStart.value).format('YYYY-MM-DD')
      );
      const leaseEnd = dayjs(leaseStart)
        .add(
          isWeeks ? this.leasePeriod.value * 7 : this.leasePeriod.value,
          isWeeks ? 'day' : this.periodTypes.value
        )
        .subtract(1, 'day')
        .format('YYYY-MM-DD');
      if (leaseEnd === dayjs(this.leaseEnd.value).format('YYYY-MM-DD')) {
        return;
      }
      this.periodTypes.setValue(this.periodTypeItems[0].value, {
        emitEvent: false
      });
      this.leasePeriod.setValue('', { emitEvent: false });
      this.leasePeriod.disable();
    }
  }

  handleTimeLeaseEnd() {
    const isWeeks = this.periodTypes.value === this.periodTypeItems[1].value;
    const isUserDefine =
      this.periodTypes.value === this.periodTypeItems[0].value;
    const currentTime = new Date(
      dayjs(this.leaseStart.value).format('YYYY-MM-DD')
    );
    if (
      !!this.leaseStart.value?.toString() &&
      !!this.periodTypes.value &&
      !!this.leasePeriod.value
    ) {
      let currentLeastStart;

      if (isUserDefine) {
        currentLeastStart = dayjs(this.leaseEnd.value);
      } else {
        const periodToAdd = isWeeks
          ? this.leasePeriod.value * 7
          : this.leasePeriod.value;
        let periodTypeToAdd = this.periodTypes.value;
        if (
          periodTypeToAdd !== 'day' &&
          periodTypeToAdd !== 'months' &&
          periodTypeToAdd !== 'years'
        ) {
          periodTypeToAdd = 'day';
        }

        currentLeastStart = dayjs(currentTime).add(
          periodToAdd,
          periodTypeToAdd
        );
      }

      this.leaseEnd.setValue(
        new Date(
          currentLeastStart
            .subtract(
              this.periodTypes.value === this.periodTypeItems[0].value ? 0 : 1,
              'day'
            )
            .utc()
            .format('YYYY-MM-DD')
        ),
        { emitEvent: false }
      );
    }
  }

  isFieldValid(field: string) {
    if (this.leasingForm) {
      if (
        this.periodTypes.value === this.periodTypeItems[0].value &&
        field === 'leasePeriod'
      ) {
        return false;
      }

      return (
        !this.leasingForm.get(field).valid &&
        this.leasingForm.get(field).touched
      );
    }
    return false;
  }

  onChangePeriodType(event) {
    if (event.value === this.periodTypeItems[0].value) {
      this.leasePeriod.setValue('');
      this.leasePeriod.disable();
    } else {
      this.leasePeriod.enable();
    }
  }

  ngAfterViewChecked() {
    const elementSelected = this.elr.nativeElement.querySelector(
      '.ng-option .item-selected'
    );
    const parentElement = elementSelected?.closest('.ng-option');
    if (parentElement) {
      parentElement.classList.add('ng-selected');
    }
  }

  disableLeaseStart = (current: Date): boolean => {
    if (!(this.originalLeaseStart.value as Date) || !current) return false;
    return differenceInCalendarDays(current, this.originalLeaseStart.value) < 0;
  };

  disableLeaseEndOriginal = (current: Date): boolean => {
    if (!(this.originalLeaseStart.value as Date) || !current) return false;
    return differenceInCalendarDays(current, this.originalLeaseStart.value) < 0;
  };

  disableLeaseEnd = (current: Date): boolean => {
    if (!this.leaseStart.value || !current) return false;
    return current <= this.leaseStart.value;
  };

  checkLeaseConditions = (current: Date): boolean => {
    return (
      this.disableLeaseEndOriginal(current) || this.disableLeaseEnd(current)
    );
  };

  triggerInputTouched(event: boolean, field: string) {
    if (!event) {
      this[field].markAsTouched();
    }
  }
}
