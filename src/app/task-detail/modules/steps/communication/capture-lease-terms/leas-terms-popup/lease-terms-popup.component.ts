import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TrudiStep } from '@/app/task-detail/modules/steps/utils/stepType';
import {
  bondAtData,
  frequencyData,
  leasePeriodTypeData,
  rentedAtData
} from '@/app/task-detail/modules/steps/constants/constants';
import { CURRENCYNUMBER } from '@services/constants';

@Component({
  selector: 'lease-terms-popup',
  templateUrl: './lease-terms-popup.component.html',
  styleUrls: ['./lease-terms-popup.component.scss']
})
export class LeaseTermsPopupComponent {
  @Input() modalId: string;
  @Input() model: TrudiStep;
  @Input() leaseTermsForm: FormGroup;
  @Input() visible: boolean;
  @Input() title: string;
  @Output() handleClose = new EventEmitter();
  @Output() nextModal = new EventEmitter();
  @Output() closeModal = new EventEmitter();
  @Input() hasBackButton: boolean;
  @Output() onBack = new EventEmitter();

  public rentedAtData = rentedAtData;
  public leasePeriodTypeData = leasePeriodTypeData;
  public frequencyData = frequencyData;
  public bondAtData = bondAtData;
  public maskPattern = CURRENCYNUMBER;

  constructor() {}

  handleNextModal() {
    this.leaseTermsForm.markAllAsTouched();
    if (this.leaseTermsForm.invalid) {
      return;
    }
    this.nextModal.emit();
  }
  get leasePeriodControl() {
    return this.leaseTermsForm.get('leasePeriod');
  }
  get leasePeriodTypeControl() {
    return this.leaseTermsForm.get('leasePeriodType');
  }
  handleBack() {
    this.onBack.emit();
  }
}
