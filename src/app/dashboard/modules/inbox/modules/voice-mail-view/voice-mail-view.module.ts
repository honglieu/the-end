import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalModule } from '@angular/cdk/portal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SharedModule } from '@shared/shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { ForwardViaEmailModule } from '@/app/task-detail/components/forward-via-email/forward-via-email.module';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { ForwardConversationModule } from '@/app/task-detail/components/forward-conversation/forward-conversation.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { RxFor } from '@rx-angular/template/for';
import { RxLet } from '@rx-angular/template/let';
import { RxIf } from '@rx-angular/template/if';
import { SharedModule as InboxSharedModule } from '@/app/dashboard/modules/inbox/shared/shared.module';
import { VoiceMailViewRoutingModule } from './voice-mail-view-routing.module';
import { VoiceMailFilterComponent } from './components/voice-mail-filter/voice-mail-filter.component';
import { VoiceMailListComponent } from './views/voice-mail-list/voice-mail-list.component';
import { VoiceMailRowComponent } from './components/voice-mail-row/voice-mail-row.component';
import { MessageDefaultModule } from '@shared/components/chat/message-default/message-default.module';
import { TicketModule } from '@shared/components/chat/ticket/ticket.module';
import { MessageRescheduledRequestModule } from '@shared/components/chat/message-rescheduled-request/message-rescheduled-request.module';
import { MessageVacateRequestModule } from '@shared/components/chat/message-vacate-request/message-vacate-request.module';
import { VoicemailInboxDetailComponent } from './views/voice-mail-inbox-detail/voice-mail-inbox-detail.component';
import { VoicemailInboxDetailMessageComponent } from './components/voice-mail-inbox-detail-message/voice-mail-inbox-detail-message.component';
import { AddVoiceMailToTaskModalComponent } from './components/add-voice-mail-to-task-modal/add-voice-mail-to-task-modal.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { VoiceMailApiService } from './services/voice-mail-api.service';
import { VoiceMailMenuService } from './services/voice-mail-menu.service';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { PropertyProfileModule } from '@shared/components/property-profile/property-profile.module';
import { PreventButtonModule } from '@trudi-ui';
import { TaskDragDropService } from '@/app/dashboard/modules/task-page/services/task-drag-drop.service';
import { VoiceMailParticipantsComponent } from './components/voice-mail-participants/voice-mail-participants.component';
import { NzResizableModule } from 'ng-zorro-antd/resizable';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { AddItemToTaskComponent } from '@/app/dashboard/modules/inbox/components/add-item-to-task/add-item-to-task.component';
import { ItemRequestLinkedTaskComponent } from '@/app/dashboard/modules/inbox/components/item-request-linked-task/item-request-linked-task.component';
import { ConversationSummaryModule } from '@/app/dashboard/modules/inbox/components/conversation-summary/conversation-summary.module';
import { JoinConversationComponent } from '@/app/dashboard/modules/inbox/components/join-conversation/join-conversation.component';

@NgModule({
  declarations: [
    VoiceMailListComponent,
    VoiceMailFilterComponent,
    VoiceMailRowComponent,
    VoicemailInboxDetailComponent,
    VoicemailInboxDetailMessageComponent,
    AddVoiceMailToTaskModalComponent,
    VoiceMailParticipantsComponent
  ],
  imports: [
    InfiniteScrollModule,
    VoiceMailViewRoutingModule,
    CommonModule,
    SharedModule,
    TrudiUiModule,
    NzToolTipModule,
    ScrollingModule,
    NzSkeletonModule,
    SharePopUpModule,
    PortalModule,
    ItemRequestLinkedTaskComponent,
    ForwardViaEmailModule,
    MoveMessToDifferentTaskModule,
    ForwardConversationModule,
    DragDropModule,
    CustomPipesModule,
    NzMenuModule,
    NzDropDownModule,
    InboxSharedModule,
    MessageDefaultModule,
    TicketModule,
    MessageRescheduledRequestModule,
    MessageVacateRequestModule,
    RxFor,
    RxLet,
    RxIf,
    ShareModuleUserModule,
    PropertyProfileModule,
    PreventButtonModule,
    NzResizableModule,
    NzTimelineModule,
    AddItemToTaskComponent,
    ConversationSummaryModule,
    JoinConversationComponent
  ],
  exports: [
    SharedModule,
    VoicemailInboxDetailComponent,
    VoicemailInboxDetailMessageComponent
  ],
  providers: [TaskDragDropService, VoiceMailApiService, VoiceMailMenuService]
})
export class VoiceMailViewModule {}
