import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicPageRoutingModule } from './public-page-routing.module';
import { TrudiUiModule } from '@trudi-ui';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { EmailNotificationSettingsComponent } from './email-notification-settings/email-notification-settings.component';
import { VerifyEmailResponseComponent } from './verify-email-response/verify-email-response.component';
import { UnsubcribedEmailComponent } from './unsubcribed-email/unsubcribed-email.component';
import { ReactiveFormsModule } from '@angular/forms';
import { EmailNotificationSettingService } from './email-notification-settings/email-notification-setting.service';

@NgModule({
  declarations: [
    EmailNotificationSettingsComponent,
    VerifyEmailResponseComponent,
    UnsubcribedEmailComponent
  ],
  imports: [
    CommonModule,
    PublicPageRoutingModule,
    TrudiUiModule,
    NzSkeletonModule,
    ReactiveFormsModule
  ],
  providers: [EmailNotificationSettingService]
})
export class PublicPageModule {}
