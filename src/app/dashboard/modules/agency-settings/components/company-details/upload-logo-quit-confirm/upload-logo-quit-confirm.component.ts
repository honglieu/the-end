import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';

enum UploadAgencyStep {
  VIEW = 1,
  UPLOAD = 2,
  REMOVE = 3
}

@Component({
  selector: 'app-upload-logo-quit-confirm',
  templateUrl: './upload-logo-quit-confirm.component.html',
  styleUrls: ['./upload-logo-quit-confirm.component.scss']
})
export class UploadLogoQuitConfirmComponent implements OnInit {
  @Input() currentStep: number;
  @Output() showQuitConfirmChange = new EventEmitter<boolean>();
  @Output() currentStepChange = new EventEmitter<number>();
  @Output() showUploadModalChange = new EventEmitter<boolean>();
  @Output() showCroppieChange = new EventEmitter<boolean>();

  constructor() {}

  ngOnInit() {}

  onGoBack() {
    this.showQuitConfirmChange.emit(false);
    if (this.currentStep === UploadAgencyStep.UPLOAD) {
      this.showCroppieChange.emit(true);
    } else if (this.currentStep === UploadAgencyStep.REMOVE) {
      this.showUploadModalChange.emit(true);
    } else {
      return;
    }
  }

  onConfirm() {
    this.showQuitConfirmChange.emit(false);
    this.currentStepChange.emit(UploadAgencyStep.VIEW);
    this.showUploadModalChange.emit(false);
    this.showCroppieChange.emit(true);
  }
}
