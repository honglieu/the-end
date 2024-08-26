import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { TrudiDatePickerModule } from '@shared/components/date-picker2/date-picker.module';
import { BreachContractFormComponent } from './breach-contract-form.component';
import { PreventButtonModule, TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [BreachContractFormComponent],
  imports: [
    CommonModule,
    SharedModule,
    TrudiUiModule,
    TrudiDatePickerModule,
    PreventButtonModule
  ],
  exports: [BreachContractFormComponent]
})
export class BreachContractFormModule {}
