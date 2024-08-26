import { SelectOptionAddToTaskComponent } from './../select-option-add-to-task/select-option-add-to-task.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMessageDetailListComponent } from './app-message-detail-list.component';
import { AppUnhappyPathTrudiModule } from '@/app/control-panel/trudi/app-dropdown-trudi/app-unhappy-path-trudi.module';
import { MessageDefaultModule } from '@shared/components/chat/message-default/message-default.module';
import { MessageRescheduledRequestModule } from '@shared/components/chat/message-rescheduled-request/message-rescheduled-request.module';
import { MessageVacateRequestModule } from '@shared/components/chat/message-vacate-request/message-vacate-request.module';
import { MessageViaEmailModule } from '@shared/components/chat/message-via-email/message-via-email.module';
import { TicketModule } from '@shared/components/chat/ticket/ticket.module';
import { LandlordToOwnerPipe } from '@shared/pipes/landlord-to-owner.pipe';
import { PreventButtonModule, TrudiUiModule } from '@trudi-ui';
import { ForwardConversationModule } from '@/app/task-detail/components/forward-conversation/forward-conversation.module';
import { ForwardViaEmailModule } from '@/app/task-detail/components/forward-via-email/forward-via-email.module';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { AppChatService } from '@/app/task-detail/modules/app-chat/app-chat.service';
import { AiSumaryDetailModule } from '@/app/task-detail/modules/app-chat/components/ai-summary/ai-summary.module';
import { MediaCardModule } from '@/app/task-detail/modules/app-chat/components/ai-summary/components/media-card/media-card.module';
import { AppMessageDetailHeaderComponent } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-message-detail-header/app-message-detail-header.component';
import { HeaderLeftModule } from '@/app/task-detail/modules/header-left/header-left.module';
import { SidebarRightModule } from '@/app/task-detail/modules/sidebar-right/sidebar-right.module';
import { TrudiModule } from '@/app/task-detail/modules/trudi/trudi.module';
import { MessageLoadingService } from '@/app/task-detail/services/message-loading.service';
import { TrudiScheduledMsgModule } from '@/app/trudi-scheduled-msg/trudi-scheduled-msg.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ParticipantsDetailModule } from '@/app/task-detail/modules/app-chat/components/participants-detail/participants-detail.module';
import { CallInprogressNotifyModule } from '@/app/task-detail/modules/app-chat/components/call-inprogress-notify/call-inprogress-notify.module';
import { ConfirmCallingRequestModule } from '@/app/task-detail/modules/app-chat/components/confirm-calling-request/confirm-calling-request.module';
import { InvitationMessageModule } from '@/app/task-detail/modules/app-chat/components/invitation-message/invitation-message.module';
import { ViewConversationModule } from '@/app/task-detail/modules/app-chat/components/view-conversation/view-conversation.module';
import { SharedModule } from '@shared/shared.module';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { AppChatModule } from '@/app/task-detail/modules/app-chat/app-chat.module';
import { AppComposeMessageModule } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/app-compose-message.module';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { PropertyProfileModule } from '@shared/components/property-profile/property-profile.module';
import { MessageHeaderSkeletonComponent } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/message-header-skeleton/message-header-skeleton.component';
import { MessageTicketSkeletonComponent } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/message-ticket-skeleton/message-ticket-skeleton.component';
import { SkeletonSharedModule } from '@shared/components/skeleton/skeleton-shared.module';
import { ConversationSummaryModule } from '@/app/dashboard/modules/inbox/components/conversation-summary/conversation-summary.module';
import { JoinConversationComponent } from '@/app/dashboard/modules/inbox/components/join-conversation/join-conversation.component';

@NgModule({
  declarations: [
    AppMessageDetailListComponent,
    AppMessageDetailHeaderComponent,
    SelectOptionAddToTaskComponent,
    MessageHeaderSkeletonComponent,
    MessageTicketSkeletonComponent
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
    AiSumaryDetailModule,
    MessageDefaultModule,
    NzPopoverModule,
    MessageRescheduledRequestModule,
    MessageVacateRequestModule,
    AppUnhappyPathTrudiModule,
    MediaCardModule,
    PreventButtonModule,
    ParticipantsDetailModule,
    ViewConversationModule,
    CallInprogressNotifyModule,
    InvitationMessageModule,
    ConfirmCallingRequestModule,
    ShareModuleUserModule,
    TrudiSendMsgModule,
    AppComposeMessageModule,
    AppChatModule,
    PropertyProfileModule,
    SkeletonSharedModule,
    TrudiUiModule,
    ConversationSummaryModule,
    JoinConversationComponent
  ],
  exports: [
    AppMessageDetailListComponent,
    SelectOptionAddToTaskComponent,
    MessageHeaderSkeletonComponent
  ],
  providers: [
    LandlordToOwnerPipe,
    MessageLoadingService,
    AppChatService,
    CustomPipesModule
  ]
})
export class AppMessageDetailListModule {}
