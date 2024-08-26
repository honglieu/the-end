import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrudiUiModule } from '@trudi-ui';
import { ReactiveFormsModule } from '@angular/forms';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { VacateDetailFormComponent } from './vacate-detail-form.component';
import { SharedModule } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/shared/shared.module';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [VacateDetailFormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TrudiUiModule,
    TrudiDatePickerModule,
    SharedModule,
    RxPush
  ],
  exports: [VacateDetailFormComponent]
})
export class VacateDetailFormModule {}
