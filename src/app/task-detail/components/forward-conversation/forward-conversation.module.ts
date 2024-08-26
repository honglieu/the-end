import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForwardConversationComponent } from './forward-conversation.component';
import { SharedModule } from '@shared/shared.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [ForwardConversationComponent],
  imports: [
    CommonModule,
    SharedModule,
    TrudiSendMsgModule,
    SharePopUpModule,
    RxPush
  ],
  exports: [ForwardConversationComponent]
})
export class ForwardConversationModule {}
