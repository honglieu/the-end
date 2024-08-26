import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandlordToOwnerPipe } from '@shared/pipes/landlord-to-owner.pipe';
import { AppChatService } from '@/app/task-detail/modules/app-chat/app-chat.service';
import { TrudiModule } from '@/app/task-detail/modules/trudi/trudi.module';
import { MessageLoadingService } from '@/app/task-detail/services/message-loading.service';
import { TrudiScheduledMsgModule } from '@/app/trudi-scheduled-msg/trudi-scheduled-msg.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { SharedModule } from '@shared/shared.module';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { MessageReceiverContainerComponent } from './components/message-receiver-container/message-receiver-container.component';
import { MessageReceiverComponent } from './components/message-receiver/message-receiver.component';
import { MessageReceiverPreviewComponent } from './components/message-receiver-preview/message-receiver-preview.component';
import { InlineMessageEditorComponent } from './components/inline-message-editor/inline-message-editor.component';
import { AppComposeMessageComponent } from './app-compose-message.component';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { AppComposeMessageRoutingModule } from './app-compose-message-routing.module';
import { MessageReplyPreviewComponent } from './components/message-reply-preview/message-reply-preview.component';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [
    AppComposeMessageComponent,
    MessageReceiverContainerComponent,
    MessageReceiverComponent,
    MessageReceiverPreviewComponent,
    InlineMessageEditorComponent
  ],
  imports: [
    InfiniteScrollModule,
    CommonModule,
    DragDropModule,
    SharedModule,
    TrudiModule,
    TrudiSendMsgModule,
    TrudiScheduledMsgModule,
    NzSkeletonModule,
    NzToolTipModule,
    NzDropDownModule,
    ShareModuleUserModule,
    NzResizableModule,
    MessageReplyPreviewComponent,
    AppComposeMessageRoutingModule,
    TrudiUiModule
  ],
  exports: [AppComposeMessageComponent],
  providers: [LandlordToOwnerPipe, MessageLoadingService, AppChatService]
})
export class AppComposeMessageModule {}
