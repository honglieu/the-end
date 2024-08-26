import { PortalModule } from '@angular/cdk/portal';
import { NgModule } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { TrudiUiModule } from '@trudi-ui';
import { NotificationComponent } from './notification.component';
import { DashboardRoutingModule } from '@/app/dashboard/dashboard-routing.module';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { ListNotificationComponent } from './components/list-notification/list-notification.component';
import { NotificationItemComponent } from './components/notification-item/notification-item.component';
import { ReminderItemComponent } from './components/reminder-item/reminder-item.component';
import { NotificationActionsComponent } from './components/notification-actions/notification-actions.component';
import { NotificationService } from '@services/notification.service';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NotificationItemAttachmentComponent } from '@/app/dashboard/modules/notification/components/notification-item-attachment/notification-item-attachment.component';
import { PreventButtonModule } from '@trudi-ui';

@NgModule({
  declarations: [
    NotificationComponent,
    ListNotificationComponent,
    NotificationItemComponent,
    ReminderItemComponent,
    NotificationActionsComponent,
    NotificationItemAttachmentComponent
  ],
  imports: [
    TrudiUiModule,
    NzDividerModule,
    PortalModule,
    DashboardRoutingModule,
    CommonModule,
    SharedModule,
    NzToolTipModule,
    PreventButtonModule
  ],
  exports: [NotificationComponent],
  providers: [NotificationService]
})
export class NotificationModule {}
