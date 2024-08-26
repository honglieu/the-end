import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { LandlordToOwnerPipe } from '@shared/pipes/landlord-to-owner.pipe';
import { SharedModule } from '@shared/shared.module';
import { TrudiScheduledMsgModule } from '@/app/trudi-scheduled-msg/trudi-scheduled-msg.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { ForwardConversationModule } from '@/app/task-detail/components/forward-conversation/forward-conversation.module';
import { ForwardViaEmailModule } from '@/app/task-detail/components/forward-via-email/forward-via-email.module';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { MessageLoadingService } from '@/app/task-detail/services/message-loading.service';
import { TrudiModule } from '@/app/task-detail/modules/trudi/trudi.module';
import { AppChatComponent } from './app-chat.component';
import { AppChatHeaderComponent } from './components/app-chat-header/app-chat-header.component';
import { SidebarRightModule } from '@/app/task-detail/modules/sidebar-right/sidebar-right.module';
import { HeaderLeftModule } from '@/app/task-detail/modules/header-left/header-left.module';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { MessageViaEmailModule } from '@shared/components/chat/message-via-email/message-via-email.module';
import { TicketModule } from '@shared/components/chat/ticket/ticket.module';
import { MessageDefaultModule } from '@shared/components/chat/message-default/message-default.module';
import { MessageRescheduledRequestModule } from '@shared/components/chat/message-rescheduled-request/message-rescheduled-request.module';
import { MessageVacateRequestModule } from '@shared/components/chat/message-vacate-request/message-vacate-request.module';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { AiSumaryDetailModule } from './components/ai-summary/ai-summary.module';
import { AppUnhappyPathTrudiModule } from '@/app/control-panel/trudi/app-dropdown-trudi/app-unhappy-path-trudi.module';
import { MediaCardModule } from './components/ai-summary/components/media-card/media-card.module';
import { PreventButtonModule } from '@trudi-ui';
import { ReiFormComponent } from './components/rei-form/rei-form.component';
import { TrudiUiModule } from '@trudi-ui';
import { TaskDetailCustomPipesModule } from '@/app/task-detail/pipes/task-detail-custom-pipes.module';
import { WarningReiFormPopupComponent } from './components/rei-form/warning-rei-form-popup/warning-rei-form-popup.component';
import { ParticipantsDetailModule } from './components/participants-detail/participants-detail.module';
import { ViewConversationModule } from './components/view-conversation/view-conversation.module';
import { CallInprogressNotifyModule } from './components/call-inprogress-notify/call-inprogress-notify.module';
import { InvitationMessageModule } from './components/invitation-message/invitation-message.module';
import { ConfirmCallingRequestModule } from './components/confirm-calling-request/confirm-calling-request.module';
import { AppChatService } from './app-chat.service';
import { PropertyProfileModule } from '@shared/components/property-profile/property-profile.module';
import { SummaryMessageDialogModule } from '@/app/task-detail/modules/summary-message-dialog/summary-message-dialog.module';
import { RxPush } from '@rx-angular/template/push';
import { ConversationSummaryModule } from '@/app/dashboard/modules/inbox/components/conversation-summary/conversation-summary.module';
@NgModule({
  declarations: [
    AppChatHeaderComponent,
    AppChatComponent,
    ReiFormComponent,
    WarningReiFormPopupComponent
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
    TrudiUiModule,
    TaskDetailCustomPipesModule,
    PropertyProfileModule,
    SummaryMessageDialogModule,
    RxPush,
    ConversationSummaryModule
  ],
  exports: [AppChatComponent, ReiFormComponent],
  providers: [LandlordToOwnerPipe, MessageLoadingService, AppChatService]
})
export class AppChatModule {}
