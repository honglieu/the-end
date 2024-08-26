import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { DashboardSharedModule } from '@/app/dashboard/shared/dashboard-shared.module';
import { EmailNotificationSettingService } from '@/app/public-page/email-notification-settings/email-notification-setting.service';
import { ProfileSettingService } from '@services/profile-setting.service';
import { TrudiDatePickerModule } from '@shared/components/date-picker2';
import { SharedModule } from '@shared/shared.module';
import { TrudiSendMsgModule } from '@/app/trudi-send-msg/trudi-send-msg.module';
import { TrudiUiModule } from '@trudi-ui';
import { UserProfileModule } from '@/app/user-profile/user-profile.module';
import { CheckFormSaveChange } from '@/app/profile-setting/check.form-save-change';
import { ProfileSettingRoutingModule } from '@/app/profile-setting/profile-setting-routing.module';
import { IntegrationsFormComponent } from './components/integrations-form/integrations-form.component';
import { IntegrationsComponent } from './integrations.component';
import { IntegrationsPopUpComponent } from './components/integrations-pop-up/integrations-pop-up.component';
import { IntegrationComponent } from './components/integration/integration.component';
import { IntegrationsService } from '@/app/profile-setting/services/integrations.service';
import { ConnectCalendarComponent } from './components/connect-calendar/connect-calendar.component';

@NgModule({
  declarations: [
    IntegrationsComponent,
    IntegrationsFormComponent,
    IntegrationsPopUpComponent,
    IntegrationComponent,
    ConnectCalendarComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    UserProfileModule,
    TrudiUiModule,
    ProfileSettingRoutingModule,
    TrudiDatePickerModule,
    DashboardSharedModule,
    TrudiSendMsgModule,
    NzSkeletonModule,
    SharedModule,
    NgxMaskDirective,
    NgxMaskPipe
  ],
  providers: [
    ProfileSettingService,
    IntegrationsService,
    CheckFormSaveChange,
    EmailNotificationSettingService,
    provideNgxMask()
  ]
})
export class IntegrationsModule {}
