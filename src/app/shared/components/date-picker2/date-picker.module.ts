import { BidiModule } from '@angular/cdk/bidi';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TrudiFormPatchModule } from '@core';
import { TrudiNoAnimationModule } from '@core';
import { TrudiOutletModule } from '@core';
import { TrudiOverlayModule } from '@core';

import { CalendarFooterComponent } from './calendar-footer.component';
import { TrudiDatePickerComponent } from './date-picker.component';
import { DateRangePopupComponent } from './date-range-popup.component';
import { InnerPopupComponent } from './inner-popup.component';
import { LibPackerModule } from './lib/lib-packer.module';
import { TrudiMonthPickerComponent } from './month-picker.component';

@NgModule({
  imports: [
    BidiModule,
    CommonModule,
    FormsModule,
    OverlayModule,
    LibPackerModule,
    TrudiOverlayModule,
    TrudiNoAnimationModule,
    TrudiFormPatchModule,
    TrudiOutletModule,
    LibPackerModule
  ],
  exports: [TrudiDatePickerComponent, TrudiMonthPickerComponent],
  declarations: [
    TrudiDatePickerComponent,
    TrudiMonthPickerComponent,
    CalendarFooterComponent,
    InnerPopupComponent,
    DateRangePopupComponent
  ]
})
export class TrudiDatePickerModule {}
