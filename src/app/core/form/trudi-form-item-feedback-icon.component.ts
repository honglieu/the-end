import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';

import { TrudiValidateStatus } from '@core';

const iconTypeMap = {
  error: 'close-circle-fill',
  validating: 'loading',
  success: 'check-circle-fill',
  warning: 'exclamation-circle-fill'
} as const;

@Component({
  selector: 'trudi-form-item-feedback-icon',
  exportAs: 'trudiFormFeedbackIcon',
  preserveWhitespaces: false,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <span *ngIf="iconType" trudi-icon></span> `,
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    class: 'trudi-form-item-feedback-icon',
    '[class.trudi-form-item-feedback-icon-error]': 'status==="error"',
    '[class.trudi-form-item-feedback-icon-warning]': 'status==="warning"',
    '[class.trudi-form-item-feedback-icon-success]': 'status==="success"',
    '[class.trudi-form-item-feedback-icon-validating]': 'status==="validating"'
  }
})
export class TrudiFormItemFeedbackIconComponent implements OnChanges {
  @Input() status: TrudiValidateStatus = '';
  constructor(public cdr: ChangeDetectorRef) {}

  iconType: (typeof iconTypeMap)[keyof typeof iconTypeMap] | null = null;

  ngOnChanges(_changes: SimpleChanges): void {
    this.updateIcon();
  }

  updateIcon(): void {
    this.iconType = this.status ? iconTypeMap[this.status] : null;
    this.cdr.markForCheck();
  }
}
