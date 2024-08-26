import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMessageDetailComponent } from './app-message-detail.component';
import { SharedModule } from '@shared/shared.module';
import { AppChatModule } from '@/app/task-detail/modules/app-chat/app-chat.module';
import { HeaderConversationsModule } from '@/app/task-detail/modules/header-conversations/header-conversations.module';
import { TaskDetailService } from '@/app/task-detail/services/task-detail.service';
import { TaskEditorApiService } from '@/app/dashboard/modules/task-editor/services/task-editor-api.service';
import { EmailApiService } from '@/app/dashboard/modules/inbox/modules/email-list-view/services/email-api.service';
import { AppMessageDetailListModule } from '@/app/dashboard/modules/inbox/modules/app-message-list/components/app-message-detail-list/app-message-detail-list.module';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [AppMessageDetailComponent],
  imports: [
    CommonModule,
    SharedModule,
    AppChatModule,
    AppMessageDetailListModule,
    HeaderConversationsModule,
    TrudiUiModule
  ],
  exports: [AppMessageDetailComponent],
  providers: [TaskDetailService, TaskEditorApiService, EmailApiService]
})
export class AppMessageDetailModule {}
