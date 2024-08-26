import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SharedModule } from '@/app/shared/shared.module';
import { TrudiModule } from '@/app/task-detail/modules/trudi/trudi.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiScheduledMsgModule } from '@/app/trudi-scheduled-msg/trudi-scheduled-msg.module';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { ForwardViaEmailModule } from '@/app/task-detail/components/forward-via-email/forward-via-email.module';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { ForwardConversationModule } from '@/app/task-detail/components/forward-conversation/forward-conversation.module';
import { SidebarRightModule } from '@/app/task-detail/modules/sidebar-right/sidebar-right.module';
import { HeaderLeftModule } from '@/app/task-detail/modules/header-left/header-left.module';
import { MessageViaEmailModule } from '@/app/shared/components/chat/message-via-email/message-via-email.module';
import { TicketModule } from '@/app/shared/components/chat/ticket/ticket.module';
import { AppUnhappyPathTrudiModule } from '@/app/control-panel/trudi/app-dropdown-trudi/app-unhappy-path-trudi.module';
import { MessageDefaultModule } from '@/app/shared/components/chat/message-default/message-default.module';
import { MessageRescheduledRequestModule } from '@/app/shared/components/chat/message-rescheduled-request/message-rescheduled-request.module';
import { MessageVacateRequestModule } from '@/app/shared/components/chat/message-vacate-request/message-vacate-request.module';
import { PropertyProfileModule } from '@/app/shared/components/property-profile/property-profile.module';
import { SkeletonSharedModule } from '@/app/shared/components/skeleton/skeleton-shared.module';
import { MediaCardModule } from '@/app/task-detail/modules/app-chat/components/ai-summary/components/media-card/media-card.module';
import { ParticipantsDetailModule } from '@/app/task-detail/modules/app-chat/components/participants-detail/participants-detail.module';
import { ViewConversationModule } from '@/app/task-detail/modules/app-chat/components/view-conversation/view-conversation.module';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { LandlordToOwnerPipe } from '@/app/shared/pipes/landlord-to-owner.pipe';
import { MessageLoadingService } from '@/app/task-detail/services/message-loading.service';
import { AppChatService } from '@/app/task-detail/modules/app-chat/app-chat.service';
import { CustomPipesModule } from '@/app/shared/pipes/customPipes.module';
import { SmsComposeMessageModule } from '@/app/dashboard/modules/inbox/modules/sms-view/components/sms-compose-message/sms-compose-message.module';
import { SmsMessageDetailListComponent } from './sms-message-detail-list.component';
import { SmsMessageDetailHeaderComponent } from './components/sms-message-detail-header/sms-message-detail-header.component';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { AppMessageDetailListModule } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-message-detail-list/app-message-detail-list.module';
import { AppChatModule } from '@/app/task-detail/modules/app-chat/app-chat.module';
import { SmsMessageDefaultComponent } from '@/app/dashboard/modules/inbox/modules/sms-view/components/sms-message-detail-list/components/sms-message-default/sms-message-default.component';
import { SmsReassignPropertyModalComponent } from './components/sms-reassign-property-modal/sms-reassign-property-modal.component';
import { SmsMessageFooterComponent } from './components/sms-message-footer/sms-message-footer.component';
import { PreventButtonModule, TrudiUiModule } from '@trudi-ui';
import { SmsFileActionComponent } from './components/sms-file-action/sms-file-action.component';
import { ConversationSummaryModule } from '@/app/dashboard/modules/inbox/components/conversation-summary/conversation-summary.module';
import { JoinConversationComponent } from '@/app/dashboard/modules/inbox/components/join-conversation/join-conversation.component';

@NgModule({
  declarations: [
    SmsMessageDetailListComponent,
    SmsMessageDetailHeaderComponent,
    SmsMessageDefaultComponent,
    SmsReassignPropertyModalComponent,
    SmsMessageFooterComponent,
    SmsFileActionComponent
  ],
  imports: [
    InfiniteScrollModule,
    CommonModule,
    DragDropModule,
    SharedModule,
    TrudiModule,
    TrudiSendMsgModule,
    TrudiScheduledMsgModule,
    MoveMessToDifferentTaskModule,
    ForwardViaEmailModule,
    NzSkeletonModule,
    NzToolTipModule,
    NzDropDownModule,
    ForwardConversationModule,
    SidebarRightModule,
    HeaderLeftModule,
    MessageViaEmailModule,
    TicketModule,
    MessageDefaultModule,
    NzPopoverModule,
    MessageRescheduledRequestModule,
    MessageVacateRequestModule,
    AppUnhappyPathTrudiModule,
    MediaCardModule,
    PreventButtonModule,
    ParticipantsDetailModule,
    ViewConversationModule,
    ShareModuleUserModule,
    TrudiSendMsgModule,
    PropertyProfileModule,
    SkeletonSharedModule,
    SmsComposeMessageModule,
    NzTimelineModule,
    NzCollapseModule,
    NzResizableModule,
    AppMessageDetailListModule,
    AppChatModule,
    TrudiUiModule,
    ConversationSummaryModule,
    JoinConversationComponent
  ],
  exports: [SmsMessageDetailListComponent],
  providers: [
    LandlordToOwnerPipe,
    MessageLoadingService,
    AppChatService,
    CustomPipesModule
  ]
})
export class SmsMessageDetailListModule {}
