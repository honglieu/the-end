import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InboxRoutingModule } from './inbox-routing.module';
import { InboxComponent } from './inbox.component';
import { InboxSidebarComponent } from './components/inbox-sidebar/inbox-sidebar.component';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { InboxSidebarItemComponent } from '@/app/dashboard/modules/inbox/components/inbox-sidebar/components/inbox-sidebar-item/inbox-sidebar-item.component';
import { MessageSidebarItemComponent } from './components/inbox-sidebar/components/message-sidebar-item/message-sidebar-item.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TaskModule } from '@/app/task/task.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '@shared/shared.module';
import { PortalModule } from '@angular/cdk/portal';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { AssignTeamComponent } from './components/mailbox/assign-team/assign-team.component';
import { MailboxComponent } from './components/mailbox/mailbox.component';
import { UserSharedModule } from '@/app/user/shared/user-shared.module';
import { EmailSidebarItemComponent } from './components/email-sidebar-item/email-sidebar-item.component';

import { EmptyPageComponent } from './components/inbox-sidebar/empty-page/empty-page.component';
import { InboxTabsComponent } from './components/inbox-tabs/inbox-tabs.component';
import { SelectMailboxTypeComponent } from './components/mailbox/select-mailbox-type/select-mailbox-type.component';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ConfirmExistingCompanyMailboxComponent } from './components/mailbox/confirm-existing-company-mailbox/confirm-existing-company-mailbox.component';
import { SelectEmailProviderComponent } from './components/mailbox/select-email-provider/select-email-provider.component';
import { ForwardInboxComponent } from './components/forward-inbox/forward-inbox.component';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { MessageApiService } from './modules/message-list-view/services/message-api.service';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { IntegrateImapSmtpServerComponent } from './components/mailbox/integrate-imap-smtp-server/integrate-imap-smtp-server.component';
import { SharedMailboxComponent } from './components/mailbox/shared-mailbox/shared-mailbox.component';

import { SelectOptionSendBulkMsgComponent } from './components/select-option-send-bulk-msg/select-option-send-bulk-msg.component';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { MoveMessageWarningComponent } from './components/move-message-warning/move-message-warning.component';
import { MoveMessageToTaskComponent } from './components/move-message-to-task/move-message-to-task.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MoveMessageToEmailFolderComponent } from './components/move-message-to-email-folder/move-message-to-email-folder.component';
import { FolderSidebarItemComponent } from './components/folder-sidebar-item/folder-sidebar-item.component';
import { NzTreeModule } from 'ng-zorro-antd/tree';
import { EmailFolderSidebarComponent } from './components/gmail-folder-sidebar/email-folder-sidebar.component';
import { NzTreeViewModule } from 'ng-zorro-antd/tree-view';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { MessageSidebarComponent } from './components/inbox-sidebar/components/message-sidebar/message-sidebar.component';
import { EncourageUserComponent } from './components/mailbox/encourage-user/encourage-user.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MsgAttachmentLoadModule } from '@shared/components/msg-attachment-load/msg-attachment-load.module';
import { CdkTreeModule } from '@angular/cdk/tree';
import { ConfirmAutoSyncConversationsToPtComponent } from './components/mailbox/confirm-auto-sync-conversations-to-pt/confirm-auto-sync-conversations-to-pt.component';
import { AppMessageApiService } from './modules/app-message-list/services/app-message-api.service';
import { InboxSidebarV2Component } from './components/inbox-sidebar-v2/inbox-sidebar-v2.component';
import { MailboxListComponent } from './components/inbox-sidebar-v2/components/mailbox-list/mailbox-list.component';
import { EmailFoderListComponent } from './components/inbox-sidebar-v2/components/email-foder-list/email-foder-list.component';
import { ArchivedMailboxListComponent } from './components/inbox-sidebar-v2/components/archived-mailbox-list/archived-mailbox-list.component';
import { AddMailboxComponent } from './components/inbox-sidebar-v2/components/add-mailbox/add-mailbox.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { MailboxItemComponent } from './components/inbox-sidebar-v2/components/mailbox-item/mailbox-item.component';
import { SidebarItemV2Component } from './components/inbox-sidebar-v2/components/sidebar-item-v2/sidebar-item-v2.component';
import { ArchivedMailboxItemComponent } from './components/inbox-sidebar-v2/components/archived-mailbox-item/archived-mailbox-item.component';
import { AddToTaskWarningService } from './components/add-to-task-warning/add-to-task-warning.service';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { SelectBulkSendMethodComponent } from './components/select-bulk-send-method/select-bulk-send-method.component';
import { ArchivedChannelListComponent } from './components/inbox-sidebar-v2/components/archived-channel-list/archived-channel-list.component';
import { RxLet } from '@rx-angular/template/let';
import { TrudiUiModule } from '@trudi-ui';

@NgModule({
  declarations: [
    InboxComponent,
    InboxSidebarComponent,
    InboxSidebarItemComponent,
    MessageSidebarItemComponent,
    MailboxComponent,
    AssignTeamComponent,
    EmptyPageComponent,
    InboxTabsComponent,
    EmailSidebarItemComponent,
    ForwardInboxComponent,
    SelectMailboxTypeComponent,
    ConfirmExistingCompanyMailboxComponent,
    SelectEmailProviderComponent,
    IntegrateImapSmtpServerComponent,
    SharedMailboxComponent,
    IntegrateImapSmtpServerComponent,
    SelectOptionSendBulkMsgComponent,
    SelectBulkSendMethodComponent,
    MoveMessageToTaskComponent,
    MoveMessageWarningComponent,
    FolderSidebarItemComponent,
    EmailFolderSidebarComponent,
    MoveMessageToEmailFolderComponent,
    MessageSidebarComponent,
    EncourageUserComponent,
    ConfirmAutoSyncConversationsToPtComponent,
    InboxSidebarV2Component,
    MailboxListComponent,
    EmailFoderListComponent,
    ArchivedMailboxListComponent,
    AddMailboxComponent,
    MailboxItemComponent,
    SidebarItemV2Component,
    InboxSidebarV2Component,
    ArchivedMailboxItemComponent,
    ArchivedChannelListComponent
  ],
  imports: [
    TrudiDatePickerModule,
    CommonModule,
    InboxRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    TrudiUiModule,
    DashboardSharedModule,
    NzDropDownModule,
    NzMenuModule,
    TaskModule,
    NgSelectModule,
    SharedModule,
    PortalModule,
    NzSkeletonModule,
    UserSharedModule,
    NzToolTipModule,
    NzRadioModule,
    NzDividerModule,
    NzAvatarModule,
    TrudiSendMsgModule,
    DragDropModule,
    MoveMessToDifferentTaskModule,
    NzCollapseModule,
    NzTreeModule,
    NzTreeViewModule,
    NzTreeSelectModule,
    ScrollingModule,
    MsgAttachmentLoadModule,
    CdkTreeModule,
    OverlayModule,
    CustomPipesModule,
    RxLet
  ],
  exports: [
    SelectOptionSendBulkMsgComponent,
    SelectBulkSendMethodComponent,
    MoveMessageToEmailFolderComponent
  ],
  providers: [MessageApiService, AppMessageApiService, AddToTaskWarningService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InboxModule {}
