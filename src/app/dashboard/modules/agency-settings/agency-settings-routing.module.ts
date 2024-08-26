import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AgencySettingsComponent } from './agency-settings.component';
import { CompanyDetailsComponent } from './components/company-details/company-details.component';
import { TeamComponent } from './components/team/team.component';
import { BillingComponent } from './components/billing/billing.component';
import { AgencyIntegrationsComponent } from './components/agency-integrations/agency-integrations.component';
import { VoicemailComponent } from './components/voicemail/voicemail.component';
import { CanActivateVoicemail } from '@/app/dashboard/common/guards/voicemail.guard';
import { AutomatedRepliesPolicyComponent } from './components/automated-replies-policy/automated-replies-policy.component';
import { EmergencyContactsGuard } from './components/mobile-app/emergency-contacts.guard';
import { EmergencyContactsComponent } from './components/mobile-app/emergency-contacts/emergency-contacts.component';
import { ResponseTimeComponent } from './components/response-time/response-time.component';
import { FontSettingsComponent } from './components/font-settings/font-settings.component';
import { SmsComponent } from '@/app/dashboard/modules/agency-settings/components/sms/sms.component';
import { SMSNumberGuard } from './components/sms/sms-number.guard';
import { MessengerComponent } from './components/messenger/messenger.component';
import { WhatsAppComponent } from './components/whatsapp/whatsapp.component';

const routes: Routes = [
  {
    path: '',
    component: AgencySettingsComponent,
    children: [
      { path: 'agency-details', component: CompanyDetailsComponent },
      {
        path: 'team',
        component: TeamComponent
      },
      { path: 'billing', component: BillingComponent },
      {
        path: 'response-time',
        component: ResponseTimeComponent
      },
      {
        path: 'voicemail',
        component: VoicemailComponent,
        canActivate: [CanActivateVoicemail]
      },
      {
        path: 'task-editor',
        loadChildren: () =>
          import('../task-editor/task-editor.module').then(
            (m) => m.TaskEditorModule
          )
      },
      {
        path: 'policies',
        component: AutomatedRepliesPolicyComponent
      },
      {
        path: 'task-editor/list/task-template/:taskTemplateId',
        loadChildren: () =>
          import(
            '@/app/dashboard/modules/task-editor/modules/task-template-details/task-template-details.module'
          ).then((m) => m.TaskTemplateDetailsModule)
      },
      {
        path: 'integrations',
        component: AgencyIntegrationsComponent
      },
      {
        path: 'mobile-app/emergency-contacts',
        component: EmergencyContactsComponent,
        canActivate: [EmergencyContactsGuard]
      },
      {
        path: 'email-settings',
        component: FontSettingsComponent
      },
      {
        path: 'sms',
        component: SmsComponent,
        canActivate: [SMSNumberGuard]
      },
      {
        path: 'messenger',
        component: MessengerComponent
      },
      {
        path: 'whatsapp',
        component: WhatsAppComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AgencySettingsRoutingModule {}
