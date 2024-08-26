import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskDetailRoutingModule } from './task-detail-routing.module';
import { SidebarRightModule } from './modules/sidebar-right/sidebar-right.module';
import { TaskDetailComponent } from './task-detail.component';
import { AppChatModule } from './modules/app-chat/app-chat.module';
import { SidebarLeftModule } from './modules/sidebar-left/sidebar-left.module';
import { TaskDetailService } from './services/task-detail.service';
import { SharedModule } from '@shared/shared.module';
import { HeaderConversationsModule } from './modules/header-conversations/header-conversations.module';
import { HeaderLeftModule } from '@/app/task-detail/modules/header-left/header-left.module';
import { SharedModule as SharedSideBarLeftModule } from '@/app/task-detail/modules/sidebar-left/shared/shared.module';
import { PropertyTreeBaseModule } from './modules/steps/property-tree/property-tree.module';
import { TaskEditorApiService } from '@/app/dashboard/modules/task-editor/services/task-editor-api.service';
import { InternalNoteModule } from './modules/internal-note/internal-note.module';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { InboxModule } from '@/app/dashboard/modules/inbox/inbox.module';
import { MoveMessToDifferentTaskModule } from './components/move-mess-to-different-task/move-mess-to-different-task.module';
import { RemiderViewListModule } from './modules/remider-view-list/remider-view-list.module';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';
import { VoiceMailViewModule } from '@/app/dashboard/modules/inbox/modules/voice-mail-view/voice-mail-view.module';
import { AppMessageDetailListModule } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-message-detail-list/app-message-detail-list.module';
import { AppComposeMessageModule } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-compose-message/app-compose-message.module';
import { SkeletonSharedModule } from '@shared/components/skeleton/skeleton-shared.module';
import { RxPush } from '@rx-angular/template/push';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [TaskDetailComponent],
  imports: [
    CommonModule,
    SharedModule,
    SidebarRightModule,
    SidebarLeftModule,
    AppChatModule,
    TaskDetailRoutingModule,
    HeaderConversationsModule,
    HeaderLeftModule,
    SharedSideBarLeftModule,
    PropertyTreeBaseModule,
    InternalNoteModule,
    InboxModule,
    MoveMessToDifferentTaskModule,
    RemiderViewListModule,
    ShareModuleUserModule,
    VoiceMailViewModule,
    AppMessageDetailListModule,
    AppComposeMessageModule,
    SkeletonSharedModule,
    RxPush,
    TrudiUiModule
  ],
  exports: [TaskDetailComponent],
  providers: [TaskDetailService, TaskEditorApiService, EmailApiService]
})
export class TaskDetailModule {}
