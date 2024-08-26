import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MailboxSettingComponent } from './mailbox-setting.component';
import { TeamPermissionsComponent } from './components/team-permissions/team-permissions.component';
import { EmailSignatureComponent } from './components/email-signature/email-signature.component';
import { MailboxBehavioursComponent } from './components/mailbox-behaviours/mailbox-behaviours.component';
import { AccountComponent } from './components/account/account.component';
import { OutOfOfficeComponent } from './components/out-of-office/out-of-office.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'team-permission',
    pathMatch: 'full'
  },
  {
    path: '',
    component: MailboxSettingComponent,
    children: [
      {
        path: 'team-permission',
        component: TeamPermissionsComponent
      },
      { path: 'greeting-sign-off', component: EmailSignatureComponent },
      { path: 'mailbox-preferences', component: MailboxBehavioursComponent },
      { path: 'account', component: AccountComponent },
      {
        path: 'out-of-office',
        component: OutOfOfficeComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MailBoxSettingViewRoutingModule {}
