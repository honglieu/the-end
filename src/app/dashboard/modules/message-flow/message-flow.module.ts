import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageFlowComponent } from './components/message-flow/message-flow.component';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [MessageFlowComponent],
  imports: [CommonModule, TrudiSendMsgModule, RouterModule],
  exports: [MessageFlowComponent]
})
export class MessageFlowModule {}
