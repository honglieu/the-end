import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { SharedModule } from '@shared/shared.module';
import { ButtonAttionModule } from '@/app/task-detail/modules/app-chat/components/button-action/button-attion.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { MessageDefaultComponent } from './message-default.component';
import { MessageReplyComponent } from '@shared/components/chat/message-reply';

@NgModule({
  declarations: [MessageDefaultComponent],
  exports: [MessageDefaultComponent],
  imports: [
    CommonModule,
    SharedModule,
    ButtonAttionModule,
    NzDropDownModule,
    DragDropModule,
    TrudiSendMsgModule,
    MessageReplyComponent
  ]
})
export class MessageDefaultModule {}
