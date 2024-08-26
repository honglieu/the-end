import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VerifyEmailResponseComponent } from './verify-email-response/verify-email-response.component';
import { UnsubcribedEmailComponent } from './unsubcribed-email/unsubcribed-email.component';
import { EmailNotificationSettingsComponent } from './email-notification-settings/email-notification-settings.component';

const routes: Routes = [
  {
    path: '',
    component: EmailNotificationSettingsComponent
  },
  {
    path: 'verify-email',
    component: VerifyEmailResponseComponent
  },
  {
    path: 'unsubcribed-email',
    component: UnsubcribedEmailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicPageRoutingModule {}
