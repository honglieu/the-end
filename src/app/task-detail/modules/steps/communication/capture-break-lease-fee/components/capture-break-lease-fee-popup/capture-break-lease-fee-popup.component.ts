import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  CURRENCYNUMBER,
  DEFAULT_CHAR_TRUDI_NUMBER_FIELD
} from '@services/constants';

@Component({
  selector: 'capture-break-lease-fee-popup',
  templateUrl: './capture-break-lease-fee-popup.component.html',
  styleUrls: ['./capture-break-lease-fee-popup.component.scss']
})
export class CaptureBreakLeaseFeePopUpComponent implements OnInit {
  @Input() modalId: string;
  @Input() form: FormGroup;
  @Input() visible = false;
  @Input() title = '';
  @Output() nextModal = new EventEmitter();
  @Output() closeModal = new EventEmitter();
  @Output() onBack = new EventEmitter();
  @Input() hasBackButton: boolean;
  public maskPattern = CURRENCYNUMBER;
  readonly DEFAULT_CHAR_TRUDI_NUMBER_FIELD = DEFAULT_CHAR_TRUDI_NUMBER_FIELD;

  ngOnInit(): void {}

  handleNext() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.nextModal.emit();
  }
  handleClose() {
    this.closeModal.emit();
  }

  handleBack() {
    this.onBack.emit();
  }
}
