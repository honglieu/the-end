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
import { E2eAttributeDirective, TrudiUiModule } from '@trudi-ui';
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
import { FaceBookViewRoutingModule } from './facebook-routing.module';
import { RxLet } from '@rx-angular/template/let';
import { RxIf } from '@rx-angular/template/if';
import { PropertyProfileModule } from '@/app/shared/components/property-profile/property-profile.module';
import { FacebookFilterComponent } from './components/facebook-filter/facebook-filter.component';
import { FacebookViewListComponent } from './views/facebook-view-list/facebook-view-list.component';
import { FacebookViewRowComponent } from './components/facebook-view-row/facebook-view-row.component';
import { FacebookViewDetailComponent } from './views/facebook-view-detail/facebook-view-detail.component';
import { FacebookParticipantsComponent } from './components/facebook-participants/facebook-participants.component';
import { FacebookViewConnectComponent } from './views/facebook-view-connect/facebook-connect.component';
import { FacebookViewHubComponent } from './views/facebook-view-hub/facebook-hub.component';
import { AppChatModule } from '@/app/task-detail/modules/app-chat/app-chat.module';
import { FacebookActionPanelComponent } from './components/facebook-action-panel/facebook-action-panel.component';
import { FacebookViewDetailMessageComponent } from './components/facebook-view-detail-message/facebook-view-detail-message.component';
import { FacebookMessageDefaultComponent } from './components/facebook-message-default/facebook-message-default.component';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { FacebookMessageFooterComponent } from './components/facebook-message-footer/facebook-message-footer.component';
import { MessengerInlineEditorComponent } from './components/messenger-inline-editor/messenger-inline-editor.component';
import { TrudiScheduledMsgModule } from '@/app/trudi-scheduled-msg/trudi-scheduled-msg.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiModule } from '@/app/task-detail/modules/trudi/trudi.module';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { MessageReplyPreviewComponent } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/components/message-reply-preview/message-reply-preview.component';
import { FacebookReplyHeaderComponent } from './components/facebook-reply-header/facebook-reply-header.component';
import { FacebookViewDetailHeaderComponent } from './components/facebook-view-detail-header/facebook-view-detail-header.component';
import { PreventButtonModule } from '@trudi-ui';
import { ConversationSummaryModule } from '@/app/dashboard/modules/inbox/components/conversation-summary/conversation-summary.module';
import { JoinConversationComponent } from '@/app/dashboard/modules/inbox/components/join-conversation/join-conversation.component';
import { TwemojiPipe } from '@/app/shared/pipes/twemoji.pipe';
import { FacebookMessageAttachmentComponent } from './components/facebook-message-attachment/facebook-message-attachment.component';

@NgModule({
  declarations: [
    FacebookViewHubComponent,
    FacebookViewConnectComponent,
    FacebookViewDetailComponent,
    FacebookViewListComponent,
    FacebookViewRowComponent,
    FacebookFilterComponent,
    FacebookParticipantsComponent,
    FacebookViewDetailComponent,
    FacebookActionPanelComponent,
    FacebookViewDetailMessageComponent,
    FacebookViewDetailHeaderComponent,
    FacebookMessageDefaultComponent,
    FacebookMessageFooterComponent,
    MessengerInlineEditorComponent,
    FacebookReplyHeaderComponent,
    FacebookMessageAttachmentComponent
  ],
  imports: [
    FaceBookViewRoutingModule,
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
    JoinConversationComponent,
    TwemojiPipe,
    E2eAttributeDirective
  ],
  exports: [TrudiUiModule, SharedModule],
  providers: [TaskDragDropService, TrudiConfirmService]
})
export class FacebookViewModule {}
