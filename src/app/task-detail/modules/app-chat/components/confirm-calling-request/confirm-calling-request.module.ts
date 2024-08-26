import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmCallingRequestComponent } from './confirm-calling-request.component';
import { SharedModule } from '@shared/shared.module';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [ConfirmCallingRequestComponent],
  imports: [CommonModule, SharedModule, TrudiUiModule],
  exports: [ConfirmCallingRequestComponent]
})
export class ConfirmCallingRequestModule {}
