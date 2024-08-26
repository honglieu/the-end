import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalModule } from '@angular/cdk/portal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SharedModule } from '@shared/shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { ForwardViaEmailModule } from '@/app/task-detail/components/forward-via-email/forward-via-email.module';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { ForwardConversationModule } from '@/app/task-detail/components/forward-conversation/forward-conversation.module';
import { TaskDetailModule } from '@/app/task-detail/task-detail.module';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { TrudiConfirmService } from '@trudi-ui';
import { SharedModule as InboxSharedModule } from '@/app/dashboard/modules/inbox/shared/shared.module';
import { InboxModule } from '@/app/dashboard/modules/inbox/inbox.module';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { TaskDragDropService } from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';
import { RxFor } from '@rx-angular/template/for';
import { WhatsAppViewRoutingModule } from './whatsapp-routing.module';
import { RxLet } from '@rx-angular/template/let';
import { RxIf } from '@rx-angular/template/if';
import { PreventButtonModule } from '@trudi-ui';
import { PropertyProfileModule } from '@/app/shared/components/property-profile/property-profile.module';
import { WhatsappFilterComponent } from './components/whatsapp-filter/whatsapp-filter.component';
import { WhatsappViewListComponent } from './views/whatsapp-view-list/whatsapp-view-list.component';
import { WhatsappViewRowComponent } from './components/whatsapp-view-row/whatsapp-view-row.component';
import { WhatsappViewDetailComponent } from './views/whatsapp-view-detail/whatsapp-view-detail.component';
import { WhatsappParticipantsComponent } from './components/whatsapp-participants/whatsapp-participants.component';
import { AppChatModule } from '@/app/task-detail/modules/app-chat/app-chat.module';
import { WhatsappActionPanelComponent } from './components/whatsapp-action-panel/whatsapp-action-panel.component';
import { WhatsappViewDetailMessageComponent } from './components/whatsapp-view-detail-message/whatsapp-view-detail-message.component';
import { WhatsappMessageDefaultComponent } from './components/whatsapp-message-default/whatsapp-message-default.component';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { WhatsappMessageFooterComponent } from './components/whatsapp-message-footer/whatsapp-message-footer.component';
import { WhatsAppInlineEditorComponent } from './components/whatsapp-inline-editor/whatsapp-inline-editor.component';
import { TrudiScheduledMsgModule } from '@/app/trudi-scheduled-msg/trudi-scheduled-msg.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiModule } from '@/app/task-detail/modules/trudi/trudi.module';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { MessageReplyPreviewComponent } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/components/message-reply-preview/message-reply-preview.component';
import { WhatsappReplyHeaderComponent } from './components/whatsapp-reply-header/whatsapp-reply-header.component';
import { WhatsappViewDetailHeaderComponent } from './components/whatsapp-view-detail-header/whatsapp-view-detail-header.component';
import { WhatsappViewConnectComponent } from './views/whatsapp-view-connect/whatsapp-view-connect.component';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { ConversationSummaryModule } from '@/app/dashboard/modules/inbox/components/conversation-summary/conversation-summary.module';
import { JoinConversationComponent } from '@/app/dashboard/modules/inbox/components/join-conversation/join-conversation.component';
import { WhatsappMessageAttachmentComponent } from './components/whatsapp-message-attachment/whatsapp-message-attachment.component';

@NgModule({
  declarations: [
    WhatsappViewDetailComponent,
    WhatsappViewListComponent,
    WhatsappViewRowComponent,
    WhatsappFilterComponent,
    WhatsappParticipantsComponent,
    WhatsappViewDetailComponent,
    WhatsappActionPanelComponent,
    WhatsappViewDetailMessageComponent,
    WhatsappViewDetailHeaderComponent,
    WhatsappMessageDefaultComponent,
    WhatsappMessageAttachmentComponent,
    WhatsappMessageFooterComponent,
    WhatsAppInlineEditorComponent,
    WhatsappReplyHeaderComponent,
    WhatsappViewConnectComponent
  ],
  imports: [
    WhatsAppViewRoutingModule,
    CommonModule,
    SharedModule,
    TrudiUiModule,
    NzToolTipModule,
    ScrollingModule,
    NzSkeletonModule,
    SharePopUpModule,
    PortalModule,
    ForwardViaEmailModule,
    MoveMessToDifferentTaskModule,
    CustomPipesModule,
    ForwardConversationModule,
    InfiniteScrollDirective,
    DragDropModule,
    TaskDetailModule,
    NzMenuModule,
    NzDropDownModule,
    InboxSharedModule,
    InboxModule,
    NzTabsModule,
    PropertyProfileModule,
    PreventButtonModule,
    RxFor,
    RxLet,
    RxIf,
    AppChatModule,
    ShareModuleUserModule,
    TrudiSendMsgModule,
    TrudiScheduledMsgModule,
    CommonModule,
    TrudiModule,
    NzResizableModule,
    MessageReplyPreviewComponent,
    ConversationSummaryModule,
    NzRadioModule,
    JoinConversationComponent
  ],
  exports: [TrudiUiModule, SharedModule],
  providers: [TaskDragDropService, TrudiConfirmService]
})
export class WhatsappViewModule {}
