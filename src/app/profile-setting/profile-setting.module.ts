import { ProfileSettingService } from './../services/profile-setting.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { RouterModule } from '@angular/router';
import { ProfileSettingRoutingModule } from './profile-setting-routing.module';
import { ProfileSettingComponent } from './profile-setting.component';
import { UserProfileModule } from '@/app/user-profile/user-profile.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { PortfoliosComponent } from './portfolios/portfolios.component';
import { NotificationComponent } from './notification/notification.component';
import { AppointmentAvailabilityComponent } from './appointment-availability/appointment-availability.component';
import { SharePopUpModule } from '@/app/share-pop-up/share-pop-up.module';
import { RemindersComponent } from './reminders/reminders.component';
import { MarketingEmailComponent } from './notification/marketing-email/marketing-email.component';
import { NotificationsLayoutComponent } from './notification/notifications-layout/notifications-layout.component';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { TrudiUiModule } from '@trudi-ui';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NotificationSkeletonComponent } from './notification/notification-skeleton/notification-skeleton.component';
import { CheckFormSaveChange } from './check.form-save-change';
import { EmailNotificationSettingService } from '@/app/public-page/email-notification-settings/email-notification-setting.service';
import { IntegrationsModule } from './integrations/integrations.module';
import { PortfoliosGroupsComponent } from './portfolios/components/portfolios-groups/portfolios-groups.component';
import { PortfoliosRowComponent } from './portfolios/components/portfolios-row/portfolios-row.component';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';

@NgModule({
  declarations: [
    PortfoliosComponent,
    NotificationComponent,
    ProfileSettingComponent,
    AppointmentAvailabilityComponent,
    RemindersComponent,
    MarketingEmailComponent,
    NotificationsLayoutComponent,
    NotificationSkeletonComponent,
    PortfoliosGroupsComponent,
    PortfoliosRowComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    UserProfileModule,
    TrudiUiModule,
    ProfileSettingRoutingModule,
    SharePopUpModule,
    TrudiDatePickerModule,
    DashboardSharedModule,
    TrudiSendMsgModule,
    NzSkeletonModule,
    IntegrationsModule,
    NgxMaskDirective,
    NgxMaskPipe
  ],
  providers: [
    ProfileSettingService,
    CheckFormSaveChange,
    EmailNotificationSettingService,
    provideNgxMask()
  ]
})
export class ProfileSettingModule {}
