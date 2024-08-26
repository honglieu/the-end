import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { SharedModule } from '@shared/shared.module';
import { ButtonAttionModule } from '@/app/task-detail/modules/app-chat/components/button-action/button-attion.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { MessageVacateRequestComponent } from './message-vacate-request.component';

@NgModule({
  declarations: [MessageVacateRequestComponent],
  exports: [MessageVacateRequestComponent],
  imports: [
    CommonModule,
    SharedModule,
    ButtonAttionModule,
    NzDropDownModule,
    DragDropModule,
    TrudiSendMsgModule
  ]
})
export class MessageVacateRequestModule {}