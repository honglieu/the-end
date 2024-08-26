import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzNoAnimationModule } from 'ng-zorro-antd/core/no-animation';
import { HeaderConversationsComponent } from './header-conversations.component';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { HeaderConversationItemComponent } from './header-conversation-item/header-conversation-item.component';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { PreventButtonModule, TrudiUiModule } from '@trudi-ui';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { RxFor } from '@rx-angular/template/for';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [HeaderConversationsComponent, HeaderConversationItemComponent],
  imports: [
    CommonModule,
    SharedModule,
    NzDropDownModule,
    NzTabsModule,
    NzNoAnimationModule,
    TrudiSendMsgModule,
    NzSkeletonModule,
    NzToolTipModule,
    PreventButtonModule,
    RxFor,
    RxPush,
    TrudiUiModule
  ],
  exports: [HeaderConversationsComponent]
})
export class HeaderConversationsModule {}
