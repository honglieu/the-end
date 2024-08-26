import { Directive, Host, Optional } from '@angular/core';

import { TrudiDatePickerComponent } from './date-picker.component';

@Directive({
  selector: 'trudi-month-picker',
  exportAs: 'trudiMonthPicker'
})
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export class TrudiMonthPickerComponent {
  constructor(@Optional() @Host() public datePicker: TrudiDatePickerComponent) {
    this.datePicker.trudiMode = 'month';
  }
}
