/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Directive, Host, Optional } from '@angular/core';

import { TrudiUIDatePickerComponent } from './date-picker.component';

@Directive({
  selector: 'nz-month-picker',
  exportAs: 'nzMonthPicker'
})
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export class NzMonthPickerComponent {
  constructor(
    @Optional() @Host() public datePicker: TrudiUIDatePickerComponent
  ) {
    this.datePicker.nzMode = 'month';
  }
}
