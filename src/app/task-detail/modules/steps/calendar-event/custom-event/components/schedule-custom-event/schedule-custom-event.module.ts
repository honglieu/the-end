import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { TrudiDatePickerModule } from '@shared/components/date-picker2/date-picker.module';
import { ScheduleCustomEventComponent } from './schedule-custom-event.component';
import { RxPush } from '@rx-angular/template/push';
import { PreventButtonModule, TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [ScheduleCustomEventComponent],
  imports: [
    CommonModule,
    SharedModule,
    TrudiDatePickerModule,
    PreventButtonModule,
    RxPush,
    TrudiUiModule
  ],
  exports: [ScheduleCustomEventComponent]
})
export class ScheduleCustomEventComponentModule {}
