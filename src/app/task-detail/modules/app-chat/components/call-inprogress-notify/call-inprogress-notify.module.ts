import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallInprogressNotifyComponent } from './call-inprogress-notify.component';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [CallInprogressNotifyComponent],
  imports: [CommonModule, TrudiUiModule],
  exports: [CallInprogressNotifyComponent]
})
export class CallInprogressNotifyModule {}
