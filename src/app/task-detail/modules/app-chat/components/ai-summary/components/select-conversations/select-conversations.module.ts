import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { SelectModule } from '@trudi-ui';
import { TrudiUiModule } from '@trudi-ui';
import { ConversationBadgeLabel } from './conversation-badge-label.pipe';
import { ConversationClassPipe } from './conversation-class.pipe';
import { SelectConversationsComponent } from './select-conversations.component';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [
    SelectConversationsComponent,
    ConversationClassPipe,
    ConversationBadgeLabel
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    CustomPipesModule,
    NzToolTipModule,
    TrudiUiModule,
    RxPush
  ],
  exports: [SelectConversationsComponent],
  providers: [ConversationClassPipe]
})
export class SelectConversationsModule {}
