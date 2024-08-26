import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageViaEmailComponent } from './message-via-email.component';
import { MessageViaEmailMetadataComponent } from './message-via-email-metadata/message-via-email-metadata.component';
import { IframeMessageComponent } from './iframe-message/iframe-message.component';
import { SharedModule } from '@shared/shared.module';
import { ButtonAttionModule } from '@/app/task-detail/modules/app-chat/components/button-action/button-attion.module';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { MsgAttachmentLoadModule } from '@shared/components/msg-attachment-load/msg-attachment-load.module';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [
    MessageViaEmailComponent,
    MessageViaEmailMetadataComponent,
    IframeMessageComponent
  ],
  exports: [
    MessageViaEmailComponent,
    IframeMessageComponent,
    MessageViaEmailMetadataComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ButtonAttionModule,
    NzDropDownModule,
    DragDropModule,
    TrudiSendMsgModule,
    MsgAttachmentLoadModule,
    TrudiUiModule
  ]
})
export class MessageViaEmailModule {}
