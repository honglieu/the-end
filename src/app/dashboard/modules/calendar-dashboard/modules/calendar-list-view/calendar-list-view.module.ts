import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarListViewComponent } from './calendar-list-view.component';
import { SharedModule } from '@shared/shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { DateRowComponent } from './components/date-row/date-row.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CalendarDashboardShareModule } from '@/app/dashboard/modules/calendar-dashboard/calendar-dashboard-share/calendar-dashboard-share.module';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { LinkedTasksComponent } from './components/linked-tasks/linked-tasks.component';
import { HistoricalEventComponent } from './components/historical-event/historical-event.component';
import { CalendarToolbarComponent } from './components/calendar-toolbar/calendar-toolbar.component';
import { BulkCreateTasksComponent } from '@/app/dashboard/modules/calendar-dashboard/modules/bulk-create-tasks/bulk-create-tasks.component';
import { CheckingDuplicatesBulkCreateTaskComponent } from '@/app/dashboard/modules/calendar-dashboard/modules/bulk-create-tasks/components/checking-duplicates-bulk-create-task/checking-duplicates-bulk-create-task.component';
import { ProcessingBulkCreateTaskComponent } from '@/app/dashboard/modules/calendar-dashboard/modules/bulk-create-tasks/components/processing-bulk-create-task/processing-bulk-create-task.component';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { CreateMultiTasksPopupComponent } from '@/app/dashboard/modules/calendar-dashboard/modules/bulk-create-tasks/components/create-multi-tasks-popup/create-multi-tasks-popup.component';
import { ConfirmEventTypeComponent } from '@/app/dashboard/modules/calendar-dashboard/modules/bulk-create-tasks/components/confirm-event-type/confirm-event-type.component';
import { InboxModule } from '@/app/dashboard/modules/inbox/inbox.module';
import { SendMessageComponent } from '@/app/dashboard/modules/calendar-dashboard/modules/bulk-create-tasks/components/send-message/send-message.component';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { PropertyProfileModule } from '@shared/components/property-profile/property-profile.module';
import { ShareModuleUserModule } from '@/app/user/shared/share-module-user.module';

@NgModule({
  declarations: [
    CalendarListViewComponent,
    DateRowComponent,
    LinkedTasksComponent,
    HistoricalEventComponent,
    CalendarToolbarComponent,
    ConfirmEventTypeComponent,
    BulkCreateTasksComponent,
    CheckingDuplicatesBulkCreateTaskComponent,
    ProcessingBulkCreateTaskComponent,
    CreateMultiTasksPopupComponent,
    SendMessageComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    TrudiUiModule,
    ScrollingModule,
    CalendarDashboardShareModule,
    NzSkeletonModule,
    NzProgressModule,
    InboxModule,
    TrudiSendMsgModule,
    PropertyProfileModule,
    ShareModuleUserModule
  ],
  exports: [CalendarListViewComponent]
})
export class CalendarListViewModule {}
