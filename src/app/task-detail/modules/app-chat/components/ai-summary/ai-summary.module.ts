import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiUiModule } from '@trudi-ui';
import { MediaCardModule } from './components/media-card/media-card.module';
import { PopupSelectFileModule } from './components/popup-select-file/popup-select-file.module';
import { SelectConversationsModule } from './components/select-conversations/select-conversations.module';

import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { WidgetAiSummaryFacadeModule } from './ai-summary-facade.module';
import { AiSummaryComponent } from './containers/ai-summary.component';
import { RxPush } from '@rx-angular/template/push';
import { PreventButtonModule } from '@trudi-ui';
import { CustomDirectivesModule } from '@/app/shared';

@NgModule({
  declarations: [AiSummaryComponent],
  imports: [
    CommonModule,
    TrudiUiModule,
    SelectConversationsModule,
    PopupSelectFileModule,
    MediaCardModule,
    WidgetAiSummaryFacadeModule,
    NzSkeletonModule,
    TrudiSendMsgModule,
    SharePopUpModule,
    NzToolTipModule,
    NzPopoverModule,
    PreventButtonModule,
    RxPush,
    CustomDirectivesModule
  ],
  exports: [AiSummaryComponent],
  providers: []
})
export class AiSumaryDetailModule {}
