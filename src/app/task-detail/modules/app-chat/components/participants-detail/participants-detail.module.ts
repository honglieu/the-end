import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipantsDetailComponent } from './participants-detail.component';
import { SharedModule } from '@shared/shared.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [ParticipantsDetailComponent],
  imports: [CommonModule, SharedModule, TrudiSendMsgModule, RxPush],
  exports: [ParticipantsDetailComponent]
})
export class ParticipantsDetailModule {}
