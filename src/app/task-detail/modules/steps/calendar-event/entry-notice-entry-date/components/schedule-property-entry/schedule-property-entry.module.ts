import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { SchedulePropertyEntryComponent } from './schedule-property-entry.component';
import { TrudiDatePickerModule } from '@shared/components/date-picker2/date-picker.module';
import { PreventButtonModule, TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [SchedulePropertyEntryComponent],
  imports: [
    CommonModule,
    SharedModule,
    TrudiDatePickerModule,
    PreventButtonModule,
    TrudiUiModule
  ],
  exports: [SchedulePropertyEntryComponent]
})
export class SchedulePropertyEntryModule {}
