import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { ForwardViaEmailComponent } from './forward-via-email.component';
import { RxPush } from '@rx-angular/template/push';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [ForwardViaEmailComponent],
  imports: [CommonModule, SharedModule, RxPush, TrudiUiModule],
  exports: [ForwardViaEmailComponent]
})
export class ForwardViaEmailModule {}
