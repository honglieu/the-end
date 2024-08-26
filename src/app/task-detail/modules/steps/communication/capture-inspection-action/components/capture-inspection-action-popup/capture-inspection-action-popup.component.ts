import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'capture-inspection-action-popup',
  templateUrl: './capture-inspection-action-popup.component.html',
  styleUrls: ['./capture-inspection-action-popup.component.scss']
})
export class CaptureInspectionActionPopUpComponent implements OnInit {
  @Input() modalId: string;
  @Input() form: FormGroup;
  @Input() visible = false;
  @Input() title = '';
  @Output() nextModal = new EventEmitter();
  @Output() closeModal = new EventEmitter();
  @Output() onBack = new EventEmitter();
  @Input() hasBackButton = '';
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
