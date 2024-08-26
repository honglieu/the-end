/**
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { BidiModule } from '@angular/cdk/bidi';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormPatchModule } from 'ng-zorro-antd/core/form';
import { NzNoAnimationModule } from 'ng-zorro-antd/core/no-animation';
import { NzOutletModule } from 'ng-zorro-antd/core/outlet';
import { NzOverlayModule } from 'ng-zorro-antd/core/overlay';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';

import { CalendarFooterComponent } from './calendar-footer.component';
import { TrudiUIDatePickerComponent } from './date-picker.component';
import { DateRangePopupComponent } from './date-range-popup.component';
import { InnerPopupComponent } from './inner-popup.component';
import { LibPackerModule } from './lib/lib-packer.module';
import { NzMonthPickerComponent } from './month-picker.component';
import { TrudiSingleRangePickerComponent } from '../date-picker/custom/trudi-single-range-picker/trudi-single-range-picker.component';
import { NzWeekPickerComponent } from './week-picker.component';
import { NzYearPickerComponent } from './year-picker.component';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { SingleDateRangePopupComponent } from '../date-picker/custom/trudi-single-range-picker/single-date-range-popup.component';
import { StrictCharacterDirective } from '../date-picker/directives/strict-character.directive';
import { NZ_DATE_CONFIG } from 'ng-zorro-antd/i18n';

@NgModule({
  imports: [
    BidiModule,
    CommonModule,
    FormsModule,
    OverlayModule,
    LibPackerModule,
    NzIconModule,
    NzOverlayModule,
    NzNoAnimationModule,
    NzFormPatchModule,
    NzOutletModule,
    NzTimePickerModule,
    NzButtonModule,
    LibPackerModule,
    NgxMaskDirective,
    NgxMaskPipe
  ],
  exports: [TrudiSingleRangePickerComponent, TrudiUIDatePickerComponent],
  declarations: [
    TrudiUIDatePickerComponent,
    NzMonthPickerComponent,
    NzYearPickerComponent,
    NzWeekPickerComponent,
    TrudiSingleRangePickerComponent,
    CalendarFooterComponent,
    InnerPopupComponent,
    DateRangePopupComponent,
    SingleDateRangePopupComponent,
    StrictCharacterDirective
  ],
  providers: [
    {
      provide: NZ_DATE_CONFIG,
      useValue: {
        firstDayOfWeek: 1
      }
    },
    provideNgxMask()
  ]
})
export class TrudiDatePickerModule {}
