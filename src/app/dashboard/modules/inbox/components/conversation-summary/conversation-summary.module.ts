import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzNoAnimationModule } from 'ng-zorro-antd/core/no-animation';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TrudiModule } from '@/app/task-detail/modules/trudi/trudi.module';
import { AiSumaryDetailModule } from '@/app/task-detail/modules/app-chat/components/ai-summary/ai-summary.module';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LottieModule } from 'ngx-lottie';
import { PreventButtonModule, TrudiUiModule } from '@trudi-ui';
import { CustomPipesModule } from '@/app/shared/pipes/customPipes.module';
import { ButtonAttionModule } from '@/app/task-detail/modules/app-chat/components/button-action/button-attion.module';
import { SharedModule } from '@/app/shared/shared.module';
import { SummaryMessageDialogModule } from '@/app/task-detail/modules/summary-message-dialog/summary-message-dialog.module';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { AddItemToTaskComponent } from '@/app/dashboard/modules/inbox/components/add-item-to-task/add-item-to-task.component';
import { ItemRequestLinkedTaskComponent } from '@/app/dashboard/modules/inbox/components/item-request-linked-task/item-request-linked-task.component';
import { RxFor } from '@rx-angular/template/for';
import { ConverationSummaryService } from './services/converation-summary.service';
import { ConversationSummaryComponent } from './conversation-summary.component';
import { ConversationSummaryAttachmentComponent } from './components/conversation-summary-attachment/conversation-summary-attachment.component';
import { ConversationSummaryFileComponent } from './components/conversation-summary-file/conversation-summary-file.component';
import { ConversationSummaryItemComponent } from './components/conversation-summary-item/conversation-summary-item.component';
import { ConversationSummaryLinkedComponent } from './components/conversation-summary-linked/conversation-summary-linked.component';
import { ConversationSummaryRequestComponent } from './components/conversation-summary-request/conversation-summary-request.component';

@NgModule({
  declarations: [
    ConversationSummaryComponent,
    ConversationSummaryAttachmentComponent,
    ConversationSummaryFileComponent,
    ConversationSummaryItemComponent,
    ConversationSummaryLinkedComponent,
    ConversationSummaryRequestComponent
  ],
  exports: [
    ConversationSummaryComponent,
    ConversationSummaryLinkedComponent,
    ConversationSummaryFileComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    TrudiModule,
    TrudiUiModule,
    NzDropDownModule,
    NzNoAnimationModule,
    TrudiSendMsgModule,
    NzSkeletonModule,
    NzToolTipModule,
    PreventButtonModule,
    ItemRequestLinkedTaskComponent,
    AiSumaryDetailModule,
    AddItemToTaskComponent,
    NzDropDownModule,
    NzResizableModule,
    DragDropModule,
    LottieModule,
    CustomPipesModule,
    ButtonAttionModule,
    SummaryMessageDialogModule,
    NzTimelineModule,
    RxFor
  ],
  providers: [ConverationSummaryService]
})
export class ConversationSummaryModule {}
