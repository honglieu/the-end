import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { NzNoAnimationModule } from 'ng-zorro-antd/core/no-animation';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { RemiderViewListComponent } from './remider-view-list.component';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { SharedModule as SharedInboxModule } from '@/app/dashboard/modules/inbox/shared/shared.module';
import { MessageReminderComponent } from './components/message-reminder/message-reminder.component';
import { PopoverMessageReminderComponent } from './components/popover-message-reminder/popover-message-reminder.component';
import { PortalModule } from '@angular/cdk/portal';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { TaskModule } from '@/app/task/task.module';
import { TrudiUiModule } from '@trudi-ui';
import { UserSharedModule } from '@/app/user/shared/user-shared.module';
import { MoveMessToDifferentTaskModule } from '@/app/task-detail/components/move-mess-to-different-task/move-mess-to-different-task.module';
import { MessageViaEmailModule } from '@shared/components/chat/message-via-email/message-via-email.module';

import { ScrollingModule as ExperimentalScrollingModule } from '@angular/cdk-experimental/scrolling';

import { OverlayModule } from '@angular/cdk/overlay';

import { VirtualReminderListViewportComponent } from './components/virtual-reminder-list-viewport/virtual-reminder-list-viewport.component';
import { MessageReminderControlComponent } from './components/message-reminder-control/message-reminder-control.component';
import { MessageListReminderSkeletonComponent } from './components/message-list-reminder-skeleton/message-list-reminder-skeleton.component';
import { RxPush } from '@rx-angular/template/push';

@NgModule({
  declarations: [
    RemiderViewListComponent,
    MessageReminderComponent,
    PopoverMessageReminderComponent,
    VirtualReminderListViewportComponent,
    MessageReminderControlComponent,
    MessageListReminderSkeletonComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    OverlayModule,
    NzNoAnimationModule,
    NzSkeletonModule,
    SharedInboxModule,
    FormsModule,
    ReactiveFormsModule,
    TrudiUiModule,
    DashboardSharedModule,
    TaskModule,
    PortalModule,
    UserSharedModule,
    NzToolTipModule,
    TrudiSendMsgModule,
    MoveMessToDifferentTaskModule,
    ExperimentalScrollingModule,
    MessageViaEmailModule,
    RxPush
  ],
  exports: [RemiderViewListComponent]
})
export class RemiderViewListModule {}
