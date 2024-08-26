import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { SharedModule } from '@shared/shared.module';
import { ButtonAttionModule } from '@/app/task-detail/modules/app-chat/components/button-action/button-attion.module';
import { MessageRescheduledRequestComponent } from './message-rescheduled-request';

@NgModule({
  declarations: [MessageRescheduledRequestComponent],
  exports: [MessageRescheduledRequestComponent],
  imports: [
    CommonModule,
    SharedModule,
    ButtonAttionModule,
    NzDropDownModule,
    DragDropModule,
    TrudiSendMsgModule
  ]
})
export class MessageRescheduledRequestModule {}
