import { AMOUNT_ERRORS } from '@/app/leasing/utils/leasing.enum';
import { CURRENCYNUMBER } from '@services/constants';
import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { differenceInCalendarDays } from 'date-fns';
import { SyncPropertyTreeLeasingFormService } from '@/app/leasing/services/sync-property-tree-leasing-form.service';
import { IItemSelect } from '@/app/leasing/utils/leasingType';

@Component({
  selector: 'rent-schedule',
  templateUrl: './rent-schedule.component.html',
  styleUrls: ['./rent-schedule.component.scss']
})
export class RentScheduleComponent implements OnInit {
  @Input() disable: boolean = null;
  public isValidOriginalRentStart: boolean = false;
  public inValidOriginalNextRent: boolean = false;
  public paymentPeriodItems: IItemSelect[] = [
    { value: 'daily', text: 'Daily' },
    { value: 'weekly', text: 'Weekly' },
    { value: 'fortnightly', text: 'Fortnightly' },
    { value: 'monthly', text: 'Monthly' },
    { value: 'quarterly', text: 'Quarterly' },
    { value: 'yearly', text: 'Yearly' }
  ];
  public isInputFocused: boolean = false;
  public isInputClicked: boolean = false;
  public maskPattern = CURRENCYNUMBER;
  public amountErrors = AMOUNT_ERRORS;

  handleInputFocus() {
    this.isInputFocused = true;
  }

  handleInputBlur() {
    this.isInputFocused = false;
  }

  handleInputClick() {
    this.isInputClicked = true;
  }
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

  get rentalAmount(): AbstractControl {
    return this.leasingForm.get('rentAmount');
  }

  get paymentPeriod(): AbstractControl {
    return this.leasingForm.get('paymentPeriod');
  }

  get rentStartDate(): AbstractControl {
    return this.leasingForm.get('rentStartDate');
  }

  get nextRentReview(): AbstractControl {
    return this.leasingForm.get('nextRentReview');
  }

  get rentDescription(): AbstractControl {
    return this.leasingForm.get('rentDescription');
  }

  get fees(): AbstractControl {
    return this.leasingForm.get('doChargeNewTenancyFees');
  }

  ngOnInit(): void {
    this.originalLeaseStart.valueChanges.subscribe((value) => {
      this.isValidOriginalRentStart =
        differenceInCalendarDays(value, this.rentStartDate.value) > 0;
      this.inValidOriginalNextRent =
        differenceInCalendarDays(value, this.nextRentReview.value) > 0;
    });

    this.rentStartDate.valueChanges.subscribe((value) => {
      this.isValidOriginalRentStart =
        differenceInCalendarDays(value, this.originalLeaseStart.value) < 0;
    });

    this.nextRentReview.valueChanges.subscribe((value) => {
      this.inValidOriginalNextRent =
        differenceInCalendarDays(value, this.originalLeaseStart.value) < 0;
    });
  }

  isFieldValid(field: string): boolean {
    if (this.leasingForm) {
      return (
        !this.leasingForm.get(field).valid &&
        (this.leasingForm.get(field).dirty ||
          this.leasingForm.get(field).touched)
      );
    }
    return false;
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

  disableOriginStart = (current: Date): boolean => {
    if (!(this.originalLeaseStart.value as Date)) return false;
    return differenceInCalendarDays(current, this.originalLeaseStart.value) < 0;
  };

  onCheckboxChange($event): void {
    this.fees.setValue($event);
  }

  triggerInputTouched(event: boolean, field: string) {
    if (!event) {
      this[field].markAsTouched();
    }
  }
}
