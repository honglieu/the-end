import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray } from '@angular/forms';
import { LeasingFormService } from '@/app/leasing/services/leasing-form.service';
import { FormHelper } from '@trudi-ui';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'leasing-landlord-applications-shortlist-popup',
  templateUrl: './leasing-landlord-applications-shortlist-popup.component.html',
  styleUrls: ['./leasing-landlord-applications-shortlist-popup.component.scss']
})
export class LeasingLandlordApplicationsShortlistPopupComponent
  implements OnInit
{
  public leasingLandlordApplicationShortlistForm: FormArray;
  label = {
    name: 'Name',
    summary: 'Summary'
  };
  unSubscribe = new Subject<boolean>();
  @Input() modalId: string;
  @Input() isShowLandlordApplicationShortList = false;
  @Output() closePopup = new EventEmitter();
  @Input() isRequiredApplicationField1: boolean = true;
  @Input() titleModal: string = 'Shortlisted Applications';
  @Input() hasBackButton: boolean;
  @Output() onBack = new EventEmitter();
  public isClickOnSubmitButton: boolean = false;
  constructor(private leasingForm: LeasingFormService) {}

  get controls() {
    return this.leasingLandlordApplicationShortlistForm.controls;
  }

  ngOnInit(): void {
    this.leasingLandlordApplicationShortlistForm =
      this.leasingForm.buildLandlordApplicationShortlist(
        this.isRequiredApplicationField1
      );
    this.leasingForm.resetFormEventsSubject
      .pipe(takeUntil(this.unSubscribe))
      .subscribe(() => {
        this.resetForm();
      });
    this.leasingLandlordApplicationShortlistForm.valueChanges
      .pipe(takeUntil(this.unSubscribe))
      .subscribe((value) => {
        if (value) {
          this.isClickOnSubmitButton = false;
        }
      });
  }

  resetForm() {
    if (this.leasingLandlordApplicationShortlistForm) {
      FormHelper.resetFormArray(this.leasingLandlordApplicationShortlistForm);
    }
  }

  handleConfirm() {
    this.isClickOnSubmitButton = true;
    this.leasingLandlordApplicationShortlistForm.markAllAsTouched();
    const { value, invalid } =
      this.leasingLandlordApplicationShortlistForm || {};
    if (invalid) return;
    this.closePopup.emit(value);
  }

  handleClose() {
    this.closePopup.emit(null);
    this.resetForm();
  }

  handleBack() {
    this.onBack.emit();
    this.resetForm();
  }

  ngOnDestroy(): void {
    this.unSubscribe.next(true);
    this.unSubscribe.complete();
  }
}
